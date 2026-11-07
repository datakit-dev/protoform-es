import { describe, expect, test } from "vitest";

import type { ListField } from "./list";
import { data, findField } from "./test/helpers";
import { everything } from "./test/render";

function list(message: ReturnType<typeof everything>, name: string) {
  return findField<ListField>(message, name);
}

describe("scalar lists", () => {
  test("add, edit, move and remove", () => {
    const message = everything();

    list(message, "tags").add();
    list(message, "tags").add();
    list(message, "tags").setAt(0, "a");
    list(message, "tags").setAt(1, "b");
    expect(list(message, "tags").items()).toEqual(["a", "b"]);

    list(message, "tags").move(0, 1);
    expect(list(message, "tags").items()).toEqual(["b", "a"]);

    list(message, "tags").removeAt(0);
    expect(list(message, "tags").items()).toEqual(["a"]);
    expect(list(message, "tags").size).toBe(1);
  });

  test("move ignores out-of-range indexes", () => {
    const message = everything({ tags: ["a", "b"] });

    list(message, "tags").move(0, 5);
    list(message, "tags").move(-1, 0);
    list(message, "tags").move(1, 1);

    expect(data(message).tags).toEqual(["a", "b"]);
  });

  test("clear empties the list", () => {
    const message = everything({ tags: ["a", "b"] });

    list(message, "tags").clear();

    expect(data(message).tags).toEqual([]);
  });

  test("round-trips through toString/parse and replaces existing items", () => {
    const message = everything({ tags: ["old"] });

    list(message, "tags").parse('["x","y"]');

    expect(data(message).tags).toEqual(["x", "y"]);
    expect(list(message, "tags").toString()).toBe('["x","y"]');
  });

  test("parse rejects non-arrays", () => {
    expect(() => list(everything(), "tags").parse('{"a":1}')).toThrow(/expected array/);
  });
});

describe("enum lists", () => {
  test("add defaults to the zero value; parse accepts names and numbers", () => {
    const message = everything();

    list(message, "colors").add();
    expect(data(message).colors).toEqual([0]);

    list(message, "colors").parse('["COLOR_RED", 2]');
    expect(data(message).colors).toEqual([1, 2]);
    expect(list(message, "colors").toString()).toBe('["COLOR_RED","COLOR_GREEN"]');
  });
});

describe("message lists", () => {
  test("items are wrapped with their path and edited in place", () => {
    const message = everything();
    list(message, "items").add();
    list(message, "items").add();

    const items = list(message, "items").messages();
    items[1].fields()[0].parse("second");

    expect(items.map((i) => i.path)).toEqual(["items[0]", "items[1]"]);
    expect(data(message).items.map((i) => i.label)).toEqual(["", "second"]);
  });

  test("moving and removing keep item contents", () => {
    const message = everything({ items: [{ label: "a" }, { label: "b" }, { label: "c" }] });

    list(message, "items").move(2, 0);
    expect(data(message).items.map((i) => i.label)).toEqual(["c", "a", "b"]);

    list(message, "items").removeAt(1);
    expect(data(message).items.map((i) => i.label)).toEqual(["c", "b"]);
  });

  test("round-trips through toString/parse", () => {
    const message = everything({ items: [{ label: "a", qty: 1 }] });
    const json = list(message, "items").toString();

    list(message, "items").clear();
    list(message, "items").parse(json);

    expect(data(message).items).toMatchObject([{ label: "a", qty: 1 }]);
  });

  test("changes bubble up to subscribers of the root", () => {
    const message = everything();
    list(message, "items").add();
    const before = message.store.dataSnapshot();

    list(message, "items").messages()[0].fields()[0].parse("x");

    expect(message.store.dataSnapshot()).toBeGreaterThan(before);
  });
});
