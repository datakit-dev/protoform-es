import { describe, expect, test } from "vitest";

import type { MapField } from "./map";
import { data, findField } from "./test/helpers";
import { everything } from "./test/render";

function map(message: ReturnType<typeof everything>, name: string) {
  return findField<MapField>(message, name);
}

describe("scalar maps", () => {
  test("add rejects duplicates; rename keeps order and rejects taken keys", () => {
    const message = everything();

    expect(map(message, "labels").add("a", "1")).toBe(true);
    expect(map(message, "labels").add("b", "2")).toBe(true);
    expect(map(message, "labels").add("a")).toBe(false);

    expect(map(message, "labels").rename("a", "b")).toBe(false);
    expect(map(message, "labels").rename("a", "a")).toBe(true);
    expect(map(message, "labels").rename("a", "c")).toBe(true);
    expect(map(message, "labels").entries()).toEqual([["c", "1"], ["b", "2"]]);
  });

  test("setValue, delete and clear", () => {
    const message = everything({ labels: { a: "1", b: "2" } });

    map(message, "labels").setValue("a", "changed");
    map(message, "labels").delete("b");
    expect(data(message).labels).toEqual({ a: "changed" });
    expect(map(message, "labels").size).toBe(1);

    map(message, "labels").clear();
    expect(data(message).labels).toEqual({});
  });

  test("numeric values default to zero", () => {
    const message = everything();

    map(message, "counts").add("x");

    expect(data(message).counts).toEqual({ x: 0 });
  });

  test("round-trips through toString/parse and replaces existing entries", () => {
    const message = everything({ labels: { old: "x" } });

    map(message, "labels").parse('{"a":"1","b":"2"}');

    expect(data(message).labels).toEqual({ a: "1", b: "2" });
    expect(JSON.parse(map(message, "labels").toString())).toEqual({ a: "1", b: "2" });
  });

  test("parse rejects non-objects", () => {
    expect(() => map(everything(), "labels").parse("[1]")).toThrow(/expected object/);
    expect(() => map(everything(), "labels").parse("null")).toThrow(/expected object/);
  });

  test("keys are formatted for display and parsed from text", () => {
    const field = map(everything(), "labels");

    expect(field.formatKey("a")).toBe("a");
    expect(field.parseKey("a")).toBe("a");
    expect(field.has("a")).toBe(false);
  });
});

describe("enum maps", () => {
  test("add defaults to the zero value; parse accepts enum names", () => {
    const message = everything();

    map(message, "color_map").add("a");
    map(message, "color_map").parse('{"x":"COLOR_GREEN","y":1}');

    expect(data(message).colorMap).toEqual({ x: 2, y: 1 });
    expect(JSON.parse(map(message, "color_map").toString())).toEqual({ x: "COLOR_GREEN", y: "COLOR_RED" });
  });
});

describe("message maps", () => {
  test("values are wrapped with their path and edited in place", () => {
    const message = everything();
    map(message, "item_map").add("k");

    const [[key, item]] = map(message, "item_map").messages();
    item.fields()[0].parse("value");

    expect(key).toBe("k");
    expect(item.path).toBe("item_map[k]");
    expect(data(message).itemMap.k.label).toBe("value");
  });

  test("round-trips through toString/parse", () => {
    const message = everything({ itemMap: { a: { label: "x", qty: 1 } } });
    const json = map(message, "item_map").toString();

    map(message, "item_map").clear();
    map(message, "item_map").parse(json);

    expect(data(message).itemMap).toMatchObject({ a: { label: "x", qty: 1 } });
  });
});
