/**
 * @author FuraxDev
 * Patches Discord's MessageActions.sendMessage to rewrite custom emoji
 * syntax (<:name:id> / <a:name:id>) into direct CDN links before sending,
 * letting non-Nitro accounts post custom/animated emojis as embeds.
 */

import type { Plugin } from "./index";
import { findByProps } from "../webpack/findByProps";

const EMOJI_PATTERN = /<(a?):(\w+):(\d+)>/g;
const CDN_BASE = "https://cdn.discordapp.com/emojis";
const POLL_INTERVAL_MS = 1000;

interface OutgoingMessage {
  content?: string;
  [key: string]: unknown;
}

interface MessageActionsModule {
  sendMessage: (channelId: string, message: OutgoingMessage, ...rest: unknown[]) => unknown;
}

let originalSendMessage: MessageActionsModule["sendMessage"] | undefined;
let patchedModule: MessageActionsModule | undefined;
let pollHandle: ReturnType<typeof setInterval> | undefined;

function rewriteContent(content: string): string {
  return content.replace(EMOJI_PATTERN, (_match, animatedFlag: string, _name: string, id: string) => {
    const extension = animatedFlag === "a" ? "gif" : "png";
    return `${CDN_BASE}/${id}.${extension}`;
  });
}

function patchedSendMessage(
  this: MessageActionsModule,
  channelId: string,
  message: OutgoingMessage,
  ...rest: unknown[]
): unknown {
  const patchedMessage = message?.content ? { ...message, content: rewriteContent(message.content) } : message;
  return originalSendMessage!.call(this, channelId, patchedMessage, ...rest);
}

function tryPatch(): boolean {
  const messageActions = findByProps("sendMessage", "editMessage") as MessageActionsModule | undefined;
  if (!messageActions) return false;

  originalSendMessage = messageActions.sendMessage;
  messageActions.sendMessage = patchedSendMessage;
  patchedModule = messageActions;
  return true;
}

function restore(): void {
  if (patchedModule && originalSendMessage) {
    patchedModule.sendMessage = originalSendMessage;
  }
  patchedModule = undefined;
  originalSendMessage = undefined;
}

export const fakeNitroPlugin: Plugin = {
  name: "FakeNitro",
  description: "Sends custom emojis as direct CDN links so non-Nitro accounts can use them.",
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
