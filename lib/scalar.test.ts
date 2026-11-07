import { ScalarType } from "@bufbuild/protobuf";
import { expect, test } from "vitest";

import { formatScalar, parseScalar, tryParseScalar } from "./scalar";

test("parses booleans without treating 'false' as truthy", () => {
  expect(parseScalar(ScalarType.BOOL, "false")).toBe(false);
  expect(parseScalar(ScalarType.BOOL, "true")).toBe(true);
  expect(parseScalar(ScalarType.BOOL, "")).toBe(false);
  expect(tryParseScalar(ScalarType.BOOL, "maybe").ok).toBe(false);
});

test("parses and range-checks 32-bit integers", () => {
  expect(parseScalar(ScalarType.INT32, "-12")).toBe(-12);
  expect(parseScalar(ScalarType.INT32, "")).toBe(0);
  expect(tryParseScalar(ScalarType.INT32, "2147483648").ok).toBe(false);
  expect(tryParseScalar(ScalarType.UINT32, "-1").ok).toBe(false);
  expect(tryParseScalar(ScalarType.INT32, "1.5").ok).toBe(false);
  expect(tryParseScalar(ScalarType.INT32, "abc").ok).toBe(false);
});

test("keeps 64-bit integers exact as bigint", () => {
  expect(parseScalar(ScalarType.INT64, "9223372036854775807")).toBe(9223372036854775807n);
  expect(parseScalar(ScalarType.UINT64, "18446744073709551615")).toBe(18446744073709551615n);
  expect(tryParseScalar(ScalarType.INT64, "9223372036854775808").ok).toBe(false);
  expect(parseScalar(ScalarType.INT64, "")).toBe(0n);
});

test("parses floats including special values", () => {
  expect(parseScalar(ScalarType.DOUBLE, "1.5e3")).toBe(1500);
  expect(parseScalar(ScalarType.DOUBLE, "-Infinity")).toBe(-Infinity);
  expect(parseScalar(ScalarType.DOUBLE, "NaN")).toBeNaN();
  expect(tryParseScalar(ScalarType.DOUBLE, "1.2.3").ok).toBe(false);
  expect(tryParseScalar(ScalarType.FLOAT, "1e39").ok).toBe(false);
});

test("round-trips bytes as base64", () => {
  const bytes = parseScalar(ScalarType.BYTES, "aGVsbG8=");
  expect(Array.from(bytes as Uint8Array)).toEqual(Array.from(new TextEncoder().encode("hello")));
  expect(formatScalar(ScalarType.BYTES, bytes)).toBe("aGVsbG8=");
  expect(tryParseScalar(ScalarType.BYTES, "***").ok).toBe(false);
});
