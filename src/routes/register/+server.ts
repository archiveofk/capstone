// src/routes/register/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createAccount } from '$lib/database/accounts';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { email, password, username } = await request.json();
        
        if (!email || !password || !username) {
            return json(
                { error: 'Email, password, and username are required' },
                { status: 400 }
            );
        }
        
        const result = await createAccount(email, password, username);
        if (result.status !== 201) {
            return json(
                { error: result.message },
                { status: result.status }
            );
        }
        return json(
            { message: result.message },
            { status: result.status }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return json(
            { error: 'Failed to create account' },
            { status: 500 }
        );
    }
};