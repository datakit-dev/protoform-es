import { type DescField, ScalarType } from "@bufbuild/protobuf";
import { base64Decode, base64Encode } from "@bufbuild/protobuf/wire";
import { type ScalarValue } from "@bufbuild/protobuf/reflect";

import { BaseField } from "./base";

export type ScalarFieldDesc = Extract<DescField, { fieldKind: "scalar" }>;

export class ScalarField extends BaseField<ScalarFieldDesc> {
  get(): ScalarValue {
    return this.parent.value.get(this.desc);
  }

  set(value: ScalarValue) {
    this.parent.value.set(this.desc, value);
    this.changed();
  }

  parse(str: string) {
    this.set(parseScalar(this.desc.scalar, str));
  }

  toString(): string {
    return formatScalar(this.desc.scalar, this.get());
  }
}

export type ParseResult =
  | { ok: true; value: ScalarValue }
  | { ok: false; error: string };

const FLOAT32_MAX = 3.4028234663852886e38;

const INT_RANGES: Partial<Record<ScalarType, readonly [bigint, bigint]>> = {
  [ScalarType.INT32]: [-(2n ** 31n), 2n ** 31n - 1n],
  [ScalarType.SINT32]: [-(2n ** 31n), 2n ** 31n - 1n],
  [ScalarType.SFIXED32]: [-(2n ** 31n), 2n ** 31n - 1n],
  [ScalarType.UINT32]: [0n, 2n ** 32n - 1n],
  [ScalarType.FIXED32]: [0n, 2n ** 32n - 1n],
  [ScalarType.INT64]: [-(2n ** 63n), 2n ** 63n - 1n],
  [ScalarType.SINT64]: [-(2n ** 63n), 2n ** 63n - 1n],
  [ScalarType.SFIXED64]: [-(2n ** 63n), 2n ** 63n - 1n],
  [ScalarType.UINT64]: [0n, 2n ** 64n - 1n],
  [ScalarType.FIXED64]: [0n, 2n ** 64n - 1n],
};

const FLOAT_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;
const INT_PATTERN = /^[+-]?\d+$/;

export function isIntegerScalar(scalar: ScalarType): boolean {
  return scalar in INT_RANGES;
}

export function isNumericScalar(scalar: ScalarType): boolean {
  return isIntegerScalar(scalar) || scalar === ScalarType.FLOAT || scalar === ScalarType.DOUBLE;
}

/**
 * Parses user input into a value for the given scalar type. Empty input
 * yields the zero value. 32-bit integers become numbers, 64-bit integers
 * become bigints (as expected by the reflection API).
 */
export function tryParseScalar(scalar: ScalarType, input: string): ParseResult {
  const str = input.trim();

  switch (scalar) {
    case ScalarType.STRING:
      return { ok: true, value: input };
    case ScalarType.BOOL: {
      const lower = str.toLowerCase();
      if (lower === "" || lower === "false" || lower === "0") return { ok: true, value: false };
      if (lower === "true" || lower === "1") return { ok: true, value: true };
      return { ok: false, error: "Enter true or false" };
    }
    case ScalarType.BYTES: {
      if (str === "") return { ok: true, value: new Uint8Array() };
      try {
        return { ok: true, value: base64Decode(str) };
      } catch {
        return { ok: false, error: "Enter valid base64" };
      }
    }
    case ScalarType.DOUBLE:
    case ScalarType.FLOAT: {
      if (str === "") return { ok: true, value: 0 };
      const special = parseSpecialFloat(str);
      if (special !== undefined) return { ok: true, value: special };
      if (!FLOAT_PATTERN.test(str)) return { ok: false, error: "Enter a number" };
      const num = Number(str);
      if (!Number.isFinite(num) || (scalar === ScalarType.FLOAT && Math.abs(num) > FLOAT32_MAX)) {
        return { ok: false, error: "Number is out of range" };
      }
      return { ok: true, value: num };
    }
    default: {
      const range = INT_RANGES[scalar];
      if (!range) return { ok: false, error: "Unsupported type" };
      if (str === "") return { ok: true, value: is64Bit(scalar) ? 0n : 0 };
      if (!INT_PATTERN.test(str)) return { ok: false, error: "Enter a whole number" };
      const big = BigInt(str);
      if (big < range[0] || big > range[1]) {
        return { ok: false, error: `Value must be between ${range[0]} and ${range[1]}` };
      }
      return { ok: true, value: is64Bit(scalar) ? big : Number(big) };
    }
  }
}

/** Like `tryParseScalar`, but throws on invalid input. */
export function parseScalar(scalar: ScalarType, str: string): ScalarValue {
  const result = tryParseScalar(scalar, str);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.value;
}

export function formatScalar(scalar: ScalarType, value: ScalarValue): string {
  if (scalar === ScalarType.BYTES) {
    return base64Encode(value as Uint8Array);
  }
  return String(value);
}

function parseSpecialFloat(str: string): number | undefined {
  switch (str.toLowerCase()) {
    case "nan":
      return NaN;
    case "inf":
    case "+inf":
    case "infinity":
    case "+infinity":
      return Infinity;
    case "-inf":
    case "-infinity":
      return -Infinity;
  }
  return undefined;
}

function is64Bit(scalar: ScalarType): boolean {
  switch (scalar) {
    case ScalarType.INT64:
    case ScalarType.UINT64:
    case ScalarType.SINT64:
    case ScalarType.FIXED64:
    case ScalarType.SFIXED64:
      return true;
  }
  return false;
}
