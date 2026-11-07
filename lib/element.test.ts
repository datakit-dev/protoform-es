import { ConnectionSchema } from "@buf/datakit-dev_dtkt-sdk.bufbuild_es/dtkt/core/v1/connection_pb";
import { describe, expect, test } from "vitest";

import { Element, elementFor, getFieldDescription, getScalarTypeName } from "./element";
import { ScalarType } from "@bufbuild/protobuf";
import { fixtureMessage } from "./test/fixture";

const desc = (message: "Everything" | "Hinted", name: string) => {
  const field = fixtureMessage(message).fields.find((f) => f.name === name);
  if (!field) throw new Error(`no field ${name}`);
  return field;
};

describe("Element", () => {
  test("defaults the title to the JSON name", () => {
    expect(elementFor(desc("Everything", "item_map")).title()).toBe("itemMap");
  });

  test("explicit options override title and description", () => {
    const element = elementFor(desc("Hinted", "titled"));

    expect(element.title()).toBe("Custom title");
    expect(element.description()).toBe("Helpful description");
    expect(element.documented).toBe("Helpful description");
  });

  test("describes undocumented fields by their type", () => {
    expect(getFieldDescription(desc("Everything", "name"))).toBe("string");
    expect(getFieldDescription(desc("Everything", "tags"))).toBe("list<string>");
    expect(getFieldDescription(desc("Everything", "labels"))).toBe("map<string, string>");
    expect(getFieldDescription(desc("Everything", "item_map"))).toBe("map<string, test.Item>");
    expect(getFieldDescription(desc("Everything", "color"))).toBe("test.Color");
    expect(getFieldDescription(desc("Everything", "nested"))).toBe("test.Item");
    expect(getFieldDescription(desc("Everything", "colors"))).toBe("list<test.Color>");
  });

  test("undocumented fields have no `documented` text", () => {
    expect(elementFor(desc("Everything", "name")).documented).toBe("");
  });

  test("reads hidden, required and the UI hint", () => {
    expect(elementFor(desc("Hinted", "secret")).hidden).toBe(true);
    expect(elementFor(desc("Hinted", "plain")).hidden).toBe(false);
    expect(elementFor(desc("Hinted", "must")).required).toBe(true);
    expect(elementFor(desc("Hinted", "plain")).required).toBe(false);

    expect(elementFor(desc("Hinted", "notes")).type().case).toBe("input");
    expect(elementFor(desc("Hinted", "agree")).type().case).toBe("confirm");
    expect(elementFor(desc("Hinted", "upload")).type().case).toBe("file");
    expect(elementFor(desc("Hinted", "plain")).valid).toBe(false);
    expect(elementFor(desc("Hinted", "notes")).valid).toBe(true);
  });

  test("oneofs are titled by their name", () => {
    const oneof = fixtureMessage("Everything").oneofs[0];

    expect(new Element(oneof).title()).toBe("choice");
  });

  test("elements are cached per descriptor", () => {
    const field = desc("Everything", "name");

    expect(elementFor(field)).toBe(elementFor(field));
  });

  test("works with descriptors from generated code", () => {
    const hidden = ConnectionSchema.fields.filter((f) => elementFor(f).hidden);
    const required = ConnectionSchema.fields.filter((f) => elementFor(f).required);

    expect(hidden.length).toBeGreaterThan(0);
    expect(required.length).toBeGreaterThan(0);
  });
});

describe("getScalarTypeName", () => {
  test("names every scalar type as in .proto files", () => {
    expect(getScalarTypeName(ScalarType.DOUBLE)).toBe("double");
    expect(getScalarTypeName(ScalarType.SFIXED64)).toBe("sfixed64");
    expect(getScalarTypeName(ScalarType.BYTES)).toBe("bytes");
    expect(getScalarTypeName(ScalarType.SINT32)).toBe("sint32");
  });
});
