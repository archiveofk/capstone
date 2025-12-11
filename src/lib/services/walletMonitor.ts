import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import { getInvoiceByInvoiceId, updateInvoicePayment } from '$lib/database/invoices';
import { getUserById, updateTotalMade } from '$lib/database/accounts';
import bs58 from 'bs58';

const HOUSE_WALLET = process.env.HOUSE_WALLET || import.meta.env.HOUSE_WALLET || 'CPFGknWp1zrhEEw5UMfsVcy1pUN97HPBCHvXU9RkqcrQ';
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || import.meta.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=caf35849-c4cf-427a-a38d-b3a054c6b8fe';
const SOLANA_WS_URL = process.env.SOLANA_WS_URL || import.meta.env.SOLANA_WS_URL || 'wss://mainnet.helius-rpc.com/?api-key=caf35849-c4cf-427a-a38d-b3a054c6b8fe';

interface MonitoredInvoice {
    invoice_id: string;
    wallet_address: string;
    amount: number;
    user_id: number;
    last_checked_signature: string | null;
}

const monitoredInvoices = new Map<string, MonitoredInvoice>();
const connections = new Map<string, Connection>();

export async function startMonitoringInvoice(invoiceId: string, walletAddress: string, amount: number, userId: number) {
    if (monitoredInvoices.has(invoiceId)) {
        return;
    }
    
    const invoice: MonitoredInvoice = {
        invoice_id: invoiceId,
        wallet_address: walletAddress,
        amount: amount,
        user_id: userId,
        last_checked_signature: null
    };
    
    monitoredInvoices.set(invoiceId, invoice);
    monitorWallet(invoice);
}

async function monitorWallet(invoice: MonitoredInvoice) {
    try {
        const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
        const publicKey = new PublicKey(invoice.wallet_address);
        
        const subscriptionId = connection.onAccountChange(
            publicKey,
            async (accountInfo) => {
                await checkForPayments(invoice);
            },
            'confirmed'
        );
        
        const intervalId = setInterval(async () => {
            await checkForPayments(invoice);
        }, 10000);
        
        connections.set(invoice.invoice_id, connection);
        
        console.log(`Started monitoring invoice ${invoice.invoice_id} for wallet ${invoice.wallet_address}`);
    } catch (error) {
        console.error(`Error starting wallet monitoring for invoice ${invoice.invoice_id}:`, error);
    }
}

async function checkForPayments(invoice: MonitoredInvoice) {
    try {
        const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
        const publicKey = new PublicKey(invoice.wallet_address);
        
        const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 10 });
        
        const currentInvoice = await getInvoiceByInvoiceId(invoice.invoice_id);
        if (!currentInvoice) {
            stopMonitoringInvoice(invoice.invoice_id);
            return;
        }
        
        if (currentInvoice.status === 'completed') {
            stopMonitoringInvoice(invoice.invoice_id);
            return;
        }
        
        for (const sigInfo of signatures) {
            if (invoice.last_checked_signature === sigInfo.signature) {
                break;
            }
            
            const tx = await connection.getTransaction(sigInfo.signature, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0
            });
            
            if (!tx) continue;
            
            let incomingAmount = 0;
            let isIncoming = false;
            
            if (tx.meta && tx.meta.postBalances && tx.meta.preBalances) {
                const accountKeys = tx.transaction.message.getAccountKeys();
                
                for (let i = 0; i < accountKeys.length; i++) {
                    const accountKey = accountKeys.get(i);
                    if (!accountKey) continue;
                    
                    const postBalance = tx.meta.postBalances[i];
                    const preBalance = tx.meta.preBalances[i];
                    
                    if (accountKey.toBase58() === invoice.wallet_address) {
                        const balanceChange = (postBalance - preBalance) / 1e9;
                        if (balanceChange > 0) {
                            incomingAmount = balanceChange;
                            isIncoming = true;
                            break;
                        }
                    }
                }
            }
            
            if (isIncoming && incomingAmount > 0) {
                await updateInvoicePayment(invoice.invoice_id, incomingAmount, sigInfo.signature);
                invoice.last_checked_signature = sigInfo.signature;
                
                const updatedInvoice = await getInvoiceByInvoiceId(invoice.invoice_id);
                if (updatedInvoice && updatedInvoice.status === 'completed') {
                    await handleCompletedInvoice(updatedInvoice);
                    stopMonitoringInvoice(invoice.invoice_id);
                }
                
                break;
            }
        }
    } catch (error) {
        console.error(`Error checking payments for invoice ${invoice.invoice_id}:`, error);
    }
}

async function handleCompletedInvoice(invoice: any) {
    try {
        if (!invoice.wallet_data || !invoice.wallet_data.private) {
            console.error(`No wallet data found for invoice ${invoice.invoice_id}`);
            return;
        }
        
        const user = await getUserById(invoice.user_id);
        if (!user || !user.solana_wallet) {
            console.error(`User ${invoice.user_id} has no solana_wallet set`);
            return;
        }
        
        const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
        
        try {
            new PublicKey(user.solana_wallet);
            new PublicKey(HOUSE_WALLET);
        } catch (error) {
            console.error(`Invalid wallet address:`, error);
            return;
        }
        
        const privateKeyBytes = bs58.decode(invoice.wallet_data.private);
        const invoiceKeypair = Keypair.fromSecretKey(privateKeyBytes);
        
        const balance = await connection.getBalance(invoiceKeypair.publicKey);
        const balanceSOL = balance / LAMPORTS_PER_SOL;
        
        if (balanceSOL < invoice.amount) {
            console.error(`Insufficient balance in invoice wallet. Expected ${invoice.amount} SOL, got ${balanceSOL} SOL`);
            return;
        }
        
        const rentExemptMinimum = await connection.getMinimumBalanceForRentExemption(0);
        const rentSOL = rentExemptMinimum / LAMPORTS_PER_SOL;
        
        const amountAfterRent = invoice.amount - rentSOL;
        
        if (amountAfterRent <= 0) {
            console.error(`Invoice amount too small. Amount: ${invoice.amount} SOL, Rent: ${rentSOL} SOL`);
            return;
        }
        
        const userAmount = amountAfterRent * 0.95;
        const houseAmount = amountAfterRent * 0.05;
        
        let userLamports = Math.floor(userAmount * LAMPORTS_PER_SOL);
        let houseLamports = Math.floor(houseAmount * LAMPORTS_PER_SOL);
        
        const estimatedFeeLamports = 20000;
        const totalNeeded = userLamports + houseLamports + rentExemptMinimum + estimatedFeeLamports;
        
        if (balance < totalNeeded) {
            console.log(`Adjusting amounts: balance ${balance} < needed ${totalNeeded}`);
            const availableForTransfer = balance - rentExemptMinimum - estimatedFeeLamports;
            if (availableForTransfer <= 0) {
                console.error(`Cannot transfer: balance too small after rent and fees`);
                return;
            }
            userLamports = Math.floor(availableForTransfer * 0.95);
            houseLamports = availableForTransfer - userLamports;
        }
        
        const transaction = new Transaction();
        
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: invoiceKeypair.publicKey,
                toPubkey: new PublicKey(user.solana_wallet),
                lamports: userLamports
            })
        );
        
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: invoiceKeypair.publicKey,
                toPubkey: new PublicKey(HOUSE_WALLET),
                lamports: houseLamports
            })
        );
        
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = invoiceKeypair.publicKey;
        transaction.sign(invoiceKeypair);
        
        const remainingAfterTransfers = balance - userLamports - houseLamports;
        if (remainingAfterTransfers < rentExemptMinimum) {
            console.error(`CRITICAL: Remaining balance ${remainingAfterTransfers} < rent ${rentExemptMinimum}. Adjusting transfers.`);
            const maxTransferable = balance - rentExemptMinimum - estimatedFeeLamports;
            if (maxTransferable <= 0) {
                console.error(`Cannot transfer: balance too small`);
                return;
            }
            userLamports = Math.floor(maxTransferable * 0.95);
            houseLamports = maxTransferable - userLamports;
            
            transaction.instructions = [];
            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: invoiceKeypair.publicKey,
                    toPubkey: new PublicKey(user.solana_wallet),
                    lamports: userLamports
                })
            );
            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: invoiceKeypair.publicKey,
                    toPubkey: new PublicKey(HOUSE_WALLET),
                    lamports: houseLamports
                })
            );
            transaction.recentBlockhash = blockhash;
            transaction.sign(invoiceKeypair);
        }
        
        try {
            const simulation = await connection.simulateTransaction(transaction);
            if (simulation.value.err) {
                console.error(`Transaction simulation failed:`, simulation.value.err);
                if (simulation.value.logs) {
                    console.error('Simulation logs:', simulation.value.logs);
                }
                console.error(`Balance: ${balance}, User: ${userLamports}, House: ${houseLamports}, Rent: ${rentExemptMinimum}, Remaining: ${balance - userLamports - houseLamports}`);
                return;
            }
        } catch (simError) {
            console.error(`Error simulating transaction:`, simError);
            return;
        }
        
        const txSig = await connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: false,
            maxRetries: 3
        });
        
        await connection.confirmTransaction(txSig, 'confirmed');
        
        const finalUserAmount = userLamports / LAMPORTS_PER_SOL;
        const finalHouseAmount = houseLamports / LAMPORTS_PER_SOL;
        
        await updateTotalMade(invoice.user_id, finalUserAmount);
        
        console.log(`Completed invoice ${invoice.invoice_id}: Sent ${finalUserAmount} SOL to user, ${finalHouseAmount} SOL to house`);
        console.log(`Transaction: ${txSig}`);
    } catch (error) {
        console.error(`Error handling completed invoice ${invoice.invoice_id}:`, error);
    }
}

export function stopMonitoringInvoice(invoiceId: string) {
    monitoredInvoices.delete(invoiceId);
    const connection = connections.get(invoiceId);
    if (connection) {
        connections.delete(invoiceId);
    }
    console.log(`Stopped monitoring invoice ${invoiceId}`);
}

export function isMonitoringInvoice(invoiceId: string): boolean {
    return monitoredInvoices.has(invoiceId);
}
