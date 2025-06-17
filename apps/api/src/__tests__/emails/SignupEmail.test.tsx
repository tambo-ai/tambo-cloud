import { renderSignupEmailText } from "../../emails/SignupEmail";

describe("SignupEmail template", () => {
  it("renders the expected content", () => {
    const text = renderSignupEmailText({
      firstName: "Taylor",
      docsUrl: "https://docs.tambo.co/quick-start",
      unsubscribeUrl: "https://tambo.co/unsub?id=123",
    });

    // Basic structure
    expect(text).toContain("welcome, Taylor!");
    expect(text).toContain("Thanks for signing up!");
    expect(text).toContain("npx create-tambo@latest");
    expect(text).toContain("https://docs.tambo.co/quick-start");

    // Signature and footer
    expect(text).toContain("— michael & the tambo team");
    expect(text).toContain("Unsubscribe: https://tambo.co/unsub?id=123");
  });
});
