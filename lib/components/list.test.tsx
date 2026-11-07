import { screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { data, kits } from "../test/helpers";
import { everything, renderForm } from "../test/render";

describe.each(kits)("list fields (%s kit)", (_name, kit) => {
  test("scalar lists add, edit, reorder and remove items", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });

    await user.click(screen.getByRole("button", { name: "Add item: tags" }));
    await user.click(screen.getByRole("button", { name: "Add item: tags" }));
    await user.type(screen.getByLabelText("Item 1"), "a");
    await user.type(screen.getByLabelText("Item 2"), "b");
    expect(data(message).tags).toEqual(["a", "b"]);

    await user.click(screen.getByRole("button", { name: "Move item 2 up" }));
    expect(data(message).tags).toEqual(["b", "a"]);

    await user.click(screen.getByRole("button", { name: "Move item 1 down" }));
    expect(data(message).tags).toEqual(["a", "b"]);

    await user.click(screen.getByRole("button", { name: "Remove item 1" }));
    expect(data(message).tags).toEqual(["b"]);
  });

  test("the first item can't move up and the last can't move down", () => {
    renderForm(everything({ tags: ["a", "b"] }), { kit });

    expect((screen.getByRole("button", { name: "Move item 1 up" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Move item 2 down" }) as HTMLButtonElement).disabled).toBe(true);
  });

  test("empty lists say so", () => {
    renderForm(everything(), { kit });

    expect(screen.getAllByText("No items").length).toBeGreaterThan(0);
  });

  test("message lists render a nested form per item", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });

    await user.click(screen.getByRole("button", { name: "Add item: items" }));
    const group = screen.getByRole("group", { name: "Item 1" });
    await user.type(within(group).getByLabelText("label"), "widget");
    await user.type(within(group).getByLabelText("qty"), "3");

    expect(data(message).items).toMatchObject([{ label: "widget", qty: 3 }]);
  });

  test("message list items can be removed and keep their neighbours' values", async () => {
    const message = everything({ items: [{ label: "a" }, { label: "b" }] });
    const { user } = renderForm(message, { kit });

    await user.click(screen.getByRole("button", { name: "Remove item 1" }));

    expect(data(message).items.map((i) => i.label)).toEqual(["b"]);
    expect((within(screen.getByRole("group", { name: "Item 1" })).getByLabelText("label") as HTMLInputElement).value).toBe("b");
  });

  test("repeated well-known types render one editor per item", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });

    await user.click(screen.getByRole("button", { name: "Add item: times" }));
    await user.type(screen.getByLabelText("Item 1"), "2024-01-31T12:00:00Z");

    expect(data(message).times[0].seconds).toBe(1706702400n);
  });

  test("validation errors appear on the offending item", () => {
    const message = everything({ tags: ["a", "b"] });
    const tags = message.value.desc.fields.find((f) => f.name === "tags")!;
    message.store.setViolations([
      { message: "too short", field: [tags, { kind: "list_sub", index: 1 }] },
    ] as never);

    renderForm(message, { kit });

    expect(screen.getByText("too short")).toBeTruthy();
    expect(screen.getByLabelText("Item 2").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByLabelText("Item 1").getAttribute("aria-invalid")).toBeNull();
  });

  test("view mode hides add, move and remove", () => {
    renderForm(everything({ tags: ["x"] }), { kit, mode: "view" });

    expect(screen.queryByRole("button", { name: /Add item/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Move item/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Remove item/ })).toBeNull();
    expect((screen.getByLabelText("Item 1") as HTMLInputElement).readOnly).toBe(true);
  });
});
