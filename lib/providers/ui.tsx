import { type PropsWithChildren, useMemo } from "react";

import { UIContext, type UIContextValue, useUI } from "../kit/context";
import type { UIKit } from "../kit/types";

export type UIProviderProps = Partial<Omit<UIContextValue, "kit" | "messages">> & {
  /** Primitives to render with. Missing ones fall back to the enclosing provider or the bare kit. */
  kit?: Partial<UIKit>;
  messages?: Partial<UIContextValue["messages"]>;
};

/**
 * Chooses the UI used by every `Protoform` below it. Providers nest: inner
 * providers override outer ones per primitive.
 */
export function UIProvider({ kit, renderers, resolve, messages, children }: PropsWithChildren<UIProviderProps>) {
  const parent = useUI();

  const value = useMemo<UIContextValue>(() => ({
    kit: { ...parent.kit, ...kit },
    renderers: { ...parent.renderers, ...renderers },
    resolve: resolve ?? parent.resolve,
    messages: { ...parent.messages, ...messages },
  }), [parent, kit, renderers, resolve, messages]);

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}
