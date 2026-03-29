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

export type VerifiableGuarantee = {
  operation: string;
  assertion: string;
  test: string;
};

export type AspirationalGuarantee = {
  statement: string;
  enforcement: string;
};

export type ContractDependency = {
  component: string;
  version: string;
  guarantees_assumed: string[];
};

export type ContractDefinition = {
  spec_version: string;
  component: string;
  version: string;
  kind: "stateless" | "stateful" | "async" | "streaming";
  description: string;
  instructions: string;
  errors: Record<string, { retryable: boolean; description: string }>;
  annotations: Record<string, OperationAnnotations>;
  guarantees: {
    verifiable: VerifiableGuarantee[];
    aspirational: AspirationalGuarantee[];
  };
  requires?: ContractDependency[];
};
