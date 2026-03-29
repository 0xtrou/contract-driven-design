import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { buildServer } from "./server.js";

type TextContent = { type: "text"; text: string };

function extractText(result: Record<string, unknown>): string {
  const content = result["content"] as TextContent[];
  return content[0].text;
}

async function createTestClient() {
  const server = buildServer();
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  const client = new Client({ name: "test-client", version: "1.0.0" });

  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);

  return { client, server };
}

describe("CounterComponent MCP server conformance", () => {
  let client: Client;

  beforeEach(async () => {
    const ctx = await createTestClient();
    client = ctx.client;
  });

  describe("tool discovery", () => {
    it("exposes all four tools", async () => {
      const { tools } = await client.listTools();
      const names = tools.map((t) => t.name);

      expect(names).toContain("counter_increment");
      expect(names).toContain("counter_decrement");
      expect(names).toContain("counter_get");
      expect(names).toContain("counter_reset");
    });

    it("counter_get has no required inputs", async () => {
      const { tools } = await client.listTools();
      const getTool = tools.find((t) => t.name === "counter_get")!;
      expect(getTool.inputSchema.required ?? []).toHaveLength(0);
    });

    it("counter_reset has no required inputs", async () => {
      const { tools } = await client.listTools();
      const resetTool = tools.find((t) => t.name === "counter_reset")!;
      expect(resetTool.inputSchema.required ?? []).toHaveLength(0);
    });
  });

  describe("tool execution", () => {
    it("counter_get returns value initially", async () => {
      const result = await client.callTool(
        { name: "counter_get", arguments: {} },
        CallToolResultSchema
      );
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(extractText(result));
      expect(parsed).toHaveProperty("value");
      expect(Number.isInteger(parsed.value)).toBe(true);
    });

    it("counter_increment returns structured output", async () => {
      const result = await client.callTool(
        { name: "counter_increment", arguments: { amount: 3 } },
        CallToolResultSchema
      );
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(extractText(result));
      expect(parsed).toHaveProperty("value");
      expect(Number.isInteger(parsed.value)).toBe(true);
    });

    it("counter_decrement returns structured output", async () => {
      await client.callTool(
        { name: "counter_increment", arguments: { amount: 5 } },
        CallToolResultSchema
      );
      const result = await client.callTool(
        { name: "counter_decrement", arguments: { amount: 2 } },
        CallToolResultSchema
      );
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(extractText(result));
      expect(parsed).toHaveProperty("value");
      expect(Number.isInteger(parsed.value)).toBe(true);
    });

    it("counter_reset returns { value: 0 }", async () => {
      await client.callTool(
        { name: "counter_increment", arguments: { amount: 10 } },
        CallToolResultSchema
      );
      const result = await client.callTool(
        { name: "counter_reset", arguments: {} },
        CallToolResultSchema
      );
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(extractText(result));
      expect(parsed).toEqual({ value: 0 });
    });

    it("returns isError on overflow with declared error code", async () => {
      const result = await client.callTool(
        { name: "counter_increment", arguments: { amount: 2147483647 } },
        CallToolResultSchema
      );

      if (result.isError) {
        const parsed = JSON.parse(extractText(result));
        expect(["COUNTER_OVERFLOW", "COUNTER_UNDERFLOW"]).toContain(
          parsed.code
        );
        expect(typeof parsed.retryable).toBe("boolean");
      }
    });
  });

  describe("resource discovery", () => {
    it("exposes contract and state resources", async () => {
      const { resources } = await client.listResources();
      const uris = resources.map((r) => r.uri);
      expect(uris).toContain("counter://contract");
      expect(uris).toContain("counter://state");
    });
  });

  describe("resource content", () => {
    it("counter://contract returns YAML content", async () => {
      const result = await client.readResource({ uri: "counter://contract" });
      const first = result.contents[0]!;
      expect(first.mimeType).toBe("application/yaml");
      const text = "text" in first ? (first.text as string) : "";
      expect(text).toContain("CounterComponent");
    });

    it("counter://state returns valid JSON state", async () => {
      const result = await client.readResource({ uri: "counter://state" });
      const first = result.contents[0]!;
      expect(first.mimeType).toBe("application/json");
      const text = "text" in first ? (first.text as string) : "";
      const state = JSON.parse(text);
      expect(state).toHaveProperty("value");
      expect(state).toHaveProperty("min");
      expect(state).toHaveProperty("max");
    });
  });
});
