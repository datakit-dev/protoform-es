const WKT = "google.protobuf.";

const TEXT_TYPES = new Set([`${WKT}Timestamp`, `${WKT}Duration`, `${WKT}FieldMask`]);
const JSON_TYPES = new Set([`${WKT}Struct`, `${WKT}Value`, `${WKT}ListValue`]);
const WRAPPER_TYPES = new Set([
  "DoubleValue", "FloatValue", "Int64Value", "UInt64Value", "Int32Value",
  "UInt32Value", "BoolValue", "StringValue", "BytesValue",
].map((name) => WKT + name));

export const ANY_TYPE_NAME = `${WKT}Any`;

/** Well-known types edited as a single value in a text box. */
export function isTextWellKnown(typeName: string): boolean {
  return TEXT_TYPES.has(typeName);
}

/** Well-known types that hold arbitrary JSON. */
export function isJsonWellKnown(typeName: string): boolean {
  return JSON_TYPES.has(typeName);
}

/**
 * Well-known types edited as a single value (a text box, JSON editor, or the
 * wrapped scalar) rather than as a nested form.
 */
export function isInlineWellKnown(typeName: string): boolean {
  return TEXT_TYPES.has(typeName) || JSON_TYPES.has(typeName) || WRAPPER_TYPES.has(typeName);
}
