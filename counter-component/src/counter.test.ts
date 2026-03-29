import { describe, it, expect, beforeEach } from "vitest";
import { createCounter } from "./counter.js";
import { getDefaultState, loadContract } from "./contract.js";
import { CounterError } from "./types.js";

const contract = loadContract();

describe("CounterComponent contract conformance", () => {
  let counter: ReturnType<typeof createCounter>;

  beforeEach(() => {
    counter = createCounter(getDefaultState(contract));
  });

  describe("get", () => {
    it("returns initial value of 0", () => {
      expect(counter.get()).toEqual({ value: 0 });
    });

    it("never modifies state", () => {
      counter.increment({ amount: 5 });
      const before = counter.state();
      counter.get();
      counter.get();
      counter.get();
      const after = counter.state();
      expect(before).toEqual(after);
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

    it("throws COUNTER_OVERFLOW when exceeding max", () => {
      const c = createCounter({ ...getDefaultState(contract), value: 2147483647, max: 2147483647 });
      expect(() => c.increment()).toThrowError(CounterError);
    });

    it("does not modify state on overflow", () => {
      const c = createCounter({ ...getDefaultState(contract), value: 100, max: 100 });
      const before = c.state();
      expect(() => c.increment()).toThrowError(CounterError);
      expect(c.state()).toEqual(before);
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

    it("throws COUNTER_UNDERFLOW when going below min", () => {
      const c = createCounter({ ...getDefaultState(contract), value: 0, min: 0 });
      expect(() => c.decrement()).toThrowError(CounterError);
    });

    it("does not modify state on underflow", () => {
      const c = createCounter({ ...getDefaultState(contract), value: 0, min: 0 });
      const before = c.state();
      expect(() => c.decrement()).toThrowError(CounterError);
      expect(c.state()).toEqual(before);
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

  describe("output shape", () => {
    it("always returns { value: integer }", () => {
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

  describe("bounded state", () => {
    it("value stays within [min, max] across operations", () => {
      const c = createCounter({ ...getDefaultState(contract), min: -5, max: 5 });

      for (let i = 0; i < 5; i++) c.increment();
      expect(c.get().value).toBe(5);

      expect(() => c.increment()).toThrowError(CounterError);
      expect(c.get().value).toBe(5);

      for (let i = 0; i < 10; i++) c.decrement();
      expect(c.get().value).toBe(-5);

      expect(() => c.decrement()).toThrowError(CounterError);
      expect(c.get().value).toBe(-5);
    });
  });

  describe("error taxonomy matches contract", () => {
    it("only throws error codes declared in the contract", () => {
      const declaredCodes = Object.keys(contract.errors);
      const c = createCounter({ ...getDefaultState(contract), min: 0, max: 0, value: 0 });

      const collectedCodes: string[] = [];

      try { c.increment(); } catch (e) {
        if (e instanceof CounterError) collectedCodes.push(e.code);
      }
      try { c.decrement(); } catch (e) {
        if (e instanceof CounterError) collectedCodes.push(e.code);
      }

      expect(collectedCodes.length).toBe(2);
      for (const code of collectedCodes) {
        expect(declaredCodes).toContain(code);
      }
    });

    it("error retryable flag matches the contract", () => {
      const c = createCounter({ ...getDefaultState(contract), max: 0, value: 0 });

      try { c.increment(); } catch (e) {
        if (e instanceof CounterError) {
          expect(e.retryable).toBe(contract.errors[e.code].retryable);
        }
      }
    });
  });
});
