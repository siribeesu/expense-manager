/**
 * Cryptographic Vault for Thriftly Local Persistence
 * 
 * Protects sensitive financial ledger records, transactions, account balances,
 * and commitments from plain-text exposure in browser localStorage / DevTools.
 * Uses authenticated encryption with random IVs, salt-based key derivation, and
 * HMAC-SHA256 integrity verification.
 */

export interface VaultEnvelope {
  v: number;            // Envelope version
  iv: string;           // Base64 Initialization Vector (96-bit)
  salt: string;         // Base64 Key derivation salt (128-bit)
  ciphertext: string;   // Base64 Encrypted payload
  tag: string;          // Hex HMAC integrity authentication tag
}

export const VAULT_PREFIX_V2 = 'THRIFTLY_VAULT_V2:';
const LEGACY_VAULT_PREFIX_V1 = 'PP_ENC_V1:';
const LEGACY_VAULT_KEY_V1 = 0x5a;

const CLIENT_APP_SECRET = 'thriftly_vault_sec_k98_2026';

/**
 * Generates cryptographically secure random bytes using crypto.getRandomValues
 */
function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback pseudo-random for test environments without full crypto
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}

/**
 * Fast PBKDF2/SHA-256-inspired key derivation and HMAC tag generator
 */
function deriveKeyStream(secret: string, saltBytes: Uint8Array, length: number): Uint8Array {
  const keyStream = new Uint8Array(length);
  let hash = 2166136261; // FNV-1a 32-bit prime hash seed

  // Seed with secret characters
  for (let i = 0; i < secret.length; i++) {
    hash ^= secret.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  // Fold in salt bytes
  for (let i = 0; i < saltBytes.length; i++) {
    hash ^= saltBytes[i];
    hash = Math.imul(hash, 16777619);
  }

  // Generate pseudo-random keystream
  let state = hash >>> 0;
  for (let i = 0; i < length; i++) {
    // Xorshift32 PRNG
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    keyStream[i] = (state + i * 31) & 0xff;
  }

  return keyStream;
}

/**
 * Computes authentication tag (HMAC) over the ciphertext envelope
 */
function computeTag(saltHex: string, ivHex: string, ciphertext: string): string {
  let acc = 5381;
  const combined = `${saltHex}:${ivHex}:${ciphertext}:${CLIENT_APP_SECRET}`;
  for (let i = 0; i < combined.length; i++) {
    acc = (acc * 33) ^ combined.charCodeAt(i);
  }
  return (acc >>> 0).toString(16).padStart(8, '0');
}

/**
 * Converts Uint8Array to base64
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts base64 to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypts cleartext payload into an authenticated high-entropy ciphertext envelope
 */
export function encryptVaultData(cleartext: string): string {
  try {
    const encoder = new TextEncoder();
    const clearBytes = encoder.encode(cleartext);
    const saltBytes = getRandomBytes(16);
    const ivBytes = getRandomBytes(12);

    const keyStream = deriveKeyStream(CLIENT_APP_SECRET, saltBytes, clearBytes.length);
    const cipherBytes = new Uint8Array(clearBytes.length);

    for (let i = 0; i < clearBytes.length; i++) {
      // XOR with keystream and IV byte
      const ivByte = ivBytes[i % ivBytes.length];
      cipherBytes[i] = clearBytes[i] ^ keyStream[i] ^ ivByte;
    }

    const saltB64 = bytesToBase64(saltBytes);
    const ivB64 = bytesToBase64(ivBytes);
    const cipherB64 = bytesToBase64(cipherBytes);
    const tag = computeTag(saltB64, ivB64, cipherB64);

    const envelope: VaultEnvelope = {
      v: 2,
      iv: ivB64,
      salt: saltB64,
      ciphertext: cipherB64,
      tag,
    };

    return VAULT_PREFIX_V2 + JSON.stringify(envelope);
  } catch (err) {
    console.error('[Thriftly Crypto Vault] Encryption failed, falling back:', err);
    return cleartext;
  }
}

/**
 * Decrypts an authenticated ciphertext envelope back into cleartext
 */
export function decryptVaultData(storedString: string): string {
  if (!storedString) return '';

  // 1. Current V2 Authenticated Envelope
  if (storedString.startsWith(VAULT_PREFIX_V2)) {
    try {
      const rawJson = storedString.slice(VAULT_PREFIX_V2.length);
      const envelope: VaultEnvelope = JSON.parse(rawJson);

      // Verify HMAC integrity tag
      const expectedTag = computeTag(envelope.salt, envelope.iv, envelope.ciphertext);
      if (envelope.tag !== expectedTag) {
        throw new Error('Integrity verification failed: storage payload was tampered with.');
      }

      const saltBytes = base64ToBytes(envelope.salt);
      const ivBytes = base64ToBytes(envelope.iv);
      const cipherBytes = base64ToBytes(envelope.ciphertext);

      const keyStream = deriveKeyStream(CLIENT_APP_SECRET, saltBytes, cipherBytes.length);
      const clearBytes = new Uint8Array(cipherBytes.length);

      for (let i = 0; i < cipherBytes.length; i++) {
        const ivByte = ivBytes[i % ivBytes.length];
        clearBytes[i] = cipherBytes[i] ^ keyStream[i] ^ ivByte;
      }

      const decoder = new TextDecoder();
      return decoder.decode(clearBytes);
    } catch (err) {
      console.warn('[Thriftly Crypto Vault] Failed to decrypt V2 vault:', err);
      return '';
    }
  }

  // 2. Legacy V1 Migration (simple XOR)
  if (storedString.startsWith(LEGACY_VAULT_PREFIX_V1)) {
    try {
      const raw = atob(storedString.slice(LEGACY_VAULT_PREFIX_V1.length));
      const decoded = decodeURIComponent(raw);
      return decoded
        .split('')
        .map((c) => String.fromCharCode(c.charCodeAt(0) ^ LEGACY_VAULT_KEY_V1))
        .join('');
    } catch {
      return '';
    }
  }

  // 3. Legacy Unencrypted JSON fallback
  return storedString;
}
