import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

export interface RegistrationStatus {
    isRegistered: boolean;
    eventName: string | null;
    type: 'general' | 'hackathon' | null;
    loading: boolean;
    data: any | null;
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
                const userEmail = user.email?.toLowerCase();
                
                // 0. Fetch User Profile to get AVR ID
                const userSnap = await getDocs(query(collection(db, "user"), where("uid", "==", user.uid), limit(1)));
                let avrId = "";
                if (!userSnap.empty) {
                    avrId = userSnap.docs[0].data().avrId;
                }

                // 1. Check General Registrations (Solo/Team via allAvrIds)
                // We check both email (leader legacy) and allAvrIds (team member expansion)
                const queries1 = [];
                if (userEmail) queries1.push(query(collection(db, "registrations"), where("userEmail", "==", userEmail), limit(1)));
                if (avrId) queries1.push(query(collection(db, "registrations"), where("allAvrIds", "array-contains", avrId), limit(1)));

                for (const q of queries1) {
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        const data = snap.docs[0].data();
                        setStatus({
                            isRegistered: true,
                            eventName: data.eventName || "Registered Event",
                            type: 'general',
                            loading: false,
                            data
                        });
                        return;
                    }
                }

                // 2. Check Hackathon Squads (Param-X)
                const queries2 = [];
                if (userEmail) queries2.push(query(collection(db, "hackathon_registrations"), where("allEmails", "array-contains", userEmail), limit(1)));
                if (avrId) queries2.push(query(collection(db, "hackathon_registrations"), where("allAvrIds", "array-contains", avrId), limit(1)));

                for (const q of queries2) {
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        const data = snap.docs[0].data();
                        setStatus({
                            isRegistered: true,
                            eventName: "Param-X Hackathon",
                            type: 'hackathon',
                            loading: false,
                            data
                        });
                        return;
                    }
                }

                // If we reach here, user is free to register
                setStatus({
                    isRegistered: false,
                    eventName: null,
                    type: null,
                    loading: false,
                    data: null
                });

            } catch (error) {
                console.error("Critical: Registration Guard Check Failed", error);
                setStatus(prev => ({ ...prev, loading: false }));
            }
        };

        runSecurityCheck();
    }, [user, loadingAuth]);

    return status;
}
