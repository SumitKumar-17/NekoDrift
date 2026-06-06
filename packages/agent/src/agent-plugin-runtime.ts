import { homedir, tmpdir, userInfo } from "node:os";
import { dirname, join } from "node:path";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";

import { createNekoDriftClient, type NekoDriftClient, type NekoDriftReaction } from "@neko-drift/client";
import { pickHookSpeech, type HookSpeechCategory, validateHookSpeech } from "@neko-drift/agent-events";

import { validateNekoDriftPetArg } from "./agent-previews.js";

export interface AgentPluginOptions {
  readonly pet?: string;
  readonly debug?: boolean;
}

export interface AgentPluginRuntimeOptions extends AgentPluginOptions {
  readonly clientFactory?: () => NekoDriftClient;
  readonly schedule?: (work: () => Promise<void>) => void;
  readonly now?: () => number;
  readonly random?: () => number;
  readonly throttlePath?: string;
  readonly debugLog?: (message: string) => void;
}

export interface AgentPluginDecision {
  readonly reaction?: NekoDriftReaction;
  readonly speechCategory?: HookSpeechCategory;
}

export type AgentHooks = {
  readonly event: (input: { readonly event: unknown }) => void;
  readonly "chat.message": (input: unknown, output: unknown) => void;
  readonly "tool.execute.before": (input: { readonly tool?: string }, output: { readonly args?: unknown }) => void;
  readonly "tool.execute.after": (input: { readonly tool?: string }, output: unknown) => void;
};

const speechCooldownMs = 20_000;
const permissionCooldownMs = 3_000;
const reactionCooldownMs = 10_000;

export function createNekoDriftAgentHooks(options: AgentPluginRuntimeOptions = {}): AgentHooks {
  const pet = options.pet === undefined ? undefined : validateNekoDriftPetArg(options.pet);
  const clientFactory = options.clientFactory ?? (() => createNekoDriftClient({ connectTimeoutMs: 500, responseTimeoutMs: 500 }));
  const schedule = options.schedule ?? defaultSchedule;
  const debug = options.debug === true || process.env.NEKODRIFT_DEBUG === "1";
  const debugLog = options.debugLog ?? ((message) => { if (debug) process.stderr.write(`${message}\n`); });
  let client: NekoDriftClient | undefined;
  let lease: { readonly leaseId: string; readonly expiresAt?: number } | undefined;

  const run = (decision: AgentPluginDecision | undefined): void => {
    if (!decision?.reaction) return;
    const reaction = decision.reaction;
    try {
      schedule(async () => {
        try {
          const shouldSpeak = decision.speechCategory ? shouldSendSpeech(decision.speechCategory, options) : false;
          const shouldReact = shouldSendReaction(reaction, options);
          if (!shouldSpeak && !shouldReact) return;

          client ??= clientFactory();
          const leaseId = pet ? await getLeaseId(client, pet) : undefined;
          if (decision.speechCategory && shouldSpeak) {
            await client.say(validateHookSpeech(pickHookSpeech(decision.speechCategory, options.random)), { reaction, leaseId });
            return;
          }
          await client.react(reaction, { leaseId });
        } catch (error) {
          debugLog(`NekoDrift Agent plugin ignored error: ${sanitizeDebugError(error)}`);
        }
      });
    } catch (error) {
      debugLog(`NekoDrift Agent plugin scheduling ignored error: ${sanitizeDebugError(error)}`);
    }
  };

  const getLeaseId = async (hit: NekoDriftClient, requestedPetId: string): Promise<string | undefined> => {
    if (lease && (!lease.expiresAt || lease.expiresAt - Date.now() > 2_000)) return lease.leaseId;
    try {
      const next = await hit.acquireLease({ requestedPetId });
      lease = { leaseId: next.leaseId, expiresAt: next.expiresAt };
      return next.leaseId;
    } catch (error) {
      debugLog(`NekoDrift Agent lease unavailable: ${sanitizeDebugError(error)}`);
      return undefined;
    }
  };

  return {
    event(input) {
      try {
        run(classifyAgentBusEvent(input.event));
      } catch (error) {
        debugLog(`NekoDrift Agent event ignored error: ${sanitizeDebugError(error)}`);
      }
    },
    "chat.message"() {
      run({ reaction: "thinking" });
    },
    "tool.execute.before"(input, output) {
      const tool = typeof input.tool === "string" ? input.tool : "";
      if (shouldIgnoreNekoDriftTool(tool)) return;
      run({ reaction: classifyAgentToolReaction(tool, output.args) });
    },
    "tool.execute.after"() {
      // Intentionally quiet for now; session.error/session.status events provide less noisy completion signals.
    },
  };
}

export function classifyAgentToolReaction(toolName: string, args?: unknown): NekoDriftReaction | undefined {
  const normalized = toolName.toLowerCase();
  if (/edit|write|patch|apply_patch/.test(normalized)) return "editing";
  if (/bash|shell|terminal/.test(normalized)) return isTestLikeToolArgs(args) ? "testing" : undefined;
  return undefined;
}

export function classifyAgentBusEvent(event: unknown): AgentPluginDecision | undefined {
  const type = getEventType(event);
  if (type === "permission.asked") return shouldIgnoreNekoDriftTool(getEventPermission(event) ?? "") ? undefined : { reaction: "waiting", speechCategory: "permission" };
  if (type === "session.error") return { reaction: "error", speechCategory: "error" };
  if (type === "session.status" && getEventStatusType(event) === "idle") return { reaction: "success" };
  return undefined;
}

export function shouldIgnoreNekoDriftTool(toolName: string): boolean {
  const normalized = toolName.toLowerCase().replace(/[^a-z0-9_:-]+/g, "_");
  return /(?:^|[_:-])nekodrift_(?:nekodrift_)?(?:status|say|react)$/.test(normalized) || /^nekodrift_(?:status|say|react)$/.test(normalized);
}

export function getDefaultAgentThrottlePath(): string {
  if (process.platform === "win32") return join(process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local"), "NekoDrift", "agent-hook-throttle.json");
  const stateHome = process.env.XDG_STATE_HOME || join(homedir(), ".local", "state");
  if (stateHome) return join(stateHome, "nekodrift", "agent-hook-throttle.json");
  return join(tmpdir(), `nekodrift-${safeUid()}`, "agent-hook-throttle.json");
}

function shouldSendSpeech(category: HookSpeechCategory, options: AgentPluginRuntimeOptions): boolean {
  const now = options.now?.() ?? Date.now();
  const cooldown = category === "permission" ? permissionCooldownMs : speechCooldownMs;
  return shouldSendThrottleKey(category, cooldown, now, options.throttlePath ?? getDefaultAgentThrottlePath());
}

function shouldSendReaction(reaction: NekoDriftReaction, options: AgentPluginRuntimeOptions): boolean {
  const now = options.now?.() ?? Date.now();
  return shouldSendThrottleKey(`reaction:${reaction}`, reactionCooldownMs, now, options.throttlePath ?? getDefaultAgentThrottlePath());
}

function shouldSendThrottleKey(key: string, cooldown: number, now: number, path: string): boolean {
  const state = readThrottleState(path);
  const previous = typeof state[key] === "number" ? state[key] : 0;
  if (now - previous < cooldown) return false;
  state[key] = now;
  writeThrottleState(path, state);
  return true;
}

function isTestLikeToolArgs(args: unknown): boolean {
  const command = isRecord(args) && typeof args.command === "string" ? args.command.slice(0, 300) : "";
  return /\b(test|vitest|jest|pytest|npm\s+test|pnpm\s+test|yarn\s+test|cargo\s+test|go\s+test)\b/i.test(command);
}

function getEventType(event: unknown): string | undefined {
  if (!isRecord(event)) return undefined;
  if (typeof event.type === "string") return event.type;
  if (isRecord(event.payload) && typeof event.payload.type === "string") return event.payload.type;
  return undefined;
}

function getEventStatusType(event: unknown): string | undefined {
  if (!isRecord(event)) return undefined;
  const properties = isRecord(event.properties) ? event.properties : isRecord(event.payload) && isRecord(event.payload.properties) ? event.payload.properties : undefined;
  const status = isRecord(properties?.status) ? properties.status : undefined;
  return typeof status?.type === "string" ? status.type : undefined;
}

function getEventPermission(event: unknown): string | undefined {
  if (!isRecord(event)) return undefined;
  const properties = isRecord(event.properties) ? event.properties : isRecord(event.payload) && isRecord(event.payload.properties) ? event.payload.properties : undefined;
  if (typeof properties?.permission === "string") return properties.permission;
  if (Array.isArray(properties?.patterns)) {
    const hit = properties.patterns.find((pattern) => typeof pattern === "string" && shouldIgnoreNekoDriftTool(pattern));
    if (typeof hit === "string") return hit;
  }
  return undefined;
}

function readThrottleState(path: string): Record<string, number> {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
    if (!isRecord(parsed)) return {};
    const state: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if ((key === "thinking" || key === "success" || key === "error" || key === "permission" || key.startsWith("reaction:")) && typeof value === "number" && Number.isFinite(value)) state[key] = value;
    }
    return state;
  } catch {
    return {};
  }
}

function writeThrottleState(path: string, state: Record<string, number>): void {
  try {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    const tempPath = `${path}.${process.pid}.tmp`;
    writeFileSync(tempPath, `${JSON.stringify(state)}\n`, { encoding: "utf8", mode: 0o600 });
    renameSync(tempPath, path);
  } catch {
    // Best effort only; throttling must never break hooks.
  }
}

function defaultSchedule(work: () => Promise<void>): void {
  queueMicrotask(() => { void work(); });
}

function sanitizeDebugError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/(?:[A-Za-z]:)?[\\/][^\s"']{2,}/g, "<path>")
    .replace(/\b(api[_-]?key|secret|password|token)\s*[:=]\s*\S+/gi, "$1=<redacted>")
    .slice(0, 200);
}

function safeUid(): string {
  try { return String(userInfo().uid); } catch { return "user"; }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
