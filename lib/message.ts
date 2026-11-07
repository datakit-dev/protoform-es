import { create, type DescField, type DescMessage, type Message as ProtoMessage, type MessageInitShape, fromJson, type JsonValue, type MessageValidType, toJsonString, equals, merge } from "@bufbuild/protobuf";
import { reflect, type ReflectMessage } from "@bufbuild/protobuf/reflect";
import { type ValidationResult, type Validator, type Violation } from "@bufbuild/protovalidate";

import { type Element, elementFor } from "./element";
import { type Field, createField } from "./field";
import { defaultValidator } from "./env";
import { OneOfField } from "./oneof";
import { fieldPath } from "./path";
import { FormStore } from "./store";

export type MessageOptions = {
  /** The message that contains this one; changes and validation bubble up to it. */
  owner?: Message;
  /** Location of this message inside the root message, e.g. `items[0]`. */
  path?: string;
  /** Called after this message changes (before the owner is notified). */
  onChange?: () => void;
  store?: FormStore;
};

export class Message {
  readonly value: ReflectMessage;
  readonly path: string;
  readonly store: FormStore;
  protected readonly owner?: Message;
  private readonly onChange?: () => void;

  constructor(desc: DescMessage, init?: MessageInitShape<DescMessage>, options: MessageOptions = {}) {
    this.value = reflect(desc, create(desc, init));
    this.owner = options.owner;
    this.path = options.path ?? "";
    this.onChange = options.onChange;
    this.store = options.owner?.store ?? options.store ?? new FormStore();
  }

  /** Fields in declaration order; each oneof group is a single `OneOfField`. */
  fields(): Field[] {
    return this.value.desc.members.map((member) =>
      member.kind === "oneof" ? new OneOfField(this, member) : createField(this, member)
    );
  }

  fieldPath(desc: Pick<DescField, "name">): string {
    return fieldPath(this.path, desc);
  }

  /** Violations reported for this message as a whole. */
  get errors(): Violation[] {
    return this.store.violationsAt(this.path);
  }

  errorMessages(): string[] {
    return this.errorMessagesAt(this.path);
  }

  errorMessagesAt(path: string): string[] {
    const messages: string[] = [];
    const local = this.store.localError(path);
    if (local) {
      messages.push(local);
    }
    for (const violation of this.store.violationsAt(path)) {
      messages.push(violation.message);
    }
    return messages;
  }

  /**
   * Validates the whole message tree (delegating to the root message) and
   * records the violations so fields can display them.
   */
  validate(validator?: Validator): ValidationResult<MessageValidType<DescMessage>, ProtoMessage> {
    if (this.owner) {
      return this.owner.validate(validator);
    }

    validator = validator ?? defaultValidator;
    const result = validator.validate(this.value.desc, this.value.message);
    this.store.setViolations(result.kind === "invalid" ? result.violations : []);
    this.store.setLocalError("", result.kind === "error" ? String(result.error) : undefined);
    return result;
  }

  get(): ProtoMessage {
    return this.value.message;
  }

  /** Replaces the contents of this message with `value`. */
  set(value: ProtoMessage) {
    if (equals(this.value.desc, this.value.message, value)) {
      return;
    }
    this.reset();
    merge(this.value.desc, this.value.message, value);
    this.notify();
  }

  /** Resets every field to its zero value. */
  clear() {
    this.reset();
    this.notify();
  }

  /** Signals that this message changed; subscribed UI re-renders. */
  notify() {
    this.attach();
    this.onChange?.();
    if (this.owner) {
      this.owner.notify();
    } else {
      this.store.dataChanged();
    }
  }

  protected attach() { }

  protected reset() {
    for (const field of this.value.desc.fields) {
      this.value.clear(field);
    }
  }
};

export type MessageFieldDesc = Extract<DescField, { fieldKind: "message" }>;

export class MessageField extends Message implements Field {
  readonly parent: Message;
  readonly desc: MessageFieldDesc;
  readonly elem: Element;

  constructor(parent: Message, desc: MessageFieldDesc) {
    super(desc.message, parent.value.get(desc).message, {
      owner: parent,
      path: fieldPath(parent.path, desc),
    });

    this.parent = parent;
    this.desc = desc;
    this.elem = elementFor(desc);
  }

  isSet(): boolean {
    return this.parent.value.isSet(this.desc);
  }

  /** Marks the field as present, creating an empty message if it was unset. */
  ensure() {
    if (!this.isSet()) {
      this.notify();
    }
  }

  /** Unsets the field. */
  override clear() {
    this.reset();
    this.parent.value.clear(this.desc);
    this.parent.notify();
  }

  toString(): string {
    return toJsonString(this.value.desc, this.get());
  }

  parse(value: string): void {
    this.set(fromJson(this.value.desc, JSON.parse(value) as JsonValue));
  }

  protected override attach() {
    if (!this.parent.value.isSet(this.desc)) {
      this.parent.value.set(this.desc, this.value);
    }
  }
}
