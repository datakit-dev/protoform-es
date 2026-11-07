import { create, createFileRegistry } from "@bufbuild/protobuf";
import { FieldDescriptorProto_Type as Type, FileDescriptorProtoSchema } from "@bufbuild/protobuf/wkt";
import { describe, expect, test } from "vitest";

import { getComments } from "./comments";
import { Element, getFieldDescription, getProtoDescription } from "./element";

const loc = (path: number[], comments: { leading?: string; trailing?: string; detached?: string[] }) => ({
  path,
  span: [0, 0, 0],
  leadingComments: comments.leading,
  trailingComments: comments.trailing,
  leadingDetachedComments: comments.detached ?? [],
});

// Paths: message_type=4, enum_type=5; in a message: field=2, nested_type=3, enum_type=4, oneof_decl=8; in an enum: value=2
const registry = createFileRegistry(create(FileDescriptorProtoSchema, {
  name: "commented.proto",
  package: "c",
  syntax: "proto3",
  messageType: [{
    name: "Outer",
    field: [
      { name: "plain", number: 1, label: 1, type: Type.STRING, jsonName: "plain" },
      { name: "documented", number: 2, label: 1, type: Type.STRING, jsonName: "documented" },
      { name: "choice_a", number: 3, label: 1, type: Type.STRING, jsonName: "choiceA", oneofIndex: 0 },
    ],
    oneofDecl: [{ name: "choice" }],
    nestedType: [{ name: "Inner", field: [{ name: "x", number: 1, label: 1, type: Type.INT32, jsonName: "x" }] }],
    enumType: [{ name: "Kind", value: [{ name: "KIND_UNSPECIFIED", number: 0 }, { name: "KIND_A", number: 1 }] }],
  }],
  enumType: [{ name: "TopLevel", value: [{ name: "TOP_UNSPECIFIED", number: 0 }] }],
  sourceCodeInfo: {
    location: [
      loc([4, 0], { leading: " The outer message.\n" }),
      loc([4, 0, 2, 1], { leading: " Leading line.\n", trailing: " Trailing line.\n", detached: [" Detached.\n"] }),
      loc([4, 0, 8, 0], { leading: " Pick one.\n" }),
      loc([4, 0, 3, 0], { leading: " The nested message.\n" }),
      loc([4, 0, 3, 0, 2, 0], { leading: " The x field.\n" }),
      loc([4, 0, 4, 0], { leading: " The nested enum.\n" }),
      loc([4, 0, 4, 0, 2, 1], { leading: " Value A.\n" }),
      loc([5, 0], { leading: " A top-level enum.\n" }),
    ],
  },
}), () => undefined);

const outer = registry.getMessage("c.Outer")!;
const field = (name: string) => outer.fields.find((f) => f.name === name)!;

describe("getComments", () => {
  test("finds comments on top-level and nested messages", () => {
    expect(getComments(outer).leading).toBe(" The outer message.\n");
    expect(getComments(registry.getMessage("c.Outer.Inner")!).leading).toBe(" The nested message.\n");
  });

  test("finds leading, trailing and detached comments on fields", () => {
    expect(getComments(field("documented"))).toEqual({
      leadingDetached: [" Detached.\n"],
      leading: " Leading line.\n",
      trailing: " Trailing line.\n",
    });
  });

  test("fields of nested messages", () => {
    expect(getComments(registry.getMessage("c.Outer.Inner")!.fields[0]).leading).toBe(" The x field.\n");
  });

  test("oneofs", () => {
    expect(getComments(outer.oneofs[0]).leading).toBe(" Pick one.\n");
  });

  test("enums and enum values, nested and top-level", () => {
    expect(getComments(registry.getEnum("c.TopLevel")!).leading).toBe(" A top-level enum.\n");
    const kind = registry.getEnum("c.Outer.Kind")!;
    expect(getComments(kind).leading).toBe(" The nested enum.\n");
    expect(getComments(kind.values[1]).leading).toBe(" Value A.\n");
  });

  test("elements without comments (or files without source info) yield empty comments", () => {
    expect(getComments(field("plain"))).toEqual({ leadingDetached: [] });
    expect(getComments(registry.getEnum("c.Outer.Kind")!.values[0])).toEqual({ leadingDetached: [] });
  });
});

describe("descriptions from comments", () => {
  test("getProtoDescription joins detached, leading and trailing comments", () => {
    expect(getProtoDescription(field("documented"))).toBe("Detached. Leading line. Trailing line.");
    expect(getProtoDescription(field("documented"), true)).toBe("Detached.\nLeading line.\nTrailing line.");
  });

  test("fields use their comments, falling back to the type", () => {
    expect(getFieldDescription(field("documented"))).toContain("Leading line.");
    expect(getFieldDescription(field("plain"))).toBe("string");
  });

  test("Element exposes comments as documentation", () => {
    expect(new Element(field("documented")).documented).toContain("Leading line.");
    expect(new Element(field("plain")).documented).toBe("");
    expect(new Element(outer.oneofs[0]).documented).toBe("Pick one.");
  });
});
