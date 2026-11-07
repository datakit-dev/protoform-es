// Adapted from `getComments` in @bufbuild/protoplugin (Apache-2.0,
// Copyright 2021-2026 Buf Technologies, Inc.), reduced to the descriptor kinds
// protoform needs. Vendored so the browser bundle doesn't depend on the code
// generator toolkit (which pulls in the TypeScript compiler).
import type { DescEnum, DescEnumValue, DescField, DescMessage, DescOneof } from "@bufbuild/protobuf";
import { isFieldSet } from "@bufbuild/protobuf";
import {
  DescriptorProtoSchema,
  EnumDescriptorProtoSchema,
  FileDescriptorProtoSchema,
  SourceCodeInfo_LocationSchema,
  type FileDescriptorProto,
} from "@bufbuild/protobuf/wkt";

export type Commentable = DescMessage | DescEnum | DescEnumValue | DescField | DescOneof;

export type Comments = {
  leadingDetached: string[];
  leading?: string;
  trailing?: string;
};

/** Comments attached to a descriptor in the .proto source, if the descriptor carries source info. */
export function getComments(desc: Commentable): Comments {
  return findComments(fileOf(desc).proto, sourcePath(desc));
}

function fileOf(desc: Commentable) {
  switch (desc.kind) {
    case "message":
    case "enum":
      return desc.file;
    case "enum_value":
    case "field":
    case "oneof":
      return desc.parent.file;
  }
}

/** The location of the element in the FileDescriptorProto, e.g. [4, 0, 2, 1] for the second field of the first message. */
function sourcePath(desc: Commentable): number[] {
  switch (desc.kind) {
    case "message":
      return desc.parent
        ? [...sourcePath(desc.parent), DescriptorProtoSchema.field.nestedType.number, desc.parent.proto.nestedType.indexOf(desc.proto)]
        : [FileDescriptorProtoSchema.field.messageType.number, desc.file.proto.messageType.indexOf(desc.proto)];
    case "enum":
      return desc.parent
        ? [...sourcePath(desc.parent), DescriptorProtoSchema.field.enumType.number, desc.parent.proto.enumType.indexOf(desc.proto)]
        : [FileDescriptorProtoSchema.field.enumType.number, desc.file.proto.enumType.indexOf(desc.proto)];
    case "enum_value":
      return [...sourcePath(desc.parent), EnumDescriptorProtoSchema.field.value.number, desc.parent.proto.value.indexOf(desc.proto)];
    case "field":
      return [...sourcePath(desc.parent), DescriptorProtoSchema.field.field.number, desc.parent.proto.field.indexOf(desc.proto)];
    case "oneof":
      return [...sourcePath(desc.parent), DescriptorProtoSchema.field.oneofDecl.number, desc.parent.proto.oneofDecl.indexOf(desc.proto)];
  }
}

function findComments(file: FileDescriptorProto, path: number[]): Comments {
  const location = file.sourceCodeInfo?.location.find((loc) =>
    loc.path.length === path.length && loc.path.every((value, index) => value === path[index])
  );
  if (!location) {
    return { leadingDetached: [] };
  }
  return {
    leadingDetached: location.leadingDetachedComments,
    leading: isFieldSet(location, SourceCodeInfo_LocationSchema.field.leadingComments) ? location.leadingComments : undefined,
    trailing: isFieldSet(location, SourceCodeInfo_LocationSchema.field.trailingComments) ? location.trailingComments : undefined,
  };
}
