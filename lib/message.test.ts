import { create } from "@bufbuild/protobuf";
import { TimestampSchema } from "@bufbuild/protobuf/wkt";
import { ConnectionSchema } from "@buf/datakit-dev_dtkt-sdk.bufbuild_es/dtkt/core/v1/connection_pb";
import { describe, expect, test, vi } from "vitest";

import { Message, MessageField } from "./message";
import { pathToString } from "./path";
import type { ScalarField } from "./scalar";
import { data, findField } from "./test/helpers";
import { everything } from "./test/render";

describe("store", () => {
  test("edits bump the revision and notify subscribers", () => {
    const message = everything();
    const listener = vi.fn();
    message.store.subscribe(listener);
    const before = message.store.snapshot();

    findField<ScalarField>(message, "name").set("hello");

    expect(message.store.snapshot()).toBeGreaterThan(before);
    expect(listener).toHaveBeenCalled();
    expect(findField<ScalarField>(message, "name").get()).toBe("hello");
  });

  test("unsubscribed listeners are not called", () => {
    const message = everything();
    const listener = vi.fn();
    const unsubscribe = message.store.subscribe(listener);
    unsubscribe();

    findField<ScalarField>(message, "name").set("x");

    expect(listener).not.toHaveBeenCalled();
  });

  test("data and error revisions are tracked separately", () => {
    const message = everything();
    const data = message.store.dataSnapshot();

    message.store.setLocalError("name", "bad");

    expect(message.store.dataSnapshot()).toBe(data);
    expect(message.store.localError("name")).toBe("bad");
    expect(message.store.hasLocalErrors()).toBe(true);

    message.store.setLocalError("name", undefined);
    expect(message.store.hasLocalErrors()).toBe(false);
  });
});

describe("message fields", () => {
  test("a nested message attaches to its parent on first edit and detaches on clear", () => {
    const message = everything();
    const nested = findField<MessageField>(message, "nested");
    expect(nested.isSet()).toBe(false);

    nested.ensure();
    expect(findField<MessageField>(message, "nested").isSet()).toBe(true);

    findField<MessageField>(message, "nested").fields()[0].parse("widget");
    expect(data(message).nested?.label).toBe("widget");

    findField<MessageField>(message, "nested").clear();
    expect(findField<MessageField>(message, "nested").isSet()).toBe(false);
    expect(data(message).nested).toBeUndefined();
  });

  test("editing a field of an unset nested message attaches it", () => {
    const message = everything();

    findField<MessageField>(message, "nested").fields()[0].parse("implicit");

    expect(data(message).nested?.label).toBe("implicit");
  });

  test("set replaces rather than merges", () => {
    const message = everything();
    const created = findField<MessageField>(message, "created");

    created.set(create(TimestampSchema, { seconds: 100n, nanos: 5 }));
    created.set(create(TimestampSchema, { seconds: 200n }));

    expect(data(message).created).toMatchObject({ seconds: 200n, nanos: 0 });
  });

  test("clear resets every field", () => {
    const message = everything({ name: "x", count: 3, tags: ["a"] });

    message.clear();

    expect(data(message)).toMatchObject({ name: "", count: 0, tags: [] });
  });

  test("round-trips through toString/parse as JSON", () => {
    const message = everything({ nested: { label: "a", qty: 2 } });
    const nested = findField<MessageField>(message, "nested");

    expect(JSON.parse(nested.toString())).toEqual({ label: "a", qty: 2 });

    nested.parse('{"label":"b"}');
    expect(data(message).nested).toMatchObject({ label: "b", qty: 0 });
  });

  test("fields() lists each oneof once, in declaration order", () => {
    const names = everything().fields().map((f) => f.path);

    expect(names.indexOf("choice")).toBeGreaterThan(names.indexOf("nested"));
    expect(names).not.toContain("text");
  });
});

describe("validation", () => {
  const invalid = () => new Message(ConnectionSchema, { uid: "", name: "test-connection" });

  test("violations are mapped to field paths", () => {
    const message = invalid();

    expect(message.validate().kind).toBe("invalid");
    expect(message.store.violations.length).toBeGreaterThan(0);

    for (const violation of message.store.violations) {
      expect(message.errorMessagesAt(pathToString(violation.field))).toContain(violation.message);
    }
  });

  test("errors surface on the field that owns them", () => {
    const message = invalid();
    message.validate();

    expect(message.fields().some((f) => f.errorMessages().length > 0)).toBe(true);
  });

  test("validating a nested message validates the whole tree", () => {
    const message = everything();
    const nested = findField<MessageField>(message, "nested");

    expect(nested.validate().kind).toBe("valid");
    expect(message.store.violations).toEqual([]);
  });

  test("a valid message clears earlier violations", () => {
    const message = invalid();
    message.validate();
    expect(message.store.violations.length).toBeGreaterThan(0);

    const valid = everything();
    valid.store.setViolations(message.store.violations);
    valid.validate();

    expect(valid.store.violations).toEqual([]);
  });
});
