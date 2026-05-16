declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void): void;
declare function expect<T>(value: T): {
  toEqual(expected: unknown): void;
  toThrow(expected?: string | RegExp): void;
};
