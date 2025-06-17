import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TamboEmailButton } from "../TamboEmailButton";

// Mock the Tambo hook so we can intercept setValue calls
const mockSetValue = jest.fn();

jest.mock("@tambo-ai/react", () => ({
  useTamboThreadInput: () => ({
    setValue: mockSetValue,
  }),
}));

describe("TamboEmailButton", () => {
  beforeEach(() => {
    mockSetValue.mockClear();
  });

  it("renders the button and keeps it visible after click while prefilling the input", async () => {
    render(<TamboEmailButton />);

    const button = screen.getByRole("button", {
      name: /try sending us an email/i,
    });

    expect(button).toBeInTheDocument();

    await userEvent.click(button);

    // The hook should be called with the sample prompt
    expect(mockSetValue).toHaveBeenCalledWith(
      "Help me send an email to the founders.",
    );

    // Button should still be in the document after click
    expect(
      screen.getByRole("button", { name: /try sending us an email/i }),
    ).toBeInTheDocument();
  });

  it("triggers the same behavior for the ⌘/Ctrl + E keyboard shortcut", async () => {
    render(<TamboEmailButton />);

    await userEvent.keyboard("{Meta>}{KeyE}{/Meta}");

    expect(mockSetValue).toHaveBeenCalledWith(
      "Help me send an email to the founders.",
    );

    // Button stays visible
    expect(
      screen.getByRole("button", { name: /try sending us an email/i }),
    ).toBeInTheDocument();
  });
});
