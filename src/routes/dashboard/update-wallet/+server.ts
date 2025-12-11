import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateSolanaWallet } from '$lib/database/accounts';
import { verifySessionToken } from '$lib/utils/sessions';

export const POST: RequestHandler = async ({ request, cookies }) => {
    const sessionToken = cookies.get('session');
    
    if (!sessionToken) {
        throw redirect(302, '/');
    }
    
    const decoded = verifySessionToken(sessionToken);
    
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
        cookies.delete('session', { path: '/' });
        throw redirect(302, '/');
    }
    
    const userId = decoded.userId as number;
    
    try {
        const { wallet } = await request.json();
        
        // Validate wallet address (basic check - should be 32-44 characters for Solana)
        if (wallet && wallet.length > 64) {
            return json(
                { error: 'Wallet address is too long (max 64 characters)' },
                { status: 400 }
            );
        }
        
        const result = await updateSolanaWallet(userId, wallet || null);
        
        if (result.status !== 200) {
            return json(
                { error: result.message },
                { status: result.status }
            );
        }
        
        return json({ message: result.message });
    } catch (error) {
        console.error('Error updating wallet:', error);
        return json(
            { error: 'Failed to update wallet' },
            { status: 500 }
        );
    }
};

