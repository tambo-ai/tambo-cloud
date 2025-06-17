import { handleSignup } from "../auth/signup";

describe("handleSignup", () => {
  it("enqueues welcome_email job with correct payload", async () => {
    const publishMock = jest.fn();

    const fakeBoss = {
      publish: publishMock,
    } as any;

    const newUser = {
      id: "user-123",
      email: "demo@example.com",
      firstName: "Demo",
    };

    await handleSignup(fakeBoss, newUser);

    expect(publishMock).toHaveBeenCalledTimes(1);
    expect(publishMock).toHaveBeenCalledWith("welcome_email", {
      userId: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
    });
  });
});
