import { renderSignupEmailText } from "../../emails/SignupEmail";

describe("SignupEmail template", () => {
  it("matches snapshot", () => {
    const text = renderSignupEmailText({
      firstName: "Taylor",
      docsUrl: "https://docs.tambo.co/quick-start",
      unsubscribeUrl: "https://tambo.co/unsub?id=123",
    });

    expect(text).toMatchSnapshot();
  });
});
