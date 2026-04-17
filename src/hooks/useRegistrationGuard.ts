import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';

export interface RegistrationStatus {
    isRegistered: boolean;
    eventName: string | null;
    type: 'general' | 'hackathon' | null;
    loading: boolean;
    data: any | null;
    error?: boolean;
}

/**
 * useRegistrationGuard
 * 
 * A centralized safety hook to check if a user is already participating 
 * in ANY competition or workshop across the platform.
 */
export function useRegistrationGuard() {
    const [user, loadingAuth] = useAuthState(auth);
    const [status, setStatus] = useState<RegistrationStatus>({
        isRegistered: false,
        eventName: null,
        type: null,
        loading: true,
        data: null
    });

    useEffect(() => {
        // Skip if still authenticating
        if (loadingAuth) return;

        // Reset if no user
        if (!user) {
            setStatus(prev => ({ ...prev, loading: false, isRegistered: false }));
            return;
        }

        const runSecurityCheck = async () => {
            try {
                // Restriction removed per request: 
                // Users can now register for multiple events.
                // We bypass the cross-event security check completely here.
                // Each event retains its OWN duplicate checks for its specific competition.
                
                setStatus({
                    isRegistered: false,
                    eventName: null,
                    type: null,
                    loading: false,
                    data: null
                });

            } catch (error) {
                console.error("Critical: Registration Guard Check Failed", error);
                // Set loading false but also mark as errored so consumers know the check failed
                setStatus(prev => ({ ...prev, loading: false, error: true }));
            }
        };

        runSecurityCheck();
    }, [user, loadingAuth]);

    return status;
}
