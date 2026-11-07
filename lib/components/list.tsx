import { useId } from "react";

import type { ListField } from "../list";
import { useKit, useMessages } from "../kit/context";
import type { Message } from "../message";
import { EnumInput } from "./enum";
import type { FieldElementProps } from "./field";
import { FieldSection } from "./group";
import { MessageValue } from "./message";
import { ScalarInput } from "./scalar";
import { isInlineWellKnown } from "../wellknown";

type ListElementProps = FieldElementProps & {
  field: ListField;
};

type RowProps = {
  field: ListField;
  index: number;
  readOnly: boolean;
};

/** Move and remove buttons for one list item. */
function ItemActions({ field, index, readOnly }: RowProps) {
  const kit = useKit();
  const messages = useMessages();

  if (readOnly) {
    return null;
  }

  const n = index + 1;
  return (
    <>
      <kit.Button variant="ghost" size="sm" aria-label={messages.moveItemUp(n)} disabled={index === 0} onClick={() => field.move(index, index - 1)}>
        ↑
      </kit.Button>
      <kit.Button variant="ghost" size="sm" aria-label={messages.moveItemDown(n)} disabled={index === field.size - 1} onClick={() => field.move(index, index + 1)}>
        ↓
      </kit.Button>
      <kit.Button variant="ghost" size="sm" aria-label={messages.removeItem(n)} onClick={() => field.removeAt(index)}>
        ✕
      </kit.Button>
    </>
  );
}

function itemPath(field: ListField, index: number): string {
  return `${field.path}[${index}]`;
}

/** A scalar or enum item as one compact row; errors appear under it. */
function ValueRow({ field, index, readOnly, value }: RowProps & { value: unknown }) {
  const kit = useKit();
  const messages = useMessages();
  const id = useId();

  const errors = field.parent.errorMessagesAt(itemPath(field, index));
  const common = {
    describedBy: errors.length > 0 ? `${id}-errors` : undefined,
    invalid: errors.length > 0,
    readOnly,
    "aria-label": messages.item(index + 1),
  };

  let control;
  switch (field.desc.listKind) {
    case "scalar":
      control = (
        <ScalarInput
          {...common}
          scalar={field.desc.scalar}
          value={value as never}
          onValue={(next) => field.setAt(index, next)}
          store={field.parent.store}
          errorPath={itemPath(field, index)}
        />
      );
      break;
    case "enum":
      control = (
        <EnumInput
          {...common}
          compact
          desc={field.desc.enum}
          value={value as number}
          onValue={(next) => field.setAt(index, next)}
        />
      );
      break;
    default:
      return null;
  }

  return (
    <kit.Row id={id} errors={errors} actions={<ItemActions field={field} index={index} readOnly={readOnly} />}>
      {control}
    </kit.Row>
  );
}

function MessageRow({ field, index, readOnly, item, depth, mode }: RowProps & { item: Message; depth: number; mode: ListElementProps["mode"] }) {
  const kit = useKit();
  const messages = useMessages();
  const id = useId();

  const actions = <ItemActions field={field} index={index} readOnly={readOnly} />;
  const title = messages.item(index + 1);
  const errors = field.parent.errorMessagesAt(itemPath(field, index));

  if (isInlineWellKnown(item.value.desc.typeName)) {
    return (
      <kit.Row id={id} errors={errors} actions={actions}>
        <MessageValue
          message={item}
          mode={mode}
          aria-label={title}
          describedBy={errors.length > 0 ? `${id}-errors` : undefined}
          invalid={errors.length > 0}
        />
      </kit.Row>
    );
  }

  return (
    <kit.Section id={id} title={title} errors={errors} depth={depth} actions={actions} collapsible>
      <MessageValue message={item} mode={mode} depth={depth + 1} />
    </kit.Section>
  );
}

export function ListElement({ field, mode, depth = 0, id }: ListElementProps) {
  const kit = useKit();
  const messages = useMessages();
  const readOnly = mode === "view";

  let rows;
  if (field.desc.listKind === "message") {
    rows = field.messages().map((item, index) => (
      <MessageRow
        key={index}
        field={field}
        index={index}
        readOnly={readOnly}
        item={item}
        depth={depth + 1}
        mode={mode}
      />
    ));
  } else {
    rows = field.items().map((value, index) => (
      <ValueRow key={index} field={field} index={index} readOnly={readOnly} value={value} />
    ));
  }

  const add = readOnly ? undefined : (
    <kit.Button variant="secondary" size="sm" aria-label={`${messages.addItem}: ${field.elem.title()}`} onClick={() => field.add()}>
      {messages.addItem}
    </kit.Button>
  );

  return (
    <FieldSection field={field} id={id} depth={depth} actions={add}>
      {rows.length === 0
        ? <p data-pf="empty">{messages.noItems}</p>
        : <kit.Stack>{rows}</kit.Stack>}
    </FieldSection>
  );
}
