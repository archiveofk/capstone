import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authenticateApiKey } from '$lib/utils/apiAuth';
import { createInvoice } from '$lib/database/invoices';
import { generateSolanaWallet } from '$lib/utils/solanaWallet';
import { startMonitoringInvoice } from '$lib/services/walletMonitor';
import { updateTotalPayments } from '$lib/database/accounts';

export const POST: RequestHandler = async ({ request }) => {
    try {
        // Get API key from Authorization header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return json(
                { error: 'Missing or invalid Authorization header. Use: Authorization: Bearer YOUR_API_KEY' },
                { status: 401 }
            );
        }
        
        const apiKey = authHeader.substring(7);
        const userId = await authenticateApiKey(apiKey);
        
        if (!userId) {
            return json(
                { error: 'Invalid API key' },
                { status: 401 }
            );
        }
        
        const body = await request.json();
        const { blockchain, coin, amount } = body;
        
        if (!blockchain || !coin || !amount) {
            return json(
                { error: 'Missing required fields: blockchain, coin, and amount are required' },
                { status: 400 }
            );
        }
        
        if (blockchain.toLowerCase() !== 'solana') {
            return json(
                { error: 'Invalid blockchain. Only "solana" is supported' },
                { status: 400 }
            );
        }
        
        if (coin.toLowerCase() !== 'solana') {
            return json(
                { error: 'Invalid coin. Only "solana" is supported' },
                { status: 400 }
            );
        }
        
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return json(
                { error: 'Amount must be a positive number' },
                { status: 400 }
            );
        }
        
        const walletData = generateSolanaWallet();
        
        const invoice = await createInvoice({
            user_id: userId,
            blockchain: 'solana',
            coin: 'solana',
            amount: amountNum,
            wallet_data: walletData
        });
        
        if (!invoice) {
            return json(
                { error: 'Failed to create invoice' },
                { status: 500 }
            );
        }

        await updateTotalPayments(userId, 1);
        
        if (walletData && walletData.pub) {
            startMonitoringInvoice(invoice.invoice_id, walletData.pub, amountNum, userId).catch(error => {
                console.error(`Error starting wallet monitoring for invoice ${invoice.invoice_id}:`, error);
            });
        }
        
        return json({
            success: true,
            invoice: {
                id: invoice.id,
                invoice_id: invoice.invoice_id,
                blockchain: invoice.blockchain,
                coin: invoice.coin,
                amount: invoice.amount,
                amount_paid: invoice.amount_paid,
                status: invoice.status,
                wallet_address: walletData.pub,
                created_at: invoice.created_at
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating invoice:', error);
        return json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};

