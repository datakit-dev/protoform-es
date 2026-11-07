import { createMutableRegistry } from "@bufbuild/protobuf";
import { describe, expect, test } from "vitest";

import { Env, createDefaultValidator, defaultRegistry } from "./env";
import { fixtureRegistry } from "./test/fixture";

describe("Env", () => {
  test("defaults to the shared registry and validator", () => {
    const validator = createDefaultValidator(defaultRegistry);

    const env = new Env({ validator });

    expect(env.registry).toBe(defaultRegistry);
    expect(env.validator).toBe(validator);
    expect(env.anyTypeFilter("anything")).toBe(true);
  });

  test("builds a validator for a custom registry", () => {
    const registry = createMutableRegistry(fixtureRegistry);
    const env = new Env({ registry });

    expect(env.registry).toBe(registry);
  });

  test("uses the given type filter", () => {
    const env = new Env({ anyTypeFilter: (name) => name.startsWith("a.") });

    expect(env.anyTypeFilter("a.B")).toBe(true);
    expect(env.anyTypeFilter("b.C")).toBe(false);
  });

  test("creates the default transport lazily and only once", () => {
    const env = new Env();

    const first = env.transport;

    expect(first).toBeTruthy();
    expect(env.transport).toBe(first);
  });

  test("uses a provided transport", () => {
    const transport = { unary: () => { throw new Error("unused"); }, stream: () => { throw new Error("unused"); } };

    expect(new Env({ transport }).transport).toBe(transport);
  });
});
