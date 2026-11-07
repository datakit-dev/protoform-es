import { describe, expect, test } from "vitest";

import { fieldPath, indexPath, keyPath, pathToString } from "./path";
import { fixtureMessage } from "./test/fixture";

describe("path helpers", () => {
  test("join field names, indexes and keys", () => {
    expect(fieldPath("", { name: "a" })).toBe("a");
    expect(fieldPath("a", { name: "b" })).toBe("a.b");
    expect(indexPath("items", 2)).toBe("items[2]");
    expect(keyPath("labels", "env")).toBe("labels[env]");
    expect(keyPath("counts", 7n)).toBe("counts[7]");
    expect(keyPath("flags", true)).toBe("flags[true]");
  });

  test("pathToString matches the notation used by fields", () => {
    const desc = fixtureMessage("Everything");
    const items = desc.fields.find((f) => f.name === "items")!;
    const labels = desc.fields.find((f) => f.name === "labels")!;
    const label = fixtureMessage("Item").fields.find((f) => f.name === "label")!;

    expect(pathToString([items, { kind: "list_sub", index: 1 }, label])).toBe("items[1].label");
    expect(pathToString([labels, { kind: "map_sub", key: "env" }])).toBe("labels[env]");
    expect(pathToString([desc.oneofs[0]])).toBe("choice");
    expect(pathToString([])).toBe("");
  });
});
