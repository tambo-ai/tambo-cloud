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

// Hashing to ensure 32-byte key length for AES-256
function getHashedKey(key: string): Buffer {
  return createHash("sha256").update(key).digest();
}

/** Turn a raw api key into an encrypted string, signed */
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
  return `${iv.toString("hex")}.${encrypted}`;
}

export function decryptApiKey(
  encryptedData: string,
  apiKeySecret: string,
): {
  storedString: string;
  apiKey: string;
} {
  const secretKey = getHashedKey(apiKeySecret);

  const [ivHex, encrypted] = splitFromEnd(encryptedData, ".");

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

// --- New prefix constant ---
export const TAMBO_PREFIX = "tambo_";

/**
 * Encode an encrypted API key into a user-facing format.
 *
 * The function base64-encodes the provided `encryptedKey` and prepends the
 * fixed {@link TAMBO_PREFIX}. The resulting string can be shown to users and
 * later decoded with {@link decodeApiKey}.
 *
 * @param encryptedKey - The raw encrypted key stored in the database.
 * @returns The user-facing API key (`tambo_<base64>`).
 */
export function encodeApiKeyForUser(encryptedKey: string): string {
  return `${TAMBO_PREFIX}${Buffer.from(encryptedKey, "utf-8").toString(
    "base64",
  )}`;
}

/**
 * Decode a user-provided API key back to its raw encrypted form.
 *
 * If the key starts with the {@link TAMBO_PREFIX}, the prefix is removed and
 * the remainder is base64-decoded. If the prefix is absent, the original key
 * is returned unchanged to maintain backward compatibility.
 *
 * @param userProvidedKey - The key received from the user or client.
 * @returns The decoded raw encrypted key.
 */
export function decodeApiKey(userProvidedKey: string): string {
  if (!userProvidedKey.startsWith(TAMBO_PREFIX)) {
    return userProvidedKey;
  }

  const base64Part = userProvidedKey.slice(TAMBO_PREFIX.length);

  try {
    return Buffer.from(base64Part, "base64").toString("utf-8");
  } catch {
    // In the unlikely event of invalid base64, fall back to the original input.
    return userProvidedKey;
  }
}
