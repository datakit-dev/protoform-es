import type { ReactNode } from "react";
import {
  Button as HeadlessButton,
  Checkbox as HeadlessCheckbox,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Description,
  Field as HeadlessField,
  Input,
  Label,
  Radio,
  RadioGroup as HeadlessRadioGroup,
  Select as HeadlessSelect,
  Switch,
  Textarea,
} from "@headlessui/react";

import type {
  ButtonProps, CheckboxProps, FieldFrameProps, FileInputProps, FormProps, RadioGroupProps,
  RowProps, SectionProps, SelectProps, StackProps, TextAreaProps, TextInputProps, UIKit,
} from "../types";

function Form({ onSubmit, children }: FormProps) {
  return (
    <form className="pf-form" noValidate onSubmit={onSubmit}>
      {children}
    </form>
  );
}

function Stack({ children }: StackProps) {
  return <div className="pf-stack">{children}</div>;
}

function Row({ id, children, actions, errors = [] }: RowProps) {
  return (
    <>
      <div className="pf-row">
        <div className="pf-row-content">{children}</div>
        {actions && <div className="pf-row-actions">{actions}</div>}
      </div>
      <ErrorList id={`${id}-errors`} errors={errors} />
    </>
  );
}

function ErrorList({ id, errors }: { id: string; errors: string[] }): ReactNode {
  if (errors.length === 0) {
    return null;
  }
  return (
    <ul className="pf-errors" id={id} aria-live="polite">
      {errors.map((error) => <li key={error}>{error}</li>)}
    </ul>
  );
}

// Headless UI links labels, descriptions and errors to the control it renders
// inside a `Field`, and ignores aria-labelledby/-describedby passed directly, so
// the frame registers them through its own `Label` and `Description`. The ids
// are stable so controls Headless can't link (radio groups) can reference them.
function Field({ id, label, description, errors, required, children }: FieldFrameProps) {
  return (
    <HeadlessField className="pf-field" data-invalid={errors.length > 0 || undefined}>
      <Label className="pf-label" id={`${id}-label`}>
        {label}
        {required && <span className="pf-required" aria-hidden="true"> *</span>}
      </Label>
      <div className="pf-field-body">
        {description && <Description className="pf-description" id={`${id}-description`}>{description}</Description>}
        {children}
        {errors.length > 0 && (
          <Description as="ul" className="pf-errors" id={`${id}-errors`} aria-live="polite">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </Description>
        )}
      </div>
    </HeadlessField>
  );
}

function Chevron() {
  return (
    <svg className="pf-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Section({ id, title, description, errors, depth, actions, collapsible, children }: SectionProps) {
  const descriptionNode = description && <p className="pf-description" id={`${id}-description`}>{description}</p>;
  const errorNode = <ErrorList id={`${id}-errors`} errors={errors} />;

  if (collapsible) {
    return (
      <Disclosure as="div" className="pf-section" role="group" aria-labelledby={`${id}-title`} data-depth={depth} defaultOpen>
        <div className="pf-section-header">
          <DisclosureButton className="pf-section-toggle">
            <Chevron />
            <span className="pf-section-title" id={`${id}-title`}>{title}</span>
          </DisclosureButton>
          {actions && <div className="pf-section-actions">{actions}</div>}
        </div>
        {errorNode}
        <DisclosurePanel className="pf-section-body" unmount={false}>
          {descriptionNode}
          {children}
        </DisclosurePanel>
      </Disclosure>
    );
  }

  return (
    <div className="pf-section" role="group" data-depth={depth} aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined}>
      <div className="pf-section-header">
        <span className="pf-section-title" id={`${id}-title`}>{title}</span>
        {actions && <div className="pf-section-actions">{actions}</div>}
      </div>
      {descriptionNode}
      {errorNode}
      <div className="pf-section-body">{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, onBlur, onEnter, type = "text", inputMode, placeholder, mono, invalid, ...rest }: TextInputProps) {
  return (
    <Input
      className="pf-input"
      data-mono={mono || undefined}
      type={type}
      inputMode={inputMode}
      name={rest.name}
      value={value}
      placeholder={placeholder}
      disabled={rest.disabled}
      readOnly={rest.readOnly}
      required={rest.required}
      invalid={invalid}
      aria-label={rest["aria-label"]}
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

function TextArea({ value, onChange, onBlur, rows = 4, placeholder, mono, invalid, ...rest }: TextAreaProps) {
  return (
    <Textarea
      className="pf-textarea"
      data-mono={mono || undefined}
      name={rest.name}
      rows={rows}
      value={value}
      placeholder={placeholder}
      disabled={rest.disabled}
      readOnly={rest.readOnly}
      required={rest.required}
      invalid={invalid}
      aria-label={rest["aria-label"]}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
    />
  );
}

function Checkbox({ checked, onChange, label, variant = "checkbox", invalid, ...rest }: CheckboxProps) {
  const common = {
    name: rest.name,
    checked,
    onChange,
    disabled: rest.disabled || rest.readOnly,
    "aria-label": rest["aria-label"],
    "aria-invalid": invalid || undefined,
    "data-invalid": invalid || undefined,
  };

  const control = variant === "switch" ? (
    <Switch {...common} className="pf-switch">
      <span className="pf-switch-thumb" aria-hidden="true" />
    </Switch>
  ) : (
    <HeadlessCheckbox {...common} className="pf-checkbox">
      <svg className="pf-checkbox-mark" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M3 8l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </HeadlessCheckbox>
  );

  if (label === undefined) {
    return control;
  }
  return (
    <HeadlessField className="pf-check-label">
      {control}
      <Label>{label}</Label>
    </HeadlessField>
  );
}

function Select({ value, onChange, options, placeholder, invalid, ...rest }: SelectProps) {
  return (
    <div className="pf-select-wrap">
      <HeadlessSelect
        className="pf-select"
        name={rest.name}
        value={value}
        disabled={rest.disabled || rest.readOnly}
        required={rest.required}
        invalid={invalid}
        aria-label={rest["aria-label"]}
        onChange={(event) => onChange(event.target.value)}
      >
        {placeholder !== undefined && <option value="" disabled>{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>
        ))}
      </HeadlessSelect>
      <Chevron />
    </div>
  );
}

function RadioGroup({ value, onChange, options, invalid, describedBy, ...rest }: RadioGroupProps) {
  // Headless UI's RadioGroup shadows the surrounding Field's label and description,
  // so a labelled group wraps it and points at the frame's stable ids.
  return (
    <div
      role="group"
      id={rest.id}
      aria-label={rest["aria-label"]}
      aria-labelledby={rest.id && !rest["aria-label"] ? `${rest.id}-label` : undefined}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
    >
      <HeadlessRadioGroup
        className="pf-radiogroup"
        name={rest.name ?? rest.id}
        value={value}
        onChange={onChange}
        disabled={rest.disabled || rest.readOnly}
      >
        {options.map((option) => (
          <HeadlessField key={option.value} className="pf-radio-option" disabled={option.disabled}>
            <Radio value={option.value} className="pf-radio">
              <span className="pf-radio-dot" aria-hidden="true" />
            </Radio>
            <Label className="pf-radio-label">{option.label}</Label>
          </HeadlessField>
        ))}
      </HeadlessRadioGroup>
    </div>
  );
}

function FileInput({ accept, onFile, invalid, describedBy, ...rest }: FileInputProps) {
  // The native control already shows the chosen file name, so `fileName` isn't rendered.
  return (
    <input
      className="pf-file-input"
      type="file"
      id={rest.id}
      name={rest.name}
      accept={accept?.length ? accept.join(",") : undefined}
      disabled={rest.disabled || rest.readOnly}
      aria-label={rest["aria-label"]}
      aria-labelledby={rest.id && !rest["aria-label"] ? `${rest.id}-label` : undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      data-invalid={invalid || undefined}
      onChange={(event) => onFile(event.target.files?.[0])}
    />
  );
}

function Button({ variant = "secondary", size = "md", type = "button", disabled, onClick, children, ...rest }: ButtonProps) {
  return (
    <HeadlessButton
      className="pf-button"
      data-variant={variant}
      data-size={size}
      type={type}
      disabled={disabled}
      aria-label={rest["aria-label"]}
      onClick={onClick}
    >
      {children}
    </HeadlessButton>
  );
}

/**
 * Tailwind-styled primitives built on Headless UI. Import
 * `@dtkt/protoform/styles.css` for the styles; dark mode follows the OS
 * (override with `.dark`/`.light` or `data-theme` on an ancestor).
 */
export const tailwindKit: UIKit = {
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
