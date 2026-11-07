import { StrictMode, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";

import { createMutableRegistry, toJsonString } from "@bufbuild/protobuf";

import { Protoform, SubmitButton } from "../lib/components";
import { bareKit } from "../lib/kit/bare";
import { tailwindKit } from "../lib/kit/tailwind";
import { Message } from "../lib/message";
import { EnvProvider } from "../lib/providers/env";
import { defaultRegistry, Env } from "../lib/env";
import { file_dtkt_core_v1_automation } from "@buf/datakit-dev_dtkt-sdk.bufbuild_es/dtkt/core/v1/automation_pb";
import { file_dtkt_core_v1_connection } from "@buf/datakit-dev_dtkt-sdk.bufbuild_es/dtkt/core/v1/connection_pb";
import { file_dtkt_core_v1_deployment } from "@buf/datakit-dev_dtkt-sdk.bufbuild_es/dtkt/core/v1/deployment_pb";
import { file_dtkt_core_v1_integration } from "@buf/datakit-dev_dtkt-sdk.bufbuild_es/dtkt/core/v1/integration_pb";

import "../lib/styles/protoform.css";
import "./playground.css";

const env = new Env({
  registry: createMutableRegistry(
    defaultRegistry,
    file_dtkt_core_v1_automation,
    file_dtkt_core_v1_connection,
    file_dtkt_core_v1_deployment,
    file_dtkt_core_v1_integration,
  ),
});
const desc = env.registry.getMessage("dtkt.core.v1.Connection");

type Theme = "system" | "light" | "dark";
type KitName = "tailwind" | "bare";

function Playground() {
  const [kit, setKit] = useState<KitName>("tailwind");
  const [theme, setTheme] = useState<Theme>("system");
  const [readOnly, setReadOnly] = useState(false);
  const [message, setMessage] = useState(new Message(desc!));

  useSyncExternalStore(message.store.subscribe, message.store.snapshot);

  const dataTheme = theme === "system" ? undefined : theme;

  const updateMessage = (typeName: string) => {
    const desc = env.registry.getMessage(typeName);
    if (!desc) {
      throw new Error(`Message descriptor for ${typeName} not found`);
    }
    setMessage(new Message(desc));
  };

  return (
    <div className="shell" data-theme={dataTheme}>
      <header className="toolbar">
        <strong>protoform</strong>
        <label>
          Kit
          <select value={kit} onChange={(e) => setKit(e.target.value as KitName)}>
            <option value="tailwind">Tailwind + Headless UI</option>
            <option value="bare">Bare (unstyled)</option>
          </select>
        </label>
        <label>
          Theme
          <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label>
          Message
          <select value={message.value.desc.typeName} onChange={(e) => updateMessage(e.target.value)}>
            {Array.from(env.registry).filter((desc) => desc.kind === "message" && !desc.typeName.endsWith("Response")).sort((a, b) => a.typeName.localeCompare(b.typeName)).map((desc) => (
              <option key={desc.typeName} value={desc.typeName}>
                {desc.typeName}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input type="checkbox" checked={readOnly} onChange={(e) => setReadOnly(e.target.checked)} /> Read-only
        </label>
      </header>

      <main>
        <h1 className="message-title">{message.value.desc.typeName}</h1>

        <div className="layout">
          <EnvProvider env={env}>
            <Protoform
              message={message}
              kit={kit === "tailwind" ? tailwindKit : bareKit}
              mode={readOnly ? "view" : "edit"}
              validateOn="change"
              onSubmit={() => alert("Valid!")}
            >
              <SubmitButton>Submit</SubmitButton>
            </Protoform>
          </EnvProvider>

          <pre className="output">{toJsonString(message.value.desc, message.get(), { registry: env.registry, prettySpaces: 2 })}</pre>
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
);
