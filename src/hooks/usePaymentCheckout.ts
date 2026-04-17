import { useState, useCallback, useRef, useEffect } from 'react';
import { FUNCTIONS_CONFIG } from '../config/functions';

export type CheckoutStatus = 'idle' | 'creating' | 'redirecting' | 'success' | 'failed' | 'error';

interface PaymentOrderPayload {
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  udf1?: string;
  upiId?: string;
  pendingPayload: any;
}

interface UsePaymentCheckoutReturn {
  status: CheckoutStatus;
  qrLink: string | null;
  txnid: string | null;
  registrationId: string | null;
  error: string | null;
  timeRemaining: number;
  paymentMode: 'qr' | 'collect';
  initiatePayment: (payload: PaymentOrderPayload) => Promise<void>;
  cancelPayment: () => void;
  retry: () => void;
  updatePayloadAndRetry: (updates: Partial<PaymentOrderPayload>) => void;
}

export function usePaymentCheckout(): UsePaymentCheckoutReturn {
  const [status, setStatus] = useState<CheckoutStatus>('idle');
  const [txnid, setTxnid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lastPayloadRef = useRef<PaymentOrderPayload | null>(null);

  const cleanup = useCallback(() => {
    // Keep for potential future use if we need timeouts
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const initiatePayment = useCallback(async (payload: PaymentOrderPayload) => {
    cleanup();
    setStatus('creating');
    setError(null);
    lastPayloadRef.current = payload;
    setTxnid(payload.txnid);

    try {
      const returnUrlParams = `?returnUrl=${encodeURIComponent(window.location.origin + '/payment/status')}`;
      const fullPayload = {
        ...payload,
        surl: `${FUNCTIONS_CONFIG.paymentSuccess}${returnUrlParams}`,
        furl: `${FUNCTIONS_CONFIG.paymentFailure}${returnUrlParams}`,
      };

      const response = await fetch(FUNCTIONS_CONFIG.initiatePayment, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload)
      });

      const data = await response.json();

      if (data.success && data.access_key) {
        setStatus('redirecting');
        // Standard redirect flow
        window.location.href = `https://pay.easebuzz.in/pay/${data.access_key}`;
      } else {
        setError(data.error || 'Failed to initiate payment');
        setStatus('error');
      }
    } catch (err: any) {
      console.error('[PaymentCheckout] Initiate error:', err);
      setError(err.message || 'Failed to initiate payment');
      setStatus('error');
    }
  }, [cleanup]);

  const cancelPayment = useCallback(() => {
    cleanup();
    setStatus('idle');
    setError(null);
  }, [cleanup]);

  const retry = useCallback(() => {
    if (lastPayloadRef.current) {
      initiatePayment(lastPayloadRef.current);
    }
  }, [initiatePayment]);

  const updatePayloadAndRetry = useCallback((updates: Partial<PaymentOrderPayload>) => {
    if (lastPayloadRef.current) {
      const newPayload = { ...lastPayloadRef.current, ...updates };
      initiatePayment(newPayload);
    }
  }, [initiatePayment]);

  return {
    status,
    qrLink: null,
    txnid,
    registrationId: null,
    error,
    timeRemaining: 0,
    paymentMode: 'qr',
    initiatePayment,
    cancelPayment,
    retry,
    updatePayloadAndRetry
  };
}
