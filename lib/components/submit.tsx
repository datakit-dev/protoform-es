import type { PropsWithChildren } from "react";

import { useKit } from "../kit/context";
import type { ButtonProps } from "../kit/types";

export type SubmitButtonProps = PropsWithChildren<Pick<ButtonProps, "variant" | "size" | "disabled" | "aria-label">>;

/**
 * A submit button drawn by the active kit. Put it in `<Protoform>`'s children
 * (or anywhere under a `UIProvider`) so it matches the rest of the form.
 */
export function SubmitButton({ variant = "primary", children = "Submit", ...props }: SubmitButtonProps) {
  const { Button } = useKit();

  return <Button {...props} variant={variant} type="submit">{children}</Button>;
}
