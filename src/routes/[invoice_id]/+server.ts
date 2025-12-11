import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getInvoiceByInvoiceId } from '$lib/database/invoices';

export const GET: RequestHandler = async ({ params }) => {
    const invoiceId = params.invoice_id;
    
    if (!invoiceId) {
        throw error(400, 'Invoice ID is required');
    }
    
    const invoice = await getInvoiceByInvoiceId(invoiceId);
    
    if (!invoice) {
        throw error(404, 'Invoice not found');
    }
    
    // Return invoice data (excluding sensitive wallet private key)
    return json({
        invoice: {
            id: invoice.id,
            invoice_id: invoice.invoice_id,
            blockchain: invoice.blockchain,
            coin: invoice.coin,
            amount: invoice.amount,
            amount_paid: invoice.amount_paid,
            status: invoice.status,
            wallet_address: invoice.wallet_data?.pub || null,
            created_at: invoice.created_at,
            completed_at: invoice.completed_at
        }
    });
};




