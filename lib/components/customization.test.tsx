import { render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { bareKit } from "../kit/bare";
import { defineKit, resolveRenderer, useUI } from "../kit/context";
import { tailwindKit } from "../kit/tailwind";
import type { UIKit } from "../kit/types";
import { EnvProvider } from "../providers/env";
import { UIProvider } from "../providers/ui";
import { fixtureEnv } from "../test/fixture";
import { everything, renderForm } from "../test/render";
import type { FieldElementProps } from "./field";
import { Protoform } from "./protoform";

const TestButton: UIKit["Button"] = ({ children, onClick, "aria-label": label }) => (
  <button data-testid="test-button" type="button" aria-label={label} onClick={onClick}>{children}</button>
);

describe("kit overrides", () => {
  test("a partial kit overrides only the given primitives", async () => {
    const { user } = renderForm(everything(), { kit: { Button: TestButton } });

    expect(screen.getAllByTestId("test-button").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Add item: tags" }));
    expect(screen.getByLabelText("Item 1")).toBeTruthy();
    expect(screen.getByLabelText("name").getAttribute("data-pf")).toBe("input");
  });

  test("the default kit is bare", () => {
    renderForm(everything());

    expect(screen.getByLabelText("name").getAttribute("data-pf")).toBe("input");
  });

  test("providers nest: inner kits override outer ones per primitive", () => {
    const Marked: UIKit["TextInput"] = ({ value }) => <output data-testid="marked">{value}</output>;
    const env = fixtureEnv();

    render(
      <EnvProvider env={env}>
        <UIProvider kit={tailwindKit}>
          <UIProvider kit={{ TextInput: Marked }}>
            <Protoform message={everything({ name: "inner" })} />
          </UIProvider>
        </UIProvider>
      </EnvProvider>,
    );

    expect(screen.getAllByTestId("marked").map((el) => el.textContent)).toContain("inner");
    expect(document.querySelector(".pf-form")).not.toBeNull();
    expect(document.querySelector(".pf-switch")).not.toBeNull();
  });

  test("defineKit layers kits over the bare kit", () => {
    const kit = defineKit({ Button: TestButton });

    expect(kit.Button).toBe(TestButton);
    expect(kit.TextInput).toBe(bareKit.TextInput);
    expect(Object.keys(kit).sort()).toEqual(Object.keys(bareKit).sort());
  });

  test("the kit prop on Protoform is used for that form only", () => {
    renderForm(everything(), { kit: tailwindKit });

    expect(document.querySelector(".pf-form")).not.toBeNull();
  });
});

describe("renderers", () => {
  test("replace a field by full name, keeping the labelled frame", () => {
    const Name = ({ field }: FieldElementProps) => <output data-testid="name">custom {field.desc.name}</output>;
    renderForm(everything(), { renderers: { "test.Everything.name": Name } });

    expect(screen.getByTestId("name").textContent).toBe("custom name");
    expect(screen.getByText("name", { selector: "label" })).toBeTruthy();
  });

  test("replace a field by message type and can opt out of the frame", () => {
    const Time = ({ field }: FieldElementProps) => <output data-testid="time">{field.desc.name}</output>;
    Time.frame = "none" as const;
    renderForm(everything(), { renderers: { "google.protobuf.Timestamp": Time } });

    expect(screen.getAllByTestId("time").map((el) => el.textContent)).toContain("created");
    expect(screen.queryByLabelText("created")).toBeNull();
  });

  test("replace an enum by its type name (every field of that type)", () => {
    const Color = () => <output data-testid="color">custom color</output>;
    renderForm(everything(), { renderers: { "test.Color": Color } });

    // color, colors (list) and color_map all hold test.Color
    expect(screen.getAllByTestId("color")).toHaveLength(3);
    expect(screen.queryByRole("radio")).toBeNull();
  });

  test("receive the control id and error state from the frame", () => {
    const Probe = ({ id, invalid }: FieldElementProps) => <input data-testid="probe" id={id} aria-invalid={invalid} />;
    renderForm(everything(), { renderers: { "test.Everything.name": Probe } });

    expect(screen.getByLabelText("name")).toBe(screen.getByTestId("probe"));
  });

  test("a field-name renderer wins over a type renderer", () => {
    const ByName = () => <output data-testid="by-name" />;
    const ByType = () => <output data-testid="by-type" />;
    renderForm(everything(), {
      renderers: { "test.Everything.created": ByName, "google.protobuf.Timestamp": ByType },
    });

    expect(screen.getByTestId("by-name")).toBeTruthy();
    expect(screen.getAllByTestId("by-type")).toHaveLength(1);
  });

  test("resolve wins over renderers and can take over arbitrary fields", () => {
    const Resolved = () => <p>resolved</p>;
    const Listed = () => <p>listed</p>;
    renderForm(everything(), {
      renderers: { "test.Everything.count": Listed },
      resolve: (field) => field.desc.name === "count" ? Resolved : undefined,
    });

    expect(screen.getByText("resolved")).toBeTruthy();
    expect(screen.queryByText("listed")).toBeNull();
    expect(screen.queryByLabelText("count")).toBeNull();
  });

  test("oneofs can be replaced by group name", () => {
    const Choice = () => <output data-testid="choice">custom oneof</output>;
    Choice.frame = "none" as const;
    renderForm(everything(), { renderers: { "test.Everything.choice": Choice } });

    expect(screen.getByTestId("choice")).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: "choice" })).toBeNull();
  });

  test("resolveRenderer returns undefined when nothing matches", () => {
    const field = everything().fields()[0];

    const { result } = renderHook(() => resolveRenderer(useUI(), field));

    expect(result.current).toBeUndefined();
  });
});

describe("messages", () => {
  test("built-in strings can be translated", async () => {
    const user = userEvent.setup();
    renderForm(everything({ tags: ["x"] }), {
      messages: {
        addItem: "Ajouter",
        notSet: "Non défini",
        noItems: "Aucun",
        item: (n) => `Élément ${n}`,
        removeItem: (n) => `Supprimer ${n}`,
      },
    });

    expect(screen.getAllByRole("button", { name: /^Ajouter/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Non défini").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Aucun").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Élément 1")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Supprimer 1" }));
    expect(screen.queryByLabelText("Élément 1")).toBeNull();
  });
});
