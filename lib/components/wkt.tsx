import { useEffect } from "react";

import { create, equals, fromJson, type JsonValue, toJson } from "@bufbuild/protobuf";
import { type Any, anyPack, anyUnpack, timestampNow } from "@bufbuild/protobuf/wkt";

import { useEnv } from "../env";
import { useMessages, useKit } from "../kit/context";
import { Message, MessageField } from "../message";
import { isJsonWellKnown, isTextWellKnown } from "../wellknown";
import type { ScalarField } from "../scalar";
import { useDraft } from "./hooks";
import type { FieldDisplayMode } from "./field";
import { MessageValue } from "./message";
import { ScalarInput } from "./scalar";

const WKT = "google.protobuf.";

export type WellKnownEditorProps = {
  message: Message;
  mode?: FieldDisplayMode;
  id?: string;
  describedBy?: string;
  invalid?: boolean;
  /** Names the control when there's no surrounding label (e.g. rows in a list). */
  "aria-label"?: string;
};

/** Editors for the well-known types where a nested form would be awkward. */
export function WellKnownEditor(props: WellKnownEditorProps) {
  const typeName = props.message.value.desc.typeName;

  if (isTextWellKnown(typeName)) {
    return <JsonEditor {...props} format="text" />;
  }
  if (isJsonWellKnown(typeName)) {
    return <JsonEditor {...props} format="json" />;
  }
  return <WrapperEditor {...props} />;
}

const PLACEHOLDERS: Record<string, string> = {
  [`${WKT}Timestamp`]: "2024-01-31T12:00:00Z",
  [`${WKT}Duration`]: "1.5s",
  [`${WKT}FieldMask`]: "foo,bar.baz",
};

function JsonEditor({ message, mode, id, describedBy, invalid, format, "aria-label": ariaLabel }: WellKnownEditorProps & { format: "text" | "json" }) {
  const kit = useKit();
  const messages = useMessages();
  const desc = message.value.desc;
  const store = message.store;

  const isEmpty = (target: Message) =>
    target instanceof MessageField ? !target.isSet() : equals(desc, target.get(), create(desc));

  const stringify = (value: Message["value"]["message"]) => {
    const json = toJson(desc, value);
    return typeof json === "string" && format === "text" ? json : JSON.stringify(json, null, 2);
  };
  const parse = (text: string) =>
    fromJson(desc, format === "text" ? text : JSON.parse(text) as JsonValue);

  const draft = useDraft(isEmpty(message) ? "" : stringify(message.get()), (text) => {
    if (text.trim() === "") return "";
    try {
      return stringify(parse(text));
    } catch {
      return undefined;
    }
  });

  useEffect(() => () => store.setLocalError(message.path, undefined), [store, message.path]);

  const onChange = (text: string) => {
    draft.setText(text);
    if (text.trim() === "") {
      message.clear();
      store.setLocalError(message.path, undefined);
      return;
    }
    try {
      message.set(parse(text));
      if (message instanceof MessageField) {
        message.ensure();
      }
      store.setLocalError(message.path, undefined);
    } catch (err) {
      store.setLocalError(message.path, err instanceof Error ? err.message : String(err));
    }
  };

  const onBlur = () => {
    if (store.localError(message.path) === undefined) {
      draft.reset();
    }
  };

  const control = {
    id,
    describedBy,
    "aria-label": ariaLabel,
    invalid: invalid || store.localError(message.path) !== undefined,
    readOnly: mode === "view",
    value: draft.text,
    mono: true,
    placeholder: PLACEHOLDERS[desc.typeName],
    onChange,
    onBlur,
  };

  if (format === "json") {
    return <kit.TextArea {...control} rows={6} />;
  }

  const canSetNow = desc.typeName === `${WKT}Timestamp` && mode !== "view";
  const now = () => {
    message.set(timestampNow());
    if (message instanceof MessageField) {
      message.ensure();
    }
    store.setLocalError(message.path, undefined);
    draft.reset();
  };

  return (
    <kit.Row actions={canSetNow && <kit.Button size="sm" variant="secondary" onClick={now}>{messages.now}</kit.Button>}>
      <kit.TextInput {...control} />
    </kit.Row>
  );
}

function WrapperEditor({ message, mode, id, describedBy, invalid, "aria-label": ariaLabel }: WellKnownEditorProps) {
  const field = message.fields()[0] as ScalarField;

  return (
    <ScalarInput
      scalar={field.desc.scalar}
      value={field.get()}
      onValue={(value) => field.set(value)}
      store={message.store}
      errorPath={field.path}
      id={id}
      describedBy={describedBy}
      invalid={invalid}
      readOnly={mode === "view"}
      aria-label={ariaLabel}
    />
  );
}

export type AnyEditorProps = {
  message: Message;
  mode?: FieldDisplayMode;
  depth?: number;
};

/** `google.protobuf.Any`: pick a message type from the registry, then edit it. */
export function AnyEditor({ message, mode, depth = 0 }: AnyEditorProps) {
  const env = useEnv();
  const kit = useKit();
  const messages = useMessages();

  const any = message.get() as Any;
  const typeName = any.typeUrl.slice(any.typeUrl.lastIndexOf("/") + 1);
  const desc = typeName ? env.registry.getMessage(typeName) : undefined;

  const names = new Set<string>();
  for (const entry of env.registry) {
    if (entry.kind === "message" && env.anyTypeFilter(entry.typeName)) {
      names.add(entry.typeName);
    }
  }
  if (typeName) {
    names.add(typeName);
  }
  const options = [...names].sort().map((name) => ({ value: name, label: name }));

  const onType = (name: string) => {
    const next = env.registry.getMessage(name);
    if (next) {
      anyPack(next, create(next), any);
      message.notify();
    }
  };

  let inner: Message | undefined;
  if (desc) {
    const target = new Message(desc, anyUnpack(any, desc) ?? create(desc), {
      owner: message,
      path: `${message.path}[${typeName}]`,
      onChange: () => anyPack(desc, target.get() as never, any),
    });
    inner = target;
  }

  return (
    <kit.Stack>
      <kit.Select
        aria-label={messages.selectType}
        placeholder={messages.selectType}
        value={typeName}
        options={options}
        readOnly={mode === "view"}
        onChange={onType}
      />
      {inner && <MessageValue message={inner} mode={mode} depth={depth} />}
    </kit.Stack>
  );
}
