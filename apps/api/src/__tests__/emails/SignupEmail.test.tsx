import { render } from "@react-email/render";
import SignupEmail from "../../emails/SignupEmail";

describe("SignupEmail template", () => {
  it("matches snapshot", () => {
    const html = render(
      <SignupEmail
        firstName="Taylor"
        docsUrl="https://docs.tambo.co/quick-start"
        unsubscribeUrl="https://tambo.co/unsub?id=123"
      />,
    );

    expect(html).toMatchSnapshot();
  });
});
