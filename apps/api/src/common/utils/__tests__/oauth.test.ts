import { jest } from "@jest/globals";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { OAuthValidationMode } from "@tambo-ai-cloud/core";
import { operations } from "@tambo-ai-cloud/db";
import { SignJWT, exportJWK, generateKeyPair } from "jose";
import { CorrelationLoggerService } from "../../services/logger.service";
import { validateSubjectToken } from "../oauth";

// Mock only the database operations
jest.mock("@tambo-ai-cloud/db", () => ({
  operations: {
    decryptOAuthSecretKey: jest.fn(),
  },
}));

// Mock global fetch for OpenID discovery tests
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe("validateSubjectToken", () => {
  let mockLogger: jest.Mocked<CorrelationLoggerService>;
  const symmetricSecret = "my-test-secret-key-that-is-long-enough";
  const testPayload = {
    sub: "user123",
    iss: "https://example.com",
    aud: "test-audience",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.API_KEY_SECRET = "test-secret";

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as any;
  });

  describe("NONE validation mode", () => {
    it("should decode JWT without verification", async () => {
      // Create a real JWT (even though we won't verify it)
      const token = await new SignJWT(testPayload)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(symmetricSecret));

      const result = await validateSubjectToken(
        token,
        OAuthValidationMode.NONE,
        null,
        mockLogger,
      );

      expect(result.sub).toBe("user123");
      expect(result.iss).toBe("https://example.com");
    });
  });

  describe("SYMMETRIC validation mode", () => {
    const mockSettings = {
      secretKeyEncrypted: "encrypted-secret-key",
      publicKey: null,
    };

    it("should verify JWT with symmetric key", async () => {
      // Mock the decryption to return our test secret
      jest
        .mocked(operations.decryptOAuthSecretKey)
        .mockReturnValue(symmetricSecret);

      // Create a real JWT with the symmetric key
      const token = await new SignJWT(testPayload)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(symmetricSecret));

      const result = await validateSubjectToken(
        token,
        OAuthValidationMode.SYMMETRIC,
        mockSettings,
        mockLogger,
      );

      expect(result.sub).toBe("user123");
      expect(result.iss).toBe("https://example.com");
      expect(operations.decryptOAuthSecretKey).toHaveBeenCalledWith(
        "encrypted-secret-key",
        "test-secret",
      );
    });

    it("should reject JWT with wrong symmetric key", async () => {
      // Mock the decryption to return a different secret
      jest
        .mocked(operations.decryptOAuthSecretKey)
        .mockReturnValue("wrong-secret");

      // Create a JWT with the correct key
      const token = await new SignJWT(testPayload)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(symmetricSecret));

      await expect(
        validateSubjectToken(
          token,
          OAuthValidationMode.SYMMETRIC,
          mockSettings,
          mockLogger,
        ),
      ).rejects.toThrow();
    });

    it("should throw error when secret key is missing", async () => {
      await expect(
        validateSubjectToken(
          "any-token",
          OAuthValidationMode.SYMMETRIC,
          { secretKeyEncrypted: null, publicKey: null },
          mockLogger,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw error when oauth settings are null", async () => {
      await expect(
        validateSubjectToken(
          "any-token",
          OAuthValidationMode.SYMMETRIC,
          null,
          mockLogger,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("ASYMMETRIC_MANUAL validation mode", () => {
    it("should verify JWT with manual public key", async () => {
      // Generate a real RSA key pair
      const { publicKey, privateKey } = await generateKeyPair("RS256");
      const publicJWK = await exportJWK(publicKey);

      const mockSettings = {
        secretKeyEncrypted: null,
        publicKey: JSON.stringify(publicJWK),
      };

      // Create a real JWT with the private key
      const token = await new SignJWT(testPayload)
        .setProtectedHeader({ alg: "RS256" })
        .sign(privateKey);

      const result = await validateSubjectToken(
        token,
        OAuthValidationMode.ASYMMETRIC_MANUAL,
        mockSettings,
        mockLogger,
      );

      expect(result.sub).toBe("user123");
      expect(result.iss).toBe("https://example.com");
    });

    it("should reject JWT with wrong public key", async () => {
      // Generate two different key pairs
      const { privateKey: privateKey1 } = await generateKeyPair("RS256");
      const { publicKey: publicKey2 } = await generateKeyPair("RS256");
      const wrongPublicJWK = await exportJWK(publicKey2);

      const mockSettings = {
        secretKeyEncrypted: null,
        publicKey: JSON.stringify(wrongPublicJWK),
      };

      // Create JWT with first private key, try to verify with second public key
      const token = await new SignJWT(testPayload)
        .setProtectedHeader({ alg: "RS256" })
        .sign(privateKey1);

      await expect(
        validateSubjectToken(
          token,
          OAuthValidationMode.ASYMMETRIC_MANUAL,
          mockSettings,
          mockLogger,
        ),
      ).rejects.toThrow();
    });

    it("should throw error when public key is missing", async () => {
      await expect(
        validateSubjectToken(
          "any-token",
          OAuthValidationMode.ASYMMETRIC_MANUAL,
          { secretKeyEncrypted: null, publicKey: null },
          mockLogger,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw error when public key is invalid JSON", async () => {
      const invalidSettings = {
        secretKeyEncrypted: null,
        publicKey: "invalid-json",
      };

      await expect(
        validateSubjectToken(
          "any-token",
          OAuthValidationMode.ASYMMETRIC_MANUAL,
          invalidSettings,
          mockLogger,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Error parsing or using manual public key"),
      );
    });
  });

  describe("ASYMMETRIC_AUTO validation mode", () => {
    // TODO: Fix mocking of createRemoteJWKSet to avoid network requests
    // This test currently tries to make real network requests
    // it("should verify JWT using OpenID discovery", async () => {
    //   // Generate a real key pair for the test issuer
    //   const { publicKey, privateKey } = await generateKeyPair("RS256");
    //   const publicJWK = await exportJWK(publicKey);

    //   const issuer = "https://auth.example.com";
    //   const payloadWithIssuer = { ...testPayload, iss: issuer };

    //   // Create a real JWT
    //   const token = await new SignJWT(payloadWithIssuer)
    //     .setProtectedHeader({ alg: "RS256", kid: "test-key-id" })
    //     .sign(privateKey);

    //   // Mock the OpenID configuration endpoint
    //   const mockOpenIdConfig = {
    //     issuer,
    //     jwks_uri: `${issuer}/.well-known/jwks.json`,
    //   };

    //   // Mock createRemoteJWKSet to return a local key set
    //   const mockKeySet = {
    //     async [Symbol.asyncIterator]() {
    //       return {
    //         async next() {
    //           return { value: await importJWK(publicJWK), done: false };
    //         },
    //       };
    //     },
    //   };

    //   // Mock the jose module's createRemoteJWKSet function
    //   jest.doMock("jose", () => {
    //     const actual = jest.requireActual("jose");
    //     return {
    //       ...actual,
    //       createRemoteJWKSet: jest.fn().mockReturnValue(mockKeySet),
    //     };
    //   });

    //   (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
    //     ok: true,
    //     json: (jest.fn() as any).mockResolvedValue(mockOpenIdConfig),
    //   } as any);

    //   const result = await validateSubjectToken(
    //     token,
    //     OAuthValidationMode.ASYMMETRIC_AUTO,
    //     null,
    //     mockLogger,
    //   );

    //   expect(result.sub).toBe("user123");
    //   expect(result.iss).toBe(issuer);
    //   expect(global.fetch).toHaveBeenCalledWith(
    //     `${issuer}/.well-known/openid-configuration`,
    //   );
    //   expect(mockLogger.log).toHaveBeenCalledWith(
    //     `Fetching OpenID configuration from: ${issuer}/.well-known/openid-configuration`,
    //   );
    // });

    it("should throw error when token has no issuer", async () => {
      // Create a token without issuer
      const payloadWithoutIssuer: any = { ...testPayload };
      delete payloadWithoutIssuer.iss;

      const token = await new SignJWT(payloadWithoutIssuer)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(symmetricSecret));

      await expect(
        validateSubjectToken(
          token,
          OAuthValidationMode.ASYMMETRIC_AUTO,
          null,
          mockLogger,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw error when OpenID config fetch fails", async () => {
      const token = await new SignJWT(testPayload)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(symmetricSecret));

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        statusText: "Not Found",
      } as any);

      await expect(
        validateSubjectToken(
          token,
          OAuthValidationMode.ASYMMETRIC_AUTO,
          null,
          mockLogger,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to fetch OpenID configuration: Not Found",
      );
    });

    it("should throw error when OpenID config is missing jwks_uri", async () => {
      const token = await new SignJWT(testPayload)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(symmetricSecret));

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: (jest.fn() as any).mockResolvedValue({
          issuer: "https://auth.example.com",
        }),
      } as any);

      await expect(
        validateSubjectToken(
          token,
          OAuthValidationMode.ASYMMETRIC_AUTO,
          null,
          mockLogger,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("Unsupported validation mode", () => {
    it("should throw error for unsupported validation mode", async () => {
      await expect(
        validateSubjectToken(
          "any-token",
          "INVALID_MODE" as OAuthValidationMode,
          null,
          mockLogger,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("Edge cases", () => {
    it("should handle null oauth settings for NONE mode", async () => {
      const token = await new SignJWT(testPayload)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(symmetricSecret));

      const result = await validateSubjectToken(
        token,
        OAuthValidationMode.NONE,
        null,
        mockLogger,
      );

      expect(result.sub).toBe("user123");
    });

    it("should handle invalid JWT format", async () => {
      await expect(
        validateSubjectToken(
          "not-a-jwt",
          OAuthValidationMode.NONE,
          null,
          mockLogger,
        ),
      ).rejects.toThrow();
    });
  });
});
