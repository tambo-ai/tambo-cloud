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

To help you get started, we recommend working through our quick-start guide:
https://docs.tambo.co/quick-start

If you have any questions, just reply to this email and our team will be happy to help.

— The Tambo Team

(If you’d rather not receive onboarding emails, you can unsubscribe here: https://tambo.co/unsub?id=123)"
    `);
  });
});
