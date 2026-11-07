import { useKit, useMessages } from "../kit/context";
import { Message, type MessageField } from "../message";
import type { FieldDisplayMode, FieldElementProps } from "./field";
import { FieldGroup, FieldSection } from "./group";
import { AnyEditor, WellKnownEditor } from "./wkt";
import { ANY_TYPE_NAME, isInlineWellKnown } from "../wellknown";

export type MessageValueProps = {
  message: Message;
  mode?: FieldDisplayMode;
  depth?: number;
  id?: string;
  describedBy?: string;
  invalid?: boolean;
  "aria-label"?: string;
};

/** The editor for the contents of a message (a form, or a specialised well-known type editor). */
export function MessageValue({ message, mode, depth = 0, ...control }: MessageValueProps) {
  const typeName = message.value.desc.typeName;

  if (isInlineWellKnown(typeName)) {
    return <WellKnownEditor message={message} mode={mode} {...control} />;
  }
  if (typeName === ANY_TYPE_NAME) {
    return <AnyEditor message={message} mode={mode} depth={depth} />;
  }
  return <FieldGroup fields={message.fields()} mode={mode} depth={depth} />;
}

export type MessageElementProps = FieldElementProps & {
  field: MessageField;
};

export function MessageElement({ field, mode, depth = 0, id, describedBy, invalid }: MessageElementProps) {
  const kit = useKit();
  const messages = useMessages();

  if (isInlineWellKnown(field.value.desc.typeName)) {
    return <MessageValue message={field} mode={mode} id={id} describedBy={describedBy} invalid={invalid} />;
  }

  const isSet = field.isSet();
  const title = field.elem.title();

  let actions;
  if (mode !== "view") {
    actions = isSet ? (
      <kit.Button variant="ghost" size="sm" aria-label={`${messages.clear} ${title}`} onClick={() => field.clear()}>
        {messages.clear}
      </kit.Button>
    ) : (
      <kit.Button variant="secondary" size="sm" aria-label={`${messages.edit} ${title}`} onClick={() => field.ensure()}>
        {messages.edit}
      </kit.Button>
    );
  }

  return (
    <FieldSection field={field} id={id} depth={depth} actions={actions} collapsible={isSet && depth > 0}>
      {isSet
        ? <MessageValue message={field} mode={mode} depth={depth + 1} />
        : <p data-pf="empty">{messages.notSet}</p>}
    </FieldSection>
  );
}
