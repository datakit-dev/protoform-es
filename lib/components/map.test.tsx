import { screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { data, kits } from "../test/helpers";
import { everything, renderForm } from "../test/render";

// Map sections appear in declaration order: labels, counts, item_map, color_map, by_id
const LABELS = 0;
const ITEM_MAP = 2;
const BY_ID = 4;

describe.each(kits)("map fields (%s kit)", (_name, kit) => {
  const keyInput = (index: number) => screen.getAllByPlaceholderText("Key")[index];
  const addButton = (index: number) => screen.getAllByRole("button", { name: "Add" })[index];

  test("scalar entries are added as key = value and edited in place", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });

    await user.type(keyInput(LABELS), "env");
    await user.type(screen.getAllByPlaceholderText("Value")[0], "prod");
    await user.click(addButton(LABELS));

    expect(data(message).labels).toEqual({ env: "prod" });
    expect((keyInput(LABELS) as HTMLInputElement).value).toBe("");

    await user.type(screen.getByLabelText("Value for env"), "!");
    expect(data(message).labels).toEqual({ env: "prod!" });
  });

  test("existing entries show a fixed key next to an editable value", () => {
    renderForm(everything({ labels: { env: "x" } }), { kit });

    const key = screen.getByLabelText("Key env") as HTMLInputElement;
    expect(key.value).toBe("env");
    expect(key.readOnly).toBe(true);
    expect((screen.getByLabelText("Value for env") as HTMLInputElement).value).toBe("x");
  });

  test("entries can be removed", async () => {
    const message = everything({ labels: { env: "x" } });
    const { user } = renderForm(message, { kit });

    await user.click(screen.getByRole("button", { name: "Remove entry env" }));

    expect(data(message).labels).toEqual({});
  });

  test("Enter in the key or value input adds the entry instead of submitting", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit, onSubmit: () => { throw new Error("submitted"); } });

    await user.type(keyInput(LABELS), "a{Enter}");
    expect(data(message).labels).toEqual({ a: "" });

    await user.type(keyInput(LABELS), "b");
    await user.type(screen.getAllByPlaceholderText("Value")[0], "2{Enter}");
    expect(data(message).labels).toEqual({ a: "", b: "2" });
  });

  test("duplicate keys are rejected until the key changes", async () => {
    const message = everything({ labels: { env: "x" } });
    const { user } = renderForm(message, { kit });

    await user.type(keyInput(LABELS), "env");
    await user.click(addButton(LABELS));
    expect(screen.getByText("Key already exists")).toBeTruthy();
    expect(data(message).labels).toEqual({ env: "x" });

    await user.type(keyInput(LABELS), "2");
    expect(screen.queryByText("Key already exists")).toBeNull();
  });

  test("the add button is disabled until a key is typed", async () => {
    const { user } = renderForm(everything(), { kit });

    expect((addButton(LABELS) as HTMLButtonElement).disabled).toBe(true);
    await user.type(keyInput(LABELS), "k");
    expect((addButton(LABELS) as HTMLButtonElement).disabled).toBe(false);
  });

  test("numeric values are validated before adding, without blocking the form", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });
    const counts = within(screen.getByRole("group", { name: "counts" }));

    await user.type(counts.getByPlaceholderText("Key"), "a");
    await user.type(counts.getByPlaceholderText("Value"), "x");
    expect(counts.getByText("Enter a whole number")).toBeTruthy();
    expect((counts.getByRole("button", { name: "Add" }) as HTMLButtonElement).disabled).toBe(true);
    expect(message.store.hasLocalErrors()).toBe(false);

    await user.clear(counts.getByPlaceholderText("Value"));
    await user.type(counts.getByPlaceholderText("Value"), "12");
    await user.click(counts.getByRole("button", { name: "Add" }));
    expect(data(message).counts).toEqual({ a: 12 });
  });

  test("numeric values of existing entries are validated like scalar fields", async () => {
    const message = everything({ counts: { a: 1 } });
    const { user } = renderForm(message, { kit });
    const input = screen.getByLabelText("Value for a");

    await user.clear(input);
    await user.type(input, "12");
    expect(data(message).counts).toEqual({ a: 12 });

    await user.type(input, "x");
    expect(screen.getByText("Enter a whole number")).toBeTruthy();
    expect(data(message).counts).toEqual({ a: 12 });
  });

  test("enum values are chosen with a select", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });
    const colors = within(screen.getByRole("group", { name: "colorMap" }));

    await user.type(colors.getByPlaceholderText("Key"), "k");
    await user.selectOptions(colors.getByLabelText("Value"), "Green");
    await user.click(colors.getByRole("button", { name: "Add" }));
    expect(data(message).colorMap).toEqual({ k: 2 });

    await user.selectOptions(screen.getByLabelText("Value for k"), "Red");
    expect(data(message).colorMap).toEqual({ k: 1 });
  });

  test("message entries are added by key and edited in their own section", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });

    await user.type(keyInput(ITEM_MAP), "first");
    await user.click(addButton(ITEM_MAP));
    const group = screen.getByRole("group", { name: "first" });
    await user.type(within(group).getByLabelText("label"), "widget");

    expect(data(message).itemMap.first.label).toBe("widget");

    await user.click(screen.getByRole("button", { name: "Remove entry first" }));
    expect(data(message).itemMap).toEqual({});
  });

  test("message maps have no value input in the add row", () => {
    renderForm(everything(), { kit });

    // labels, counts, color_map and by_id take values; item_map takes only a key
    expect(screen.getAllByPlaceholderText("Key")).toHaveLength(5);
    expect(screen.getAllByLabelText("Value")).toHaveLength(4);
  });

  test("keys are checked against the key type", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });

    await user.type(keyInput(BY_ID), "abc");
    await user.click(addButton(BY_ID));
    expect(screen.getByText("Enter a whole number")).toBeTruthy();
    expect(data(message).byId).toEqual({});

    await user.clear(keyInput(BY_ID));
    await user.type(keyInput(BY_ID), "5");
    await user.type(screen.getAllByPlaceholderText("Value")[2], "five");
    await user.click(addButton(BY_ID));

    expect(data(message).byId).toEqual({ 5: "five" });
  });

  test("validation errors appear under the offending entry", () => {
    const message = everything({ labels: { env: "x" } });
    const labels = message.value.desc.fields.find((f) => f.name === "labels")!;
    message.store.setViolations([
      { message: "bad value", field: [labels, { kind: "map_sub", key: "env" }] },
    ] as never);

    renderForm(message, { kit });

    expect(screen.getByText("bad value")).toBeTruthy();
    expect(screen.getByLabelText("Value for env").getAttribute("aria-invalid")).toBe("true");
  });

  test("view mode hides adding and removing", () => {
    renderForm(everything({ labels: { env: "x" } }), { kit, mode: "view" });

    expect(screen.queryByPlaceholderText("Key")).toBeNull();
    expect(screen.queryByRole("button", { name: /Remove entry/ })).toBeNull();
    expect((screen.getByLabelText("Value for env") as HTMLInputElement).readOnly).toBe(true);
  });
});
