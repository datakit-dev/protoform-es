import { type DescField } from "@bufbuild/protobuf";
import { type Violation } from "@bufbuild/protovalidate";

import { type Element } from "./element";
import { MessageField, type Message } from "./message";
import { EnumField } from "./enum";
import { ListField } from "./list";
import { MapField } from "./map";
import { ScalarField } from "./scalar";

export interface Field {
  readonly parent: Message;
  readonly desc: DescField;
  readonly elem: Element;
  /** Location of the field in the message, e.g. `items[0].name`. */
  readonly path: string;
  readonly errors: Violation[];
  /** Validation violations plus local input errors (e.g. unparsable numbers). */
  errorMessages(): string[];
  toString(): string;
  parse(value: string): void;
};

export function createField(parent: Message, desc: DescField): Field {
  switch (desc.fieldKind) {
    case "list":
      return new ListField(parent, desc);
    case "map":
      return new MapField(parent, desc);
    case "message":
      return new MessageField(parent, desc);
    case "scalar":
      return new ScalarField(parent, desc);
    case "enum":
      return new EnumField(parent, desc);
  }
}
