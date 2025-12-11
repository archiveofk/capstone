import jwt from 'jsonwebtoken';

export function generateSessionToken(userId: number) {
    return jwt.sign({ userId }, "test_secret", { expiresIn: '7d' });
}

export function verifySessionToken(token: string) {
    try {
        return jwt.verify(token, "test_secret");
    } catch (error) {
        console.error('Error verifying session token:', error);
        return null;
    }
}