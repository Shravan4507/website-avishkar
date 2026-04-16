import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FUNCTIONS_CONFIG } from '../../config/functions';
import { CheckCircle, XCircle, Loader2, RefreshCcw } from 'lucide-react';
import './PaymentStatus.css';

type TxnStatus = 'verifying' | 'success' | 'failed' | 'timeout';

const PaymentStatus: React.FC = () => {
  const [searchParams] = useSearchParams();
  const txnid = searchParams.get('txnid');
  const initialStatus = searchParams.get('status') as TxnStatus || 'verifying';
  const reason = searchParams.get('reason');

  const navigate = useNavigate();
  const [status, setStatus] = useState<TxnStatus>(initialStatus);
  const [errorMessage, setErrorMessage] = useState(reason || '');
  const [verifyAttempt, setVerifyAttempt] = useState(0);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeVerifyDoneRef = useRef(false);
  const statusRef = useRef(status);

  // Keep statusRef in sync (so async callbacks see latest value)
  useEffect(() => { statusRef.current = status; }, [status]);

  const cleanup = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  /**
   * Passive check: read Firestore pending_registrations doc directly.
   * This is the fastest path — if paymentSuccess or webhook already
   * finalized, this picks it up immediately.
   */
  const checkFirestore = async (): Promise<boolean> => {
    if (!txnid) return false;
    try {
      const pendingDoc = await getDoc(doc(db, "pending_registrations", txnid));
      if (pendingDoc.exists()) {
        const pData = pendingDoc.data();
        if (pData.status === 'confirmed') {
          setStatus('success');
          cleanup();
          return true;
        } else if (pData.status === 'failed') {
          setStatus('failed');
          setErrorMessage(pData.errorMessage || 'Payment was failed or rejected by the gateway.');
          cleanup();
          return true;
        }
      }
    } catch (e) {
      console.error("[PaymentStatus] Firestore polling error:", e);
    }
    return false;
  };

  /**
   * Active check: call checkPaymentStatus Cloud Function which queries
   * the payment gateway's Transaction API directly and finalizes the
   * registration if the payment was successful. This is the third
   * safety net after paymentSuccess and paymentWebhook.
   */
  const activeVerify = async (): Promise<boolean> => {
    if (!txnid || activeVerifyDoneRef.current) return false;
    try {
      console.log(`[PaymentStatus] Active verification attempt for ${txnid}`);
      const res = await fetch(`${FUNCTIONS_CONFIG.checkPaymentStatus}?txnid=${txnid}`);
      const data = await res.json();

      if (data.status === 'success') {
        setStatus('success');
        cleanup();
        activeVerifyDoneRef.current = true;
        return true;
      } else if (data.status === 'failed') {
        setStatus('failed');
        setErrorMessage('Payment was unsuccessful.');
        cleanup();
        activeVerifyDoneRef.current = true;
        return true;
      }
      // status === 'pending' → keep polling
    } catch (e) {
      console.error("[PaymentStatus] Active verify error:", e);
    }
    return false;
  };

  useEffect(() => {
    if (status === 'success' || status === 'failed') return;
    if (!txnid) {
      setStatus('failed');
      setErrorMessage('Transaction ID is missing.');
      return;
    }

    // 1. Immediate check
    checkFirestore();

    // 2. Poll every 2.5s — passive Firestore + active gateway verification as fallback
    let pollCount = 0;
    pollingRef.current = setInterval(async () => {
      if (statusRef.current === 'success' || statusRef.current === 'failed') {
        cleanup();
        return;
      }

      pollCount++;
      setVerifyAttempt(pollCount);

      // First try passive Firestore check
      const resolved = await checkFirestore();
      if (resolved) return;

      // After 8 seconds (3 polls), start active verification via gateway API
      // This triggers the Cloud Function to directly query Easebuzz/Razorpay
      if (pollCount >= 3 && !activeVerifyDoneRef.current) {
        const activeResolved = await activeVerify();
        if (activeResolved) return;
      }
    }, 2500);

    // 3. Timeout after 90 seconds
    timeoutRef.current = setTimeout(() => {
      if (statusRef.current === 'verifying') {
        setStatus('timeout');
      }
      cleanup();
    }, 90000);

    return cleanup;
  }, [txnid, initialStatus]);

  const handleReturn = () => {
    navigate('/user/dashboard', { replace: true });
  };

  const handleManualRetry = async () => {
    setStatus('verifying');
    setVerifyAttempt(0);
    activeVerifyDoneRef.current = false;

    const resolved = await checkFirestore();
    if (!resolved) {
      await activeVerify();
    }
  };

  return (
    <div className="payment-status-container">
      <div className="payment-status-card">
        {status === 'verifying' && (
          <div className="status-content verifying">
            <div className="icon-wrapper">
              <Loader2 size={64} className="spinner-icon" />
            </div>
            <h2>Verifying Transaction</h2>
            <p className="status-subtitle">
              We are securely confirming your payment with the gateway.
              <br />
              <strong>Please do not close or refresh this page.</strong>
            </p>
            {verifyAttempt >= 3 && (
              <p className="status-detail">
                Checking with payment gateway directly...
              </p>
            )}
          </div>
        )}

        {status === 'success' && (
          <div className="status-content success">
            <div className="icon-wrapper">
              <CheckCircle size={64} className="success-icon" />
            </div>
            <h2>Payment Successful!</h2>
            <p className="status-subtitle">
              Your registration has been confirmed and secured.
            </p>
            <p className="status-txnid">TXN ID: {txnid}</p>
            <button className="status-action-btn success-btn" onClick={handleReturn}>
              Go to Dashboard
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="status-content failed">
            <div className="icon-wrapper">
              <XCircle size={64} className="failed-icon" />
            </div>
            <h2>Payment Failed</h2>
            <p className="status-subtitle">
              {errorMessage || 'The payment was unsuccessful.'}
            </p>
            <div className="error-notice">
              <strong>Important:</strong> If your money is debited, please contact the support at <a href="mailto:support.avishkarr@zealeducation.com">support.avishkarr@zealeducation.com</a> immediately with your TXN ID.
            </div>
            <p className="status-txnid">TXN ID: {txnid}</p>
            <button className="status-action-btn failed-btn" onClick={handleReturn}>
              Go to Dashboard
            </button>
          </div>
        )}

        {status === 'timeout' && (
          <div className="status-content timeout">
            <div className="icon-wrapper">
              <RefreshCcw size={64} className="timeout-icon" />
            </div>
            <h2>Verification Timeout</h2>
            <p className="status-subtitle">
              The gateway is taking longer than expected to confirm the status.
            </p>
            <p className="status-subtitle">
              Do not worry. If your payment was successful, it will automatically reflect in your dashboard within 5 to 10 minutes.
            </p>
            <p className="status-txnid">TXN ID: {txnid}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="status-action-btn" onClick={handleManualRetry}>
                <RefreshCcw size={16} /> Check Again
              </button>
              <button className="status-action-btn" onClick={handleReturn}>
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;

