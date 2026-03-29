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

const contractSchema = z.object({
  component: z.string(),
  version: z.string(),
  kind: z.string(),
  description: z.string(),
  instructions: z.string(),
  input: z.record(z.string(), objectSchema),
  output: objectSchema,
  state: z.object({
    type: z.literal("object"),
    properties: z.object({
      value: z.object({ type: z.literal("integer"), default: z.number() }),
      min: z.object({ type: z.literal("integer"), default: z.number() }),
      max: z.object({ type: z.literal("integer"), default: z.number() }),
    }),
  }),
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
  guarantees: z.object({
    success: z.array(z.string()),
    failure: z.array(z.string()),
  }),
  annotations: z.record(
    z.string(),
    z.object({
      readOnly: z.boolean(),
      destructive: z.boolean(),
      idempotent: z.boolean(),
      openWorld: z.boolean(),
    })
  ),
});

export type LoadedContract = z.infer<typeof contractSchema> & ContractDefinition;

export function loadContract(): LoadedContract {
  const file = readFileSync(contractPath, "utf-8");
  const parsed = YAML.parse(file);
  return contractSchema.parse(parsed) as LoadedContract;
}

export function getDefaultState(contract: LoadedContract): CounterState {
  return {
    value: contract.state.properties.value.default,
    min: contract.state.properties.min.default,
    max: contract.state.properties.max.default,
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
