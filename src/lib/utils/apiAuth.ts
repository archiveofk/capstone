import { getConnection } from "$lib/database/connection";

export async function authenticateApiKey(apiKey: string): Promise<number | null> {
    if (!apiKey) {
        return null;
    }
    
    const connection = await getConnection();
    try {
        const result = await connection.query(
            'SELECT user_id FROM api_keys WHERE token = ?',
            [apiKey]
        );
        await connection.release();
        
        if (result.length === 0) {
            return null;
        }
        
        return result[0].user_id;
    } catch (error) {
        console.error('Error authenticating API key:', error);
        await connection.release();
        return null;
    }
}

