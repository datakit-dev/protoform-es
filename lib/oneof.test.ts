import { describe, expect, test } from "vitest";

import { OneOfField } from "./oneof";
import { data, findField } from "./test/helpers";
import { everything } from "./test/render";

function choice(message: ReturnType<typeof everything>) {
  return findField<OneOfField>(message, "choice");
}

describe("oneof fields", () => {
  test("starts unset and falls back to the first member for display", () => {
    const field = choice(everything());

    expect(field.isSet()).toBe(false);
    expect(field.active()).toBeUndefined();
    expect(field.desc.name).toBe("text");
    expect(field.toString()).toBe("");
  });

  test("selecting a case clears the previous one", () => {
    const message = everything();

    choice(message).select("text");
    choice(message).active()!.parse("hi");
    expect(data(message).choice).toEqual({ case: "text", value: "hi" });

    choice(message).select("number");
    expect(data(message).choice.case).toBe("number");
    expect(choice(message).active()!.desc.name).toBe("number");

    choice(message).clear();
    expect(choice(message).isSet()).toBe(false);
  });

  test("reselecting the active case keeps its value", () => {
    const message = everything();
    choice(message).select("text");
    choice(message).active()!.parse("keep");

    choice(message).select("text");

    expect(data(message).choice.value).toBe("keep");
  });

  test("a message member can be selected and edited", () => {
    const message = everything();

    choice(message).select("choice_item");
    const active = choice(message).active()!;
    expect(active.desc.name).toBe("choice_item");
    (active as unknown as { fields(): { parse(v: string): void }[] }).fields()[0].parse("inner");

    expect(data(message).choice.case).toBe("choiceItem");
    expect(data(message).choice.value).toMatchObject({ label: "inner" });
  });

  test("selecting an unknown member throws", () => {
    expect(() => choice(everything()).select("nope")).toThrow(/not part of oneof/);
  });

  test("lists every member and delegates toString/parse to the active one", () => {
    const message = everything();
    choice(message).select("number");

    choice(message).parse("7");

    expect(choice(message).fields().map((f) => f.desc.name)).toEqual(["text", "number", "choice_item"]);
    expect(choice(message).toString()).toBe("7");
  });

  test("errors are reported at the oneof path and on the active member", () => {
    const message = everything();
    choice(message).select("number");

    const desc = message.value.desc;
    message.store.setViolations([
      { message: "group", field: [desc.oneofs[0]] },
      { message: "member", field: [desc.fields.find((f) => f.name === "number")!] },
    ] as never);

    const messages = choice(message).errorMessages();
    expect(messages).toContain("group");
    expect(messages).toContain("member");
    expect(choice(message).errors).toHaveLength(2);
  });
});
