import { describe, it, expect, beforeEach } from "vitest";
import { createCounter } from "./counter.js";
import { getDefaultState, loadContract } from "./contract.js";
import { CounterError } from "./types.js";

const contract = loadContract();

function expectContractError(error: unknown) {
  expect(error).toBeInstanceOf(CounterError);
  const contractError = error as CounterError;
  expect(Object.keys(contract.errors)).toContain(contractError.code);
  expect(contractError.retryable).toBe(contract.errors[contractError.code].retryable);
  return contractError;
}

describe("CounterComponent boundary conformance", () => {
  let counter: ReturnType<typeof createCounter>;

  beforeEach(() => {
    counter = createCounter(getDefaultState(contract));
  });

  describe("get", () => {
    it("returns the current value", () => {
      expect(counter.get()).toEqual({ value: 0 });
    });

    it("does not change the observable value", () => {
      counter.increment({ amount: 5 });
      const before = counter.get();
      counter.get();
      counter.get();
      counter.get();
      const after = counter.get();
      expect(after).toEqual(before);
    });
  });

  describe("increment", () => {
    it("increments by 1 by default", () => {
      expect(counter.increment()).toEqual({ value: 1 });
    });

    it("increments by specified amount", () => {
      expect(counter.increment({ amount: 5 })).toEqual({ value: 5 });
    });

    it("increases value by exactly the requested amount", () => {
      const before = counter.get().value;
      counter.increment({ amount: 7 });
      const after = counter.get().value;
      expect(after - before).toBe(7);
    });

    it("returns a declared error when exceeding max", () => {
      const bounded = createCounter({
        ...getDefaultState(contract),
        value: 2147483647,
        max: 2147483647,
      });

      try {
        bounded.increment();
        expect.fail("expected increment to fail");
      } catch (error) {
        const contractError = expectContractError(error);
        expect(contractError.code).toBe("COUNTER_OVERFLOW");
      }
    });

    it("does not change the observable value on failure", () => {
      const bounded = createCounter({
        ...getDefaultState(contract),
        value: 100,
        max: 100,
      });
      const before = bounded.get();

      try {
        bounded.increment();
      } catch {
      }

      expect(bounded.get()).toEqual(before);
    });
  });

  describe("decrement", () => {
    it("decrements by 1 by default", () => {
      counter.increment({ amount: 5 });
      expect(counter.decrement()).toEqual({ value: 4 });
    });

    it("decrements by specified amount", () => {
      counter.increment({ amount: 10 });
      expect(counter.decrement({ amount: 3 })).toEqual({ value: 7 });
    });

    it("decreases value by exactly the requested amount", () => {
      counter.increment({ amount: 10 });
      const before = counter.get().value;
      counter.decrement({ amount: 4 });
      const after = counter.get().value;
      expect(before - after).toBe(4);
    });

    it("returns a declared error when going below min", () => {
      const bounded = createCounter({
        ...getDefaultState(contract),
        value: 0,
        min: 0,
      });

      try {
        bounded.decrement();
        expect.fail("expected decrement to fail");
      } catch (error) {
        const contractError = expectContractError(error);
        expect(contractError.code).toBe("COUNTER_UNDERFLOW");
      }
    });

    it("does not change the observable value on failure", () => {
      const bounded = createCounter({
        ...getDefaultState(contract),
        value: 0,
        min: 0,
      });
      const before = bounded.get();

      try {
        bounded.decrement();
      } catch {
      }

      expect(bounded.get()).toEqual(before);
    });
  });

  describe("reset", () => {
    it("sets value to 0", () => {
      counter.increment({ amount: 42 });
      expect(counter.reset()).toEqual({ value: 0 });
    });

    it("is idempotent", () => {
      counter.increment({ amount: 10 });
      counter.reset();
      counter.reset();
      counter.reset();
      expect(counter.get()).toEqual({ value: 0 });
    });
  });

  describe("output boundary", () => {
    it("always returns { value: integer } on success", () => {
      for (const op of [
        () => counter.get(),
        () => counter.increment(),
        () => counter.decrement(),
        () => counter.reset(),
      ]) {
        const result = op();
        expect(result).toHaveProperty("value");
        expect(Number.isInteger(result.value)).toBe(true);
      }
    });
  });

  describe("bounded behavior", () => {
    it("never returns values outside the declared bounds", () => {
      const bounded = createCounter({
        ...getDefaultState(contract),
        min: -5,
        max: 5,
      });

      for (let i = 0; i < 5; i++) bounded.increment();
      expect(bounded.get().value).toBe(5);

      try {
        bounded.increment();
      } catch {
      }
      expect(bounded.get().value).toBe(5);

      for (let i = 0; i < 10; i++) bounded.decrement();
      expect(bounded.get().value).toBe(-5);

      try {
        bounded.decrement();
      } catch {
      }
      expect(bounded.get().value).toBe(-5);
    });
  });

  describe("error taxonomy", () => {
    it("only emits error codes declared in the contract", () => {
      const declaredCodes = Object.keys(contract.errors);
      const bounded = createCounter({
        ...getDefaultState(contract),
        min: 0,
        max: 0,
        value: 0,
      });

      const collectedCodes: string[] = [];

      try {
        bounded.increment();
      } catch (error) {
        collectedCodes.push(expectContractError(error).code);
      }

      try {
        bounded.decrement();
      } catch (error) {
        collectedCodes.push(expectContractError(error).code);
      }

      expect(collectedCodes.length).toBe(2);
      for (const code of collectedCodes) {
        expect(declaredCodes).toContain(code);
      }
    });
  });
});
