import { useId, useState, useSyncExternalStore } from "react";

import type { ScalarValue } from "@bufbuild/protobuf/reflect";

import { useKit, useMessages } from "../kit/context";
import type { MapField, MapKey } from "../map";
import type { Message } from "../message";
import { keyPath } from "../path";
import { FormStore } from "../store";
import { EnumInput } from "./enum";
import type { FieldElementProps } from "./field";
import { FieldSection } from "./group";
import { MessageValue } from "./message";
import { ScalarInput } from "./scalar";
import { isInlineWellKnown } from "../wellknown";

type MapElementProps = FieldElementProps & {
  field: MapField;
};

type EntryProps = {
  field: MapField;
  entryKey: MapKey;
  readOnly: boolean;
};

function RemoveButton({ field, entryKey, readOnly }: EntryProps) {
  const kit = useKit();
  const messages = useMessages();

  if (readOnly) {
    return null;
  }
  return (
    <kit.Button variant="ghost" size="sm" aria-label={messages.removeEntry(field.formatKey(entryKey))} onClick={() => field.delete(entryKey)}>
      ✕
    </kit.Button>
  );
}

function Separator() {
  return <span data-pf="separator" aria-hidden="true">=</span>;
}

type ValueControlProps = {
  field: MapField;
  value: unknown;
  onValue: (value: unknown) => string | void;
  store: FormStore;
  errorPath: string;
  readOnly: boolean;
  invalid?: boolean;
  describedBy?: string;
  onEnter?: () => void;
  "aria-label": string;
  placeholder?: string;
};

/** The editor for a scalar or enum map value: text input, switch or select. */
function ValueControl({ field, value, onValue, store, errorPath, ...control }: ValueControlProps) {
  switch (field.desc.mapKind) {
    case "enum":
      return <EnumInput {...control} compact desc={field.desc.enum} value={value as number} onValue={onValue} />;
    case "scalar":
      return (
        <ScalarInput
          {...control}
          scalar={field.desc.scalar}
          value={value as ScalarValue}
          onValue={(next) => onValue(next)}
          store={store}
          errorPath={errorPath}
        />
      );
    default:
      return null;
  }
}

/** An existing scalar or enum entry as `key = value`; the key is fixed, the value is editable. */
function ValueEntry({ field, entryKey, readOnly, value }: EntryProps & { value: unknown }) {
  const kit = useKit();
  const messages = useMessages();
  const id = useId();

  const key = field.formatKey(entryKey);
  const path = keyPath(field.path, entryKey);
  const errors = field.parent.errorMessagesAt(path);

  return (
    <kit.Row id={id} errors={errors} actions={<RemoveButton field={field} entryKey={entryKey} readOnly={readOnly} />}>
      <kit.TextInput value={key} readOnly mono aria-label={messages.entryKey(key)} onChange={() => { }} />
      <Separator />
      <ValueControl
        field={field}
        value={value}
        onValue={(next) => field.setValue(entryKey, next)}
        store={field.parent.store}
        errorPath={path}
        readOnly={readOnly}
        invalid={errors.length > 0}
        describedBy={errors.length > 0 ? `${id}-errors` : undefined}
        aria-label={messages.entryValue(key)}
      />
    </kit.Row>
  );
}

function MessageEntry({ field, entryKey, readOnly, item, depth, mode }: EntryProps & { item: Message; depth: number; mode: MapElementProps["mode"] }) {
  const kit = useKit();
  const messages = useMessages();
  const id = useId();

  const key = field.formatKey(entryKey);
  const errors = field.parent.errorMessagesAt(keyPath(field.path, entryKey));
  const actions = <RemoveButton field={field} entryKey={entryKey} readOnly={readOnly} />;

  if (isInlineWellKnown(item.value.desc.typeName)) {
    return (
      <kit.Row id={id} errors={errors} actions={actions}>
        <kit.TextInput value={key} readOnly mono aria-label={messages.entryKey(key)} onChange={() => { }} />
        <Separator />
        <MessageValue
          message={item}
          mode={mode}
          aria-label={messages.entryValue(key)}
          describedBy={errors.length > 0 ? `${id}-errors` : undefined}
          invalid={errors.length > 0}
        />
      </kit.Row>
    );
  }

  return (
    <kit.Section id={id} title={messages.entry(key)} errors={errors} depth={depth} actions={actions} collapsible>
      <MessageValue message={item} mode={mode} depth={depth + 1} />
    </kit.Section>
  );
}

/**
 * The row for adding an entry. For scalar and enum maps it has the same shape
 * as existing entries (`key = value`); message maps only take a key and the
 * value is edited in the new entry's section.
 */
function AddEntry({ field }: { field: MapField }) {
  const kit = useKit();
  const messages = useMessages();
  const id = useId();
  const hasValue = field.desc.mapKind !== "message";

  const [keyText, setKeyText] = useState("");
  const [keyError, setKeyError] = useState<string>();
  const [value, setValue] = useState(() => field.zeroValue());

  // Errors in the pending value are local to this row: they must not block submitting the form.
  const [valueStore] = useState(() => new FormStore());
  useSyncExternalStore(valueStore.subscribe, valueStore.snapshot);
  const valueError = valueStore.localError("value");

  const errors = [keyError, valueError].filter((error): error is string => error !== undefined);
  const canAdd = keyText !== "" && !valueStore.hasLocalErrors();

  const submit = () => {
    if (!canAdd) {
      return;
    }
    try {
      if (field.add(field.parseKey(keyText), hasValue ? value : undefined)) {
        setKeyText("");
        setKeyError(undefined);
        setValue(field.zeroValue());
      } else {
        setKeyError(messages.duplicateKey);
      }
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <kit.Row
      id={id}
      errors={errors}
      actions={
        <kit.Button variant="secondary" size="sm" aria-label={messages.addEntry} disabled={!canAdd} onClick={submit}>
          {messages.addEntry}
        </kit.Button>
      }
    >
      <kit.TextInput
        value={keyText}
        mono
        invalid={keyError !== undefined}
        describedBy={errors.length > 0 ? `${id}-errors` : undefined}
        placeholder={messages.key}
        aria-label={messages.key}
        onChange={(next) => {
          setKeyText(next);
          setKeyError(undefined);
        }}
        onEnter={submit}
      />
      {hasValue && (
        <>
          <Separator />
          <ValueControl
            field={field}
            value={value}
            onValue={(next) => setValue(next)}
            store={valueStore}
            errorPath="value"
            readOnly={false}
            invalid={valueError !== undefined}
            onEnter={submit}
            placeholder={messages.value}
            aria-label={messages.value}
          />
        </>
      )}
    </kit.Row>
  );
}

export function MapElement({ field, mode, depth = 0, id }: MapElementProps) {
  const kit = useKit();
  const messages = useMessages();
  const readOnly = mode === "view";

  let rows;
  if (field.desc.mapKind === "message") {
    rows = field.messages().map(([key, item]) => (
      <MessageEntry
        key={field.formatKey(key)}
        field={field}
        entryKey={key}
        readOnly={readOnly}
        item={item}
        depth={depth + 1}
        mode={mode}
      />
    ));
  } else {
    rows = field.entries().map(([key, value]) => (
      <ValueEntry key={field.formatKey(key)} field={field} entryKey={key} readOnly={readOnly} value={value} />
    ));
  }

  return (
    <FieldSection field={field} id={id} depth={depth}>
      {rows.length === 0 && readOnly && <p data-pf="empty">{messages.noItems}</p>}
      {(rows.length > 0 || !readOnly) && (
        <kit.Stack>
          {rows}
          {!readOnly && <AddEntry field={field} />}
        </kit.Stack>
      )}
    </FieldSection>
  );
}
