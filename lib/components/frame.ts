import type { Field } from "../field";
import { ListField } from "../list";
import { MapField } from "../map";
import { MessageField } from "../message";
import { OneOfField } from "../oneof";
import { isInlineWellKnown } from "../wellknown";

/**
 * Whether a field is rendered inside a labelled `Field` frame (single
 * controls) or draws its own `Section` (lists, maps, messages, oneofs).
 */
export function frameOf(field: Field): "field" | "section" {
  if (field instanceof OneOfField || field instanceof ListField || field instanceof MapField) {
    return "section";
  }
  if (field instanceof MessageField) {
    return isInlineWellKnown(field.value.desc.typeName) ? "field" : "section";
  }
  return "field";
}
