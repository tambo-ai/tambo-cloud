import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

function splitFromEnd(str: string, delimiter: string): [string, string] {
  const parts = str.split(delimiter);
  const lastPart = parts.pop()!;
  return [parts.join(delimiter), lastPart];
}

const algorithm = "aes-256-cbc";
const IV_LENGTH = 16; // 16 bytes for AES
/** Prefix for user-facing API keys – intentionally NOT exported. */
const TAMBO_PREFIX = "tambo_";

// Hashing to ensure 32-byte key length for AES-256
function getHashedKey(key: string): Buffer {
  return createHash("sha256").update(key).digest();
}

/**
 * Encrypt an API-key for storage **and** return the user-facing value.
 *
 * Flow:
 *   1.  Create the same `<iv>.<ciphertext>` string we have always stored.
 *   2.  Base-64 it and prefix with `"tambo_"` so that callers never need to care
 *       about our internal representation.
 *
 * The string returned from this function is the **only** value that should be
 * surfaced to users or accepted back from them later.
 */
export function encryptApiKey(
  storedString: string,
  apiKey: string,
  apiKeySecret: string,
): string {
  const secretKey = getHashedKey(apiKeySecret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(algorithm, secretKey, iv);
  const data = `${storedString}.${apiKey}`;
  let encrypted = cipher.update(data, "utf-8", "hex");
  encrypted += cipher.final("hex");
  // Raw `<iv>.<cipher>`
  const rawEncrypted = `${iv.toString("hex")}.${encrypted}`;
  // Convert to user-facing format and return
  return `${TAMBO_PREFIX}${Buffer.from(rawEncrypted, "utf-8").toString(
    "base64",
  )}`;
}

export function decryptApiKey(
  encryptedData: string,
  apiKeySecret: string,
): {
  storedString: string;
  apiKey: string;
} {
  // ------------------------------------------------------------------
  // Accept either the new `"tambo_<base64>"` value or the old raw value.
  // ------------------------------------------------------------------
  let rawEncrypted = encryptedData;
  if (rawEncrypted.startsWith(TAMBO_PREFIX)) {
    const base64Part = rawEncrypted.slice(TAMBO_PREFIX.length);
    try {
      rawEncrypted = Buffer.from(base64Part, "base64").toString("utf-8");
    } catch {
      throw new Error("Invalid API key format");
    }
  }

  const secretKey = getHashedKey(apiKeySecret);

  const [ivHex, encrypted] = splitFromEnd(rawEncrypted, ".");

  if (!ivHex || !encrypted) {
    console.error("Invalid encrypted data format in apikey");
    throw new Error("Invalid apikey format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv(algorithm, secretKey, iv);

  let decrypted: string;
  try {
    decrypted = decipher.update(encrypted, "hex", "utf-8");
    decrypted += decipher.final("utf-8");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to decrypt API key", {
      cause: error,
    });
  }

  const [storedString, apiKey] = splitFromEnd(decrypted, ".");
  return { storedString, apiKey };
}

export function hashKey(apiKey: string) {
  const hashedKey = createHash("sha256").update(apiKey).digest("hex");
  return hashedKey;
}

export function encryptProviderKey(
  providerName: string,
  providerKey: string,
  providerKeySecret: string,
): string {
  const secretKey = getHashedKey(providerKeySecret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(algorithm, secretKey, iv);
  const data = `${providerName}.${providerKey}`;
  let encrypted = cipher.update(data, "utf-8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}.${encrypted}`;
}

export function decryptProviderKey(
  encryptedData: string,
  providerKeySecret: string,
): {
  providerName: string;
  providerKey: string;
} {
  const secretKey = getHashedKey(providerKeySecret);

  const [ivHex, encrypted] = splitFromEnd(encryptedData, ".");

  if (!ivHex || !encrypted) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv(algorithm, secretKey, iv);

  let decrypted: string;
  try {
    decrypted = decipher.update(encrypted, "hex", "utf-8");
    decrypted += decipher.final("utf-8");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to decrypt provider key", {
      cause: error,
    });
  }

  const [providerName, providerKey] = splitFromEnd(decrypted, ".");
  return { providerName, providerKey };
}

export function hideApiKey(apiKey: string, visibleCharacters = 4): string {
  const hiddenPart = apiKey.substring(visibleCharacters).replace(/./g, "*");
  return apiKey.substring(0, visibleCharacters) + hiddenPart;
}

// The standalone helpers and exported constant above have been removed
// in favour of the integrated logic inside `encryptApiKey`/`decryptApiKey`.
