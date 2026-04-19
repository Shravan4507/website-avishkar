import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { COMPETITIONS_DATA } from '../data/competitions';

interface ScheduleOverlap {
  hasConflict: boolean;
  conflictingEvents: string[];
  loading: boolean;
}

export function useScheduleConflict(targetEventId?: string | null) {
  const [user, loadingAuth] = useAuthState(auth);
  const [status, setStatus] = useState<ScheduleOverlap>({
    hasConflict: false,
    conflictingEvents: [],
    loading: true
  });

  useEffect(() => {
    if (loadingAuth) return;

    if (!user || !targetEventId) {
      setStatus({ hasConflict: false, conflictingEvents: [], loading: false });
      return;
    }

    const checkSchedule = async () => {
      try {
        // 1. Get user document for AVR ID
        const uSnap = await getDoc(doc(db, "user", user.uid));
        const avrId = uSnap.data()?.avrId;

        // 2. Fetch all unique registrations
        const qLeader = query(collection(db, "registrations"), where("userEmail", "==", user.email));
        const snapLeader = await getDocs(qLeader);
        let memberRegs: any[] = [];
        if (avrId) {
          const qMember = query(collection(db, "registrations"), where("allAvrIds", "array-contains", avrId));
          const snapMember = await getDocs(qMember);
          memberRegs = snapMember.docs.map(d => d.data());
        }
        const leaderRegs = snapLeader.docs.map(d => d.data());
        
        // Param-X / Hackathon
        const qH1 = query(collection(db, "hackathon_registrations"), where("leaderEmail", "==", user.email));
        const snapH1 = await getDocs(qH1);
        let hMemberRegs: any[] = [];
        if (avrId) {
          const qH2 = query(collection(db, "hackathon_registrations"), where("allAvrIds", "array-contains", avrId));
          const snapH2 = await getDocs(qH2);
          hMemberRegs = snapH2.docs.map(d => d.data());
        }
        const hLeaderRegs = snapH1.docs.map(d => d.data());

        const hasHackathon = hLeaderRegs.length > 0 || hMemberRegs.length > 0;

        let registeredEventIds = Array.from(new Set([
          ...leaderRegs.map(r => r.competitionId as string),
          ...memberRegs.map(r => r.competitionId as string),
        ])).filter(id => id);

        // Normalize BattleGrid and RoboKshetra IDs to their main flagship IDs to fetch schedules accurately
        registeredEventIds = registeredEventIds.map(id => {
           if (id.startsWith('battlegrid_')) return 'CMP-26-FLG-BAT-MAIN';
           if (id.startsWith('robokshetra_')) return 'CMP-26-FLG-ROBO-MAIN';
           return id;
        });

        if (hasHackathon) {
           registeredEventIds.push('param-x-26'); 
        }

        // Filter out targetEventId so we don't conflict with ourselves if reloading
        let safeTargetId = targetEventId;
        if (targetEventId.startsWith('battlegrid_')) safeTargetId = 'CMP-26-FLG-BAT-MAIN';
        else if (targetEventId.startsWith('robokshetra_')) safeTargetId = 'CMP-26-FLG-ROBO-MAIN';
        else if (targetEventId.startsWith('PS-')) safeTargetId = 'param-x-26'; // if someone passes PS ID directly
        
        registeredEventIds = registeredEventIds.filter(id => id !== safeTargetId);

        if (registeredEventIds.length === 0) {
          setStatus({ hasConflict: false, conflictingEvents: [], loading: false });
          return;
        }

        // 3. Find the schedule of the target event
        const targetEvent = COMPETITIONS_DATA.find(c => c.id === safeTargetId || c.slug === safeTargetId);
        
        if (!targetEvent || !targetEvent.schedule || targetEvent.schedule.length === 0) {
          setStatus({ hasConflict: false, conflictingEvents: [], loading: false });
          return;
        }

        const registeredCompetitions = COMPETITIONS_DATA.filter(c => registeredEventIds.includes(c.id) || registeredEventIds.includes(c.slug as string));

        // 4. Overlap Logic
        const conflicts: string[] = [];
        
        for (const tSchedule of targetEvent.schedule) {
          if (!tSchedule.date || !tSchedule.startTime || !tSchedule.endTime) continue;
          
          const tStart = new Date(`${tSchedule.date}T${tSchedule.startTime}`).getTime();
          const tEnd = new Date(`${tSchedule.date}T${tSchedule.endTime}`).getTime();

          for (const regComp of registeredCompetitions) {
            if (!regComp.schedule) continue;
            for (const rSchedule of regComp.schedule) {
              if (!rSchedule.date || !rSchedule.startTime || !rSchedule.endTime) continue;
              
              if (rSchedule.date !== tSchedule.date) continue; // Must be same day

              const rStart = new Date(`${rSchedule.date}T${rSchedule.startTime}`).getTime();
              const rEnd = new Date(`${rSchedule.date}T${rSchedule.endTime}`).getTime();

              // Overlap condition: Start A < End B && Start B < End A
              if (tStart < rEnd && rStart < tEnd) {
                if (!conflicts.includes(regComp.title)) {
                  conflicts.push(regComp.title);
                }
              }
            }
          }
        }

        setStatus({
          hasConflict: conflicts.length > 0,
          conflictingEvents: conflicts,
          loading: false
        });

      } catch (err) {
        console.error("Schedule Check failed", err);
        setStatus({ hasConflict: false, conflictingEvents: [], loading: false });
      }
    };

    checkSchedule();
  }, [user, loadingAuth, targetEventId]);

  return status;
}
