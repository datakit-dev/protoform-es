import type { Violation } from "@bufbuild/protovalidate";

import { pathToString } from "./path";

/**
 * Shared, observable state for one message tree. The protobuf value itself is
 * mutated in place, so the store exposes a revision counter that React can
 * subscribe to (via `useSyncExternalStore`) to know when to re-render.
 */
export class FormStore {
  private revision = 0;
  private dataRevision = 0;
  private listeners = new Set<() => void>();

  violations: Violation[] = [];
  private byPath = new Map<string, Violation[]>();
  private localErrors = new Map<string, string>();

  /** Set once the user attempted to submit; used to switch to eager validation. */
  submitted = false;

  markSubmitted() {
    this.submitted = true;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Changes whenever data or errors change. */
  snapshot = () => this.revision;

  /** Changes only when the message data changes. */
  dataSnapshot = () => this.dataRevision;

  dataChanged() {
    this.dataRevision++;
    this.revision++;
    this.emit();
  }

  setViolations(violations: Violation[]) {
    this.violations = violations;
    this.byPath = new Map();
    for (const violation of violations) {
      const key = pathToString(violation.field);
      const list = this.byPath.get(key);
      if (list) {
        list.push(violation);
      } else {
        this.byPath.set(key, [violation]);
      }
    }
    this.revision++;
    this.emit();
  }

  violationsAt(path: string): Violation[] {
    return this.byPath.get(path) ?? [];
  }

  setLocalError(path: string, message: string | undefined) {
    if (this.localErrors.get(path) === message) {
      return;
    }
    if (message === undefined) {
      this.localErrors.delete(path);
    } else {
      this.localErrors.set(path, message);
    }
    this.revision++;
    this.emit();
  }

  localError(path: string): string | undefined {
    return this.localErrors.get(path);
  }

  hasLocalErrors(): boolean {
    return this.localErrors.size > 0;
  }

  private emit() {
    for (const listener of [...this.listeners]) {
      listener();
    }
  }
}
