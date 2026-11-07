import { useEffect } from "react";

import { ScalarType } from "@bufbuild/protobuf";
import type { ScalarValue } from "@bufbuild/protobuf/reflect";

import { useKit } from "../kit/context";
import { formatScalar, isIntegerScalar, isNumericScalar, type ScalarField, tryParseScalar } from "../scalar";
import type { FormStore } from "../store";
import { useDraft } from "./hooks";
import type { FieldElementProps } from "./field";

export type ScalarInputProps = {
  scalar: ScalarType;
  value: ScalarValue;
  /** Called with each valid value; may return an error message to display. */
  onValue: (value: ScalarValue) => string | void;
  /** Where unparsable input is recorded so it blocks submission. */
  store: FormStore;
  errorPath: string;
  id?: string;
  name?: string;
  describedBy?: string;
  invalid?: boolean;
  readOnly?: boolean;
  required?: boolean;
  multiline?: boolean;
  placeholder?: string;
  /** Called when Enter is pressed in a single-line input (suppresses the form's implicit submit). */
  onEnter?: () => void;
  "aria-label"?: string;
};

/** An editor for a single scalar value; usable standalone (e.g. list items). */
export function ScalarInput({
  scalar, value, onValue, store, errorPath, multiline, ...control
}: ScalarInputProps) {
  const kit = useKit();

  // Zero is shown as empty (placeholder "0") so typing doesn't append to a leading "0".
  const display = (next: ScalarValue) =>
    isNumericScalar(scalar) && (next === 0 || next === 0n) ? "" : formatScalar(scalar, next);

  const canonical = display(value);
  const draft = useDraft(canonical, (text) => {
    const result = tryParseScalar(scalar, text);
    return result.ok ? display(result.value) : undefined;
  });

  useEffect(() => () => store.setLocalError(errorPath, undefined), [store, errorPath]);

  if (scalar === ScalarType.BOOL) {
    return (
      <kit.Checkbox
        variant="switch"
        id={control.id}
        name={control.name}
        checked={value as boolean}
        readOnly={control.readOnly}
        invalid={control.invalid}
        describedBy={control.describedBy}
        aria-label={control["aria-label"]}
        onChange={(checked) => store.setLocalError(errorPath, onValue(checked) ?? undefined)}
      />
    );
  }

  const onChange = (text: string) => {
    draft.setText(text);
    const result = tryParseScalar(scalar, text);
    if (!result.ok) {
      store.setLocalError(errorPath, result.error);
      return;
    }
    store.setLocalError(errorPath, onValue(result.value) ?? undefined);
  };

  const onBlur = () => {
    if (store.localError(errorPath) === undefined) {
      draft.reset();
    }
  };

  const invalid = control.invalid || store.localError(errorPath) !== undefined;
  const mono = isNumericScalar(scalar) || scalar === ScalarType.BYTES;

  if (multiline && (scalar === ScalarType.STRING || scalar === ScalarType.BYTES)) {
    return (
      <kit.TextArea
        {...control}
        invalid={invalid}
        value={draft.text}
        mono={mono}
        onChange={onChange}
        onBlur={onBlur}
      />
    );
  }

  return (
    <kit.TextInput
      {...control}
      invalid={invalid}
      value={draft.text}
      mono={mono}
      placeholder={control.placeholder ?? (isNumericScalar(scalar) ? "0" : undefined)}
      inputMode={isIntegerScalar(scalar) ? "numeric" : isNumericScalar(scalar) ? "decimal" : "text"}
      onChange={onChange}
      onBlur={onBlur}
    />
  );
}

type ScalarElementProps = FieldElementProps & {
  field: ScalarField;
  /** Render strings and bytes in a multi-line text area. */
  multiline?: boolean;
};

export function ScalarElement({ field, mode, id, describedBy, invalid, multiline }: ScalarElementProps) {
  return (
    <ScalarInput
      scalar={field.desc.scalar}
      value={field.get()}
      onValue={(value) => field.set(value)}
      store={field.parent.store}
      errorPath={field.path}
      id={id}
      name={field.desc.localName}
      describedBy={describedBy}
      invalid={invalid}
      readOnly={mode === "view"}
      required={field.elem.required}
      multiline={multiline}
    />
  );
}
