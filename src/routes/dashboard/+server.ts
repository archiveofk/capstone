import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserById, getApiKeyByUserId } from '$lib/database/accounts';
import { verifySessionToken } from '$lib/utils/sessions';
import { getInvoicesByUserId } from '$lib/database/invoices';

export const GET: RequestHandler = async ({ cookies }) => {
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
    const user = await getUserById(userId);
    
    if (!user) {
        cookies.delete('session', { path: '/' });
        throw redirect(302, '/');
    }
    
    const apiKey = await getApiKeyByUserId(userId);
    const invoices = await getInvoicesByUserId(userId, 5, 0);
    
    return json({
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            total_made: user.total_made || 0,
            total_payments: user.total_payments || 0,
            solana_wallet: user.solana_wallet || null,
            api_key: apiKey || null
        },
        invoices: invoices.map(invoice => ({
            id: invoice.id,
            invoice_id: invoice.invoice_id,
            amount: invoice.amount,
            amount_paid: invoice.amount_paid,
            coin: invoice.coin,
            status: invoice.status,
            created_at: invoice.created_at,
            completed_at: invoice.completed_at
        }))
    });
};

