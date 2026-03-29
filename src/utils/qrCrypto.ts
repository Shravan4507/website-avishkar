import CryptoJS from 'crypto-js';

/**
 * QR Crypto Utility (Improved)
 * Uses AES-256 for data encryption (offline privacy)
 * Uses HMAC-SHA256 for digital signatures (tamper-proofing)
 */

const SECRET_KEY = import.meta.env.VITE_QR_SECRET_KEY;
if (!SECRET_KEY) {
  throw new Error('CRITICAL: VITE_QR_SECRET_KEY environment variable is not set. QR generation/verification is disabled.');
}

export interface QRPayload {
  firstName: string;
  lastName: string;
  avrId: string;
  yearBorn: string;
  eventId?: string; // Optional: Only for participants
}

/**
 * Generates an encrypted and signed QR string.
 * Format: CryptoJS.AES(payload + signature)
 */
export function generateQRToken(data: QRPayload): string {
  const { firstName, lastName, avrId, yearBorn, eventId = 'VISITOR' } = data;
  
  // 1. Create the canonical message string
  const message = `${firstName.trim().toLowerCase()}|${lastName.trim().toLowerCase()}|${avrId.trim()}|${yearBorn}|${eventId}|${Date.now()}`;
  
  // 2. Generate HMAC signature of the message
  const signature = CryptoJS.HmacSHA256(message, SECRET_KEY).toString(CryptoJS.enc.Hex).slice(0, 16);
  
  // 3. Combine message and signature
  const fullPayload = `${message}|${signature}`;
  
  // 4. Encrypt everything with AES to prevent raw data leakage if scanned by generic apps
  const encrypted = CryptoJS.AES.encrypt(fullPayload, SECRET_KEY).toString();
  
  return encrypted;
}

/**
 * Decrypts and verifies a QR token.
 * Returns the data if valid, throws an error otherwise.
 */
export function decryptAndVerifyQR(token: string): QRPayload & { timestamp: number } {
  try {
    // 1. Decrypt AES
    const bytes = CryptoJS.AES.decrypt(token, SECRET_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedText) throw new Error('Invalid or corrupted QR code');
    
    const parts = decryptedText.split('|');
    
    // Format: firstName|lastName|avrId|yearBorn|eventId|timestamp|signature
    if (parts.length !== 7) throw new Error('Format mismatch: Tampered or legacy QR');
    
    const [firstName, lastName, avrId, yearBorn, eventId, timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);
    
    // 2. Re-verify HMAC signature
    const message = `${firstName}|${lastName}|${avrId}|${yearBorn}|${eventId}|${timestampStr}`;
    const expectedSignature = CryptoJS.HmacSHA256(message, SECRET_KEY).toString(CryptoJS.enc.Hex).slice(0, 16);
    
    if (signature !== expectedSignature) {
      throw new Error('Security Alert: Forged or modified QR detected');
    }

    return {
      firstName,
      lastName,
      avrId,
      yearBorn,
      eventId: eventId === 'VISITOR' ? undefined : eventId,
      timestamp
    };
  } catch (error) {
    console.error('QR Decryption Error:', error);
    throw new Error(error instanceof Error ? error.message : 'Invalid QR');
  }
}
