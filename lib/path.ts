import type { DescField } from "@bufbuild/protobuf";
import type { Path } from "@bufbuild/protobuf/reflect";

/** Joins a parent path and a field into a path such as `items[0].name`. */
export function fieldPath(base: string, desc: Pick<DescField, "name">): string {
  return base ? `${base}.${desc.name}` : desc.name;
}

export function indexPath(base: string, index: number): string {
  return `${base}[${index}]`;
}

export function keyPath(base: string, key: string | number | bigint | boolean): string {
  return `${base}[${String(key)}]`;
}

/** Converts a protovalidate violation path into the same notation as `fieldPath`. */
export function pathToString(path: Path): string {
  let out = "";
  for (const element of path) {
    switch (element.kind) {
      case "field":
      case "oneof":
        out = fieldPath(out, element);
        break;
      case "extension":
        break;
      case "list_sub":
        out = indexPath(out, element.index);
        break;
      case "map_sub":
        out = keyPath(out, element.key);
        break;
    }
  }
  return out;
}
