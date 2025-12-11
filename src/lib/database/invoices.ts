import { getConnection } from "./connection";

function generateInvoiceId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export interface WalletData {
    pub: string;
    private: string;
}

export interface Invoice {
    id: number;
    invoice_id: string;
    user_id: number;
    blockchain: string;
    coin: string;
    amount: number;
    amount_paid: number;
    txids: string[];
    wallet_data: WalletData | null;
    status: 'unpaid' | 'partial' | 'completed';
    created_at: Date;
    completed_at: Date | null;
}

export interface CreateInvoiceData {
    user_id: number;
    blockchain: string;
    coin: string;
    amount: number;
    wallet_data?: WalletData | null;
}

export async function createInvoice(data: CreateInvoiceData): Promise<Invoice | null> {
    const connection = await getConnection();
    try {
        let invoiceId = generateInvoiceId();
        
        // Ensure invoice_id is unique
        let exists = true;
        let attempts = 0;
        while (exists && attempts < 10) {
            const check = await connection.query(
                'SELECT id FROM invoices WHERE invoice_id = ?',
                [invoiceId]
            );
            if (check.length === 0) {
                exists = false;
            } else {
                invoiceId = generateInvoiceId();
                attempts++;
            }
        }
        
        if (exists) {
            await connection.release();
            return null;
        }
        
        const result = await connection.query(
            `INSERT INTO invoices (invoice_id, user_id, blockchain, coin, amount, amount_paid, txids, wallet_data, status)
             VALUES (?, ?, ?, ?, ?, 0, ?, ?, 'unpaid')`,
            [
                invoiceId, 
                data.user_id, 
                data.blockchain, 
                data.coin, 
                data.amount, 
                JSON.stringify([]),
                data.wallet_data ? JSON.stringify(data.wallet_data) : null
            ]
        );
        
        const invoice = await getInvoiceById(result.insertId);
        await connection.release();
        return invoice;
    } catch (error) {
        console.error('Error creating invoice:', error);
        await connection.release();
        return null;
    }
}

export async function getInvoiceById(id: number): Promise<Invoice | null> {
    const connection = await getConnection();
    try {
        const result = await connection.query(
            'SELECT * FROM invoices WHERE id = ?',
            [id]
        );
        await connection.release();
        
        if (result.length === 0) {
            return null;
        }
        
        return formatInvoice(result[0]);
    } catch (error) {
        console.error('Error getting invoice:', error);
        await connection.release();
        return null;
    }
}

export async function getInvoiceByInvoiceId(invoiceId: string): Promise<Invoice | null> {
    const connection = await getConnection();
    try {
        const result = await connection.query(
            'SELECT * FROM invoices WHERE invoice_id = ?',
            [invoiceId]
        );
        await connection.release();
        
        if (result.length === 0) {
            return null;
        }
        
        return formatInvoice(result[0]);
    } catch (error) {
        console.error('Error getting invoice:', error);
        await connection.release();
        return null;
    }
}

export async function getInvoicesByUserId(userId: number, limit: number = 50, offset: number = 0): Promise<Invoice[]> {
    const connection = await getConnection();
    try {
        const result = await connection.query(
            'SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [userId, limit, offset]
        );
        await connection.release();
        
        return result.map(formatInvoice);
    } catch (error) {
        console.error('Error getting invoices:', error);
        await connection.release();
        return [];
    }
}

export async function updateInvoicePayment(
    invoiceId: string,
    amountPaid: number,
    txid: string
): Promise<Invoice | null> {
    const connection = await getConnection();
    try {
        const invoice = await getInvoiceByInvoiceId(invoiceId);
        if (!invoice) {
            await connection.release();
            return null;
        }
        
        const newAmountPaid = invoice.amount_paid + amountPaid;
        const newTxids = [...invoice.txids, txid];
        
        let newStatus: 'unpaid' | 'partial' | 'completed' = 'unpaid';
        let completedAt: Date | null = null;
        
        if (newAmountPaid >= invoice.amount) {
            newStatus = 'completed';
            completedAt = new Date();
        } else if (newAmountPaid > 0) {
            newStatus = 'partial';
        }
        
        await connection.query(
            `UPDATE invoices 
             SET amount_paid = ?, txids = ?, status = ?, completed_at = ?
             WHERE invoice_id = ?`,
            [
                newAmountPaid,
                JSON.stringify(newTxids),
                newStatus,
                completedAt,
                invoiceId
            ]
        );
        
        const updatedInvoice = await getInvoiceByInvoiceId(invoiceId);
        await connection.release();
        return updatedInvoice;
    } catch (error) {
        console.error('Error updating invoice payment:', error);
        await connection.release();
        return null;
    }
}

function formatInvoice(row: any): Invoice {
    return {
        id: row.id,
        invoice_id: row.invoice_id,
        user_id: row.user_id,
        blockchain: row.blockchain,
        coin: row.coin,
        amount: parseFloat(row.amount),
        amount_paid: parseFloat(row.amount_paid),
        txids: row.txids ? (typeof row.txids === 'string' ? JSON.parse(row.txids) : row.txids) : [],
        wallet_data: row.wallet_data ? (typeof row.wallet_data === 'string' ? JSON.parse(row.wallet_data) : row.wallet_data) : null,
        status: row.status,
        created_at: row.created_at,
        completed_at: row.completed_at
    };
}

