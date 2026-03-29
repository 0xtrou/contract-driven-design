import { describe, it, expect } from "vitest";
import {
  getDefaultState,
  getErrorInfo,
  getOperationAnnotations,
  getOperationInputSchema,
  loadContract,
} from "./contract.js";

describe("contract runtime", () => {
  it("loads the YAML contract", () => {
    const contract = loadContract();
    expect(contract.component).toBe("CounterComponent");
    expect(contract.version).toBe("1.0.0");
  });

  it("derives default state from the contract", () => {
    const contract = loadContract();
    expect(getDefaultState(contract)).toEqual({
      value: 0,
      min: -2147483648,
      max: 2147483647,
    });
  });

  it("derives increment input schema from the contract", () => {
    const contract = loadContract();
    const schema = getOperationInputSchema(contract, "increment");
    expect(schema).toHaveProperty("amount");
  });

  it("reads operation annotations from the contract", () => {
    const contract = loadContract();
    expect(getOperationAnnotations(contract, "get")).toEqual({
      readOnly: true,
      destructive: false,
      idempotent: true,
      openWorld: false,
    });
  });

  it("reads error metadata from the contract", () => {
    const contract = loadContract();
    expect(getErrorInfo(contract, "COUNTER_OVERFLOW")).toEqual({
      retryable: false,
      description: "Increment would exceed maximum value",
    });
  });
});
