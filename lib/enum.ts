import { type DescField, type DescEnum, type EnumShape } from "@bufbuild/protobuf";

import { BaseField } from "./base";

export type EnumFieldDesc = Extract<DescField, { fieldKind: "enum" }>;

export class EnumField extends BaseField<EnumFieldDesc> {
  get(): number {
    return this.parent.value.get(this.desc);
  }

  set(value: number) {
    this.parent.value.set(this.desc, value);
    this.changed();
  }

  /** Accepts a value name (`FOO_BAR`) or number. */
  parse(value: string) {
    const trimmed = value.trim();
    const byName = this.desc.enum.values.find((v) => v.name === trimmed);
    if (byName) {
      this.set(byName.number);
      return;
    }
    if (/^-?\d+$/.test(trimmed)) {
      this.set(Number(trimmed));
      return;
    }
    throw new Error(`unknown value "${value}" for enum ${this.desc.enum.typeName}`);
  }

  toString(): string {
    const number = this.get();
    return this.desc.enum.value[number]?.name ?? String(number);
  }
}

export function parseEnum<Desc extends DescEnum>(descEnum: Desc, value: string): EnumShape<Desc> | undefined {
  for (const enumValue of descEnum.values) {
    if (enumValue.name === value) {
      return enumValue.proto.number as EnumShape<Desc>;
    }
  }
  return undefined;
}

export function formatEnum<Desc extends DescEnum>(descEnum: Desc, value: EnumShape<Desc>, trimPrefix?: boolean): string {
  const enumName = descEnum.value[value]?.name ?? String(value);
  if (trimPrefix) {
    const prefix = enumPrefix(descEnum);
    return enumName.startsWith(prefix) ? enumName.slice(prefix.length) : enumName;
  }
  return enumName;
}

/** The conventional value prefix: `ConnectionState` -> `CONNECTION_STATE_`. */
function enumPrefix(descEnum: DescEnum): string {
  return descEnum.name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase() + "_";
}

/** A human-friendly label: `CONNECTION_STATE_NOT_READY` -> `Not ready`. */
export function enumLabel<Desc extends DescEnum>(descEnum: Desc, value: EnumShape<Desc>): string {
  const words = formatEnum(descEnum, value, true).toLowerCase().replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function allEnumValues<Desc extends DescEnum>(descEnum: Desc): EnumShape<Desc>[] {
  return descEnum.values.slice(1).map((e) => e.proto.number) as EnumShape<Desc>[];
}
