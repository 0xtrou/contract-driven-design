export type CounterOutput = {
  value: number;
};

export type IncrementInput = {
  amount?: number;
};

export type DecrementInput = {
  amount?: number;
};

export type CounterState = {
  value: number;
  min: number;
  max: number;
};

export type CounterErrorCode = "COUNTER_OVERFLOW" | "COUNTER_UNDERFLOW";

export class CounterError extends Error {
  readonly retryable: boolean;

  constructor(
    public readonly code: CounterErrorCode,
    message: string,
    retryable: boolean
  ) {
    super(message);
    this.retryable = retryable;
  }
}

export type OperationAnnotations = {
  readOnly: boolean;
  destructive: boolean;
  idempotent: boolean;
  openWorld: boolean;
};

export type ContractDefinition = {
  component: string;
  version: string;
  kind: string;
  description: string;
  instructions: string;
  errors: Record<string, { retryable: boolean; description: string }>;
  annotations: Record<string, OperationAnnotations>;
};
