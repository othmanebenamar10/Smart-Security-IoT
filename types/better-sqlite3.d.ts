declare module 'better-sqlite3' {
  export default class Database {
    constructor(filename: string);
    pragma(command: string): void;
    exec(sql: string): void;
    prepare(sql: string): {
      run(...params: unknown[]): unknown;
    };
    close(): void;
  }
}
