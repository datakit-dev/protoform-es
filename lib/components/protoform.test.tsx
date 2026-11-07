import { screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { ConnectionSchema } from "@buf/datakit-dev_dtkt-sdk.bufbuild_es/dtkt/core/v1/connection_pb";

import { Message } from "../message";
import { kits } from "../test/helpers";
import { everything, renderForm } from "../test/render";

describe.each(kits)("Protoform (%s kit)", (_name, kit) => {
  test("labels every field and points each label at its control", () => {
    renderForm(everything(), { kit });

    for (const label of ["name", "enabled", "count", "big", "ratio", "blob", "color", "level", "created", "timeout", "meta", "wrapped", "mask"]) {
      expect(screen.getByLabelText(label), label).toBeTruthy();
    }
    for (const title of ["tags", "colors", "items", "labels", "counts", "itemMap", "colorMap", "byId", "nested", "choice", "payload", "times"]) {
      expect(screen.getByRole("group", { name: title }), title).toBeTruthy();
    }
  });

  test("submits a valid message", async () => {
    const onSubmit = vi.fn();
    const { user } = renderForm(everything(), {
      kit,
      onSubmit,
      children: <button type="submit">Save</button>,
    });

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("does not submit while an input can't be parsed", async () => {
    const onSubmit = vi.fn();
    const onInvalid = vi.fn();
    const { user } = renderForm(everything(), {
      kit,
      onSubmit,
      onInvalid,
      children: <button type="submit">Save</button>,
    });

    await user.type(screen.getByLabelText("count"), "abc");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onInvalid).toHaveBeenCalledTimes(1);
  });

  test("Enter in a text field submits the form", async () => {
    const onSubmit = vi.fn();
    const { user } = renderForm(everything(), { kit, onSubmit, children: <button type="submit">Save</button> });

    await user.type(screen.getByLabelText("name"), "x{Enter}");

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  describe("validation", () => {
    const invalid = () => new Message(ConnectionSchema, { uid: "", name: "test-connection" });
    const submit = <button type="submit">Save</button>;
    const oneofError = "exactly one field is required in oneof";

    test("errors appear after a submit attempt, on the fields that own them", async () => {
      const onSubmit = vi.fn();
      const onInvalid = vi.fn();
      const { user } = renderForm(invalid(), { kit, onSubmit, onInvalid, children: submit });

      expect(screen.queryByText(oneofError)).toBeNull();
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(onSubmit).not.toHaveBeenCalled();
      expect(onInvalid).toHaveBeenCalled();
      expect(screen.getByText(oneofError)).toBeTruthy();
    });

    test("errors on hidden fields are listed at the top", async () => {
      const { user } = renderForm(invalid(), { kit, children: submit });

      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(screen.getByRole("alert").textContent).toMatch(/uid: value is required/);
    });

    test("after a submit attempt, edits revalidate immediately", async () => {
      const { user } = renderForm(invalid(), { kit, children: submit });

      await user.click(screen.getByRole("button", { name: "Save" }));
      await user.selectOptions(screen.getByRole("combobox", { name: "type" }), "deployment");

      expect(screen.queryByText(oneofError)).toBeNull();
    });

    test("validateOn=change shows errors from the first edit", async () => {
      const { user } = renderForm(invalid(), { kit, validateOn: "change" });

      expect(screen.queryByText(oneofError)).toBeNull();
      await user.selectOptions(screen.getByRole("combobox", { name: "type" }), "deployment");
      await user.selectOptions(screen.getByRole("combobox", { name: "type" }), "");

      expect(screen.getByText(oneofError)).toBeTruthy();
    });
  });

  describe("accessibility", () => {
    const describedBy = (el: HTMLElement) =>
      (el.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean)
        .map((id) => document.getElementById(id)?.textContent ?? "").join(" ");

    test("validation errors are announced through aria-describedby", () => {
      const message = everything();
      message.store.setViolations([
        { message: "too short", field: [message.value.desc.fields.find((f) => f.name === "name")!] },
      ] as never);
      renderForm(message, { kit });

      const input = screen.getByLabelText("name");
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(describedBy(input)).toContain("too short");
    });

    test("every text control has an accessible name", () => {
      renderForm(everything(), { kit });

      for (const el of screen.getAllByRole("textbox")) {
        const named = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || (el as HTMLInputElement).labels?.length;
        expect(named, el.outerHTML).toBeTruthy();
      }
    });

    test("composite fields are named groups", () => {
      renderForm(everything(), { kit });

      for (const name of ["tags", "items", "labels", "nested", "choice", "payload"]) {
        expect(screen.getByRole("group", { name })).toBeTruthy();
      }
    });
  });

  test("view mode makes every control read-only", () => {
    renderForm(everything({ name: "preset", tags: ["x"], labels: { a: "b" } }), { kit, mode: "view" });

    expect(screen.queryByRole("button", { name: /^(Add|Remove|Move|Edit|Clear)/ })).toBeNull();
    expect((screen.getByLabelText("name") as HTMLInputElement).readOnly).toBe(true);
  });
});
