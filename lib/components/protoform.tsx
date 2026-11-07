import { type PropsWithChildren, type SubmitEvent, useEffect, useSyncExternalStore } from "react";

import { useEnv } from "../env";
import { useKit } from "../kit/context";
import type { Message } from "../message";
import { UIProvider, type UIProviderProps } from "../providers/ui";
import type { FieldDisplayMode } from "./field";
import { FieldGroup } from "./group";

export type ProtoformProps = UIProviderProps & {
  message: Message;
  /** `view` makes the form read-only. */
  mode?: FieldDisplayMode;
  /**
   * When to show validation errors. Errors always appear (and then stay
   * current) after a submit attempt; `"change"` also validates from the
   * first edit.
   */
  validateOn?: "load" | "change" | "submit";
  /** Called on submit when the message is valid. */
  onSubmit?: (event: SubmitEvent<HTMLFormElement>) => void;
  /** Called on submit when validation fails or an input can't be parsed. */
  onInvalid?: () => void;
};

export function Protoform({ kit, renderers, resolve, messages, ...props }: PropsWithChildren<ProtoformProps>) {
  return (
    <UIProvider kit={kit} renderers={renderers} resolve={resolve} messages={messages}>
      <Root {...props} />
    </UIProvider>
  );
}

/** Errors on fields that are not rendered (hidden) would otherwise block submission silently. */
function hiddenErrors(message: Message): string[] {
  return message.fields()
    .filter((field) => field.elem.hidden)
    .flatMap((field) => field.errorMessages().map((error) => `${field.elem.title()}: ${error}`));
}

function Root({
  message,
  mode,
  validateOn = "submit",
  children,
  onSubmit,
  onInvalid,
}: PropsWithChildren<Omit<ProtoformProps, keyof UIProviderProps>>) {
  const env = useEnv();
  const kit = useKit();
  const { store } = message;

  // Re-render on every change to the message or its errors.
  useSyncExternalStore(store.subscribe, store.snapshot);
  const data = useSyncExternalStore(store.subscribe, store.dataSnapshot);

  useEffect(() => {
    if (store.submitted || validateOn === "load" || (validateOn === "change" && data > 0)) {
      message.validate(env.validator);
    }
  }, [store, message, env, validateOn, data]);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    store.markSubmitted();

    const result = message.validate(env.validator);
    if (result.kind === "valid" && !store.hasLocalErrors()) {
      onSubmit?.(event);
    } else {
      onInvalid?.();
    }
  };

  const errors = [...hiddenErrors(message), ...message.errorMessages()];

  return (
    <kit.Form onSubmit={handleSubmit}>
      {errors.length > 0 && (
        <ul data-pf="form-errors" role="alert">
          {errors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}
      <FieldGroup fields={message.fields()} mode={mode} />
      {children && <div data-pf="actions">{children}</div>}
    </kit.Form>
  );
}
