import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { data, kits } from "../test/helpers";
import { everything, renderForm } from "../test/render";

describe.each(kits)("well-known types (%s kit)", (_name, kit) => {
  test("timestamps are edited as RFC 3339 text with validation", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });
    const created = screen.getByLabelText("created");

    await user.type(created, "2024-01-31T12:00:00Z");
    expect(data(message).created?.seconds).toBe(1706702400n);

    await user.clear(created);
    await user.type(created, "nonsense");
    expect(created.getAttribute("aria-invalid")).toBe("true");
    expect(data(message).created).toBeUndefined();

    await user.clear(created);
    expect(created.getAttribute("aria-invalid")).toBeNull();
    expect(data(message).created).toBeUndefined();
  });

  test("existing timestamps are displayed", () => {
    renderForm(everything({ created: { seconds: 1706702400n } }), { kit });

    expect((screen.getByLabelText("created") as HTMLInputElement).value).toBe("2024-01-31T12:00:00Z");
  });

  test("the Now button sets a timestamp and clears errors", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });

    await user.type(screen.getByLabelText("created"), "bad");
    await user.click(screen.getByRole("button", { name: "Now" }));

    expect(Number(data(message).created?.seconds)).toBeGreaterThan(1.7e9);
    expect(screen.getByLabelText("created").getAttribute("aria-invalid")).toBeNull();
  });

  test("durations accept seconds with fractions", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });

    await user.type(screen.getByLabelText("timeout"), "1.5s");
    expect(data(message).timeout).toMatchObject({ seconds: 1n, nanos: 500000000 });

    await user.clear(screen.getByLabelText("timeout"));
    await user.type(screen.getByLabelText("timeout"), "soon");
    expect(screen.getByLabelText("timeout").getAttribute("aria-invalid")).toBe("true");
  });

  test("Struct is edited as JSON and rejects invalid JSON", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });
    const meta = screen.getByLabelText("meta");

    await user.click(meta);
    await user.paste('{"a": 1}');
    expect(data(message).meta).toEqual({ a: 1 });

    await user.clear(meta);
    await user.click(meta);
    await user.paste("{oops");
    expect(meta.getAttribute("aria-invalid")).toBe("true");
    expect(data(message).meta).toBeUndefined();
  });

  test("wrapper types edit the wrapped scalar", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });

    await user.type(screen.getByLabelText("wrapped"), "9");

    expect(data(message).wrapped).toBe(9);
  });

  test("field masks are comma-separated paths", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });

    await user.type(screen.getByLabelText("mask"), "a,b.c");

    expect(data(message).mask?.paths).toEqual(["a", "b.c"]);
  });

  test("view mode hides the Now button and locks the text", () => {
    renderForm(everything(), { kit, mode: "view" });

    expect(screen.queryByRole("button", { name: "Now" })).toBeNull();
    expect((screen.getByLabelText("created") as HTMLInputElement).readOnly).toBe(true);
  });
});
