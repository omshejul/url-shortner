/**
 * Utility functions for handling NextAuth JWT issues
 */

/**
 * Clear all NextAuth cookies to resolve JWT decryption issues
 * This should be called when JWT decryption fails
 */
export function clearNextAuthCookies() {
    if (typeof window !== 'undefined') {
        // Clear all NextAuth related cookies
        const cookies = [
            'next-auth.session-token',
            '__Secure-next-auth.session-token',
            'next-auth.csrf-token',
            '__Host-next-auth.csrf-token',
            'next-auth.callback-url',
            '__Secure-next-auth.callback-url'
        ];

        cookies.forEach(cookieName => {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });

        // Also clear localStorage items that might be related
        localStorage.removeItem('next-auth.session-token');
        sessionStorage.removeItem('next-auth.session-token');
    }
}

/**
 * Generate a secure random secret for NEXTAUTH_SECRET
 * This is useful for development or when setting up the app
 */
export async function generateNextAuthSecret(): Promise<string> {
    const crypto = await import('crypto');
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate that required environment variables are present
 */
export function validateAuthEnvironment(): { isValid: boolean; missing: string[] } {
    const required = [
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'MONGODB_URI'
    ];

    const missing = required.filter(key => !process.env[key]);

    return {
        isValid: missing.length === 0,
        missing
    };
}
