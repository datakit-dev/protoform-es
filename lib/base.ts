import { type DescField, type DescOneof } from "@bufbuild/protobuf";
import type { Violation } from "@bufbuild/protovalidate";

import { type Element, elementFor } from "./element";
import type { Field } from "./field";
import type { Message } from "./message";
import { fieldPath } from "./path";

/** Shared behavior for fields that live inside a parent `Message`. */
export abstract class BaseField<D extends DescField> implements Field {
  readonly parent: Message;
  readonly desc: D;
  readonly path: string;
  readonly elem: Element;

  constructor(parent: Message, desc: D) {
    this.parent = parent;
    this.desc = desc;
    this.path = fieldPath(parent.path, desc);
    this.elem = elementFor(desc as DescField | DescOneof);
  }

  get errors(): Violation[] {
    return this.parent.store.violationsAt(this.path);
  }

  errorMessages(): string[] {
    return this.parent.errorMessagesAt(this.path);
  }

  /** Marks the underlying message as changed so subscribed UI re-renders. */
  protected changed() {
    this.parent.notify();
  }

  abstract toString(): string;
  abstract parse(value: string): void;
}
