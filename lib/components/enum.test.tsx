import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { data, kits } from "../test/helpers";
import { everything, renderForm } from "../test/render";

describe.each(kits)("enum inputs (%s kit)", (_name, kit) => {
  test("small enums use radios and large enums use a select", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });

    expect(screen.getAllByRole("radio")).toHaveLength(3);
    await user.click(screen.getByRole("radio", { name: "Green" }));
    expect(data(message).color).toBe(2);

    await user.selectOptions(screen.getByLabelText("level"), "Three");
    expect(data(message).level).toBe(3);
  });

  test("labels are readable and the current value is selected", () => {
    renderForm(everything({ color: 1, level: 2 }), { kit });

    expect((screen.getByRole("radio", { name: "Red" }) as HTMLInputElement).checked
      || screen.getByRole("radio", { name: "Red" }).getAttribute("aria-checked") === "true").toBe(true);
    expect((screen.getByLabelText("level") as HTMLSelectElement).value).toBe("2");
  });

  test("unknown numbers are kept as an extra option", () => {
    renderForm(everything({ level: 42 }), { kit });

    expect((screen.getByLabelText("level") as HTMLSelectElement).value).toBe("42");
  });

  test("enum lists use a select per item", async () => {
    const message = everything();
    const { user } = renderForm(message, { kit });

    await user.click(screen.getByRole("button", { name: "Add item: colors" }));
    await user.selectOptions(screen.getByLabelText("Item 1"), "Red");

    expect(data(message).colors).toEqual([1]);
  });

  test("view mode disables the controls", () => {
    renderForm(everything(), { kit, mode: "view" });

    expect((screen.getByLabelText("level") as HTMLSelectElement).disabled).toBe(true);
  });
});
