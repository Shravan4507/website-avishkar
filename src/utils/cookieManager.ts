/**
 * Universal Cookie Controller for Avishkar '26
 * Enforces security and best practices platform-wide.
 */

export const cookieConfig = {
    path: '/',
    secure: window.location.protocol === 'https:',
    sameSite: 'lax' as const,
    expires: 365, // 1 year default
};

export const setCookie = (name: string, value: string, days: number = cookieConfig.expires) => {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${d.toUTCString()}`;
    const secure = cookieConfig.secure ? '; Secure' : '';
    const sameSite = `; SameSite=${cookieConfig.sameSite}`;
    document.cookie = `${name}=${value}; ${expires}; path=${cookieConfig.path}${secure}${sameSite}`;
};

export const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

export const removeCookie = (name: string) => {
    document.cookie = `${name}=; Path=${cookieConfig.path}; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
};
