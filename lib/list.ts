import { create, fromJson, toJson, type DescField, type JsonValue } from "@bufbuild/protobuf";
import { type ReflectList, type ReflectMessage, reflect } from "@bufbuild/protobuf/reflect";

import { BaseField } from "./base";
import { Message } from "./message";
import { indexPath } from "./path";
import { formatScalar, parseScalar } from "./scalar";
import { parseEnum } from "./enum";

export type ListFieldDesc = Extract<DescField, { fieldKind: "list" }>;

export class ListField extends BaseField<ListFieldDesc> {
  get(): ReflectList {
    return this.parent.value.get(this.desc);
  }

  set(value: ReflectList) {
    this.parent.value.set(this.desc, value);
    this.changed();
  }

  get size(): number {
    return this.get().size;
  }

  /** The raw items: scalars, enum numbers, or `ReflectMessage`s. */
  items(): unknown[] {
    return Array.from(this.get());
  }

  /** Items of a message list, wrapped so they can be edited and validated. */
  messages(): Message[] {
    return (this.items() as ReflectMessage[]).map((item, idx) =>
      new Message(item.desc, item.message, {
        owner: this.parent,
        path: indexPath(this.path, idx),
      })
    );
  }

  /** Appends a new zero-valued item (or `value`, if given). */
  add(value?: unknown) {
    const list = this.get();
    list.add((value ?? this.zeroItem()) as never);
    this.changed();
  }

  removeAt(index: number) {
    this.replace(this.items().filter((_, idx) => idx !== index));
  }

  /** Moves the item at `from` so it ends up at `to`. */
  move(from: number, to: number) {
    const items = this.items();
    if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
      return;
    }
    const [item] = items.splice(from, 1);
    items.splice(to, 0, item);
    this.replace(items);
  }

  setAt(index: number, value: unknown) {
    this.get().set(index, value as never);
    this.changed();
  }

  clear() {
    this.get().clear();
    this.changed();
  }

  toString(): string {
    return JSON.stringify(this.items().map((item) => this.itemToJson(item)));
  }

  parse(value: string): void {
    const entries = JSON.parse(value) as unknown;
    if (!Array.isArray(entries)) throw new Error(`expected array for list field: ${this.desc.name}`);

    const items = entries.map((entry) => this.itemFromJson(entry as JsonValue));
    this.replace(items);
  }

  private replace(items: unknown[]) {
    const list = this.get();
    list.clear();
    for (const item of items) {
      list.add(item as never);
    }
    this.changed();
  }

  private zeroItem(): unknown {
    switch (this.desc.listKind) {
      case "message":
        return reflect(this.desc.message, create(this.desc.message));
      case "enum":
        return this.desc.enum.values[0]?.number ?? 0;
      case "scalar":
        return parseScalar(this.desc.scalar, "");
    }
  }

  private itemToJson(item: unknown): JsonValue {
    switch (this.desc.listKind) {
      case "message":
        return toJson(this.desc.message, (item as ReflectMessage).message);
      case "enum":
        return this.desc.enum.value[item as number]?.name ?? (item as number);
      case "scalar":
        return formatScalar(this.desc.scalar, item as never);
    }
  }

  private itemFromJson(json: JsonValue): unknown {
    switch (this.desc.listKind) {
      case "message":
        return reflect(this.desc.message, fromJson(this.desc.message, json));
      case "enum":
        return typeof json === "number" ? json : parseEnum(this.desc.enum, String(json)) ?? 0;
      case "scalar":
        return parseScalar(this.desc.scalar, String(json));
    }
  }
}
