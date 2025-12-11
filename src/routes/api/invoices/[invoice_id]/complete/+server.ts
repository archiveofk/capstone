import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authenticateApiKey } from '$lib/utils/apiAuth';
import { getInvoiceByInvoiceId, updateInvoicePayment } from '$lib/database/invoices';
import { updateTotalMade } from '$lib/database/accounts';

export const POST: RequestHandler = async ({ request, params }) => {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) { //idk why we use this but everyone does
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
        
        const invoiceId = params.invoice_id;
        if (!invoiceId) {
            return json(
                { error: 'Invoice ID is required' },
                { status: 400 }
            );
        }
        
        const invoice = await getInvoiceByInvoiceId(invoiceId);
        if (!invoice) {
            return json(
                { error: 'Invoice not found' },
                { status: 404 }
            );
        }
        
        if (invoice.user_id !== userId) {
            return json(
                { error: 'Unauthorized. This invoice does not belong to you' },
                { status: 403 }
            );
        }
        
        if (invoice.status === 'completed') {
            return json(
                { error: 'Invoice is already completed' },
                { status: 400 }
            );
        }
        
        const body = await request.json();
        const { amount_paid, txid } = body;
        
        if (amount_paid === undefined || !txid) {
            return json(
                { error: 'Missing required fields: amount_paid and txid are required' },
                { status: 400 }
            );
        }
        
        const amountPaidNum = parseFloat(amount_paid);
        if (isNaN(amountPaidNum) || amountPaidNum <= 0) {
            return json(
                { error: 'amount_paid must be a positive number' },
                { status: 400 }
            );
        }
        
        if (typeof txid !== 'string' || txid.trim().length === 0) {
            return json(
                { error: 'txid must be a non-empty string' },
                { status: 400 }
            );
        }
        
        const updatedInvoice = await updateInvoicePayment(
            invoiceId,
            amountPaidNum,
            txid.trim()
        );
        
        if (!updatedInvoice) {
            return json(
                { error: 'Failed to update invoice' },
                { status: 500 }
            );
        }
        
        await updateTotalMade(userId, amountPaidNum);
        
        return json({
            success: true,
            invoice: {
                id: updatedInvoice.id,
                invoice_id: updatedInvoice.invoice_id,
                blockchain: updatedInvoice.blockchain,
                coin: updatedInvoice.coin,
                amount: updatedInvoice.amount,
                amount_paid: updatedInvoice.amount_paid,
                txids: updatedInvoice.txids,
                status: updatedInvoice.status,
                created_at: updatedInvoice.created_at,
                completed_at: updatedInvoice.completed_at
            }
        });
    } catch (error) {
        console.error('Error completing invoice:', error);
        return json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};

