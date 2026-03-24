/**
 * QR Crypto Utility
 * Uses HMAC-SHA256 via browser's SubtleCrypto API to sign and verify QR payloads.
 * Prevents QR forgery — only our app can generate valid passes.
 *
 * QR Payload Format: AVR-ID|timestamp|signature
 * The scanner verifies the signature before accepting the scan.
 */

const QR_SECRET = import.meta.env.VITE_QR_SECRET || 'avishkar26-default-secret-key';

// Convert string to ArrayBuffer
function strToBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer as ArrayBuffer;
}

// Convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Get the HMAC CryptoKey
async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    strToBuffer(QR_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Signs an AVR-ID and returns a secure QR payload string.
 * Format: AVR-ID|timestamp|signature(first 16 hex chars)
 */
export async function signQRPayload(avrId: string): Promise<string> {
  const timestamp = Date.now().toString();
  const message = `${avrId}|${timestamp}`;
  
  const key = await getKey();
  const signature = await crypto.subtle.sign('HMAC', key, strToBuffer(message));
  const sig = bufferToHex(signature).slice(0, 16); // First 16 hex chars (64 bits)
  
  return `${avrId}|${timestamp}|${sig}`;
}

/**
 * Verifies a scanned QR payload.
 * Returns { valid: boolean, avrId: string, timestamp: number }
 */
export async function verifyQRPayload(payload: string): Promise<{
  valid: boolean;
  avrId: string;
  timestamp: number;
  error?: string;
}> {
  const parts = payload.split('|');
  
  if (parts.length !== 3) {
    return { valid: false, avrId: '', timestamp: 0, error: 'INVALID FORMAT: Not an Avishkar QR' };
  }

  const [avrId, timestampStr, receivedSig] = parts;
  const timestamp = parseInt(timestampStr, 10);

  if (!avrId.startsWith('AVR-')) {
    return { valid: false, avrId, timestamp, error: 'INVALID ID: Not a valid AVR-ID' };
  }

  // Verify HMAC signature
  const message = `${avrId}|${timestampStr}`;
  const key = await getKey();
  const signature = await crypto.subtle.sign('HMAC', key, strToBuffer(message));
  const expectedSig = bufferToHex(signature).slice(0, 16);

  if (receivedSig !== expectedSig) {
    return { valid: false, avrId, timestamp, error: 'FORGED PASS: Signature mismatch' };
  }

  return { valid: true, avrId, timestamp };
}
