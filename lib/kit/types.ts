import type { ReactNode, SubmitEvent } from "react";

export type Option = {
  value: string;
  label: string;
  disabled?: boolean;
};

type ControlProps = {
  id?: string;
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  required?: boolean;
  /** Id(s) of the elements describing this control (description and errors). */
  describedBy?: string;
  "aria-label"?: string;
};

export type TextInputProps = ControlProps & {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** Called when Enter is pressed; suppresses the form's implicit submit. */
  onEnter?: () => void;
  type?: "text" | "password" | "url" | "email";
  inputMode?: "text" | "numeric" | "decimal" | "url" | "email";
  placeholder?: string;
  /** Render in a monospace font (identifiers, base64, timestamps, JSON). */
  mono?: boolean;
};

export type TextAreaProps = ControlProps & {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  rows?: number;
  placeholder?: string;
  mono?: boolean;
};

export type CheckboxProps = ControlProps & {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Inline label. Omit when an outer `Field` already labels the control. */
  label?: ReactNode;
  variant?: "checkbox" | "switch";
};

export type SelectProps = ControlProps & {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  /** Shown while `value` is empty. */
  placeholder?: string;
};

export type RadioGroupProps = ControlProps & {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
};

export type FileInputProps = ControlProps & {
  accept?: string[];
  fileName?: string;
  onFile: (file: File | undefined) => void;
};

export type ButtonProps = {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
  children: ReactNode;
};

export type FormProps = {
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  children?: ReactNode;
};

export type StackProps = {
  children?: ReactNode;
};

/** A horizontal row: growing content with optional trailing actions and errors underneath. */
export type RowProps = {
  /** Used to build the id (`${id}-errors`) controls can reference in `describedBy`. */
  id?: string;
  children?: ReactNode;
  actions?: ReactNode;
  errors?: string[];
};

/** Frames a single control with its label, description and errors. */
export type FieldFrameProps = {
  id: string;
  label: ReactNode;
  description?: string;
  errors: string[];
  required?: boolean;
  children?: ReactNode;
};

/** Frames a group of controls (nested messages, lists, maps, oneofs). */
export type SectionProps = {
  id: string;
  title: ReactNode;
  description?: string;
  errors: string[];
  depth: number;
  /** Trailing controls, e.g. a remove button. */
  actions?: ReactNode;
  collapsible?: boolean;
  children?: ReactNode;
};

/**
 * The set of primitives protoform renders with. Provide your own to use
 * another component library; any primitive you leave out falls back to the
 * unstyled default.
 */
export type UIKit = {
  Form: (props: FormProps) => ReactNode;
  Stack: (props: StackProps) => ReactNode;
  Row: (props: RowProps) => ReactNode;
  Field: (props: FieldFrameProps) => ReactNode;
  Section: (props: SectionProps) => ReactNode;
  TextInput: (props: TextInputProps) => ReactNode;
  TextArea: (props: TextAreaProps) => ReactNode;
  Checkbox: (props: CheckboxProps) => ReactNode;
  Select: (props: SelectProps) => ReactNode;
  RadioGroup: (props: RadioGroupProps) => ReactNode;
  FileInput: (props: FileInputProps) => ReactNode;
  Button: (props: ButtonProps) => ReactNode;
};
