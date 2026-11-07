import { createElement, useState } from "react";

import { ScalarType } from "@bufbuild/protobuf";

import type { Field } from "../field";
import { ListField } from "../list";
import { MapField } from "../map";
import { MessageField } from "../message";
import { OneOfField } from "../oneof";
import { ScalarField } from "../scalar";
import { EnumField } from "../enum";
import { resolveRenderer, useKit, useUI } from "../kit/context";
import { EnumElement } from "./enum";
import { ListElement } from "./list";
import { MapElement } from "./map";
import { MessageElement } from "./message";
import { OneOfFieldElement } from "./oneof";
import { ScalarElement } from "./scalar";

/** `view` is read-only; `edit` and `auto` are editable (changes apply immediately). */
export type FieldDisplayMode = "edit" | "view" | "auto";

export type FieldElementProps = {
  field: Field;
  mode?: FieldDisplayMode;
  depth?: number;
  /** Id for the control, so a surrounding label can point at it. */
  id?: string;
  /** Id(s) of the description/error elements for `aria-describedby`. */
  describedBy?: string;
  invalid?: boolean;
};

/** Renders the editor for a field: a custom renderer if one matches, else the built-in. */
export function FieldElement(props: FieldElementProps) {
  const ui = useUI();
  const Custom = resolveRenderer(ui, props.field);
  if (Custom) {
    return createElement(Custom, props);
  }
  return <BuiltinFieldElement {...props} />;
}

export function BuiltinFieldElement(props: FieldElementProps) {
  const { field } = props;

  if (field instanceof OneOfField) {
    return <OneOfFieldElement {...props} field={field} />;
  }
  if (field instanceof ListField) {
    return <ListElement {...props} field={field} />;
  }
  if (field instanceof MapField) {
    return <MapElement {...props} field={field} />;
  }
  if (field instanceof MessageField) {
    return <MessageElement {...props} field={field} />;
  }
  if (field instanceof EnumField) {
    return <EnumElement {...props} field={field} />;
  }
  if (field instanceof ScalarField) {
    const type = field.elem.type();
    const scalar = field.desc.scalar;
    if (type.case === "confirm") {
      return <ConfirmElement {...props} field={field} />;
    }
    if (type.case === "file" && (scalar === ScalarType.BYTES || scalar === ScalarType.STRING)) {
      return <FileElement {...props} field={field} />;
    }
    return <ScalarElement {...props} field={field} multiline={type.case === "input" && !!type.value.multilineText} />;
  }
  return null;
}

type ScalarHintProps = FieldElementProps & { field: ScalarField };

/** `confirm` hint: a checkbox that toggles between the approve and decline values. */
function ConfirmElement({ field, mode, id, describedBy, invalid }: ScalarHintProps) {
  const kit = useKit();
  const type = field.elem.type();
  if (type.case !== "confirm") {
    return null;
  }

  const isBool = field.desc.scalar === ScalarType.BOOL;
  const checked = isBool ? field.get() === true : field.toString() === type.value.approve;

  const onChange = (next: boolean) => {
    if (isBool) {
      field.set(next);
    } else {
      field.parse(next ? type.value.approve : type.value.decline);
    }
  };

  return (
    <kit.Checkbox
      id={id}
      name={field.desc.localName}
      checked={checked}
      readOnly={mode === "view"}
      invalid={invalid}
      describedBy={describedBy}
      onChange={onChange}
    />
  );
}

/** `file` hint: loads the chosen file's contents into a bytes or string field. */
function FileElement({ field, mode, id, describedBy, invalid }: ScalarHintProps) {
  const kit = useKit();
  const [fileName, setFileName] = useState<string>();
  const type = field.elem.type();

  const onFile = async (file: File | undefined) => {
    setFileName(file?.name);
    if (!file) {
      field.parse("");
    } else if (field.desc.scalar === ScalarType.BYTES) {
      field.set(new Uint8Array(await file.arrayBuffer()));
    } else {
      field.set(await file.text());
    }
  };

  return (
    <kit.FileInput
      id={id}
      name={field.desc.localName}
      accept={type.case === "file" ? type.value.allowedTypes : undefined}
      fileName={fileName}
      readOnly={mode === "view"}
      invalid={invalid}
      describedBy={describedBy}
      onFile={(file) => void onFile(file)}
    />
  );
}
