import { generateContextKey } from "../generate-context-key";

describe("generateContextKey", () => {
  describe("Google OAuth", () => {
    it("should generate correct context key for Google consumer account", () => {
      const result = generateContextKey(
        "https://accounts.google.com",
        undefined, // No hosted domain for consumer accounts
        "google-user-123",
      );

      expect(result).toBe("oauth:user:accounts.google.com:google-user-123");
    });

    it("should generate correct context key for Google Workspace account", () => {
      const result = generateContextKey(
        "https://accounts.google.com",
        "company.com", // Hosted domain
        "workspace-user-456",
      );

      expect(result).toBe(
        "oauth:user:accounts.google.com:company.com:workspace-user-456",
      );
    });

    it("should preserve special characters in hosted domain", () => {
      const result = generateContextKey(
        "https://accounts.google.com",
        "my-company@domain.com", // Domain with special characters
        "workspace-user-789",
      );

      expect(result).toBe(
        "oauth:user:accounts.google.com:my-company@domain.com:workspace-user-789",
      );
    });

    it("should handle null hosted domain", () => {
      const result = generateContextKey(
        "https://accounts.google.com",
        null,
        "google-user-123",
      );

      expect(result).toBe("oauth:user:accounts.google.com:google-user-123");
    });

    it("should handle empty string hosted domain", () => {
      const result = generateContextKey(
        "https://accounts.google.com",
        "",
        "google-user-123",
      );

      expect(result).toBe("oauth:user:accounts.google.com:google-user-123");
    });
  });

  describe("Other OAuth providers", () => {
    it("should generate correct context key for GitHub", () => {
      const result = generateContextKey(
        "https://github.com",
        undefined,
        "github-user-789",
      );

      expect(result).toBe("oauth:user:github.com:github-user-789");
    });

    it("should generate correct context key for Microsoft", () => {
      const result = generateContextKey(
        "https://login.microsoftonline.com",
        undefined,
        "microsoft-user-101",
      );

      expect(result).toBe(
        "oauth:user:login.microsoftonline.com:microsoft-user-101",
      );
    });

    it("should handle custom OAuth provider", () => {
      const result = generateContextKey(
        "https://auth.example.com",
        undefined,
        "custom-user-555",
      );

      expect(result).toBe("oauth:user:auth.example.com:custom-user-555");
    });
  });

  describe("Fallback scenarios", () => {
    it("should fall back to legacy format when original issuer is missing", () => {
      const result = generateContextKey(
        undefined,
        undefined,
        "legacy-user-123",
      );

      expect(result).toBe("oauth:user:legacy-user-123");
    });

    it("should fall back to legacy format when original issuer is null", () => {
      const result = generateContextKey(null, undefined, "legacy-user-456");

      expect(result).toBe("oauth:user:legacy-user-456");
    });

    it("should fall back to legacy format when original issuer is not a string", () => {
      const result = generateContextKey(
        12345, // Invalid type
        undefined,
        "legacy-user-789",
      );

      expect(result).toBe("oauth:user:legacy-user-789");
    });

    it("should fall back to legacy format when original issuer is invalid URL", () => {
      const result = generateContextKey(
        "not-a-valid-url",
        undefined,
        "user-123",
      );

      expect(result).toBe("oauth:user:user-123");
    });

    it("should fall back to legacy format when original issuer is empty string", () => {
      const result = generateContextKey("", undefined, "user-456");

      expect(result).toBe("oauth:user:user-456");
    });
  });

  describe("Edge cases", () => {
    it("should handle issuer URL with port number", () => {
      const result = generateContextKey(
        "https://auth.example.com:8080",
        undefined,
        "user-123",
      );

      expect(result).toBe("oauth:user:auth.example.com:user-123");
    });

    it("should handle issuer URL with path", () => {
      const result = generateContextKey(
        "https://auth.example.com/oauth/v2",
        undefined,
        "user-456",
      );

      expect(result).toBe("oauth:user:auth.example.com:user-456");
    });

    it("should handle HTTP (non-HTTPS) issuer", () => {
      const result = generateContextKey(
        "http://localhost:3000",
        undefined,
        "dev-user-789",
      );

      expect(result).toBe("oauth:user:localhost:dev-user-789");
    });
  });
});
