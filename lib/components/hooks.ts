import { useState, useSyncExternalStore } from "react";

import type { Message } from "../message";

/**
 * Subscribes to a message tree. Components that edit a `Message` re-render
 * whenever its data or errors change. `Protoform` does this for you.
 */
export function useMessage(message: Message): Message {
  useSyncExternalStore(message.store.subscribe, message.store.snapshot);
  return message;
}

/**
 * Keeps what the user typed while it is not yet (or no longer exactly) the
 * canonical text of the value, so typing "1." or "-" isn't clobbered.
 *
 * `normalize` maps typed text to its canonical form, or `undefined` if the
 * text is invalid.
 */
export function useDraft(canonical: string, normalize: (text: string) => string | undefined) {
  const [draft, setDraft] = useState<{ text: string; base: string } | undefined>();

  let text = canonical;
  if (draft) {
    const normalized = normalize(draft.text);
    const stillCurrent = normalized === undefined ? draft.base === canonical : normalized === canonical;
    if (stillCurrent) {
      text = draft.text;
    }
  }

  return {
    text,
    setText: (next: string) => setDraft({ text: next, base: canonical }),
    reset: () => setDraft(undefined),
  };
}
