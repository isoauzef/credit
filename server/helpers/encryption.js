/**
 * Encryption helper for PII (SSN, etc.)
 *
 * Strategy: Envelope encryption.
 *  - A random 32-byte data key (DEK) is generated per record.
 *  - The plaintext is encrypted with AES-256-GCM using the DEK.
 *  - The DEK itself is encrypted with Google Cloud KMS (if configured),
 *    or with a master key from the LOCAL_ENCRYPTION_KEY env var as fallback.
 *
 * Storage format (base64-encoded JSON):
 *   { v: 1, mode: "kms"|"local", dek: <base64>, iv: <base64>, tag: <base64>, ct: <base64> }
 *
 * Configuration (env):
 *   GOOGLE_KMS_KEY_NAME           — full resource path, e.g.
 *                                   projects/<p>/locations/<l>/keyRings/<r>/cryptoKeys/<k>
 *   GOOGLE_APPLICATION_CREDENTIALS — path to service-account JSON
 *   LOCAL_ENCRYPTION_KEY          — 32-byte master key, base64 OR hex (used when KMS not set)
 *
 * If neither KMS nor LOCAL_ENCRYPTION_KEY is configured, encryption falls back
 * to using a deterministic key derived from JWT_SECRET (NOT recommended for prod).
 */

const crypto = require("crypto");

let kmsClient = null;
function getKmsClient() {
  if (kmsClient || !process.env.GOOGLE_KMS_KEY_NAME) return kmsClient;
  try {
    const { KeyManagementServiceClient } = require("@google-cloud/kms");
    kmsClient = new KeyManagementServiceClient();
  } catch (err) {
    console.warn("[encryption] Failed to load @google-cloud/kms:", err.message);
    kmsClient = null;
  }
  return kmsClient;
}

function getLocalMasterKey() {
  const raw = process.env.LOCAL_ENCRYPTION_KEY;
  if (raw) {
    try {
      const buf = /^[0-9a-fA-F]+$/.test(raw) && raw.length === 64
        ? Buffer.from(raw, "hex")
        : Buffer.from(raw, "base64");
      if (buf.length === 32) return buf;
    } catch (_) { /* fallthrough */ }
    console.warn("[encryption] LOCAL_ENCRYPTION_KEY must be 32 bytes (hex/base64). Falling back to JWT_SECRET derivation.");
  }
  const seed = process.env.JWT_SECRET || "fallback_secret_change_me";
  return crypto.createHash("sha256").update(seed).digest();
}

async function wrapDek(dek) {
  const keyName = process.env.GOOGLE_KMS_KEY_NAME;
  const client = getKmsClient();
  if (keyName && client) {
    const [result] = await client.encrypt({ name: keyName, plaintext: dek });
    return { mode: "kms", wrapped: Buffer.from(result.ciphertext).toString("base64") };
  }
  // Local fallback: AES-256-GCM-wrap the DEK with the master key
  const master = getLocalMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", master, iv);
  const wrapped = Buffer.concat([cipher.update(dek), cipher.final()]);
  const tag = cipher.getAuthTag();
  const blob = Buffer.concat([iv, tag, wrapped]).toString("base64");
  return { mode: "local", wrapped: blob };
}

async function unwrapDek(mode, wrapped) {
  if (mode === "kms") {
    const keyName = process.env.GOOGLE_KMS_KEY_NAME;
    const client = getKmsClient();
    if (!client || !keyName) throw new Error("KMS not configured but ciphertext requires it.");
    const [result] = await client.decrypt({
      name: keyName,
      ciphertext: Buffer.from(wrapped, "base64"),
    });
    return Buffer.from(result.plaintext);
  }
  const master = getLocalMasterKey();
  const blob = Buffer.from(wrapped, "base64");
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const ct = blob.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", master, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]);
}

/**
 * Encrypt a small piece of PII (e.g. SSN). Returns a base64 string suitable
 * for storing in a Text column. Returns null when input is empty.
 */
async function encryptPII(plaintext) {
  if (plaintext === null || plaintext === undefined) return null;
  const text = String(plaintext);
  if (text.length === 0) return null;

  const dek = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", dek, iv);
  const ct = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const { mode, wrapped } = await wrapDek(dek);

  // Zero out plaintext DEK from memory
  dek.fill(0);

  const payload = {
    v: 1,
    mode,
    dek: wrapped,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ct: ct.toString("base64"),
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Decrypt a ciphertext produced by encryptPII. Returns the plaintext string,
 * or null if input is empty/invalid.
 */
async function decryptPII(envelope) {
  if (!envelope) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(envelope, "base64").toString("utf8"));
  } catch (err) {
    console.warn("[encryption] decryptPII: invalid envelope");
    return null;
  }
  if (payload.v !== 1) {
    throw new Error(`Unsupported ciphertext version: ${payload.v}`);
  }
  const dek = await unwrapDek(payload.mode, payload.dek);
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const ct = Buffer.from(payload.ct, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", dek, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  dek.fill(0);
  return plaintext;
}

function isKmsConfigured() {
  return Boolean(process.env.GOOGLE_KMS_KEY_NAME && getKmsClient());
}

module.exports = { encryptPII, decryptPII, isKmsConfigured };
