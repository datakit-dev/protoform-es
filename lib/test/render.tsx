import { type PropsWithChildren, type ReactElement } from "react";

import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Protoform, type ProtoformProps } from "../components/protoform";
import { fixtureEnv, fixtureMessage } from "./fixture";
import type { Env } from "../env";
import { Message } from "../message";
import { EnvProvider } from "../providers/env";

export function everything(init?: Record<string, unknown>) {
  return new Message(fixtureMessage("Everything"), init as never);
}

export function hinted(init?: Record<string, unknown>) {
  return new Message(fixtureMessage("Hinted"), init as never);
}

export function renderForm(
  message: Message,
  props: Partial<PropsWithChildren<ProtoformProps>> = {},
  env: Env = fixtureEnv(),
) {
  const user = userEvent.setup();
  const ui = (p: Partial<PropsWithChildren<ProtoformProps>>): ReactElement => (
    <EnvProvider env={env}>
      <Protoform message={message} {...p} />
    </EnvProvider>
  );
  const result = render(ui(props));
  return { user, ...result, rerenderForm: (p: Partial<PropsWithChildren<ProtoformProps>> = props) => result.rerender(ui(p)) };
}
