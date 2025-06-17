import { renderSignupEmailText } from "../../emails/SignupEmail";

describe("SignupEmail template", () => {
  it("renders the expected content", () => {
    const text = renderSignupEmailText({
      firstName: "Taylor",
      docsUrl: "https://docs.tambo.co/quick-start",
      unsubscribeUrl: "https://tambo.co/unsub?id=123",
    });

    // Basic structure
    expect(text).toContain("Hi Taylor,");
    expect(text).toContain("Thanks for signing up for Tambo!");
    expect(text).toContain("quick-start guide:");
    expect(text).toContain("https://docs.tambo.co/quick-start");

    // Call-to-action and signature
    expect(text).toContain("If you have any questions at all, just reply to this email");
    expect(text).toContain("— The Tambo Team");

    // Unsubscribe footer
    expect(text).toContain("Prefer not to receive onboarding emails?");
    expect(text).toContain("https://tambo.co/unsub?id=123");
  });
});
