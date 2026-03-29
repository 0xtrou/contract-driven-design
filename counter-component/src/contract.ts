import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { z, type ZodTypeAny } from "zod";
import type {
  ContractDefinition,
  CounterErrorCode,
  CounterState,
  OperationAnnotations,
} from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contractPath = join(__dirname, "..", "counter.component.yml");

const primitiveSchema = z.object({
  type: z.enum(["integer", "string", "object"]),
  minimum: z.number().optional(),
  default: z.unknown().optional(),
  description: z.string().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
  required: z.array(z.string()).optional(),
  additionalProperties: z.boolean().optional(),
});

const objectSchema = z.object({
  type: z.literal("object"),
  additionalProperties: z.boolean().optional(),
  properties: z.record(z.string(), primitiveSchema),
  required: z.array(z.string()),
});

const guaranteesSchema = z.object({
  verifiable: z.array(
    z.object({
      operation: z.string(),
      assertion: z.string(),
      test: z.string(),
    })
  ),
  aspirational: z.array(
    z.object({
      statement: z.string(),
      enforcement: z.string(),
    })
  ),
});

const requiresSchema = z.array(
  z.object({
    component: z.string(),
    version: z.string(),
    guarantees_assumed: z.array(z.string()),
    failurePolicy: z
      .object({
        mode: z.enum(["fail-closed", "fail-open", "degraded"]),
        timeoutMs: z.number().int().positive(),
        mapErrors: z.record(z.string(), z.string()),
      })
      .optional(),
  })
);

const asyncSchema = z.object({
  completion: z.enum(["required", "optional"]),
  delivery: z.enum(["at-most-once", "at-least-once", "exactly-once"]),
  ordering: z.enum(["none", "per-key", "global"]),
  maxInFlight: z.number().int().positive().optional(),
  timeoutMs: z.number().int().positive(),
  cancellation: z.object({
    supported: z.boolean(),
    semantics: z.enum(["best-effort", "guaranteed"]),
  }),
});

const streamSchema = z.object({
  messageSchema: objectSchema,
  terminalEvents: z.array(z.enum(["completed", "failed", "cancelled"])),
  ordering: z.enum(["none", "per-key", "global"]),
  backpressure: z.enum(["drop", "buffer", "block", "error"]),
  replay: z.enum(["none", "from-offset", "from-timestamp"]).optional(),
  cancellation: z
    .object({
      supported: z.boolean(),
      semantics: z.enum(["best-effort", "guaranteed"]),
    })
    .optional(),
});

const contractSchema = z
  .object({
    spec_version: z.string(),
    component: z.string(),
    version: z.string(),
    kind: z.enum(["stateless", "stateful", "async", "streaming"]),
    description: z.string(),
    instructions: z.string(),
    input: z.record(z.string(), objectSchema),
    output: objectSchema,
    state: z
      .object({
        type: z.literal("object"),
        properties: z.object({
          value: z.object({ type: z.literal("integer"), default: z.number() }),
          min: z.object({ type: z.literal("integer"), default: z.number() }),
          max: z.object({ type: z.literal("integer"), default: z.number() }),
        }),
      })
      .optional(),
    async: asyncSchema.optional(),
    stream: streamSchema.optional(),
    errors: z.record(
      z.string(),
      z.object({ retryable: z.boolean(), description: z.string() })
    ),
    policies: z.object({
      idempotency: z.string(),
      timeoutMs: z.number(),
    }),
    sideEffects: z.object({
      allowed: z.array(z.string()),
      forbidden: z.array(z.string()),
    }),
    guarantees: guaranteesSchema,
    annotations: z.record(
      z.string(),
      z.object({
        readOnly: z.boolean(),
        destructive: z.boolean(),
        idempotent: z.boolean(),
        openWorld: z.boolean(),
      })
    ),
    lifecycle: z
      .object({
        status: z.enum(["draft", "stable", "deprecated"]),
        since: z.string(),
        replaces: z.string().optional(),
      })
      .optional(),
    requires: requiresSchema.optional(),
  })
  .superRefine((contract, ctx) => {
    if (contract.kind === "stateful" && !contract.state) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["state"],
        message: "state is required when kind is stateful",
      });
    }

    if (contract.kind === "async" && !contract.async) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["async"],
        message: "async block is required when kind is async",
      });
    }

    if (contract.kind === "streaming" && !contract.stream) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stream"],
        message: "stream block is required when kind is streaming",
      });
    }
  });

export type LoadedContract = z.infer<typeof contractSchema> & ContractDefinition;

export function loadRawContractText(): string {
  return readFileSync(contractPath, "utf-8");
}

export function loadContract(): LoadedContract {
  const parsed = YAML.parse(loadRawContractText());
  return contractSchema.parse(parsed) as LoadedContract;
}

export function assertSupportedForCounter(contract: LoadedContract): void {
  if (contract.kind !== "stateful") {
    throw new Error(
      `Counter reference implementation currently supports only kind=stateful, received kind=${contract.kind}`
    );
  }
}

export function getDefaultState(contract: LoadedContract): CounterState {
  const state = contract.state;
  if (!state) {
    throw new Error("State defaults are only available for stateful contracts");
  }

  return {
    value: state.properties.value.default,
    min: state.properties.min.default,
    max: state.properties.max.default,
  };
}

function toZodType(def: z.infer<typeof primitiveSchema>): ZodTypeAny {
  if (def.type === "integer") {
    let schema = z.number().int();
    if (def.minimum !== undefined) {
      schema = schema.min(def.minimum);
    }
    if (def.default !== undefined) {
      return schema.default(def.default as number);
    }
    return schema;
  }

  if (def.type === "string") {
    let schema = z.string();
    if (def.default !== undefined) {
      return schema.default(def.default as string);
    }
    return schema;
  }

  return z.object({}).passthrough();
}

export function getOperationInputSchema(
  contract: LoadedContract,
  operation: keyof LoadedContract["input"]
): Record<string, ZodTypeAny> {
  const input = contract.input[operation];
  const shape: Record<string, ZodTypeAny> = {};

  for (const [key, value] of Object.entries(input.properties)) {
    const zodType = toZodType(value);
    const required = input.required.includes(key);
    shape[key] = required ? zodType : zodType.optional();
  }

  return shape;
}

export function getOperationAnnotations(
  contract: LoadedContract,
  operation: string
): OperationAnnotations {
  return contract.annotations[operation];
}

export function getErrorInfo(
  contract: LoadedContract,
  code: CounterErrorCode
): { retryable: boolean; description: string } {
  return contract.errors[code];
}

export function getOperationNames(contract: LoadedContract): string[] {
  return Object.keys(contract.input);
}
