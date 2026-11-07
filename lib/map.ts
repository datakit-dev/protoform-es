import { create, fromJson, toJson, type DescField, type JsonValue } from "@bufbuild/protobuf";
import { type ReflectMap, type ReflectMessage, reflect } from "@bufbuild/protobuf/reflect";

import { BaseField } from "./base";
import { Message } from "./message";
import { keyPath } from "./path";
import { formatScalar, parseScalar } from "./scalar";
import { parseEnum } from "./enum";

export type MapFieldDesc = Extract<DescField, { fieldKind: "map" }>;

export type MapKey = string | number | bigint | boolean;

export class MapField extends BaseField<MapFieldDesc> {
  get(): ReflectMap {
    return this.parent.value.get(this.desc);
  }

  set(value: ReflectMap) {
    this.parent.value.set(this.desc, value);
    this.changed();
  }

  get size(): number {
    return this.get().size;
  }

  /** Entries in insertion order. Values are scalars, enum numbers, or `ReflectMessage`s. */
  entries(): [MapKey, unknown][] {
    return Array.from(this.get().entries()) as [MapKey, unknown][];
  }

  /** The map key as shown to (and typed by) the user. */
  formatKey(key: MapKey): string {
    return formatScalar(this.desc.mapKey, key as never);
  }

  /** Parses user input into a key; throws with a user-facing message if invalid. */
  parseKey(input: string): MapKey {
    return parseScalar(this.desc.mapKey, input) as MapKey;
  }

  has(key: MapKey): boolean {
    return this.get().has(key as never);
  }

  /** Message values of a message map, wrapped so they can be edited and validated. */
  messages(): [MapKey, Message][] {
    return (this.entries() as [MapKey, ReflectMessage][]).map(([key, item]) => [
      key,
      new Message(item.desc, item.message, {
        owner: this.parent,
        path: keyPath(this.path, key),
      }),
    ]);
  }

  /** Adds `key` with a zero value (or `value`); returns false if the key exists. */
  add(key: MapKey, value?: unknown): boolean {
    if (this.has(key)) {
      return false;
    }
    this.get().set(key as never, (value ?? this.zeroValue()) as never);
    this.changed();
    return true;
  }

  setValue(key: MapKey, value: unknown) {
    this.get().set(key as never, value as never);
    this.changed();
  }

  delete(key: MapKey) {
    this.get().delete(key as never);
    this.changed();
  }

  /** Changes a key, keeping the entry's position; returns false if `to` is taken. */
  rename(from: MapKey, to: MapKey): boolean {
    if (from === to) {
      return true;
    }
    if (this.has(to)) {
      return false;
    }
    this.replace(this.entries().map(([key, value]) => [key === from ? to : key, value]));
    return true;
  }

  clear() {
    this.get().clear();
    this.changed();
  }

  toString(): string {
    const entries: Record<string, JsonValue> = {};
    for (const [key, value] of this.entries()) {
      entries[this.formatKey(key)] = this.valueToJson(value);
    }
    return JSON.stringify(entries);
  }

  parse(value: string): void {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error(`expected object for map field: ${this.desc.name}`);
    }

    this.replace(
      Object.entries(parsed).map(([key, entry]) => [this.parseKey(key), this.valueFromJson(entry as JsonValue)])
    );
  }

  private replace(entries: [MapKey, unknown][]) {
    const map = this.get();
    map.clear();
    for (const [key, value] of entries) {
      map.set(key as never, value as never);
    }
    this.changed();
  }

  /** A zero value for new entries: "" / 0 / false, or the enum's first value. */
  zeroValue(): unknown {
    switch (this.desc.mapKind) {
      case "message":
        return reflect(this.desc.message, create(this.desc.message));
      case "enum":
        return this.desc.enum.values[0]?.number ?? 0;
      case "scalar":
        return parseScalar(this.desc.scalar, "");
    }
  }

  private valueToJson(value: unknown): JsonValue {
    switch (this.desc.mapKind) {
      case "message":
        return toJson(this.desc.message, (value as ReflectMessage).message);
      case "enum":
        return this.desc.enum.value[value as number]?.name ?? (value as number);
      case "scalar":
        return formatScalar(this.desc.scalar, value as never);
    }
  }

  private valueFromJson(json: JsonValue): unknown {
    switch (this.desc.mapKind) {
      case "message":
        return reflect(this.desc.message, fromJson(this.desc.message, json));
      case "enum":
        return typeof json === "number" ? json : parseEnum(this.desc.enum, String(json)) ?? 0;
      case "scalar":
        return parseScalar(this.desc.scalar, String(json));
    }
  }
}
