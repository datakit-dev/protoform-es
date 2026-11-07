import { act, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ScalarField } from "../scalar";
import { data, findField, kits } from "../test/helpers";
import { everything, renderForm } from "../test/render";

describe.each(kits)("scalar inputs (%s kit)", (_name, kit) => {
  test("typing into a string field updates the message", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });

    await user.type(screen.getByLabelText("name"), "hello");

    expect(data(message).name).toBe("hello");
    expect((screen.getByLabelText("name") as HTMLInputElement).value).toBe("hello");
  });

  test("numeric input is validated and does not overwrite the value", async () => {
    const message = everything({ count: 5 });
    const { user } = renderForm(message, { kit });
    const input = screen.getByLabelText("count") as HTMLInputElement;

    await user.clear(input);
    await user.type(input, "12");
    expect(data(message).count).toBe(12);

    await user.type(input, "x");
    expect(screen.getByText("Enter a whole number")).toBeTruthy();
    expect(data(message).count).toBe(12);
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  test("the error goes away once the input is valid again", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });
    const input = screen.getByLabelText("count");

    await user.type(input, "x");
    expect(screen.getByText("Enter a whole number")).toBeTruthy();

    await user.clear(input);
    expect(screen.queryByText("Enter a whole number")).toBeNull();
    expect(input.getAttribute("aria-invalid")).toBeNull();
  });

  test("out-of-range values are rejected and the last valid value is kept", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });

    await user.type(screen.getByLabelText("count"), "2147483648");

    expect(screen.getByText(/Value must be between/)).toBeTruthy();
    expect(data(message).count).toBe(214748364);
  });

  test("zero is shown as an empty field with a placeholder", () => {
    renderForm(everything(), { kit });

    const input = screen.getByLabelText("count") as HTMLInputElement;
    expect(input.value).toBe("");
    expect(input.placeholder).toBe("0");
  });

  test("64-bit integers stay exact", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });

    await user.type(screen.getByLabelText("big"), "9223372036854775807");

    expect(data(message).big).toBe(9223372036854775807n);
  });

  test("floats can be typed through intermediate states", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });
    const input = screen.getByLabelText("ratio") as HTMLInputElement;

    await user.type(input, "1.");
    expect(input.value).toBe("1.");
    await user.type(input, "25");

    expect(input.value).toBe("1.25");
    expect(data(message).ratio).toBe(1.25);
  });

  test("the draft is normalized on blur", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });
    const input = screen.getByLabelText("count") as HTMLInputElement;

    await user.type(input, "007");
    expect(input.value).toBe("007");

    await user.tab();
    expect(input.value).toBe("7");
    expect(data(message).count).toBe(7);
  });

  test("an invalid draft survives blur so the user can fix it", async () => {
    const { user } = renderForm(everything(), { kit });
    const input = screen.getByLabelText("count") as HTMLInputElement;

    await user.type(input, "12x");
    await user.tab();

    expect(input.value).toBe("12x");
    expect(screen.getByText("Enter a whole number")).toBeTruthy();
  });

  test("changes made outside the form are reflected", () => {
    const message = everything({ count: 5 });
    renderForm(message, { kit });

    act(() => findField<ScalarField>(message, "count").set(9));

    expect((screen.getByLabelText("count") as HTMLInputElement).value).toBe("9");
  });

  test("bytes are edited as base64", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });
    const input = screen.getByLabelText("blob");

    await user.type(input, "aGVsbG8=");
    expect(Array.from(data(message).blob)).toEqual(Array.from(new TextEncoder().encode("hello")));

    await user.clear(input);
    await user.type(input, "***");
    expect(screen.getByText("Enter valid base64")).toBeTruthy();
  });

  test("bool toggles with a switch", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });

    await user.click(screen.getByRole("switch", { name: "enabled" }));
    expect(data(message).enabled).toBe(true);

    await user.click(screen.getByRole("switch", { name: "enabled" }));
    expect(data(message).enabled).toBe(false);
  });

  test("view mode is read-only", () => {
    renderForm(everything({ name: "preset" }), { kit, mode: "view" });

    expect((screen.getByLabelText("name") as HTMLInputElement).readOnly).toBe(true);
    expect((screen.getByRole("switch", { name: "enabled" }) as HTMLInputElement).disabled
      || screen.getByRole("switch", { name: "enabled" }).hasAttribute("data-disabled")).toBe(true);
  });
});
