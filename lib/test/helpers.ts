import type { Any } from "@bufbuild/protobuf/wkt";

import type { Field } from "../field";
import { bareKit } from "../kit/bare";
import { tailwindKit } from "../kit/tailwind";
import type { UIKit } from "../kit/types";
import type { Message } from "../message";
import { OneOfField } from "../oneof";

/** The plain-object shape of `test.Everything` as stored by protobuf-es. */
export type Data = {
  name: string;
  enabled: boolean;
  count: number;
  big: bigint;
  ratio: number;
  blob: Uint8Array;
  color: number;
  level: number;
  tags: string[];
  colors: number[];
  items: { label: string; qty: number }[];
  labels: Record<string, string>;
  counts: Record<string, number>;
  itemMap: Record<string, { label: string; qty: number }>;
  colorMap: Record<string, number>;
  byId: Record<number, string>;
  nested?: { label: string };
  choice: { case?: string; value?: unknown };
  created?: { seconds: bigint; nanos: number };
  timeout?: { seconds: bigint; nanos: number };
  meta?: unknown;
  payload?: Any;
  wrapped?: number;
  mask?: { paths: string[] };
  times: { seconds: bigint }[];
};

export const data = (message: Message) => message.get() as unknown as Data;

/** Finds a top-level field (or oneof group) by name. */
export function findField<T extends Field>(message: Message, name: string): T {
  const found = message.fields().find((f) =>
    f instanceof OneOfField ? f.oneOf.name === name : f.desc.name === name
  );
  if (!found) {
    throw new Error(`no field ${name}`);
  }
  return found as T;
}

/** Component tests run against every shipped kit. */
export const kits: [string, UIKit][] = [["bare", bareKit], ["tailwind", tailwindKit]];
