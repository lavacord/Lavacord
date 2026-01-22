/**
 * @module Lavacord
 */
export * from "./lib/LavalinkNode";
export * from "./lib/Player";
export * from "./lib/Manager";
export * from "./lib/Rest";
export * from "./lib/Types";

// This is a placeholder for the version of the library, which should be injected during build time
// this need to be explicitly typed as string.
// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const VERSION: string = "[VI]{{inject}}[/VI]";
