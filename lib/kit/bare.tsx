import type { ReactNode } from "react";

import type {
  ButtonProps, CheckboxProps, FieldFrameProps, FileInputProps, FormProps, RadioGroupProps,
  RowProps, SectionProps, SelectProps, StackProps, TextAreaProps, TextInputProps, UIKit,
} from "./types";

function Form({ onSubmit, children }: FormProps) {
  return (
    <form data-pf="form" noValidate onSubmit={onSubmit}>
      {children}
    </form>
  );
}

function Stack({ children }: StackProps) {
  return <div data-pf="stack">{children}</div>;
}

function Row({ id, children, actions, errors = [] }: RowProps) {
  return (
    <>
      <div data-pf="row">
        <div data-pf="row-content">{children}</div>
        {actions && <div data-pf="row-actions">{actions}</div>}
      </div>
      <ErrorList id={`${id}-errors`} errors={errors} />
    </>
  );
}

function Field({ id, label, description, errors, required, children }: FieldFrameProps) {
  return (
    <div data-pf="field" data-invalid={errors.length > 0 || undefined}>
      <label data-pf="label" id={`${id}-label`} htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {description && <p data-pf="description" id={`${id}-description`}>{description}</p>}
      {children}
      <ErrorList id={`${id}-errors`} errors={errors} />
    </div>
  );
}

function Section({ id, title, description, errors, depth, actions, collapsible, children }: SectionProps) {
  const heading = (
    <>
      <span data-pf="section-title" id={`${id}-title`}>{title}</span>
      {actions && <span data-pf="section-actions">{actions}</span>}
    </>
  );
  const body = (
    <>
      {description && <p data-pf="description" id={`${id}-description`}>{description}</p>}
      <ErrorList id={`${id}-errors`} errors={errors} />
      {children}
    </>
  );
  const labelling = {
    "aria-labelledby": `${id}-title`,
    "aria-describedby": description ? `${id}-description` : undefined,
  };

  if (collapsible) {
    return (
      <details data-pf="section" data-depth={depth} open {...labelling}>
        <summary data-pf="section-summary">{heading}</summary>
        {body}
      </details>
    );
  }

  return (
    <fieldset data-pf="section" data-depth={depth} {...labelling}>
      <legend data-pf="section-legend">{heading}</legend>
      {body}
    </fieldset>
  );
}

function ErrorList({ id, errors }: { id: string; errors: string[] }): ReactNode {
  if (errors.length === 0) {
    return null;
  }
  return (
    <ul data-pf="errors" id={id} aria-live="polite">
      {errors.map((error) => <li key={error}>{error}</li>)}
    </ul>
  );
}

function TextInput({ value, onChange, onBlur, onEnter, type = "text", inputMode, placeholder, mono, invalid, describedBy, ...rest }: TextInputProps) {
  return (
    <input
      data-pf="input"
      data-mono={mono || undefined}
      type={type}
      inputMode={inputMode}
      id={rest.id}
      name={rest.name}
      value={value}
      placeholder={placeholder}
      disabled={rest.disabled}
      readOnly={rest.readOnly}
      required={rest.required}
      aria-label={rest["aria-label"]}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      onKeyDown={onEnter && ((event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onEnter();
        }
      })}
    />
  );
}

function TextArea({ value, onChange, onBlur, rows = 4, placeholder, mono, invalid, describedBy, ...rest }: TextAreaProps) {
  return (
    <textarea
      data-pf="textarea"
      data-mono={mono || undefined}
      id={rest.id}
      name={rest.name}
      rows={rows}
      value={value}
      placeholder={placeholder}
      disabled={rest.disabled}
      readOnly={rest.readOnly}
      required={rest.required}
      aria-label={rest["aria-label"]}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
    />
  );
}

function Checkbox({ checked, onChange, label, variant = "checkbox", invalid, describedBy, ...rest }: CheckboxProps) {
  const input = (
    <input
      data-pf="checkbox"
      type="checkbox"
      role={variant === "switch" ? "switch" : undefined}
      id={rest.id}
      name={rest.name}
      checked={checked}
      disabled={rest.disabled || rest.readOnly}
      aria-label={rest["aria-label"]}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onChange={(event) => onChange(event.target.checked)}
    />
  );

  if (label === undefined) {
    return input;
  }
  return (
    <label data-pf="checkbox-label">
      {input}
      <span>{label}</span>
    </label>
  );
}

function Select({ value, onChange, options, placeholder, invalid, describedBy, ...rest }: SelectProps) {
  return (
    <select
      data-pf="select"
      id={rest.id}
      name={rest.name}
      value={value}
      disabled={rest.disabled || rest.readOnly}
      required={rest.required}
      aria-label={rest["aria-label"]}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onChange={(event) => onChange(event.target.value)}
    >
      {placeholder !== undefined && <option value="" disabled>{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>
      ))}
    </select>
  );
}

function RadioGroup({ value, onChange, options, invalid, describedBy, ...rest }: RadioGroupProps) {
  const name = rest.name ?? rest.id;
  return (
    <div
      data-pf="radiogroup"
      role="radiogroup"
      id={rest.id}
      aria-label={rest["aria-label"]}
      aria-labelledby={rest.id && !rest["aria-label"] ? `${rest.id}-label` : undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
    >
      {options.map((option) => (
        <label key={option.value} data-pf="radio-label">
          <input
            data-pf="radio"
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            disabled={rest.disabled || rest.readOnly || option.disabled}
            onChange={() => onChange(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function FileInput({ accept, fileName, onFile, invalid, describedBy, ...rest }: FileInputProps) {
  return (
    <div data-pf="file">
      <input
        data-pf="file-input"
        type="file"
        id={rest.id}
        name={rest.name}
        accept={accept?.length ? accept.join(",") : undefined}
        disabled={rest.disabled || rest.readOnly}
        aria-label={rest["aria-label"]}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(event) => onFile(event.target.files?.[0])}
      />
      {fileName && <span data-pf="file-name">{fileName}</span>}
    </div>
  );
}

function Button({ variant = "secondary", size = "md", type = "button", disabled, onClick, children, ...rest }: ButtonProps) {
  return (
    <button
      data-pf="button"
      data-variant={variant}
      data-size={size}
      type={type}
      disabled={disabled}
      aria-label={rest["aria-label"]}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Unstyled, semantic HTML. Style it via the `data-pf` attributes. */
export const bareKit: UIKit = {
  Form,
  Stack,
  Row,
  Field,
  Section,
  TextInput,
  TextArea,
  Checkbox,
  Select,
  RadioGroup,
  FileInput,
  Button,
};
