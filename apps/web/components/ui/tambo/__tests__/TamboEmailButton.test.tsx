import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { TamboEmailButton } from "../TamboEmailButton";

// Mock the Tambo SDK hook so no network/SDK work occurs in tests.
jest.mock("@tambo-ai/react", () => ({
  useTamboThreadInput: () => ({ setValue: jest.fn() }),
}));

describe("TamboEmailButton", () => {
  it("hides the chip after textarea focus and disables the shortcut", () => {
    const { setValue } = require("@tambo-ai/react").useTamboThreadInput();

    render(
      <>
        <TamboEmailButton />
        {/* Simulate the message textarea existing in the DOM */}
        <textarea data-slot="message-input-textarea" />
      </>,
    );

    // 1 — Chip is shown initially.
    expect(screen.getByTestId("prefill-chip")).toBeInTheDocument();

    // 2 — Focusing the textarea hides the chip.
    const textarea = screen.getByRole("textbox");
    textarea.focus();
    expect(screen.queryByTestId("prefill-chip")).toBeNull();

    // 3 — Chip stays hidden on subsequent focus events.
    textarea.blur();
    textarea.focus();
    expect(screen.queryByTestId("prefill-chip")).toBeNull();

    // 4 — ⌘/Ctrl + E shortcut should NOT trigger setValue after chip is gone.
    fireEvent.keyDown(window, { key: "e", metaKey: true });
    fireEvent.keyDown(window, { key: "e", ctrlKey: true });
    expect(setValue).not.toHaveBeenCalled();
  });
});
