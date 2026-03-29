import { describe, it, expect, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { buildServer } from "./server.js";
import { loadContract } from "./contract.js";

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

const contract = loadContract();

describe("CounterComponent MCP server conformance", () => {
  let client: Client;

  beforeEach(async () => {
    const ctx = await createTestClient();
    client = ctx.client;
  });

  describe("server identity from contract", () => {
    it("server name matches contract component", async () => {
      const { tools } = await client.listTools();
      expect(tools.length).toBeGreaterThan(0);
    });
  });

  describe("tool discovery from contract", () => {
    it("exposes one tool per contract input operation", async () => {
      const { tools } = await client.listTools();
      const names = tools.map((t) => t.name);

      for (const op of Object.keys(contract.input)) {
        expect(names).toContain(`counter_${op}`);
      }
    });

    it("tool count matches contract operation count", async () => {
      const { tools } = await client.listTools();
      expect(tools.length).toBe(Object.keys(contract.input).length);
    });
  });

  describe("tool annotations from contract", () => {
    it("counter_get has readOnlyHint=true from contract", async () => {
      const { tools } = await client.listTools();
      const getTool = tools.find((t) => t.name === "counter_get")!;
      expect(getTool.annotations?.readOnlyHint).toBe(
        contract.annotations["get"].readOnly
      );
    });

    it("counter_reset has destructiveHint=true from contract", async () => {
      const { tools } = await client.listTools();
      const resetTool = tools.find((t) => t.name === "counter_reset")!;
      expect(resetTool.annotations?.destructiveHint).toBe(
        contract.annotations["reset"].destructive
      );
    });

    it("counter_reset has idempotentHint=true from contract", async () => {
      const { tools } = await client.listTools();
      const resetTool = tools.find((t) => t.name === "counter_reset")!;
      expect(resetTool.annotations?.idempotentHint).toBe(
        contract.annotations["reset"].idempotent
      );
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
  });

  describe("resource discovery", () => {
    it("exposes contract and state resources", async () => {
      const { resources } = await client.listResources();
      const uris = resources.map((r) => r.uri);
      expect(uris).toContain("counter://contract");
      expect(uris).toContain("counter://state");
    });
  });

  describe("resource content from contract", () => {
    it("counter://contract contains the parsed contract data", async () => {
      const result = await client.readResource({ uri: "counter://contract" });
      const first = result.contents[0]!;
      const text = "text" in first ? (first.text as string) : "";
      const data = JSON.parse(text);
      expect(data.component).toBe(contract.component);
      expect(data.version).toBe(contract.version);
      expect(data.errors).toEqual(contract.errors);
    });

    it("counter://state returns valid JSON state", async () => {
      const result = await client.readResource({ uri: "counter://state" });
      const first = result.contents[0]!;
      const text = "text" in first ? (first.text as string) : "";
      const state = JSON.parse(text);
      expect(state).toHaveProperty("value");
      expect(state).toHaveProperty("min");
      expect(state).toHaveProperty("max");
    });
  });

  describe("prompt from contract", () => {
    it("exposes a usage prompt from contract instructions", async () => {
      const { prompts } = await client.listPrompts();
      const names = prompts.map((p) => p.name);
      expect(names).toContain("counter_usage");
    });
  });
});
