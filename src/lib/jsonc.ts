import { parse, type ParseError, printParseErrorCode } from "jsonc-parser";

export interface JsoncParseResult<T> {
  value: T | undefined;
  errors: string[];
}

export function parseJsonc<T = unknown>(text: string): JsoncParseResult<T> {
  const errors: ParseError[] = [];
  const value = parse(text, errors, { allowTrailingComma: true, disallowComments: false }) as T | undefined;
  return {
    value,
    errors: errors.map((e) => `${printParseErrorCode(e.error)} at offset ${e.offset}`)
  };
}

export function stringifyJson(value: unknown): string {
  return JSON.stringify(value, null, 2) + "\n";
}
