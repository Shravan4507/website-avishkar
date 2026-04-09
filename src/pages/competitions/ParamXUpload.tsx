import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, updateDoc, collection, query, where, getDocs, limit, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../firebase/firebase';
import { useToast } from '../../components/toast/Toast';
import { useRegistrationGuard } from '../../hooks/useRegistrationGuard';
import SEO from '../../components/seo/SEO';
import { 
    CloudUpload, 
    CheckCircle2, 
    ShieldAlert,
    Info,
    Loader2, 
    ArrowLeft,
    ShieldCheck,
    Lock,
    FileUp,
    Clock,
    Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

import './ParamXUpload.css';
import { reportError, withRetry } from '../../utils/errorReport';

const ParamXUpload: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [user] = useAuthState(auth);
    const toast = useToast();
    const { isRegistered, type, data, loading: loadingGuard } = useRegistrationGuard();

    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadSpeed, setUploadSpeed] = useState(0);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isLeader, setIsLeader] = useState<boolean | null>(null);
    const [checkingLeader, setCheckingLeader] = useState(true);

    const isDevBypass = import.meta.env.DEV && searchParams.get('dev') === 'true';

    const uploadTaskRef = useRef<any>(null);
    const lastBytesRef = useRef(0);
    const lastTimeRef = useRef(Date.now());

    // Mock Data for Dev Mode
    const displayData = isDevBypass ? {
        teamName: 'Dev Testing Team',
        teamId: 'AVR-PRM-9999',
        psId: 'TEST-01',
        id: 'mock-id',
        leaderAvrId: 'AVR-TEST-01',
        leaderEmail: 'dev@test.com'
    } : data;

    // Security & Access Control
    useEffect(() => {
        if (loadingGuard) return;

        // --- DEVELOPER BYPASS ---
        if (isDevBypass) {
            setIsLeader(true);
            setCheckingLeader(false);
            console.log("🛠️ Dev Bypass Active: Access Granted to Upload Portal");
            return;
        }
        // -------------------------

        if (!user) {
            toast.error("Unauthenticated: Please log in to access the upload portal.");
            navigate('/login');
            return;
        }

        if (!isRegistered || type !== 'hackathon') {
            setIsLeader(false);
            setCheckingLeader(false);
            return;
        }

        const verifyLeader = async () => {
            try {
                // Get user's AVR ID
                const userSnap = await getDocs(query(collection(db, "user"), where("uid", "==", user.uid), limit(1)));
                if (userSnap.empty) {
                    setIsLeader(false);
                    return;
                }
                const currentUserAvrId = userSnap.docs[0].data().avrId;
                
                // Compare with leader info in registration data
                const isUserLeader = data.leaderAvrId === currentUserAvrId || data.leaderEmail === user.email;
                setIsLeader(isUserLeader);
            } catch (err) {
                reportError(err, { 
                    component: 'ParamXVerifyLeader', 
                    action: 'permission_handshake',
                    severity: 'medium' 
                });
                setIsLeader(false);
            } finally {
                setCheckingLeader(false);
            }
        };

        verifyLeader();
    }, [user, isRegistered, type, data, isDevBypass, loadingGuard, navigate, toast]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            
            // Format check
            const allowed = ['.pptx', '.pdf'];
            const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
            
            if (!allowed.includes(ext)) {
                toast.error("Invalid Format: Only .pptx or .pdf allowed.");
                return;
            }

            // Size check: 5MB
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error("File Oversized: Maximum limit is 5MB.");
                return;
            }

            setFile(selectedFile);
            setUploadSuccess(false);
            setProgress(0);
        }
    };

    const handleUpload = async () => {
        if (!file || !displayData?.id) return;

        setUploading(true);
        setProgress(0);
        lastBytesRef.current = 0;
        lastTimeRef.current = Date.now();

        const storageRef = ref(storage, `paramx_submissions/${displayData.id}/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTaskRef.current = uploadTask;

        uploadTask.on('state_changed', 
            (snapshot) => {
                const now = Date.now();
                const bytesTransferred = snapshot.bytesTransferred;
                const totalBytes = snapshot.totalBytes;
                const pct = (bytesTransferred / totalBytes) * 100;
                setProgress(pct);

                // Calculate Speed & Time Left
                const timeDiff = (now - lastTimeRef.current) / 1000; // in seconds
                if (timeDiff > 0.5) {
                    const bytesDiff = bytesTransferred - lastBytesRef.current;
                    const speed = bytesDiff / timeDiff; // bytes per second
                    setUploadSpeed(speed);
                    
                    if (speed > 0) {
                        const remaining = (totalBytes - bytesTransferred) / speed;
                        setTimeLeft(remaining);
                    }

                    lastBytesRef.current = bytesTransferred;
                    lastTimeRef.current = now;
                }
            }, 
            (error) => {
                reportError(error, { 
                    component: 'ParamXFirebaseUpload', 
                    action: 'uploading_file_blob',
                    severity: 'high' 
                });
                setUploading(false);
                toast.error("Upload Failed: Connection lost or restricted access.");
            }, 
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    
                    if (isDevBypass) {
                        setUploadSuccess(true);
                        setUploading(false);
                        toast.success("Dev Mode: Mock Upload Successful!");
                        return;
                    }

                    // Atomic Firestore Update with Self-Healing Retry
                    await withRetry(async () => {
                        const regDocRef = doc(db, "hackathon_registrations", data.id);
                        await updateDoc(regDocRef, {
                            pptUrl: downloadURL,
                            lastUpdated: serverTimestamp(),
                            status: 'submitted'
                        });
                    }, 3, 2000);

                    setUploadSuccess(true);
                    setUploading(false);
                    toast.success("Submission Successful! Your project has been logged.");
                } catch (err) {
                    reportError(err, { 
                        component: 'ParamXFirestoreUpdate', 
                        action: 'finalizing_submission_metadata',
                        severity: 'high' 
                    });
                    setUploading(false);
                }
            }
        );
    };

    if (loadingGuard || checkingLeader) {
        return (
            <div className="upload-portal-loading">
                <Loader2 className="animate-spin" size={40} />
                <p>Verifying Security Credentials...</p>
            </div>
        );
    }

    if (!isDevBypass && (!isRegistered || type !== 'hackathon')) {
        return (
            <div className="upload-portal-error">
                <div className="error-card glass-morphism">
                    <Lock size={60} className="error-icon" />
                    <h1>Registration Required</h1>
                    <p>Only registered teams participating in Param-X '26 can access this portal.</p>
                    <button className="back-home-btn" onClick={() => navigate('/param-x')}>
                        Explore Challenges
                    </button>
                </div>
            </div>
        );
    }

    if (!isLeader) {
        return (
            <div className="upload-portal-error">
                <div className="error-card glass-morphism">
                    <ShieldAlert size={60} className="error-icon" />
                    <h1>Restricted Access</h1>
                    <p>Only the **Team Leader** who registered for Param-X can upload submissions.</p>
                    <button className="back-home-btn" onClick={() => navigate('/param-x')}>
                        Return to Param-X
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="upload-portal-page">
            <SEO 
                title="PPT Submission | Param-X '26" 
                description="Secure portal for Param-X hackathon teams to upload their project ideation PPTs and reports."
            />

            <div className="upload-portal-container">
                <div className="upload-nav">
                    <button className="back-link" onClick={() => navigate('/param-x')}>
                        <ArrowLeft size={18} /> Back to Event
                    </button>
                </div>

                <div className="portal-header">
                    <div className="team-badge">
                        <ShieldCheck size={16} /> 
                        <span>Leader Verified: {displayData?.teamName} ({displayData?.teamId})</span>
                    </div>
                    <h1>Project Submission Portal</h1>
                    <p>Submit your initial ideation PPT or final project report. Ensure strictly followed formats.</p>
                </div>

                <div className="upload-grid">
                    <div className="upload-controls">
                        <div className={`drop-zone ${file ? 'has-file' : ''}`}>
                            <input 
                                type="file" 
                                id="ppt-upload" 
                                hidden 
                                onChange={handleFileChange}
                                accept=".pptx, .pdf"
                                disabled={uploading}
                            />
                            <label htmlFor="ppt-upload" className="drop-label">
                                {file ? (
                                    <div className="file-info animate-scale-up">
                                        <CheckCircle2 size={48} className="file-icon" />
                                        <span className="file-name">{file.name}</span>
                                        <span className="file-size">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                                        {!uploading && <span className="change-hint">Click to change file</span>}
                                    </div>
                                ) : (
                                    <div className="upload-prompt">
                                        <div className="upload-icon-circle">
                                            <CloudUpload size={40} />
                                        </div>
                                        <h3>Drag & Drop or Browse</h3>
                                        <p>Accepted formats: .pptx, .pdf (Max 5MB)</p>
                                    </div>
                                )}
                            </label>
                        </div>

                        {uploading && (
                            <div className="upload-progress-container animate-fade-in">
                                <div className="progress-header">
                                    <div className="speed-info">
                                        <Zap size={14} />
                                        <span>{(uploadSpeed / 1024).toFixed(1)} KB/s</span>
                                    </div>
                                    <div className="time-info">
                                        <Clock size={14} />
                                        <span>{timeLeft ? `${Math.ceil(timeLeft)}s left` : 'Calculating...'}</span>
                                    </div>
                                </div>
                                <div className="progress-bar-bg">
                                    <motion.div 
                                        className="progress-bar-fill"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                    />
                                </div>
                                <div className="progress-footer">
                                    <span>Syncing with Cloud Storage...</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                            </div>
                        )}

                        <button 
                            className={`submit-upload-btn ${(!file || uploading || uploadSuccess) ? 'disabled' : ''}`}
                            disabled={!file || uploading || uploadSuccess}
                            onClick={handleUpload}
                        >
                            {uploading ? (
                                <><Loader2 className="animate-spin" /> UPLOADING...</>
                            ) : uploadSuccess ? (
                                <><CheckCircle2 /> SUBMITTED</>
                            ) : (
                                <><FileUp /> UPLOAD SUBMISSION</>
                            )}
                        </button>

                        {uploadSuccess && (
                            <div className="success-banner animate-scale-up">
                                <CheckCircle2 size={24} />
                                <div className="success-text">
                                    <h4>Update Received</h4>
                                    <p>Your team's submission has been securely stored. You can re-upload to overwrite before the deadline.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="upload-instructions glass-morphism">
                        <h3><Info size={20} /> Submission Instructions</h3>
                        <ul className="rules-list">
                            <li>
                                <strong>File Formats:</strong> Strictly accept only <strong>.pptx</strong> or <strong>.pdf</strong> files.
                            </li>
                            <li>
                                <strong>Size Limit:</strong> File size must not exceed <strong>5MB</strong>.
                            </li>
                            <li>
                                <strong>Authority:</strong> Only the <strong>Team Leader</strong> is permitted to upload the project files.
                            </li>
                            <li>
                                <strong>Naming:</strong> Please name your file clearly (e.g., <em>{displayData?.teamName || 'Team'}_PS{displayData?.psId || '01'}.pdf</em>).
                            </li>
                            <li>
                                <strong>Overwrite:</strong> You can upload multiple times; the latest file will overwrite the previous one.
                            </li>
                            <li>
                                <strong>Progress:</strong> Stay on this page until the progress bar reaches 100% and you see the "SUBMITTED" state.
                            </li>
                        </ul>

                        <div className="upload-meta-footer">
                            <div className="meta-item">
                                <span className="label">Team ID:</span>
                                <span className="value">{displayData?.teamId}</span>
                            </div>
                            <div className="meta-item">
                                <span className="label">Problem ID:</span>
                                <span className="value">PS-{displayData?.psId}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParamXUpload;
