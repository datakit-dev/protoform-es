// import { useContext, useMemo } from "react";

// import { type DescMethodUnary, type Registry } from "@bufbuild/protobuf";
// import { parsePath, reflect, type ReflectMessage } from "@bufbuild/protobuf/reflect";
// import { useSuspenseQuery } from "@connectrpc/connect-query";
// import { type SelectElement, type ValueAccessorValid } from "@buf/datakit-dev_dtkt-sdk.bufbuild_es/dtkt/protoui/v1beta1/protoui_pb";

// type OptionsProps = {
//   select: SelectElement;
// };

// type OptionsFromMethodProps = {
//   method: DescMethodUnary;
//   fieldName: string;
//   optionKey: ValueAccessorValid;
//   optionVal: ValueAccessorValid;
// };

// function resolveValue(
//   acc: ValueAccessorValid,
//   itemMessage: ReflectMessage,
//   listIndex: number,
//   registry: Registry,
// ): string | null {
//   switch (acc.value.case) {
//     case "itemIndex":
//       return String(listIndex);

//     case "itemValue":
//       // Return the message itself as a string representation
//       // eslint-disable-next-line @typescript-eslint/no-base-to-string
//       return itemMessage.toString();

//     case "itemField": {
//       let path = acc.value.value;

//       // Normalize the path - remove leading dot or message name prefix
//       if (path.startsWith(".")) {
//         path = path.slice(1);
//       }

//       // Remove the message full name prefix if present
//       const fullName = itemMessage.desc.typeName;
//       if (path.startsWith(fullName + ".")) {
//         path = path.substring(fullName.length + 1);
//       }

//       // Parse the path relative to the item message
//       const items = Array.from(parsePath(itemMessage.desc, path, { registry }));
//       if (items.length > 0) {
//         const lastItem = items[items.length - 1];
//         if (lastItem?.kind === "field") {
//           const value = itemMessage.get(lastItem);

//           return String(value);
//         }
//       }
//       return null;
//     }

//     case "mapKey":
//       // For map entries, would need additional context
//       return null;

//     case "mapValue":
//       // For map entries, would need additional context
//       return null;

//     default:
//       return null;
//   }
// }

// function OptionsFromMethod({ method, fieldName, optionKey, optionVal }: OptionsFromMethodProps) {
//   const registry = useRegistry();
//   const { data } = useSuspenseQuery(method);
//   const message = reflect(method.output, data);

//   const options = useMemo(() => {
//     const result: { key: string; value: string }[] = [];

//     try {
//       let normalizedFieldName = fieldName;
//       if (normalizedFieldName.startsWith(".")) {
//         normalizedFieldName = normalizedFieldName.slice(1);
//       }

//       // Remove the message full name prefix if present
//       const fullName = String(method.output.typeName);
//       if (normalizedFieldName.startsWith(fullName + ".")) {
//         normalizedFieldName = normalizedFieldName.substring(fullName.length + 1);
//       }

//       console.log("Normalized field name:", normalizedFieldName);
//       console.log("Message:", message);

//       // Parse the path to get to the field
//       const pathItems = Array.from(parsePath(method.output, normalizedFieldName, { registry }));
//       console.log("Path items:", pathItems);

//       // Get the field directly if it's a simple path
//       if (pathItems.length === 1 && pathItems[0].kind === "field") {
//         const item = pathItems[0];
//         const fieldValue = message.get(item);
//         console.log("Field value:", fieldValue);
//         console.log("Field kind:", item.fieldKind);

//         if (item.fieldKind === "list") {
//           // Iterate through list entries
//           for (const [idx, val] of fieldValue.entries()) {
//             console.log(`Entry ${idx}:`, val);
//             if (item.message) {
//               const itemMessage = reflect(item.message, val);

//               // Resolve the key and value using the accessors
//               const key = resolveValue(optionKey, itemMessage, idx, registry);
//               const value = resolveValue(optionVal, itemMessage, idx, registry);
//               console.log(`Resolved - key: ${key}, value: ${value}`);

//               if (key !== null && value !== null) {
//                 result.push({ key, value });
//               }
//             } else {
//               // Scalar list - use index as key and value as value
//               const key = resolveValue(optionKey, message, idx, registry) ?? String(idx);
//               const value = String(val);
//               result.push({ key, value });
//             }
//           }
//         } else if (item.fieldKind === "map") {
//           // Iterate through map entries
//           for (const [mapKey, mapValue] of fieldValue.entries()) {
//             const key = String(mapKey);
//             const value = String(mapValue);
//             result.push({ key, value });
//           }
//         }
//       }

//       console.log("Final options:", result);
//     } catch (error) {
//       console.error("Error building options:", error);
//     }

//     return result;
//   }, [data, method.output, fieldName, optionKey, optionVal, registry, message]);

//   return (
//     <>
//       {options.map((option) => (
//         <option key={option.key} value={option.value}>
//           {option.key}
//         </option>
//       ))}
//     </>
//   );
// }

// export function SelectOptions({ select }: OptionsProps) {
//   const registry = useRegistry();

//   if (select.methodName && select.fieldName) {
//     const method = registry.getMethod(select.methodName);
//     if (method?.methodKind === "unary" && select.optionKey && select.optionValue) {
//       return (
//         <OptionsFromMethod
//           method={method as DescMethodUnary}
//           fieldName={select.fieldName}
//           optionKey={select.optionKey}
//           optionVal={select.optionValue}
//         />
//       );
//     }
//   }

//   return null;
// }
