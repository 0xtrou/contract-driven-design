import {
  CounterError,
  CounterOutput,
  CounterState,
  DecrementInput,
  IncrementInput,
} from "./types.js";

const DEFAULT_STATE: CounterState = {
  value: 0,
  min: -2147483648,
  max: 2147483647,
};

export function createCounter(
  initial?: Partial<CounterState>
): {
  increment: (input?: IncrementInput) => CounterOutput;
  decrement: (input?: DecrementInput) => CounterOutput;
  get: () => CounterOutput;
  reset: () => CounterOutput;
  state: () => CounterState;
} {
  const state: CounterState = { ...DEFAULT_STATE, ...initial };

  return {
    increment(input?: IncrementInput): CounterOutput {
      const amount = input?.amount ?? 1;

      if (amount < 1 || !Number.isInteger(amount)) {
        throw new CounterError(
          "COUNTER_OVERFLOW",
          "amount must be a positive integer",
          false
        );
      }

      if (state.value > state.max - amount) {
        throw new CounterError(
          "COUNTER_OVERFLOW",
          `Increment by ${amount} would exceed max ${state.max}`,
          false
        );
      }

      state.value += amount;
      return { value: state.value };
    },

    decrement(input?: DecrementInput): CounterOutput {
      const amount = input?.amount ?? 1;

      if (amount < 1 || !Number.isInteger(amount)) {
        throw new CounterError(
          "COUNTER_UNDERFLOW",
          "amount must be a positive integer",
          false
        );
      }

      if (state.value < state.min + amount) {
        throw new CounterError(
          "COUNTER_UNDERFLOW",
          `Decrement by ${amount} would go below min ${state.min}`,
          false
        );
      }

      state.value -= amount;
      return { value: state.value };
    },

    get(): CounterOutput {
      return { value: state.value };
    },

    reset(): CounterOutput {
      state.value = 0;
      return { value: state.value };
    },

    state(): CounterState {
      return { ...state };
    },
  };
}
