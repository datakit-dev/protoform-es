import type { DescEnum } from "@bufbuild/protobuf";

import { type EnumField, enumLabel } from "../enum";
import { useKit } from "../kit/context";
import type { Option } from "../kit/types";
import type { FieldElementProps } from "./field";

/** Radio groups are used up to this many values; larger enums use a select. */
const MAX_RADIO_VALUES = 4;

export type EnumInputProps = {
  desc: DescEnum;
  value: number;
  onValue: (value: number) => void;
  id?: string;
  name?: string;
  describedBy?: string;
  invalid?: boolean;
  readOnly?: boolean;
  required?: boolean;
  /** Always use a select (e.g. inside list rows). */
  compact?: boolean;
  "aria-label"?: string;
};

/** An editor for a single enum value; usable standalone (e.g. list items). */
export function EnumInput({ desc, value, onValue, compact, ...control }: EnumInputProps) {
  const kit = useKit();

  const options: Option[] = desc.values.map((v) => ({
    value: String(v.number),
    label: enumLabel(desc, v.number),
  }));
  if (!(value in desc.value)) {
    options.push({ value: String(value), label: String(value) });
  }

  const props = {
    ...control,
    value: String(value),
    options,
    onChange: (next: string) => onValue(Number(next)),
  };

  if (!compact && options.length <= MAX_RADIO_VALUES) {
    return <kit.RadioGroup {...props} />;
  }
  return <kit.Select {...props} />;
}

type EnumElementProps = FieldElementProps & {
  field: EnumField;
};

export function EnumElement({ field, mode, id, describedBy, invalid }: EnumElementProps) {
  return (
    <EnumInput
      desc={field.desc.enum}
      value={field.get()}
      onValue={(value) => field.set(value)}
      id={id}
      name={field.desc.localName}
      describedBy={describedBy}
      invalid={invalid}
      readOnly={mode === "view"}
      required={field.elem.required}
    />
  );
}
