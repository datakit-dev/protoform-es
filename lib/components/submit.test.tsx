import { screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import type { UIKit } from "../kit/types";
import { kits } from "../test/helpers";
import { everything, renderForm } from "../test/render";
import { SubmitButton } from "./submit";

describe.each(kits)("SubmitButton (%s kit)", (_name, kit) => {
  test("submits the form", async () => {
    const onSubmit = vi.fn();
    const { user } = renderForm(everything(), { kit, onSubmit, children: <SubmitButton>Save</SubmitButton> });

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("is labelled 'Submit' by default", () => {
    renderForm(everything(), { kit, children: <SubmitButton /> });

    expect(screen.getByRole("button", { name: "Submit" }).getAttribute("type")).toBe("submit");
  });

  test("uses the kit's button styling", () => {
    renderForm(everything(), { kit, children: <SubmitButton>Save</SubmitButton> });

    const button = screen.getByRole("button", { name: "Save" });
    expect(button.getAttribute("data-variant")).toBe("primary");
    expect(button.className.includes("pf-button") || button.getAttribute("data-pf") === "button").toBe(true);
  });
});

describe("SubmitButton", () => {
  test("renders through whichever Button a custom kit provides", () => {
    const Custom: UIKit["Button"] = ({ children, variant, type, disabled }) => (
      <button data-testid="custom" data-variant={variant} type={type} disabled={disabled}>{children}</button>
    );
    renderForm(everything(), {
      kit: { Button: Custom },
      children: <SubmitButton variant="danger" disabled>Delete</SubmitButton>,
    });

    const button = screen.getByRole("button", { name: "Delete" }) as HTMLButtonElement;
    expect(button.getAttribute("data-testid")).toBe("custom");
    expect(button.type).toBe("submit");
    expect(button.dataset.variant).toBe("danger");
    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe("Delete");
  });

  test("is placed in an actions container after the fields", () => {
    const { container } = renderForm(everything(), { children: <SubmitButton /> });

    const actions = container.querySelector("[data-pf=actions]");
    expect(actions?.querySelector("button")).not.toBeNull();
    expect(actions?.previousElementSibling?.getAttribute("data-pf")).toBe("stack");
  });

  test("no actions container is rendered without children", () => {
    const { container } = renderForm(everything());

    expect(container.querySelector("[data-pf=actions]")).toBeNull();
  });
});
