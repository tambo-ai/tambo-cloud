import { renderSignupEmailText } from "../../emails/SignupEmail";

describe("SignupEmail template", () => {
  it("matches inline snapshot", () => {
    const text = renderSignupEmailText({
      firstName: "Taylor",
      docsUrl: "https://docs.tambo.co/quick-start",
      unsubscribeUrl: "https://tambo.co/unsub?id=123",
    });

    expect(text).toMatchInlineSnapshot(`
"Hi Taylor,

Thanks for signing up for Tambo!

To help you get started, check out our quick-start guide:
https://docs.tambo.co/quick-start

If you have any questions at all, just reply to this email — our team is always happy to help.

— The Tambo Team

(Prefer not to receive onboarding emails? Unsubscribe here: https://tambo.co/unsub?id=123)"
    `);
  });
});
