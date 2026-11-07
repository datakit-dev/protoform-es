import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import type { Message } from "../message";
import { kits } from "../test/helpers";
import { hinted, renderForm } from "../test/render";

type HintedData = {
  notes: string;
  agree: string;
  flag: boolean;
  upload: Uint8Array;
  titled: string;
  picked: string;
};
const data = (message: Message) => message.get() as unknown as HintedData;

describe.each(kits)("field hints (%s kit)", (_name, kit) => {
  test("input.multilineText renders a textarea", async () => {
    const message = hinted();
    const { user } = renderForm(message, { kit });
    const notes = screen.getByLabelText("notes");

    expect(notes.tagName).toBe("TEXTAREA");
    await user.type(notes, "line 1{Enter}line 2");
    expect(data(message).notes).toBe("line 1\nline 2");
  });

  test("a plain string field is a single-line input", () => {
    renderForm(hinted(), { kit });

    expect(screen.getByLabelText("plain").tagName).toBe("INPUT");
  });

  test("confirm on a string field toggles between the approve and decline values", async () => {
    const message = hinted();
    const { user } = renderForm(message, { kit });

    await user.click(screen.getByRole("checkbox", { name: "agree" }));
    expect(data(message).agree).toBe("yes");

    await user.click(screen.getByRole("checkbox", { name: "agree" }));
    expect(data(message).agree).toBe("no");
  });

  test("confirm on a bool field is a checkbox", async () => {
    const message = hinted();
    const { user } = renderForm(message, { kit });

    await user.click(screen.getByRole("checkbox", { name: "flag" }));

    expect(data(message).flag).toBe(true);
  });

  test("file loads the chosen file's bytes", async () => {
    const message = hinted();
    const { user } = renderForm(message, { kit });
    const input = screen.getByLabelText("upload") as HTMLInputElement;

    expect(input.accept).toBe(".txt");
    await user.upload(input, new File(["hello"], "greeting.txt", { type: "text/plain" }));

    await waitFor(() => expect(Array.from(data(message).upload)).toEqual(Array.from(new TextEncoder().encode("hello"))));
    expect(input.files?.[0]?.name).toBe("greeting.txt");
  });

  test("hidden fields are not rendered", () => {
    renderForm(hinted(), { kit });

    expect(screen.queryByLabelText("secret")).toBeNull();
  });

  test("title and description options are shown and linked to the control", () => {
    renderForm(hinted(), { kit });

    const input = screen.getByLabelText("Custom title");
    const description = screen.getByText("Helpful description");

    expect(input.getAttribute("aria-describedby")).toContain(description.id);
  });

  test("required fields are marked", () => {
    renderForm(hinted(), { kit });

    expect(screen.getByText("must").textContent).toContain("*");
    expect(screen.getByText("plain").textContent).not.toContain("*");
  });

  test("select hints fall back to a text input until RPC options are supported", async () => {
    const message = hinted();
    const { user } = renderForm(message, { kit });

    await user.type(screen.getByLabelText("picked"), "free text");

    expect(data(message).picked).toBe("free text");
  });

  test("an empty accept list leaves the attribute off", () => {
    const { container } = render(<>{kit.FileInput({ accept: [], onFile: () => { }, "aria-label": "f" })}</>);

    expect(container.querySelector("input[type=file]")?.hasAttribute("accept")).toBe(false);
  });

  test("view mode locks hinted controls", () => {
    renderForm(hinted(), { kit, mode: "view" });

    expect((screen.getByLabelText("notes") as HTMLTextAreaElement).readOnly).toBe(true);
    expect((screen.getByLabelText("upload") as HTMLInputElement).disabled).toBe(true);
  });
});
