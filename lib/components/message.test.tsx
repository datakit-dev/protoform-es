import { create } from "@bufbuild/protobuf";
import { type Any, anyPack, anyUnpack } from "@bufbuild/protobuf/wkt";
import { screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { fixtureMessage } from "../test/fixture";
import { data, kits } from "../test/helpers";
import { everything, renderForm } from "../test/render";

const item = fixtureMessage("Item");
const unpackLabel = (any: Any) => (anyUnpack(any, item) as unknown as { label: string }).label;

describe.each(kits)("message fields (%s kit)", (_name, kit) => {
  test("optional messages are edited and cleared explicitly", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });

    expect(screen.queryByLabelText("label")).toBeNull();
    expect(screen.getAllByText("Not set", { selector: "p" }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Edit nested" }));
    await user.type(screen.getByLabelText("label"), "inner");
    expect(data(message).nested?.label).toBe("inner");

    await user.click(screen.getByRole("button", { name: "Clear nested" }));
    expect(data(message).nested).toBeUndefined();
    expect(screen.queryByLabelText("label")).toBeNull();
  });

  test("an existing message is shown expanded", () => {
    renderForm(everything({ nested: { label: "present" } }), { kit });

    expect((screen.getByLabelText("label") as HTMLInputElement).value).toBe("present");
    expect(screen.getByRole("button", { name: "Clear nested" })).toBeTruthy();
  });

  test("view mode shows the message without edit or clear", () => {
    renderForm(everything({ nested: { label: "present" } }), { kit, mode: "view" });

    expect((screen.getByLabelText("label") as HTMLInputElement).readOnly).toBe(true);
    expect(screen.queryByRole("button", { name: "Clear nested" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit nested" })).toBeNull();
  });
});

describe.each(kits)("Any fields (%s kit)", (_name, kit) => {
  test("picks a registered type and edits it", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });

    await user.click(screen.getByRole("button", { name: "Edit payload" }));
    await user.selectOptions(screen.getByLabelText("Select type…"), "test.Item");
    await user.type(within(screen.getByRole("group", { name: "payload" })).getByLabelText("label"), "packed");

    const payload = data(message).payload!;
    expect(payload.typeUrl).toBe("type.googleapis.com/test.Item");
    expect(unpackLabel(payload)).toBe("packed");
  });

  test("only offers types accepted by the env's filter", async () => {
    const { user } = renderForm(everything(), { kit });

    await user.click(screen.getByRole("button", { name: "Edit payload" }));

    const options = within(screen.getByLabelText("Select type…")).getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["Select type…", "test.Everything", "test.Hinted", "test.Item"]);
  });

  test("shows the contents of an existing value", () => {
    const message = everything({ payload: anyPack(item, create(item, { label: "inside" })) });
    renderForm(message, { kit });

    expect((screen.getByLabelText("Select type…") as HTMLSelectElement).value).toBe("test.Item");
    expect((screen.getByLabelText("label") as HTMLInputElement).value).toBe("inside");
  });

  test("switching type starts from an empty message", async () => {
    const message = everything({ payload: anyPack(item, create(item, { label: "inside" })) });
    const { user } = renderForm(message, { kit });

    await user.selectOptions(screen.getByLabelText("Select type…"), "test.Everything");

    expect(data(message).payload!.typeUrl).toBe("type.googleapis.com/test.Everything");
    expect(screen.queryByDisplayValue("inside")).toBeNull();
  });

  test("a type missing from the registry is kept but has no editor", () => {
    const message = everything({ payload: { typeUrl: "type.googleapis.com/nope.Missing", value: new Uint8Array() } });
    renderForm(message, { kit });

    expect((screen.getByLabelText("Select type…") as HTMLSelectElement).value).toBe("nope.Missing");
    expect(screen.queryByLabelText("label")).toBeNull();
  });

  test("removing the value unsets it", async () => {
    const message = everything({ payload: anyPack(item, create(item, { label: "x" })) });
    const { user } = renderForm(message, { kit });

    await user.click(screen.getByRole("button", { name: "Clear payload" }));

    expect(data(message).payload).toBeUndefined();
  });
});
