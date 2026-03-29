import { describe, it, expect, beforeEach } from "vitest";
import YAML from "yaml";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { buildServer } from "./server.js";
import { loadContract, loadRawContractText } from "./contract.js";

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
const rawContractText = loadRawContractText();

describe("CounterComponent MCP boundary conformance", () => {
  let client: Client;

  beforeEach(async () => {
    const ctx = await createTestClient();
    client = ctx.client;
  });

  describe("tool discovery from contract", () => {
    it("exposes one tool per contract operation", async () => {
      const { tools } = await client.listTools();
      const names = tools.map((tool) => tool.name);

      for (const operation of Object.keys(contract.input)) {
        expect(names).toContain(`counter_${operation}`);
      }
    });

    it("tool count matches contract operation count", async () => {
      const { tools } = await client.listTools();
      expect(tools.length).toBe(Object.keys(contract.input).length);
    });
  });

  describe("tool annotations from contract", () => {
    it("projects readOnlyHint for get", async () => {
      const { tools } = await client.listTools();
      const getTool = tools.find((tool) => tool.name === "counter_get")!;
      expect(getTool.annotations?.readOnlyHint).toBe(
        contract.annotations.get.readOnly
      );
    });

    it("projects destructiveHint for reset", async () => {
      const { tools } = await client.listTools();
      const resetTool = tools.find((tool) => tool.name === "counter_reset")!;
      expect(resetTool.annotations?.destructiveHint).toBe(
        contract.annotations.reset.destructive
      );
    });

    it("projects idempotentHint for reset", async () => {
      const { tools } = await client.listTools();
      const resetTool = tools.find((tool) => tool.name === "counter_reset")!;
      expect(resetTool.annotations?.idempotentHint).toBe(
        contract.annotations.reset.idempotent
      );
    });
  });

  describe("tool execution", () => {
    it("returns contract-shaped success output", async () => {
      const result = await client.callTool(
        { name: "counter_increment", arguments: { amount: 3 } },
        CallToolResultSchema
      );
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(extractText(result));
      expect(parsed).toEqual({ value: 3 });
    });

    it("returns declared error payloads on failure", async () => {
      const result = await client.callTool(
        { name: "counter_increment", arguments: { amount: 2147483648 } },
        CallToolResultSchema
      );

      expect(result.isError).toBe(true);
      const parsed = JSON.parse(extractText(result));
      expect(Object.keys(contract.errors)).toContain(parsed.code);
      expect(parsed.retryable).toBe(contract.errors[parsed.code].retryable);
    });
  });

  describe("resource discovery", () => {
    it("exposes contract and state resources", async () => {
      const { resources } = await client.listResources();
      const uris = resources.map((resource) => resource.uri);
      expect(uris).toContain("counter://contract");
      expect(uris).toContain("counter://state");
    });
  });

  describe("resource content from contract", () => {
    it("counter://contract returns the canonical YAML contract", async () => {
      const result = await client.readResource({ uri: "counter://contract" });
      const first = result.contents[0]!;
      expect(first.mimeType).toBe("application/yaml");
      const text = "text" in first ? (first.text as string) : "";
      expect(text).toBe(rawContractText);
      expect(YAML.parse(text)).toEqual(contract);
    });

    it("counter://state returns boundary-observable state", async () => {
      const result = await client.readResource({ uri: "counter://state" });
      const first = result.contents[0]!;
      expect(first.mimeType).toBe("application/json");
      const text = "text" in first ? (first.text as string) : "";
      expect(JSON.parse(text)).toEqual({ value: expect.any(Number) });
    });
  });

  describe("prompt projection", () => {
    it("exposes usage guidance from contract instructions", async () => {
      const { prompts } = await client.listPrompts();
      const names = prompts.map((prompt) => prompt.name);
      expect(names).toContain("counter_usage");
    });
  });
});
