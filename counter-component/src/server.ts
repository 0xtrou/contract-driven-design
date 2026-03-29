import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { createCounter } from "./counter.js";
import { CounterError } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contractPath = join(__dirname, "..", "counter.component.yml");
const contractYaml = readFileSync(contractPath, "utf-8");

const counter = createCounter();

export function buildServer(): McpServer {
  const server = new McpServer({
    name: "counter-component",
    version: "1.0.0",
  });

  server.tool(
    "counter_increment",
    "Increment the counter. Returns the new value.",
    { amount: z.number().int().min(1).optional().default(1) },
    async ({ amount }) => {
      try {
        const result = counter.increment({ amount });
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
          isError: false,
        };
      } catch (e) {
        const err = e as CounterError;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ code: err.code, message: err.message, retryable: err.retryable }),
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "counter_decrement",
    "Decrement the counter. Returns the new value.",
    { amount: z.number().int().min(1).optional().default(1) },
    async ({ amount }) => {
      try {
        const result = counter.decrement({ amount });
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
          isError: false,
        };
      } catch (e) {
        const err = e as CounterError;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ code: err.code, message: err.message, retryable: err.retryable }),
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "counter_get",
    "Get the current counter value. Read-only, no side effects.",
    {},
    async () => {
      const result = counter.get();
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        isError: false,
      };
    }
  );

  server.tool(
    "counter_reset",
    "Reset the counter to zero. Idempotent.",
    {},
    async () => {
      const result = counter.reset();
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        isError: false,
      };
    }
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
          text: contractYaml,
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

  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
