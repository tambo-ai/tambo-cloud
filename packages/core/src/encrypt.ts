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

export function encryptApiKey(
  storedString: string,
  apiKey: string,
  apiKeySecret: string,
): string {
  const secretKey = getHashedKey(apiKeySecret);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(algorithm, secretKey, iv);
  const data = `${storedString}.${apiKey}`;

  let encryptedHex = cipher.update(data, "utf8", "hex");
  encryptedHex += cipher.final("hex");

  // turn hex → raw bytes, concat IV + cipher-text, base64-encode
  const encryptedBuf = Buffer.from(encryptedHex, "hex");
  const combined = Buffer.concat([iv, encryptedBuf]);

  return `${TAMBO_PREFIX}${combined.toString("base64")}`;
}

export function decryptApiKey(
  encryptedData: string,
  apiKeySecret: string,
): { storedString: string; apiKey: string } {
  let rawEncrypted: string;

  // ------------------------------------------------------------------
  // 1.  Handle new/old "tambo_<...>" values.
  // ------------------------------------------------------------------
  if (encryptedData.startsWith(TAMBO_PREFIX)) {
    const base64Part = encryptedData.slice(TAMBO_PREFIX.length);
    let decoded: Buffer;
    try {
      decoded = Buffer.from(base64Part, "base64");
    } catch {
      throw new Error("Invalid Base64 in API key");
    }

    // Heuristic: if decode looks like ascii "<iv>.<cipher>" treat as ascii-hex.
    const asAscii = decoded.toString("utf8");
    const looksAsciiHex = /^[0-9a-f]+\.[0-9a-f]+$/i.test(asAscii);
    if (looksAsciiHex) {
      rawEncrypted = asAscii;
    } else {
      if (decoded.length <= IV_LENGTH) {
        throw new Error("Invalid API key – payload too short");
      }
      const ivBuf = decoded.subarray(0, IV_LENGTH);
      const cipherBuf = decoded.subarray(IV_LENGTH);

      rawEncrypted = `${ivBuf.toString("hex")}.${cipherBuf.toString("hex")}`;
    }
  } else {
    // ----------------------------------------------------------------
    // 2.  Raw legacy "<ivHex>.<cipherHex>" format.
    // ----------------------------------------------------------------
    rawEncrypted = encryptedData;
  }

  // ------------------------------------------------------------------
  // Decrypt common "<ivHex>.<cipherHex>" form
  // ------------------------------------------------------------------
  const [ivHex, encryptedHex] = splitFromEnd(rawEncrypted, ".");
  if (!ivHex || !encryptedHex) {
    throw new Error("Invalid encrypted API key format");
  }

  const secretKey = getHashedKey(apiKeySecret);
  const iv = Buffer.from(ivHex, "hex");

  const decipher = createDecipheriv(algorithm, secretKey, iv);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

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
