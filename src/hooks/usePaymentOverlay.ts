import { useState, useCallback } from 'react';

export type PaymentStage = 'preparing' | 'connecting' | 'redirecting';

export function usePaymentOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const [stage, setStage] = useState<PaymentStage>('preparing');

  const startPayment = useCallback(() => {
    setStage('preparing');
    setIsVisible(true);
  }, []);

  const setConnecting = useCallback(() => {
    setStage('connecting');
  }, []);

  const setRedirecting = useCallback(() => {
    setStage('redirecting');
  }, []);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    setStage('preparing');
  }, []);

  return { isVisible, stage, startPayment, setConnecting, setRedirecting, dismiss };
}
