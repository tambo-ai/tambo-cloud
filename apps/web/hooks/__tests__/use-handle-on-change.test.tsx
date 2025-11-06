import { renderHook } from "@testing-library/react";
import { useHandleOnChange } from "../use-handle-on-change";

describe("useHandleOnChange", () => {
  it("should call callback when value changes from undefined", () => {
    const callback = jest.fn();
    const { rerender } = renderHook(
      ({ value }: { value: string | undefined }) =>
        useHandleOnChange(value, callback),
      {
        initialProps: { value: undefined as string | undefined },
      },
    );

    expect(callback).not.toHaveBeenCalled();

    rerender({ value: "test" as string | undefined });
    expect(callback).toHaveBeenCalledWith("test");
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should not call callback when value is undefined", () => {
    const callback = jest.fn();
    renderHook(() => useHandleOnChange(undefined, callback));

    expect(callback).not.toHaveBeenCalled();
  });

  it("should not call callback twice for the same value", () => {
    const callback = jest.fn();
    const { rerender } = renderHook(
      ({ value }: { value: string | undefined }) =>
        useHandleOnChange(value, callback),
      {
        initialProps: { value: undefined as string | undefined },
      },
    );

    rerender({ value: "test" as string | undefined });
    expect(callback).toHaveBeenCalledTimes(1);

    rerender({ value: "test" as string | undefined });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should call callback when value changes to a different value", () => {
    const callback = jest.fn();
    const { rerender } = renderHook(
      ({ value }: { value: string | undefined }) =>
        useHandleOnChange(value, callback),
      {
        initialProps: { value: undefined as string | undefined },
      },
    );

    rerender({ value: "first" as string | undefined });
    expect(callback).toHaveBeenCalledWith("first");
    expect(callback).toHaveBeenCalledTimes(1);

    rerender({ value: "second" as string | undefined });
    expect(callback).toHaveBeenCalledWith("second");
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("should reset tracking when resetWhen is true", () => {
    const callback = jest.fn();
    const { rerender } = renderHook(
      ({
        value,
        resetWhen,
      }: {
        value: string | undefined;
        resetWhen: boolean;
      }) => useHandleOnChange(value, callback, resetWhen),
      {
        initialProps: {
          value: undefined as string | undefined,
          resetWhen: false,
        },
      },
    );

    // First change
    rerender({ value: "test" as string | undefined, resetWhen: false });
    expect(callback).toHaveBeenCalledTimes(1);

    // Same value, no call
    rerender({ value: "test" as string | undefined, resetWhen: false });
    expect(callback).toHaveBeenCalledTimes(1);

    // Reset (value stays same but ref is cleared)
    rerender({ value: "test" as string | undefined, resetWhen: true });
    expect(callback).toHaveBeenCalledTimes(1);

    // Change to undefined (typical pattern when closing a dialog)
    rerender({ value: undefined as string | undefined, resetWhen: false });
    expect(callback).toHaveBeenCalledTimes(1);

    // Set the same value again - should trigger because ref was reset
    rerender({ value: "test" as string | undefined, resetWhen: false });
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("should handle numeric values", () => {
    const callback = jest.fn();
    const { rerender } = renderHook(
      ({ value }: { value: number | undefined }) =>
        useHandleOnChange(value, callback),
      {
        initialProps: { value: undefined as number | undefined },
      },
    );

    rerender({ value: 0 as number | undefined });
    expect(callback).toHaveBeenCalledWith(0);
    expect(callback).toHaveBeenCalledTimes(1);

    rerender({ value: 1 as number | undefined });
    expect(callback).toHaveBeenCalledWith(1);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("should handle boolean values", () => {
    const callback = jest.fn();
    const { rerender } = renderHook(
      ({ value }: { value: boolean | undefined }) =>
        useHandleOnChange(value, callback),
      {
        initialProps: { value: undefined as boolean | undefined },
      },
    );

    rerender({ value: false as boolean | undefined });
    expect(callback).toHaveBeenCalledWith(false);
    expect(callback).toHaveBeenCalledTimes(1);

    rerender({ value: true as boolean | undefined });
    expect(callback).toHaveBeenCalledWith(true);
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
