import { type DescField, type DescOneof } from "@bufbuild/protobuf";
import type { Violation } from "@bufbuild/protovalidate";

import { type Element, elementFor } from "./element";
import { type Field, createField } from "./field";
import type { Message } from "./message";
import { fieldPath } from "./path";

/** A oneof group: at most one of its member fields is set at a time. */
export class OneOfField implements Field {
  readonly parent: Message;
  readonly oneOf: DescOneof;
  readonly elem: Element;
  readonly path: string;

  constructor(parent: Message, oneOf: DescOneof) {
    this.parent = parent;
    this.oneOf = oneOf;
    this.elem = elementFor(oneOf);
    this.path = fieldPath(parent.path, oneOf);
  }

  /** The selected member, or the first member when nothing is selected. */
  get desc(): DescField {
    return this.parent.value.oneofCase(this.oneOf) ?? this.oneOf.fields[0];
  }

  get errors(): Violation[] {
    return [...this.parent.store.violationsAt(this.path), ...(this.active()?.errors ?? [])];
  }

  errorMessages(): string[] {
    return [...this.parent.errorMessagesAt(this.path), ...(this.active()?.errorMessages() ?? [])];
  }

  /** All members, e.g. to offer them as choices. */
  fields(): Field[] {
    return this.oneOf.fields.map((desc) => createField(this.parent, desc));
  }

  /** The selected member, if any. */
  active(): Field | undefined {
    const desc = this.parent.value.oneofCase(this.oneOf);
    return desc ? createField(this.parent, desc) : undefined;
  }

  isSet(): boolean {
    return this.parent.value.oneofCase(this.oneOf) !== undefined;
  }

  /** Selects the member named `name` (resetting it), or unsets the group if `undefined`. */
  select(name: string | undefined) {
    const current = this.parent.value.oneofCase(this.oneOf);
    if (current?.name === name) {
      return;
    }

    if (current) {
      this.parent.value.clear(current);
    }
    if (name !== undefined) {
      const desc = this.oneOf.fields.find((field) => field.name === name);
      if (!desc) {
        throw new Error(`field "${name}" is not part of oneof "${this.oneOf.name}"`);
      }
      this.parent.value.set(desc, this.parent.value.get(desc));
    }
    this.parent.notify();
  }

  clear() {
    this.select(undefined);
  }

  toString(): string {
    return this.active()?.toString() ?? "";
  }

  parse(value: string): void {
    this.active()?.parse(value);
  }
}
