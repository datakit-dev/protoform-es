import { type ComponentType, createContext, useContext } from "react";

import type { FieldElementProps } from "../components/field";
import type { Field } from "../field";
import { OneOfField } from "../oneof";
import { bareKit } from "./bare";
import type { UIKit } from "./types";

export const defaultMessages = {
  edit: "Edit",
  clear: "Clear",
  addItem: "Add item",
  addEntry: "Add",
  key: "Key",
  value: "Value",
  noItems: "No items",
  notSet: "Not set",
  select: "Select…",
  selectType: "Select type…",
  selectCase: "None",
  now: "Now",
  duplicateKey: "Key already exists",
  item: (n: number) => `Item ${n}`,
  entry: (key: string) => key,
  entryKey: (key: string) => `Key ${key}`,
  entryValue: (key: string) => `Value for ${key}`,
  removeItem: (n: number) => `Remove item ${n}`,
  moveItemUp: (n: number) => `Move item ${n} up`,
  moveItemDown: (n: number) => `Move item ${n} down`,
  removeEntry: (key: string) => `Remove entry ${key}`,
};

/** Strings used by the built-in components; override any of them for i18n. */
export type UIMessages = typeof defaultMessages;

/** Renders a field. Receives the same props as the built-in element. */
export type FieldRenderer = ComponentType<FieldElementProps> & {
  /**
   * `"field"` (default) wraps the renderer in a labelled field frame;
   * `"none"` lets it draw its own frame (see `FieldSection`).
   */
  frame?: "field" | "none";
};

/**
 * Custom renderers keyed by field full name (`pkg.Message.field`) or by the
 * type name of the field's message/enum (`google.protobuf.Timestamp`).
 */
export type Renderers = Record<string, FieldRenderer>;

export type UIContextValue = {
  kit: UIKit;
  renderers: Renderers;
  /** Called first; return a renderer to take over a field, or undefined to continue. */
  resolve?: (field: Field) => FieldRenderer | undefined;
  messages: UIMessages;
};

export const UIContext = createContext<UIContextValue>({
  kit: bareKit,
  renderers: {},
  messages: defaultMessages,
});

export function useUI(): UIContextValue {
  return useContext(UIContext);
}

export function useKit(): UIKit {
  return useContext(UIContext).kit;
}

export function useMessages(): UIMessages {
  return useContext(UIContext).messages;
}

export function resolveRenderer(ui: UIContextValue, field: Field): FieldRenderer | undefined {
  const custom = ui.resolve?.(field);
  if (custom) {
    return custom;
  }

  const keys: string[] = [];
  if (field instanceof OneOfField) {
    keys.push(`${field.parent.value.desc.typeName}.${field.oneOf.name}`);
  } else {
    const { desc } = field;
    keys.push(`${desc.parent.typeName}.${desc.name}`);
    if (desc.message) {
      keys.push(desc.message.typeName);
    } else if (desc.enum) {
      keys.push(desc.enum.typeName);
    }
  }

  for (const key of keys) {
    if (ui.renderers[key]) {
      return ui.renderers[key];
    }
  }
  return undefined;
}

/** Combines kits over the bare kit; later kits win. */
export function defineKit(...kits: Partial<UIKit>[]): UIKit {
  return Object.assign({}, bareKit, ...kits) as UIKit;
}
