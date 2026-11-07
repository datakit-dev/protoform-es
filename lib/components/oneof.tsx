import { useId } from "react";

import { elementFor } from "../element";
import { useKit, useMessages } from "../kit/context";
import type { OneOfField } from "../oneof";
import type { FieldElementProps } from "./field";
import { FieldRow, FieldSection } from "./group";

type OneOfFieldElementProps = FieldElementProps & {
  field: OneOfField;
};

/** A case picker plus the editor for the selected member. */
export function OneOfFieldElement({ field, mode, depth = 0, id }: OneOfFieldElementProps) {
  const kit = useKit();
  const messages = useMessages();
  const selectId = useId();

  const active = field.active();
  const options = [
    { value: "", label: messages.selectCase },
    ...field.oneOf.fields.map((desc) => ({
      value: desc.name,
      label: elementFor(desc).title(),
    })),
  ];

  return (
    <FieldSection field={field} id={id} depth={depth}>
      <kit.Stack>
        <kit.Select
          id={selectId}
          aria-label={field.elem.title()}
          value={active?.desc.name ?? ""}
          options={options}
          readOnly={mode === "view"}
          onChange={(name) => field.select(name || undefined)}
        />
        {active && <FieldRow key={active.path} field={active} mode={mode} depth={depth + 1} />}
      </kit.Stack>
    </FieldSection>
  );
}
