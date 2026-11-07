import { describe, expect, test } from "vitest";

import type { EnumField } from "./enum";
import { allEnumValues, enumLabel, formatEnum, parseEnum } from "./enum";
import { fixtureRegistry } from "./test/fixture";
import { data, findField } from "./test/helpers";
import { everything } from "./test/render";

const color = fixtureRegistry.getEnum("test.Color")!;
const level = fixtureRegistry.getEnum("test.Level")!;

describe("EnumField", () => {
  test("parses by name or number and formats by name", () => {
    const message = everything();
    const field = () => findField<EnumField>(message, "color");

    field().parse("COLOR_GREEN");
    expect(field().get()).toBe(2);
    expect(field().toString()).toBe("COLOR_GREEN");

    field().parse(" 1 ");
    expect(field().toString()).toBe("COLOR_RED");
    expect(() => field().parse("NOPE")).toThrow(/unknown value/);
  });

  test("unknown numbers format as the number", () => {
    const message = everything({ color: 99 });

    expect(findField<EnumField>(message, "color").toString()).toBe("99");
  });

  test("set updates the message", () => {
    const message = everything();

    findField<EnumField>(message, "level").set(3);

    expect(data(message).level).toBe(3);
  });
});

describe("enum helpers", () => {
  test("parseEnum finds values by name", () => {
    expect(parseEnum(color, "COLOR_RED")).toBe(1);
    expect(parseEnum(color, "nope")).toBeUndefined();
  });

  test("formatEnum optionally trims the conventional prefix", () => {
    expect(formatEnum(color, 1)).toBe("COLOR_RED");
    expect(formatEnum(color, 1, true)).toBe("RED");
    expect(formatEnum(color, 99 as never)).toBe("99");
  });

  test("enumLabel makes readable labels", () => {
    expect(enumLabel(level, 0)).toBe("Unspecified");
    expect(enumLabel(level, 3)).toBe("Three");
  });

  test("allEnumValues skips the zero value", () => {
    expect(allEnumValues(color)).toEqual([1, 2]);
  });
});
