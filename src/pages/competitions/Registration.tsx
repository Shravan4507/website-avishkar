import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import { useToast } from '../../components/toast/Toast';
import { COMPETITIONS_DATA } from '../../data/competitions';
import type { Competition } from '../../data/competitions';
import { 
  Trophy, CheckCircle, ArrowRight, ShieldCheck, 
  AlertTriangle, CreditCard, Moon, Fingerprint, 
  User, Mail, Phone, Building2, Search, Users, 
  Copy, Loader2, ShieldAlert, Check 
} from 'lucide-react';
import { useRegistrationGuard } from '../../hooks/useRegistrationGuard';
import { generateTxnId } from '../../utils/easebuzz';
import './Registration.css';
import { reportError, withRetry } from '../../utils/errorReport';
import PaymentCheckout from '../../components/payment/PaymentCheckout';
import { usePaymentCheckout } from '../../hooks/usePaymentCheckout';


const Registration: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [user, authLoading] = useAuthState(auth);
  const navigate = useNavigate();
  const toast = useToast();

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [userData, setUserData] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [accountabilityAccepted, setAccountabilityAccepted] = useState(false);
  const [transactionId] = useState<string | null>(null);
  const [moonObservation, setMoonObservation] = useState(false);

  // --- Squad State ---
  const [teamName, setTeamName] = useState('');
  const [squadMembers, setSquadMembers] = useState<any[]>([]);
  const [lookupLoading, setLookupLoading] = useState<Record<number, boolean>>({});
  const [lookupFailed, setLookupFailed] = useState<Record<number, boolean>>({});

  const { isRegistered, eventName: registeredEventName } = useRegistrationGuard();

  const isSubmittingRef = useRef(false);
  const paymentCheckout = usePaymentCheckout();
  const [checkoutOrderDetails, setCheckoutOrderDetails] = useState<{ eventName: string; amount: number; participantName: string; avrId: string } | null>(null);


  useEffect(() => {
    const initRegistration = async () => {
      if (authLoading) return;
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      if (!slug) {
        setIsLoading(false);
        return;
      }

      try {
        // 1. Fetch User Profile
        const userSnap = await getDoc(doc(db, 'user', user.uid));
        if (!userSnap.exists()) {
          toast.error("Profile incomplete. Please complete signup.");
          navigate('/signup');
          return;
        }
        const uData = userSnap.data();
        if (!uData.avrId) {
          navigate('/signup');
          return;
        }
        setUserData(uData);

        // 2. Resolve Competition (Hardcoded vs Firestore)
        // Check hardcoded first
        let foundComp = COMPETITIONS_DATA.find(
          c => c.slug === slug || c.title === slug
        );

        // If not hardcoded, check Firestore
        if (!foundComp) {
          const compSnap = await getDoc(doc(db, 'competitions', slug));
          if (compSnap.exists()) {
            const data = compSnap.data() as any;
            foundComp = {
              ...data,
              id: data.id || compSnap.id, // Fallback to doc ID if field is missing
              slug: data.slug || slug,
              department: data.department || 'General' // Fallback for department
            } as Competition;
          }
        }

        if (foundComp) {
          setCompetition(foundComp);
          
          // 3. Initialize Squad Slates if Team Event
          if ((foundComp.maxTeamSize || 1) > 1) {
            const slotsCount = (foundComp.maxTeamSize || 1) - 1;
            const initialSquad = Array.from({ length: slotsCount }, () => ({
              avrId: '',
              name: '',
              email: '',
              phone: '',
              college: ''
            }));
            setSquadMembers(initialSquad);
          }

          // 4. Check if already registered using query (list rule is isAuth)
          const regCheckQuery = query(
            collection(db, 'registrations'),
            where('userId', '==', user.uid),
            where('competitionId', '==', foundComp.id),
            limit(1)
          );
          const regCheckSnap = await getDocs(regCheckQuery);
          if (!regCheckSnap.empty) {
            setAlreadyRegistered(true);
          } else if (isRegistered && registeredEventName !== foundComp.title) {
            toast.error(`Access Denied: Already registered for ${registeredEventName}`);
            navigate('/user/dashboard', { replace: true });
            return;
          }
        }


      } catch (err) {
        reportError(err, { 
          component: 'RegistrationInit', 
          action: 'loading_competition_data',
          severity: 'high' 
        });
      } finally {
        setIsLoading(false);
      }
    };

    initRegistration();
  }, [user, authLoading, slug, navigate]);

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // --- AVR Lookup Logic ---
  const handleAvrInput = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    let val = e.target.value.toUpperCase();
    const prevVal = squadMembers[index]?.avrId || '';

    if (!val.startsWith("AVR-")) {
        val = "AVR-";
    }

    const raw = val.slice(4).replace(/[^A-Z0-9]/g, '');
    let letters = raw.slice(0, 3).replace(/[0-9]/g, '');
    let numbers = raw.slice(letters.length).replace(/[A-Z]/g, '').slice(0, 4);

    let formatted = "AVR-" + letters;

    if (letters.length === 3) {
        if (prevVal.length > val.length && prevVal.endsWith("-") && !val.includes("-", 5)) {
            formatted = "AVR-" + letters;
        } else {
            formatted += "-" + numbers;
        }
    }

    const newSquad = [...squadMembers];
    newSquad[index] = { ...newSquad[index], avrId: formatted };
    setSquadMembers(newSquad);

    if (formatted.length >= 9) {
        handleAvrLookup(formatted, index);
    }
  };

  const handleMemberInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { name, value } = e.target;
    const newSquad = [...squadMembers];
    newSquad[index] = { ...newSquad[index], [name]: value };
    setSquadMembers(newSquad);
  };

  const handleAvrLookup = async (avrId: string, index: number) => {
    if (!avrId || avrId.length < 8) return;

    setLookupLoading(prev => ({ ...prev, [index]: true }));
    try {
        const userQuery = query(collection(db, "user"), where("avrId", "==", avrId.trim()));
        const querySnapshot = await getDocs(userQuery);
        if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name || data.displayName || '';
            
            setSquadMembers(prev => {
                const updated = [...prev];
                // Only update if the user hasn't already changed the ID to something else
                if (updated[index].avrId === avrId) {
                    updated[index] = {
                        ...updated[index],
                        name: fullName,
                        email: data.email || '',
                        phone: data.whatsappNumber || data.whatsapp || data.phone || '',
                        college: data.college || '',
                        major: data.major || '',
                        dob: data.dob || '',
                        sex: data.sex || '',
                    };
                }
                return updated;
            });
            setLookupFailed(prev => ({ ...prev, [index]: false }));
        } else {
            setLookupFailed(prev => ({ ...prev, [index]: true }));
        }
    } catch (err) {
        reportError(err, { 
            component: 'RegistrationLookup', 
            action: 'member_id_verification',
            severity: 'low' 
        });
    } finally {
        setLookupLoading(prev => ({ ...prev, [index]: false }));
    }
  };


  /** Write registration to Firestore — FREE EVENTS ONLY.
   *  Paid events are handled server-side by the paymentWebhook Cloud Function.
   */
  const submitRegistration = async () => {
    // SECURITY: Block paid events from using client-side writes.
    // Paid registrations MUST go through the webhook to prevent unpaid confirmations.
    const baseFee = competition!.entryFee || 0;
    const addOnFee = (competition!.slug === 'orbitx_solar' && moonObservation) ? 20 : 0;
    const fee = baseFee + addOnFee;
    if (fee > 0) {
      console.error("SECURITY: Paid events must go through the payment gateway. Client-side write blocked.");
      toast.error("Registration error. Please try again through the payment flow.");
      return;
    }

    const regId = `${competition!.id}_${userData.avrId}`;
    const regRef = doc(db, 'registrations', regId);

    // Double check using query (avoids permission error on non-existent docs)
    const existCheckQuery = query(
      collection(db, 'registrations'),
      where('userId', '==', user!.uid),
      where('competitionId', '==', competition!.id),
      limit(1)
    );
    const existCheckSnap = await getDocs(existCheckQuery);
    if (!existCheckSnap.empty) {
      setAlreadyRegistered(true);
      setIsSuccess(true);
      return;
    }

    const allMembersAvr = [
      userData.avrId,
      ...squadMembers
        .filter(m => !!m.avrId && m.avrId.length >= 9)
        .map(m => m.avrId)
    ];

    const activeSquad = squadMembers.filter(m => !!m.avrId && m.avrId.length >= 9);

    // WRAP FIREBASE WRITE IN SELF-HEALING RETRY
    await withRetry(async () => {
      await setDoc(regRef, {
        id: regId,
        // Identification
        leaderAvrId: userData.avrId,
        userId: user!.uid,
        // Competition Info
        competitionId: competition!.id,
        eventName: competition!.title,
        competitionCode: competition!.code,
        category: competition!.category,
        department: competition!.department,
        isFlagship: competition!.isFlagship || false,
        // Team Info
        registrationType: (competition!.maxTeamSize || 1) > 1 ? "TEAM" : "SOLO",
        teamId: regId, // For free events, regId serves as teamId
        teamName: teamName || null,
        teamSize: activeSquad.length + 1,
        squad: [
          {
            avrId: userData.avrId,
            name: `${userData.firstName} ${userData.lastName}`,
            email: userData.email,
            phone: userData.whatsappNumber || userData.phone,
            college: userData.college,
            major: userData.major,
            age: calculateAge(userData.dob),
            sex: userData.sex
          },
          ...activeSquad.map(m => ({
            avrId: m.avrId,
            name: m.name,
            email: m.email,
            phone: m.phone,
            college: m.college,
            major: m.major || '',
            age: calculateAge(m.dob),
            sex: m.sex || ''
          }))
        ],
        allAvrIds: allMembersAvr,
        // Payment (always free for this code path)
        paymentRequired: competition!.paymentRequired,
        paymentStatus: 'free',
        amountPaid: 0,
        transactionId: null,
        paymentMode: null,
        // Status & Metadata
        status: 'confirmed',
        registeredAt: serverTimestamp(),
        isAttended: false,
        metadata: {
          createdAt: serverTimestamp()
        }
      });
    }, 3, 1500);


    setAlreadyRegistered(true);
    setIsSuccess(true);
  };

  /** Handle paid registration via Custom Checkout (UPI QR) */
  const handlePaidRegistration = async () => {
    if (!competition || !userData || !user) return;
    setIsSubmitting(true);
    isSubmittingRef.current = true;

    try {
      const txnid = generateTxnId(competition.id.toUpperCase().replace(/[^A-Z0-9]/g, ''));
      const baseFee = competition.entryFee || 0;
      const addOnFee = (competition.slug === 'orbitx_solar' && moonObservation) ? 20 : 0;
      const fee = baseFee + addOnFee;

      const pendingPayload = {
        txnId: txnid,
        type: 'competition',
        status: 'payment_pending',
        formData: {
          teamName: teamName || null,
          squad: squadMembers.filter(m => !!m.avrId && m.avrId.length >= 9).map(m => ({
            avrId: m.avrId,
            name: m.name,
            email: m.email,
            phone: m.phone,
            college: m.college
          })),
          moonObservation
        },
        competitionId: competition.id,
        competitionHandle: competition.handle || '',
        eventName: competition.title,
        amount: fee,
        userId: user.uid,
        userEmail: userData.email || user.email || '',
        userName: `${userData.firstName} ${userData.lastName}`,
        userPhone: userData.phone || '',
        userAVR: userData.avrId || '',
        allAvrIds: [
          userData.avrId,
          ...squadMembers
            .filter(m => !!m.avrId && m.avrId.length >= 9)
            .map(m => m.avrId)
        ],
        resolvedAt: null,
        easepayId: null,
        bankRefNum: null,
        paymentMode: null,
        adminNote: null,
        finalPayload: {
          leaderAvrId: userData.avrId,
          userId: user.uid,
          competitionId: competition.id,
          eventName: competition.title,
          competitionCode: competition.code,
          category: competition.category,
          department: competition.department,
          isFlagship: competition.isFlagship || false,
          userName: `${userData.firstName} ${userData.lastName}`,
          userEmail: userData.email || user.email || '',
          userPhone: userData.phone || '',
          registrationType: (competition.maxTeamSize || 1) > 1 ? "TEAM" : "SOLO",
          teamName: teamName || null,
          teamSize: (squadMembers.filter(m => !!m.avrId && m.avrId.length >= 9).length) + 1,
          squad: [
            {
              avrId: userData.avrId,
              name: `${userData.firstName} ${userData.lastName}`,
              email: userData.email,
              phone: userData.whatsappNumber || userData.phone,
              college: userData.college,
              major: userData.major,
              age: calculateAge(userData.dob),
              sex: userData.sex
            },
            ...squadMembers.filter(m => !!m.avrId && m.avrId.length >= 9).map(m => ({
              avrId: m.avrId,
              name: m.name,
              email: m.email,
              phone: m.phone,
              college: m.college,
              major: m.major || '',
              age: calculateAge(m.dob),
              sex: m.sex || ''
            }))
          ],
          allAvrIds: [
            userData.avrId,
            ...squadMembers
              .filter(m => !!m.avrId && m.avrId.length >= 9)
              .map(m => m.avrId)
          ],
          paymentRequired: true,
          paymentStatus: 'paid',
          amountPaid: fee,
          moonObservation: moonObservation
        }
      };

      setCheckoutOrderDetails({
        eventName: competition.title,
        amount: fee,
        participantName: `${userData.firstName} ${userData.lastName}`,
        avrId: userData.avrId
      });

      await paymentCheckout.initiatePayment({
        txnid,
        amount: fee.toFixed(2),
        productinfo: `${competition.title}${moonObservation ? ' + Moon Observation' : ''} Registration`,
        firstname: `${userData.firstName} ${userData.lastName}`,
        email: userData.email || user.email || '',
        phone: userData.phone || '',
        pendingPayload
      });

    } catch (err: any) {
      console.error("Payment Error:", err);
      toast.error("Payment initiation failed. Please try again.");
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  /** Main registration handler — routes to paid or free flow */
  const handleRegister = async () => {
    if (!competition || !userData || alreadyRegistered || isSubmittingRef.current) return;
    
    if (!accountabilityAccepted) {
      toast.error("Please acknowledge the scheduling policy.");
      return;
    }

    const baseFee = competition.entryFee || 0;
    const addOnFee = (competition.slug === 'orbitx_solar' && moonObservation) ? 20 : 0;
    const fee = baseFee + addOnFee;

    // --- Team Validation ---
    if ((competition.maxTeamSize || 1) > 1) {
      if (!teamName.trim()) {
        toast.error("TEAM_IDENTIFIER required for registration.");
        return;
      }

      const activeMembers = squadMembers.filter(m => m.avrId && m.avrId.length >= 9);
      const totalCount = activeMembers.length + 1; // +1 for Leader

      if (totalCount < (competition.minTeamSize || 1)) {
        toast.error(`Minimum ${competition.minTeamSize} members required for this arena.`);
        return;
      }

      // Check for duplicates
      const allAvrIds = [userData.avrId, ...activeMembers.map(m => m.avrId)];
      const seen = new Set();
      for (const id of allAvrIds) {
        if (seen.has(id)) {
          toast.error(`Duplicate detected: ${id}. Every squad member must be unique.`);
          return;
        }
        seen.add(id);
      }

      // Check for missing data in active members
      for (let i = 0; i < squadMembers.length; i++) {
        const m = squadMembers[i];
        if (m.avrId && m.avrId.length >= 9) {
          if (!m.name || !m.phone) {
            toast.error(`Incomplete details for Squadron Member P${i + 2}`);
            return;
          }
        }
      }
    }

    if (fee > 0) {
      // Paid event — route through Easebuzz
      await handlePaidRegistration();
    } else {
      // Free event — direct registration
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      try {
        await submitRegistration();
      } catch (err) {
        reportError(err, { 
          component: 'FreeRegistration', 
          action: 'submitting_registration',
          severity: 'high' 
        });
      } finally {
        setIsSubmitting(false);
        isSubmittingRef.current = false;
      }
    }
  };

  if (isLoading) {
    return (
      <div className="registration-page">
        <div className="loading-wrapper">
          <div className="loading-spinner"></div>
          <p>Encrypting Secure Connection...</p>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="registration-page">
        <div className="error-container">
          <h2>404 - Arena Not Found</h2>
          <p>The competition you are looking for does not exist or has been removed.</p>
          <button className="btn-dashboard-return" onClick={() => navigate('/competitions')}>
            Return to Arena
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-page animate-in">
      <PaymentCheckout
        isVisible={paymentCheckout.status !== 'idle'}
        status={paymentCheckout.status}
        qrLink={paymentCheckout.qrLink}
        timeRemaining={paymentCheckout.timeRemaining}
        error={paymentCheckout.error}
        paymentMode={paymentCheckout.paymentMode}
        registrationId={paymentCheckout.registrationId}
        orderDetails={checkoutOrderDetails || { eventName: '', amount: 0, participantName: '', avrId: '' }}
        onCancel={() => { paymentCheckout.cancelPayment(); setIsSubmitting(false); isSubmittingRef.current = false; }}
        onRetry={() => paymentCheckout.retry()}
        onChangeModeRequest={(upiId) => {
          if (upiId) {
            paymentCheckout.updatePayloadAndRetry({ upiId });
          } else {
            paymentCheckout.updatePayloadAndRetry({ upiId: undefined });
          }
        }}
        onSuccess={() => navigate('/user/dashboard')}
      />
      <div className="registration-container">
        
        {/* Left Side: Competition Details */}
        <div className="event-details-sidebar">
          <img src={competition.image} alt={competition.title} className="event-hero-img" crossOrigin="anonymous" />
          <div className="event-sidebar-overlay"></div>
          
          <div className="event-sidebar-content">
            <div className="event-meta-badges">
              {competition.isFlagship && <span className="meta-badge" style={{ background: '#ef4444', color: '#fff', borderColor: '#fca5a5' }}>Flagship Event</span>}
              <span className="meta-badge">{competition.subtitle || "Competition"}</span>
              {competition.prizePool && (
                <span className="meta-badge prize">
                  <Trophy size={14} /> Pool: {competition.prizePool}
                </span>
              )}
              {competition.entryFee !== undefined && competition.entryFee > 0 && (
                <span className="meta-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                  <CreditCard size={14} /> Entry: ₹{competition.entryFee}
                </span>
              )}
            </div>
            
            <h1 style={{ marginTop: '1rem' }}>{competition.title}</h1>
            <p className="event-desc">{competition.description || "Prepare yourself for the ultimate challenge. Do you have what it takes?"}</p>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="registration-form-section">
          <h2 className="registration-title">Official Registration</h2>
          <p className="registration-subtitle">Verify your identity profile below to secure your spot.</p>

          <div className="scheduling-notice-box">
            <div className="notice-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="notice-text">
              <h4>SCHEDULING ACCOUNTABILITY</h4>
              <p>
                By registering, you acknowledge that Avishkar '26 follows a <strong>One User, One Event</strong> policy. If you register for overlapping events, the responsibility for scheduling conflicts rests solely with you. The organizing committee is not liable for participation overlaps.
              </p>
              <div className="notice-check">
                <input 
                  type="checkbox" 
                  id="acc-check"
                  checked={accountabilityAccepted}
                  onChange={(e) => setAccountabilityAccepted(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#d9ff00', cursor: 'pointer' }}
                />
                <label htmlFor="acc-check" style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                  I accept full responsibility for my schedule.
                </label>
              </div>
            </div>
          </div>


          {userData && (
            <div className="user-prefill-card">
              <div className="prefill-header">
                <ShieldCheck size={16} /> DATA VERIFIED & SECURED
              </div>
              <div className="prefill-grid">
                <div className="prefill-item">
                  <label>First Name</label>
                  <span>{userData.firstName}</span>
                </div>
                <div className="prefill-item">
                  <label>Last Name</label>
                  <span>{userData.lastName}</span>
                </div>
                <div className="prefill-item full-width">
                  <label>College/University</label>
                  <span>{userData.college}</span>
                </div>
                <div className="prefill-item full-width" style={{ marginTop: '0.5rem' }}>
                  <label>Global Avishkar ID</label>
                  <span className="avr-highlight">{userData.avrId}</span>
                </div>
              </div>
            </div>
          )}

          {competition.slug === 'orbitx_solar' && !alreadyRegistered && (
            <div className="addon-selection-card">
              <div className="addon-header">
                <Moon size={18} /> EVENT ADD-ONS
              </div>
              <div className="addon-item">
                <div className="addon-info">
                  <span className="addon-name">Moon Observation</span>
                  <p className="addon-desc">Extended evening session with high-power lunar photography assistance.</p>
                </div>
                <div className="addon-action">
                  <span className="addon-price">+₹20</span>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={moonObservation} 
                      onChange={(e) => setMoonObservation(e.target.checked)} 
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>
          )}
          {(competition.maxTeamSize || 1) > 1 && (
            <div className="squad-assembly-section animate-in">
                {/* Team Name */}
                <div className="reg-section-divider">
                    <span className="divider-label">TEAM_IDENTIFIER</span>
                </div>
                <div className="team-name-input-group">
                    <div className="reg-input-wrapper">
                        <Users size={18} className="input-icon" />
                        <input 
                            type="text" 
                            placeholder="Enter Squadron Name" 
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                        />
                    </div>
                </div>

                {/* Squad Members */}
                <div className="reg-section-divider">
                    <span className="divider-label">SQUAD_REGISTRY</span>
                </div>
                
                <div className="squad-protocol-banner">
                    <ShieldAlert size={18} />
                    <p>All members must have a verified account. Data is synced via Global AVR IDs.</p>
                    <button className="protocol-action-btn" onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/signup`);
                        toast.success("Signup link copied!");
                    }}>
                        <Copy size={12} /> Share Link
                    </button>
                </div>

                <div className="squad-members-grid">
                    {squadMembers.map((member, index) => (
                        <div key={index} className={`member-entry-card ${lookupLoading[index] ? 'searching' : ''} ${lookupFailed[index] ? 'failed' : ''}`}>
                            <div className="member-index-tag">P{index + 2}</div>
                            
                            <div className="member-lookup-row">
                                <div className="lookup-input-box">
                                    <Fingerprint size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="AVR-XXX-0000"
                                        value={member.avrId}
                                        onChange={(e) => handleAvrInput(e, index)}
                                    />
                                    {lookupLoading[index] ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
                                </div>
                                
                                {member.avrId.length >= 9 && (
                                    <div className={`lookup-status ${lookupFailed[index] ? 'error' : 'success'}`}>
                                        {lookupFailed[index] ? <ShieldAlert size={12} /> : <Check size={12} />}
                                        {lookupFailed[index] ? 'Not Found' : 'Verified'}
                                    </div>
                                )}
                            </div>

                            <div className="member-details-rows">
                                <div className="detail-input-box readonly">
                                    <User size={14} />
                                    <input type="text" placeholder="Full Name" value={member.name} readOnly />
                                </div>
                                <div className="detail-input-box readonly">
                                    <Mail size={14} />
                                    <input type="email" placeholder="Email Address" value={member.email} readOnly />
                                </div>
                                <div className="detail-input-row">
                                    <div className="detail-input-box">
                                        <Phone size={14} />
                                        <input 
                                            type="tel" 
                                            name="phone"
                                            placeholder="WhatsApp Number" 
                                            value={member.phone} 
                                            onChange={(e) => handleMemberInputChange(e, index)}
                                        />
                                    </div>
                                    <div className="detail-input-box readonly">
                                        <Building2 size={14} />
                                        <input type="text" placeholder="Institution" value={member.college} readOnly />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {squadMembers.length < (competition.minTeamSize || 1) - 1 && (
                    <p className="squad-requirement-hint">
                        <AlertTriangle size={14} /> This arena requires at least {competition.minTeamSize} total members.
                    </p>
                )}
            </div>
          )}

          <div className="form-actions">
            {alreadyRegistered ? (
               <div className="already-registered-banner">
                 <CheckCircle size={20} /> Identity confirmed. You are registered.
               </div>
            ) : (
              <button 
                className="btn-register-submit" 
                onClick={handleRegister} 
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? "Processing..." 
                  : (competition.entryFee || 0) + (competition.slug === 'orbitx_solar' && moonObservation ? 20 : 0) > 0 
                    ? `Pay ₹${(competition.entryFee || 0) + (competition.slug === 'orbitx_solar' && moonObservation ? 20 : 0)} & Register` 
                    : "Confirm Registration"
                }
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Triumphant Success Overlay */}
      {isSuccess && (
        <div className="registration-success-overlay animate-in">
          <div className="success-icon">
            <CheckCircle size={80} color="#10b981" />
          </div>
          <h2>Access Granted.</h2>
          <p>
            Your identity <strong>{userData?.avrId}</strong> has been permanently inscribed into the registry for <strong>{competition.title}</strong>. 
            {transactionId && <><br />Transaction Ref: <strong style={{ fontFamily: 'monospace', color: '#a78bfa' }}>{transactionId}</strong></>}
            <br />Prepare your arsenal. We will see you at the arena.
          </p>
          <button className="btn-dashboard-return" onClick={() => navigate('/user/dashboard')}>
            View My Virtual Pass <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Registration;
