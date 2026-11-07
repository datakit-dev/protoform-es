import { create, createFileRegistry, createMutableRegistry, type DescMessage, type MessageInitShape, setExtension } from "@bufbuild/protobuf";
import {
  DescriptorProtoSchema,
  FieldDescriptorProto_Label as Label,
  FieldDescriptorProto_Type as Type,
  FieldDescriptorProtoSchema,
  FieldOptionsSchema,
  FileDescriptorProtoSchema,
  file_google_protobuf_any,
  file_google_protobuf_duration,
  file_google_protobuf_field_mask,
  file_google_protobuf_struct,
  file_google_protobuf_timestamp,
  file_google_protobuf_wrappers,
} from "@bufbuild/protobuf/wkt";

import { field as fieldElement, FieldElementSchema } from "../gen/dtkt/protoform/v1beta1/protoform_pb";
import { field as fieldRules, FieldRulesSchema } from "@bufbuild/protovalidate/gen/buf/validate/validate_pb.js";

import { Env } from "../env";

type FieldInit = MessageInitShape<typeof FieldDescriptorProtoSchema>;
type FieldSpec = FieldInit & { name: string; number: number };

/** Field options carrying a protoform element and/or a protovalidate `required` rule. */
function options(element?: MessageInitShape<typeof FieldElementSchema>, required?: boolean) {
  const opts = create(FieldOptionsSchema);
  if (element) {
    setExtension(opts, fieldElement, create(FieldElementSchema, element));
  }
  if (required) {
    setExtension(opts, fieldRules, create(FieldRulesSchema, { required: true }));
  }
  return opts;
}

function field(spec: FieldSpec, type: Type, typeName?: string): FieldInit {
  return {
    label: Label.OPTIONAL,
    type,
    typeName,
    jsonName: spec.name.replace(/_(\w)/g, (_, c: string) => c.toUpperCase()),
    ...spec,
  };
}

const repeated = { label: Label.REPEATED } as const;

function entry(name: string, valueType: Type, valueTypeName?: string, keyType = Type.STRING): MessageInitShape<typeof DescriptorProtoSchema> {
  return {
    name,
    options: { mapEntry: true },
    field: [
      field({ name: "key", number: 1 }, keyType),
      field({ name: "value", number: 2 }, valueType, valueTypeName),
    ],
  };
}

const file = create(FileDescriptorProtoSchema, {
  name: "test/everything.proto",
  package: "test",
  syntax: "proto3",
  dependency: [
    "google/protobuf/any.proto",
    "google/protobuf/duration.proto",
    "google/protobuf/field_mask.proto",
    "google/protobuf/struct.proto",
    "google/protobuf/timestamp.proto",
    "google/protobuf/wrappers.proto",
  ],
  enumType: [{
    name: "Color",
    value: [
      { name: "COLOR_UNSPECIFIED", number: 0 },
      { name: "COLOR_RED", number: 1 },
      { name: "COLOR_GREEN", number: 2 },
    ],
  }, {
    name: "Level",
    value: [
      { name: "LEVEL_UNSPECIFIED", number: 0 },
      { name: "LEVEL_ONE", number: 1 },
      { name: "LEVEL_TWO", number: 2 },
      { name: "LEVEL_THREE", number: 3 },
      { name: "LEVEL_FOUR", number: 4 },
      { name: "LEVEL_FIVE", number: 5 },
    ],
  }],
  messageType: [
    {
      name: "Item",
      field: [
        field({ name: "label", number: 1 }, Type.STRING),
        field({ name: "qty", number: 2 }, Type.INT32),
      ],
    },
    {
      name: "Everything",
      nestedType: [
        entry("LabelsEntry", Type.STRING),
        entry("CountsEntry", Type.INT32),
        entry("ItemMapEntry", Type.MESSAGE, ".test.Item"),
        entry("ColorMapEntry", Type.ENUM, ".test.Color"),
        entry("ByIdEntry", Type.STRING, undefined, Type.INT32),
      ],
      oneofDecl: [{ name: "choice" }],
      field: [
        field({ name: "name", number: 1 }, Type.STRING),
        field({ name: "enabled", number: 2 }, Type.BOOL),
        field({ name: "count", number: 3 }, Type.INT32),
        field({ name: "big", number: 4 }, Type.INT64),
        field({ name: "ratio", number: 5 }, Type.DOUBLE),
        field({ name: "blob", number: 6 }, Type.BYTES),
        field({ name: "color", number: 7 }, Type.ENUM, ".test.Color"),
        field({ name: "level", number: 8 }, Type.ENUM, ".test.Level"),
        field({ name: "tags", number: 9, ...repeated }, Type.STRING),
        field({ name: "colors", number: 10, ...repeated }, Type.ENUM, ".test.Color"),
        field({ name: "items", number: 11, ...repeated }, Type.MESSAGE, ".test.Item"),
        field({ name: "labels", number: 12, ...repeated }, Type.MESSAGE, ".test.Everything.LabelsEntry"),
        field({ name: "counts", number: 13, ...repeated }, Type.MESSAGE, ".test.Everything.CountsEntry"),
        field({ name: "item_map", number: 14, ...repeated }, Type.MESSAGE, ".test.Everything.ItemMapEntry"),
        field({ name: "color_map", number: 15, ...repeated }, Type.MESSAGE, ".test.Everything.ColorMapEntry"),
        field({ name: "nested", number: 16 }, Type.MESSAGE, ".test.Item"),
        field({ name: "text", number: 17, oneofIndex: 0 }, Type.STRING),
        field({ name: "number", number: 18, oneofIndex: 0 }, Type.INT32),
        field({ name: "choice_item", number: 19, oneofIndex: 0 }, Type.MESSAGE, ".test.Item"),
        field({ name: "created", number: 20 }, Type.MESSAGE, ".google.protobuf.Timestamp"),
        field({ name: "timeout", number: 21 }, Type.MESSAGE, ".google.protobuf.Duration"),
        field({ name: "meta", number: 22 }, Type.MESSAGE, ".google.protobuf.Struct"),
        field({ name: "payload", number: 23 }, Type.MESSAGE, ".google.protobuf.Any"),
        field({ name: "wrapped", number: 24 }, Type.MESSAGE, ".google.protobuf.Int32Value"),
        field({ name: "mask", number: 25 }, Type.MESSAGE, ".google.protobuf.FieldMask"),
        field({ name: "times", number: 26, ...repeated }, Type.MESSAGE, ".google.protobuf.Timestamp"),
        field({ name: "by_id", number: 27, ...repeated }, Type.MESSAGE, ".test.Everything.ByIdEntry"),
      ],
    },
    {
      name: "Hinted",
      field: [
        field({ name: "notes", number: 1, options: options({ type: { case: "input", value: { multilineText: true } } }) }, Type.STRING),
        field({ name: "agree", number: 2, options: options({ type: { case: "confirm", value: { approve: "yes", decline: "no" } } }) }, Type.STRING),
        field({ name: "flag", number: 3, options: options({ type: { case: "confirm", value: { approve: "true", decline: "false" } } }) }, Type.BOOL),
        field({ name: "upload", number: 4, options: options({ type: { case: "file", value: { allowedTypes: [".txt"] } } }) }, Type.BYTES),
        field({ name: "secret", number: 5, options: options({ hidden: true }) }, Type.STRING),
        field({ name: "titled", number: 6, options: options({ title: "Custom title", description: "Helpful description" }) }, Type.STRING),
        field({ name: "must", number: 7, options: options(undefined, true) }, Type.STRING),
        field({ name: "picked", number: 8, options: options({ type: { case: "select", value: { methodName: "x.Y/Z", responseField: "items", labelExpr: "this" } } }) }, Type.STRING),
        field({ name: "plain", number: 9 }, Type.STRING),
      ],
    },
  ],
});

const wellKnown = [
  file_google_protobuf_any,
  file_google_protobuf_duration,
  file_google_protobuf_field_mask,
  file_google_protobuf_struct,
  file_google_protobuf_timestamp,
  file_google_protobuf_wrappers,
];

export const fixtureRegistry = createFileRegistry(
  file,
  (name) => wellKnown.find((dep) => dep.name === name.replace(/\.proto$/, "")),
);

export function fixtureMessage(name: "Everything" | "Item" | "Hinted"): DescMessage {
  const desc = fixtureRegistry.getMessage(`test.${name}`);
  if (!desc) {
    throw new Error(`fixture message not found: ${name}`);
  }
  return desc;
}

/** An environment whose registry knows the fixture types (e.g. for `Any`). */
export function fixtureEnv(): Env {
  return new Env({
    registry: createMutableRegistry(fixtureRegistry),
    anyTypeFilter: (name) => name.startsWith("test."),
  });
}
