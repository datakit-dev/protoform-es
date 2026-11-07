import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { data, kits } from "../test/helpers";
import { everything, renderForm } from "../test/render";

describe.each(kits)("oneof fields (%s kit)", (_name, kit) => {
  const picker = () => screen.getByRole("combobox", { name: "choice" });

  test("shows a case picker and the selected member", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });

    expect(screen.queryByLabelText("text")).toBeNull();

    await user.selectOptions(picker(), "text");
    await user.type(screen.getByLabelText("text"), "hi");
    expect(data(message).choice).toEqual({ case: "text", value: "hi" });

    await user.selectOptions(picker(), "number");
    expect(screen.queryByLabelText("text")).toBeNull();
    await user.type(screen.getByLabelText("number"), "7");
    expect(data(message).choice).toEqual({ case: "number", value: 7 });

    await user.selectOptions(picker(), "None");
    expect(data(message).choice.case).toBeUndefined();
    expect(screen.queryByLabelText("number")).toBeNull();
  });

  test("a message member gets its own form", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });

    await user.selectOptions(picker(), "choiceItem");
    const labels = screen.getAllByLabelText("label");
    await user.type(labels[labels.length - 1], "inner");

    expect(data(message).choice).toMatchObject({ case: "choiceItem", value: { label: "inner" } });
  });

  test("an existing selection is shown", () => {
    renderForm(everything({ choice: { case: "number", value: 3 } }), { kit });

    expect((picker() as HTMLSelectElement).value).toBe("number");
    expect((screen.getByLabelText("number") as HTMLInputElement).value).toBe("3");
  });

  test("view mode disables the picker", () => {
    renderForm(everything(), { kit, mode: "view" });

    expect((picker() as HTMLSelectElement).disabled).toBe(true);
  });
});
