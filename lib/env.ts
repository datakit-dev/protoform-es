import React from "react";
import { type Registry, createMutableRegistry } from "@bufbuild/protobuf";
import type { Transport } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { type Validator, createValidator } from "@bufbuild/protovalidate";
import { file_google_protobuf_any, file_google_protobuf_api, file_google_protobuf_cpp_features, file_google_protobuf_descriptor, file_google_protobuf_duration, file_google_protobuf_empty, file_google_protobuf_field_mask, file_google_protobuf_go_features, file_google_protobuf_java_features, file_google_protobuf_source_context, file_google_protobuf_struct, file_google_protobuf_timestamp, file_google_protobuf_type, file_google_protobuf_wrappers, file_google_protobuf_compiler_plugin } from "@bufbuild/protobuf/wkt";

export const defaultRegistry = createMutableRegistry(
  file_google_protobuf_any,
  file_google_protobuf_api,
  file_google_protobuf_cpp_features,
  file_google_protobuf_descriptor,
  file_google_protobuf_duration,
  file_google_protobuf_empty,
  file_google_protobuf_field_mask,
  file_google_protobuf_go_features,
  file_google_protobuf_java_features,
  file_google_protobuf_source_context,
  file_google_protobuf_struct,
  file_google_protobuf_timestamp,
  file_google_protobuf_type,
  file_google_protobuf_wrappers,
  file_google_protobuf_compiler_plugin,
);

export const defaultValidator = createDefaultValidator(defaultRegistry);

export function createDefaultValidator(registry: Registry = defaultRegistry): Validator {
  return createValidator({ registry });
}

export function createDefaultTransport(registry: Registry = defaultRegistry): Transport {
  return createConnectTransport({
    baseUrl: "http://localhost:9900",
    jsonOptions: { registry },
  });
}

export type EnvOptions = {
  registry?: Registry;
  validator?: Validator;
  transport?: Transport;
  /** Limits which message types can be chosen for `google.protobuf.Any` fields. */
  anyTypeFilter?: (typeName: string) => boolean;
};

export class Env {
  readonly registry: Registry;
  readonly anyTypeFilter: (typeName: string) => boolean;
  private _transport?: Transport;
  private _validator?: Validator;

  constructor({ registry, validator, transport, anyTypeFilter }: EnvOptions = {}) {
    this.registry = registry ?? defaultRegistry;
    this.anyTypeFilter = anyTypeFilter ?? (() => true);
    this._transport = transport;
    this._validator = validator;
  }

  /** Created on first use so importing the library has no side effects. */
  get transport(): Transport {
    this._transport ??= createDefaultTransport(this.registry);
    return this._transport;
  }

  /** Created on first use so importing the library has no side effects. */
  get validator(): Validator {
    this._validator ??= createDefaultValidator(this.registry);
    return this._validator;
  }
};

export const EnvContext = React.createContext<Env>(new Env());

export const useEnv = () => {
  return React.useContext(EnvContext);
};
