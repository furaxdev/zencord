/**
 * @author FuraxDev
 * Rewrites custom emoji syntax (<:name:id> / <a:name:id>) into a Markdown
 * link to the emoji's direct CDN URL — [name](https://cdn.discordapp.com/
 * emojis/id.ext) — so non-Nitro accounts can share custom/animated emojis
 * as a clickable link instead of the native (Nitro-gated) render.
 *
 * Patches the message content parser (found via findByProps on
 * parse/parsePreprocessor/unparse/unparseWithMeta — confirmed against
 * Discord Web's real bundle) rather than MessageActions.sendMessage: the
 * parser is what builds the invalidEmojis list that blocks sending
 * Nitro-locked emojis client-side, before sendMessage is ever called, so
 * patching sendMessage was too late to prevent the send from being
 * rejected. Rewriting here and clearing invalidEmojis means Discord never
 * sees emoji syntax to validate in the first place.
 */

import type { Plugin } from "./index";
import { findByProps } from "../webpack/findByProps";

const EMOJI_PATTERN = /<(a?):(\w+):(\d+)>/g;
const CDN_BASE = "https://cdn.discordapp.com/emojis";
const POLL_INTERVAL_MS = 1000;

interface ParsedContent {
  content?: string;
  invalidEmojis?: unknown[];
  [key: string]: unknown;
}

interface MessageParserModule {
  parse: (...args: unknown[]) => ParsedContent;
}

let originalParse: MessageParserModule["parse"] | undefined;
let patchedModule: MessageParserModule | undefined;
let pollHandle: ReturnType<typeof setInterval> | undefined;

function rewriteEmojisToMarkdownLinks(content: string): string {
  return content.replace(EMOJI_PATTERN, (_match, animatedFlag: string, name: string, id: string) => {
    const extension = animatedFlag === "a" ? "gif" : "png";
    return `[${name}](${CDN_BASE}/${id}.${extension})`;
  });
}

function patchedParse(this: MessageParserModule, ...args: unknown[]): ParsedContent {
  const result = originalParse!.apply(this, args);

  if (typeof result?.content === "string") {
    result.content = rewriteEmojisToMarkdownLinks(result.content);
    result.invalidEmojis = [];
  }

  return result;
}

function tryPatch(): boolean {
  const messageParser = findByProps(
    "parse",
    "parsePreprocessor",
    "unparse",
    "unparseWithMeta",
  ) as MessageParserModule | undefined;
  if (!messageParser) return false;

  originalParse = messageParser.parse;
  messageParser.parse = patchedParse;
  patchedModule = messageParser;
  return true;
}

function restore(): void {
  if (patchedModule && originalParse) {
    patchedModule.parse = originalParse;
  }
  patchedModule = undefined;
  originalParse = undefined;
}

export const fakeNitroPlugin: Plugin = {
  name: "FakeNitro",
  description: "Sends custom emojis as clickable Markdown links to their CDN URL so non-Nitro accounts can use them.",
  enabled: true,
  start(): void {
    if (tryPatch()) return;

    pollHandle = setInterval(() => {
      if (tryPatch() && pollHandle !== undefined) {
        clearInterval(pollHandle);
        pollHandle = undefined;
      }
    }, POLL_INTERVAL_MS);
  },
  stop(): void {
    if (pollHandle !== undefined) {
      clearInterval(pollHandle);
      pollHandle = undefined;
    }
    restore();
  },
};
