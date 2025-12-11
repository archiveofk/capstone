import { getConnection } from "./connection";
import { generateApiKey } from "$lib/utils/apiKey";
import { generateSessionToken } from "$lib/utils/sessions";
import bcrypt from 'bcrypt';

export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10; 
    return await bcrypt.hash(password, saltRounds);
}

async function doesAccountExist(email: string, username: string) {
    const connection = await getConnection();
    const result = await connection.query(
        'SELECT * FROM users WHERE email = ? OR username = ?',
        [email, username]
    );
    return result.length > 0;
}

async function doesAccountExistByEmail(email: string) {
    const connection = await getConnection();
    const result = await connection.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );
    return result.length > 0;
}

export async function createAccount(email: string, password: string, username: string) {
    if (await doesAccountExist(email, username)) {
        return {message: 'Email or username already in use', status: 400};
    }

    const key = generateApiKey();
    const connection = await getConnection();
    const hashedPassword = await hashPassword(password);
    try{
        const userResult = await connection.query(
            'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
            [email, hashedPassword, username]
        );
        
    
        const userId = userResult.insertId;
        
        await connection.query(
            'INSERT INTO api_keys (user_id, token) VALUES (?, ?)',
            [userId, key]
        );
        
        await connection.release();
        return {message: 'Account created successfully', status: 201};
    } catch (error) {
        console.error('Error creating account:', error);
        return {message: 'Failed to create account', status: 500};
    }
}

export async function login(email: string, password: string) {
    const connection = await getConnection();
    try {
        const result = await connection.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        if (result.length === 0) {
            await connection.release();
            return {message: 'Invalid email or password', status: 401};
        }
        
        const user = result[0];
        
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            await connection.release();
            return {message: 'Invalid email or password', status: 401};
        }
        
        const sessionToken = generateSessionToken(user.id);
        await connection.release();
        return {
            message: 'Login successful', 
            status: 200, 
            sessionToken: sessionToken,
            user: { id: user.id, username: user.username, email: user.email }
        };
    } catch (error) {
        console.error('Login error:', error);
        await connection.release();
        return {message: 'Login failed', status: 500};
    }
}

export async function getUserById(userId: number) {
    const connection = await getConnection();
    try {
        const result = await connection.query(
            'SELECT id, username, email, total_made, total_payments, solana_wallet FROM users WHERE id = ?',
            [userId]
        );
        await connection.release();
        
        if (result.length === 0) {
            return null;
        }
        
        return result[0];
    } catch (error) {
        console.error('Error getting user:', error);
        await connection.release();
        return null;
    }
}

export async function updateSolanaWallet(userId: number, wallet: string | null) {
    const connection = await getConnection();
    try {
        await connection.query(
            'UPDATE users SET solana_wallet = ? WHERE id = ?',
            [wallet, userId]
        );
        await connection.release();
        return { message: 'Wallet updated successfully', status: 200 };
    } catch (error) {
        console.error('Error updating wallet:', error);
        await connection.release();
        return { message: 'Failed to update wallet', status: 500 };
    }
}

export async function getApiKeyByUserId(userId: number) {
    const connection = await getConnection();
    try {
        const result = await connection.query(
            'SELECT token FROM api_keys WHERE user_id = ? LIMIT 1',
            [userId]
        );
        await connection.release();
        
        if (result.length === 0) {
            return null;
        }
        
        return result[0].token;
    } catch (error) {
        console.error('Error getting API key:', error);
        await connection.release();
        return null;
    }
}

export async function updateTotalMade(userId: number, amount: number) {
    const connection = await getConnection();
    try {
        await connection.query(
            'UPDATE users SET total_made = total_made + ? WHERE id = ?',
            [amount, userId]
        );
        await connection.release();
        return { message: 'Total made updated successfully', status: 200 };
    } catch (error) {
        console.error('Error updating total made:', error);
        await connection.release();
        return { message: 'Failed to update total made', status: 500 };
    }
}

export async function updateTotalPayments(userId: number, amount: number) {
    const connection = await getConnection();
    try {
        await connection.query(
            'UPDATE users SET total_payments = total_payments + ? WHERE id = ?',
            [amount, userId]
        );
        await connection.release();
        return { message: 'Total payments updated successfully', status: 200 };
    } catch (error) {
        console.error('Error updating total payments:', error);
        await connection.release();
        return { message: 'Failed to update total payments', status: 500 };
    }
}