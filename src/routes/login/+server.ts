import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { login } from '$lib/database/accounts';

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const { email, password } = await request.json();
        
        if (!email || !password) {
            return json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }
        
        const result = await login(email, password);
        
        if (result.status !== 200) {
            return json(
                { error: result.message },
                { status: result.status }
            );
        }
        
        cookies.set('session', result.sessionToken, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7 
        });
        
        return json(
            { 
                message: result.message,
                user: result.user,
            },
            { status: result.status }
        );
    } catch (error) {
        console.error('Login error:', error);
        return json(
            { error: 'Failed to login' },
            { status: 500 }
        );
    }
};