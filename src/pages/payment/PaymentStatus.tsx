import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { CheckCircle, XCircle, Loader2, RefreshCcw } from 'lucide-react';
import './PaymentStatus.css'; // Make sure we import the CSS file

type TxnStatus = 'verifying' | 'success' | 'failed' | 'timeout';

const PaymentStatus: React.FC = () => {
  const [searchParams] = useSearchParams();
  const txnid = searchParams.get('txnid');
  const initialStatus = searchParams.get('status') as TxnStatus || 'verifying';
  const reason = searchParams.get('reason');

  const navigate = useNavigate();
  const [status, setStatus] = useState<TxnStatus>(initialStatus);
  const [errorMessage, setErrorMessage] = useState(reason || '');
  
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // If the initial URL status is already final, don't poll
    if (status === 'success' || status === 'failed') return;
    if (!txnid) {
      setStatus('failed');
      setErrorMessage('Transaction ID is missing.');
      return;
    }

    const checkStatus = async () => {
      try {
        const pendingDoc = await getDoc(doc(db, "pending_registrations", txnid));
        if (pendingDoc.exists()) {
          const pData = pendingDoc.data();
          if (pData.status === 'confirmed') {
            setStatus('success');
            cleanup();
          } else if (pData.status === 'failed') {
            setStatus('failed');
            setErrorMessage(pData.errorMessage || 'Payment was failed or rejected by the gateway.');
            cleanup();
          }
        }
      } catch (e) {
        console.error("Error polling payment status:", e);
      }
    };

    // 1. Initial immediate check
    checkStatus();

    // 2. Poll every 2.5 seconds
    pollingRef.current = setInterval(checkStatus, 2500);

    // 3. Timeout after 30 seconds
    timeoutRef.current = setTimeout(() => {
      if (status === 'verifying') {
        setStatus('timeout');
      }
      cleanup();
    }, 30000);

    return cleanup;
  }, [txnid, initialStatus]); // Only run on mount or txnid change

  const cleanup = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleReturn = () => {
    navigate('/user/dashboard', { replace: true });
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
            <button className="status-action-btn" onClick={handleReturn}>
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;
