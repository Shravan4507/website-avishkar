/**
 * Self-Healing Error Architecture - Core Reporter
 * Handles centralized logging and global error notifications.
 */

export interface ErrorMetadata {
  component?: string;
  action?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  [key: string]: unknown;
}

/**
 * Dispatches a custom event that the ToastProvider listens to.
 * This allows us to trigger "glitchy" errors from non-React files.
 */
export const notifyError = (message: string) => {
  window.dispatchEvent(new CustomEvent('app-error-glitch', { 
    detail: { message } 
  }));
};

/**
 * The standard way to report errors across the Avishkar '26 portal.
 */
export const reportError = (error: unknown, metadata: ErrorMetadata = {}) => {
  const errorMsg = error instanceof Error ? error.message : String(error);
  
  // 1. Log with rich metadata for developers
  console.group(`%c Error Detected: ${metadata.component || 'Global'} `, 'background: #222; color: #ff0055; font-weight: bold;');
  console.error('Message:', errorMsg);
  console.error('Metadata:', metadata);
  if (error instanceof Error) console.error('Stack:', error.stack);
  console.groupEnd();

  // 2. Filter which errors trigger a UI Toast
  // We don't want to spam the user for "low" severity background noise
  if (metadata.severity !== 'low') {
    let userMessage = 'SYSTEM GLITCH DETECTED';
    
    if (metadata.severity === 'critical') {
      userMessage = 'CRITICAL FAILURE: Attempting Auto-Recovery...';
    } else if (metadata.action) {
      userMessage = `Error during ${metadata.action}. Please retry.`;
    }

    notifyError(userMessage);
  }

  // 3. (Future Extension) Post to Firebase Analytics / Logs
  // TODO: Implement firebaseLog(error, metadata) if persistent logs are needed.
};

/**
 * A simple retry wrapper for async operations.
 * Implements the "Self-Healing" Retry pattern.
 */
export async function withRetry<T>(
  fn: () => Promise<T>, 
  retries = 3, 
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 1) throw error;
    await new Promise(r => setTimeout(r, delay));
    return withRetry(fn, retries - 1, delay * 2); // Exponential backoff
  }
}
