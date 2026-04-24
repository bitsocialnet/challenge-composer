/// <reference types="vite/client" />

// Injected by Vite's `define` from package.json at build time.
declare const __APP_VERSION__: string;

declare module "virtual:challenge-metadata" {
  export interface OptionInput {
    option: string;
    label: string;
    default?: string;
    description?: string;
    placeholder?: string;
    required?: boolean;
  }

  export interface ChallengeMetadata {
    /** Short identifier. Built-ins use the pkc-js name; externals use the package name minus `@scope/` and `-challenge`. */
    name: string;
    /** Only set for externals. The npm specifier the composer emits as the `path` field. */
    packageName?: string;
    description?: string;
    type?: string;
    optionInputs: ReadonlyArray<OptionInput>;
  }

  export const BUILTIN_CHALLENGES: ReadonlyArray<ChallengeMetadata>;
  export const EXTERNAL_CHALLENGES: ReadonlyArray<ChallengeMetadata>;
}
