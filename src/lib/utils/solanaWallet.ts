import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export interface SolanaWallet {
    pub: string;
    private: string;
}

export function generateSolanaWallet(): SolanaWallet {
    // Generate a new Solana keypair
    const keypair = Keypair.generate();
    
    // Get public key as base58 string
    const publicKey = keypair.publicKey.toBase58();
    
    // Get secret key as base58 string (for storage)
    const secretKey = bs58.encode(keypair.secretKey);
    
    return {
        pub: publicKey,
        private: secretKey
    };
}




