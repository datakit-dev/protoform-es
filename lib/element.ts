import { create, type DescField, type DescOneof, getOption, hasOption, ScalarType } from "@bufbuild/protobuf";

import { field as fieldExt, type FieldElement, FieldElementSchema } from "@buf/datakit-dev_dtkt-sdk.bufbuild_es/dtkt/protoform/v1beta1/protoform_pb";
import { field as validateField } from "@bufbuild/protovalidate/gen/buf/validate/validate_pb.js";
import { FieldBehavior, field_behavior as fieldBehaviorExt } from "@buf/googleapis_googleapis.bufbuild_es/google/api/field_behavior_pb";
import { type Commentable, getComments } from "./comments";

export class Element {
  readonly proto: FieldElement;
  readonly valid: boolean;
  readonly hidden: boolean;
  /** Whether a `(buf.validate.field).required` rule applies. */
  readonly required: boolean;
  /** Explicit description or proto comments; empty if the field is undocumented. */
  readonly documented: string;

  constructor(desc: DescField | DescOneof) {
    if (desc.kind === "field" && hasOption(desc, fieldExt)) {
      this.proto = getOption(desc, fieldExt);
    } else {
      this.proto = create(FieldElementSchema);
    }
    this.required = desc.kind === "field" && isRequired(desc);
    this.documented = this.proto.description || getProtoDescription(desc);

    if (desc.kind === "field") {
      this.proto.title = this.proto.title ?? desc.jsonName;
      this.proto.description = this.proto.description ?? getFieldDescription(desc);
    } else {
      this.proto.title = this.proto.title ?? desc.localName;
      this.proto.description = this.proto.description ?? getProtoDescription(desc);
    }
    this.valid = !!this.proto.type.case;
    this.hidden = this.proto.hidden ?? false;
  }

  type(): FieldElement["type"] {
    return this.proto.type;
  }

  title(): string {
    return this.proto.title!;
  }

  description(): string {
    return this.proto.description!;
  }
}

const elements = new WeakMap<DescField | DescOneof, Element>();

function isRequired(desc: DescField): boolean {
  return (hasOption(desc, validateField) && getOption(desc, validateField).required) || (hasOption(desc, fieldBehaviorExt) && getOption(desc, fieldBehaviorExt).includes(FieldBehavior.REQUIRED));
}

export function isIdentifier(desc: DescField): boolean {
  return hasOption(desc, fieldBehaviorExt) && getOption(desc, fieldBehaviorExt).includes(FieldBehavior.IDENTIFIER);
}

export function isOutputOnly(desc: DescField): boolean {
  return hasOption(desc, fieldBehaviorExt) && getOption(desc, fieldBehaviorExt).includes(FieldBehavior.OUTPUT_ONLY);
}

/** Returns the (cached) Element for a descriptor; fields are re-created on every render. */
export function elementFor(desc: DescField | DescOneof): Element {
  let element = elements.get(desc);
  if (!element) {
    element = new Element(desc);
    elements.set(desc, element);
  }
  return element;
}

export function getFieldDescription(desc: DescField): string {
  let description = getProtoDescription(desc);
  if (description) {
    return description;
  }

  if (desc.fieldKind == "map") {
    let mapVal: string;
    if (desc.enum) {
      mapVal = desc.enum.typeName;
    } else if (desc.message) {
      mapVal = desc.message.typeName;
    } else {
      mapVal = getScalarTypeName(desc.scalar);
    }
    description = `map<${getScalarTypeName(desc.mapKey)}, ${mapVal}>`;
  } else if (desc.message) {
    description = desc.message.typeName;
  } else if (desc.enum) {
    description = desc.enum.typeName;
  } else {
    description = getScalarTypeName(desc.scalar);
  }

  if (desc.fieldKind == "list") {
    description = `list<${description}>`;
  }

  return description;
}


export function getProtoDescription(desc: Commentable, multiline?: boolean): string {
  const sl = getComments(desc);
  const comments = sl.leadingDetached.map((comment) => comment.trim());

  if (sl.leading) {
    comments.push(sl.leading.trim());
  }

  if (sl.trailing) {
    comments.push(sl.trailing.trim());
  }

  if (multiline) {
    return comments.join("\n");
  }

  return comments.join(" ");
}

export function getScalarTypeName(scalarType: ScalarType): string {
  switch (scalarType) {
    case ScalarType.DOUBLE:
      return "double";
    case ScalarType.FLOAT:
      return "float";
    case ScalarType.INT64:
      return "int64";
    case ScalarType.UINT64:
      return "uint64";
    case ScalarType.INT32:
      return "int32";
    case ScalarType.FIXED64:
      return "fixed64";
    case ScalarType.FIXED32:
      return "fixed32";
    case ScalarType.BOOL:
      return "bool";
    case ScalarType.STRING:
      return "string";
    case ScalarType.BYTES:
      return "bytes";
    case ScalarType.UINT32:
      return "uint32";
    case ScalarType.SFIXED32:
      return "sfixed32";
    case ScalarType.SFIXED64:
      return "sfixed64";
    case ScalarType.SINT32:
      return "sint32";
    case ScalarType.SINT64:
      return "sint64";
  }
}
