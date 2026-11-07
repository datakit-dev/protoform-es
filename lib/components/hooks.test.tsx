import { act, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import type { ScalarField } from "../scalar";
import { findField } from "../test/helpers";
import { everything } from "../test/render";
import { useMessage } from "./hooks";
import type { Message } from "../message";

function Name({ message }: { message: Message }) {
  useMessage(message);
  return <output>{findField<ScalarField>(message, "name").toString()}</output>;
}

test("useMessage re-renders when the message changes outside React", () => {
  const message = everything();
  render(<Name message={message} />);
  expect(screen.getByRole("status").textContent).toBe("");

  act(() => findField<ScalarField>(message, "name").set("changed"));

  expect(screen.getByRole("status").textContent).toBe("changed");
});
