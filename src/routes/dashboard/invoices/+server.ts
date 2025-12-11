import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifySessionToken } from '$lib/utils/sessions';
import { getInvoicesByUserId } from '$lib/database/invoices';
import { getConnection } from '$lib/database/connection';

export const GET: RequestHandler = async ({ cookies, url }) => {
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
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    const connection = await getConnection();
    let total = 0;
    try {
        const countResult = await connection.query(
            'SELECT COUNT(*) as count FROM invoices WHERE user_id = ?',
            [userId]
        );
        const countValue = countResult[0]?.count;
        total = typeof countValue === 'bigint' ? Number(countValue) : (countValue || 0);
        await connection.release();
    } catch (error) {
        console.error('Error getting invoice count:', error);
        await connection.release();
    }
    
    const invoices = await getInvoicesByUserId(userId, limit, offset);
    
    return json({
        invoices: invoices.map(invoice => ({
            id: typeof invoice.id === 'bigint' ? Number(invoice.id) : invoice.id,
            invoice_id: invoice.invoice_id,
            amount: typeof invoice.amount === 'bigint' ? Number(invoice.amount) : Number(invoice.amount),
            amount_paid: typeof invoice.amount_paid === 'bigint' ? Number(invoice.amount_paid) : Number(invoice.amount_paid),
            coin: invoice.coin,
            status: invoice.status,
            txids: invoice.txids || [],
            wallet_address: invoice.wallet_data?.pub || null,
            created_at: invoice.created_at instanceof Date ? invoice.created_at.toISOString() : invoice.created_at,
            completed_at: invoice.completed_at instanceof Date ? invoice.completed_at.toISOString() : (invoice.completed_at || null)
        })),
        total: total
    });
};

