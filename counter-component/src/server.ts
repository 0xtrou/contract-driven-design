import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { fileURLToPath } from "node:url";
import { createCounter } from "./counter.js";
import {
  getDefaultState,
  getErrorInfo,
  getOperationAnnotations,
  getOperationInputSchema,
  loadContract,
} from "./contract.js";
import { CounterError } from "./types.js";

const contract = loadContract();
const counter = createCounter(getDefaultState(contract));

function textResult(payload: unknown, isError = false) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload) }],
    isError,
  };
}

export function buildServer(): McpServer {
  const server = new McpServer({
    name: contract.component,
    version: contract.version,
  });

  server.tool(
    "counter_increment",
    "Increment the counter.",
    getOperationInputSchema(contract, "increment"),
    {
      readOnlyHint: getOperationAnnotations(contract, "increment").readOnly,
      destructiveHint: getOperationAnnotations(contract, "increment").destructive,
      idempotentHint: getOperationAnnotations(contract, "increment").idempotent,
      openWorldHint: getOperationAnnotations(contract, "increment").openWorld,
    },
    async (input) => {
      try {
        return textResult(counter.increment(input));
      } catch (e) {
        const err = e as CounterError;
        const info = getErrorInfo(contract, err.code);
        return textResult(
          { code: err.code, message: err.message, retryable: info.retryable },
          true
        );
      }
    }
  );

  server.tool(
    "counter_decrement",
    "Decrement the counter.",
    getOperationInputSchema(contract, "decrement"),
    {
      readOnlyHint: getOperationAnnotations(contract, "decrement").readOnly,
      destructiveHint: getOperationAnnotations(contract, "decrement").destructive,
      idempotentHint: getOperationAnnotations(contract, "decrement").idempotent,
      openWorldHint: getOperationAnnotations(contract, "decrement").openWorld,
    },
    async (input) => {
      try {
        return textResult(counter.decrement(input));
      } catch (e) {
        const err = e as CounterError;
        const info = getErrorInfo(contract, err.code);
        return textResult(
          { code: err.code, message: err.message, retryable: info.retryable },
          true
        );
      }
    }
  );

  server.tool(
    "counter_get",
    "Get the current counter value.",
    getOperationInputSchema(contract, "get"),
    {
      readOnlyHint: getOperationAnnotations(contract, "get").readOnly,
      destructiveHint: getOperationAnnotations(contract, "get").destructive,
      idempotentHint: getOperationAnnotations(contract, "get").idempotent,
      openWorldHint: getOperationAnnotations(contract, "get").openWorld,
    },
    async () => textResult(counter.get())
  );

  server.tool(
    "counter_reset",
    "Reset the counter to zero.",
    getOperationInputSchema(contract, "reset"),
    {
      readOnlyHint: getOperationAnnotations(contract, "reset").readOnly,
      destructiveHint: getOperationAnnotations(contract, "reset").destructive,
      idempotentHint: getOperationAnnotations(contract, "reset").idempotent,
      openWorldHint: getOperationAnnotations(contract, "reset").openWorld,
    },
    async () => textResult(counter.reset())
  );

  server.resource(
    "counter-contract",
    "counter://contract",
    { mimeType: "application/yaml" },
    async () => ({
      contents: [
        {
          uri: "counter://contract",
          mimeType: "application/yaml",
          text: JSON.stringify(contract, null, 2),
        },
      ],
    })
  );

  server.resource(
    "counter-state",
    "counter://state",
    { mimeType: "application/json" },
    async () => ({
      contents: [
        {
          uri: "counter://state",
          mimeType: "application/json",
          text: JSON.stringify(counter.state(), null, 2),
        },
      ],
    })
  );

  server.prompt("counter_usage", contract.instructions, async () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: contract.instructions,
        },
      },
    ],
  }));

  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
