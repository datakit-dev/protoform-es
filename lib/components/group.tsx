import { type PropsWithChildren, type ReactNode, useId } from "react";

import type { Field } from "../field";
import { resolveRenderer, useKit, useUI } from "../kit/context";
import { FieldElement, type FieldDisplayMode } from "./field";
import { frameOf } from "./frame";

export type FieldGroupProps = {
  fields: Field[];
  mode?: FieldDisplayMode;
  depth?: number;
};

export function FieldGroup({
  fields,
  mode,
  depth = 0,
}: FieldGroupProps) {
  const kit = useKit();

  return (
    <kit.Stack>
      {fields
        .filter((field) => !field.elem.hidden)
        .map((field) => (
          <FieldRow key={field.path} field={field} mode={mode} depth={depth} />
        ))}
    </kit.Stack>
  );
}

export type FieldRowProps = {
  field: Field;
  mode?: FieldDisplayMode;
  depth?: number;
};

/** Renders one field with its label, description and errors. */
export function FieldRow({ field, mode, depth = 0 }: FieldRowProps) {
  const ui = useUI();
  const { kit } = ui;
  const id = useId();

  const renderer = resolveRenderer(ui, field);
  const framed = renderer ? (renderer.frame ?? "field") === "field" : frameOf(field) === "field";

  if (!framed) {
    return <FieldElement field={field} mode={mode} depth={depth} id={id} />;
  }

  const errors = field.errorMessages();
  const description = field.elem.documented;
  const describedBy = [
    description ? `${id}-description` : undefined,
    errors.length > 0 ? `${id}-errors` : undefined,
  ].filter(Boolean).join(" ") || undefined;

  return (
    <kit.Field
      id={id}
      label={field.elem.title()}
      description={description || undefined}
      errors={errors}
      required={field.elem.required}
    >
      <FieldElement
        field={field}
        mode={mode}
        depth={depth}
        id={id}
        describedBy={describedBy}
        invalid={errors.length > 0}
      />
    </kit.Field>
  );
}

export type FieldSectionProps = PropsWithChildren<{
  field: Field;
  depth?: number;
  id?: string;
  actions?: ReactNode;
  collapsible?: boolean;
}>;

/** Frames the body of a composite field (message, list, map, oneof) with its title and errors. */
export function FieldSection({ field, depth = 0, id, actions, collapsible, children }: FieldSectionProps) {
  const kit = useKit();
  const generatedId = useId();

  return (
    <kit.Section
      id={id ?? generatedId}
      title={field.elem.title()}
      description={field.elem.documented || undefined}
      errors={field.errorMessages()}
      depth={depth}
      actions={actions}
      collapsible={collapsible}
    >
      {children}
    </kit.Section>
  );
}
