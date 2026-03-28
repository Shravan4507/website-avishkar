import { useState } from 'react';

/**
 * useCache Hook for Avishkar '26
 * Simplifies and standardizes data persistence for a 'super smooth' UX.
 */

export function useCache<T>(key: string, initialValue: T, storageType: 'local' | 'session' = 'local') {
    const storage = storageType === 'local' ? window.localStorage : window.sessionStorage;

    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = storage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Cache Read Error [${key}]:`, error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            storage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Cache Write Error [${key}]:`, error);
        }
    };

    const clearCache = () => {
        try {
            storage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.error(`Cache Clear Error [${key}]:`, error);
        }
    };

    return [storedValue, setValue, clearCache] as const;
}
