import { pickHookSpeech, validateHookSpeech } from "@neko-drift/agent-events";
import { allowedReactions, createNekoDriftClient, type NekoDriftClient, type NekoDriftReaction } from "@neko-drift/client";

export interface NekoDriftPiOptions {
  readonly clientFactory?: () => NekoDriftClient;
  readonly schedule?: (work: () => Promise<void>) => void;
  readonly debug?: boolean;
  readonly debugLog?: (message: string) => void;
  readonly random?: () => number;
  readonly now?: () => number;
}

export interface NekoDriftPiRuntime {
  readonly handleEvent: (event: unknown) => void;
  readonly handleCommand: (args: string, ctx?: NekoDriftPiCommandContext) => Promise<void>;
}

export interface NekoDriftPiExtensionApi {
  readonly on?: (eventName: string, handler: (event: unknown, ctx?: unknown) => unknown) => unknown;
  readonly registerCommand?: (name: string, command: { readonly description?: string; readonly handler: (args: string, ctx?: unknown) => unknown }) => unknown;
}

export interface NekoDriftPiCommandContext {
  readonly ui?: {
    readonly notify?: (message: string, type?: "info" | "warning" | "error") => void;
  };
}

export interface PiEventDecision {
  readonly reaction?: NekoDriftReaction;
  readonly speech?: "error";
  readonly markError?: boolean;
  readonly clearError?: boolean;
}

export interface PiEventEnvelope {
  readonly type: string;
  readonly payload?: unknown;
}

export type NekoDriftPiCommand =
  | { readonly kind: "help" }
  | { readonly kind: "status" }
  | { readonly kind: "test" }
  | { readonly kind: "react"; readonly reaction: NekoDriftReaction }
  | { readonly kind: "say"; readonly message: string };

const automaticTimeoutMs = 500;
const errorSuccessSuppressionMs = 5_000;
const boundedCommandSliceLength = 300;

export const allowedPiNekoDriftCommands = ["help", "status", "test", "react", "say"] as const;

export function createNekoDriftPiExtension(pi: unknown, options: NekoDriftPiOptions = {}): NekoDriftPiRuntime {
  const runtime = createNekoDriftPiRuntime(options);
  const api = isPiApi(pi) ? pi : undefined;
  if (!api) return runtime;

  const subscribe = (eventName: string): void => {
    api.on?.(eventName, (event) => runtime.handleEvent({ type: eventName, payload: event }));
  };

  for (const eventName of ["session_start", "session_shutdown", "agent_start", "agent_end", "turn_start", "tool_execution_start", "tool_execution_end"]) {
    subscribe(eventName);
  }

  api.registerCommand?.("nekodrift", {
    description: "Control NekoDrift desktop pet reactions and check local connection status.",
    handler: async (args, ctx) => runtime.handleCommand(args, isCommandContext(ctx) ? ctx : undefined),
  });

  return runtime;
}

export function createNekoDriftPiRuntime(options: NekoDriftPiOptions = {}): NekoDriftPiRuntime {
  const clientFactory = options.clientFactory ?? (() => createNekoDriftClient({ connectTimeoutMs: automaticTimeoutMs, responseTimeoutMs: automaticTimeoutMs }));
  const schedule = options.schedule ?? defaultSchedule;
  const debug = options.debug === true || process.env.NEKODRIFT_PI_DEBUG === "1";
  const debugLog = options.debugLog ?? ((message) => {
    if (debug) process.stderr.write(`${message}\n`);
  });
  let client: NekoDriftClient | undefined;
  let recentErrorAt = Number.NEGATIVE_INFINITY;
  let lastErrorSpeechAt = Number.NEGATIVE_INFINITY;

  const getClient = (): NekoDriftClient => {
    client ??= clientFactory();
    return client;
  };

  const runAutomatic = (decision: PiEventDecision | undefined): void => {
    if (!decision?.reaction) return;
    const reaction = decision.reaction;
    if (decision.markError) recentErrorAt = options.now?.() ?? Date.now();
    if (decision.clearError && (options.now?.() ?? Date.now()) - recentErrorAt < errorSuccessSuppressionMs) return;

    try {
      schedule(async () => {
        try {
          if (decision.speech === "error" && shouldSendErrorSpeech()) {
            await getClient().say(validateHookSpeech(pickHookSpeech("error", options.random)), { reaction });
            return;
          }
          await getClient().react(reaction);
        } catch (error) {
          debugLog(`NekoDrift Pi extension ignored error: ${sanitizeDebugError(error)}`);
        }
      });
    } catch (error) {
      debugLog(`NekoDrift Pi extension scheduling ignored error: ${sanitizeDebugError(error)}`);
    }
  };

  const shouldSendErrorSpeech = (): boolean => {
    const now = options.now?.() ?? Date.now();
    if (now - lastErrorSpeechAt < 20_000) return false;
    lastErrorSpeechAt = now;
    return true;
  };

  return {
    handleEvent(event) {
      try {
        runAutomatic(classifyPiEvent(event));
      } catch (error) {
        debugLog(`NekoDrift Pi event ignored error: ${sanitizeDebugError(error)}`);
      }
    },
    async handleCommand(args, ctx) {
      try {
        const command = parseNekoDriftCommand(args);
        await executeCommand(command, getClient(), ctx);
      } catch (error) {
        notify(ctx, sanitizeUserError(error), "error");
      }
    },
  };
}

export function classifyPiEvent(event: unknown): PiEventDecision | undefined {
  const envelope = normalizePiEvent(event);
  const type = envelope.type;
  const record = isRecord(envelope.payload) ? envelope.payload : isRecord(event) ? event : {};
  switch (type) {
    case "session_start":
      return { reaction: "waving" };
    case "session_shutdown":
      return { reaction: "idle" };
    case "agent_start":
      return { reaction: "thinking" };
    case "turn_start":
      return { reaction: "working" };
    case "agent_end":
      return { reaction: "success", clearError: true };
    case "tool_execution_start": {
      const reaction = classifyPiToolExecutionStart(record.toolName, record.args);
      return reaction ? { reaction } : undefined;
    }
    case "tool_execution_end":
      return record.isError === true ? { reaction: "error", speech: "error", markError: true } : undefined;
    default:
      return undefined;
  }
}

export function normalizePiEvent(event: unknown): PiEventEnvelope {
  if (isRecord(event) && typeof event.type === "string") {
    return { type: event.type, payload: "payload" in event ? event.payload : event };
  }
  return { type: "", payload: event };
}

export function classifyPiToolExecutionStart(toolName: unknown, args?: unknown): NekoDriftReaction | undefined {
  const normalized = typeof toolName === "string" ? toolName.toLowerCase() : "";
  if (!normalized || shouldIgnoreNekoDriftTool(normalized)) return undefined;
  if (/edit|write|patch|apply/.test(normalized)) return "editing";
  if (/bash|shell|terminal|exec|command/.test(normalized)) return isTestLikeArgs(args) ? "testing" : "running";
  return "working";
}

export function shouldIgnoreNekoDriftTool(toolName: string): boolean {
  const normalized = toolName.toLowerCase().replace(/[^a-z0-9_:/.-]+/g, "_");
  return /(?:^|[_:/.-])nekodrift(?:[_:/.-]|$)/.test(normalized) || /^nekodrift_(?:status|say|react)$/.test(normalized);
}

export function parseNekoDriftCommand(args: string): NekoDriftPiCommand {
  const trimmed = args.trim();
  if (!trimmed || trimmed === "help" || trimmed === "--help" || trimmed === "-h") return { kind: "help" };
  const [head = "", ...rest] = trimmed.split(/\s+/);
  const tail = trimmed.slice(head.length).trim();
  switch (head.toLowerCase()) {
    case "status":
      if (rest.length > 0) throw new Error("Usage: /nekodrift status");
      return { kind: "status" };
    case "test":
      if (rest.length > 0) throw new Error("Usage: /nekodrift test");
      return { kind: "test" };
    case "react": {
      if (rest.length !== 1) throw new Error("Usage: /nekodrift react <reaction>");
      return { kind: "react", reaction: validateReaction(rest[0] ?? "") };
    }
    case "say":
      return { kind: "say", message: validateManualSpeech(tail) };
    default:
      throw new Error(`Unknown /nekodrift command: ${head}`);
  }
}

export function validateManualSpeech(message: string): string {
  const trimmed = message.trim();
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/i.test(trimmed)) throw new Error("NekoDrift speech must not contain secrets.");
  return validateHookSpeech(trimmed);
}

export function getPiNekoDriftHelp(): string {
  return "NekoDrift commands: /nekodrift status, /nekodrift test, /nekodrift react <reaction>, /nekodrift say <message>.";
}

async function executeCommand(command: NekoDriftPiCommand, client: NekoDriftClient, ctx?: NekoDriftPiCommandContext): Promise<void> {
  switch (command.kind) {
    case "help":
      notify(ctx, getPiNekoDriftHelp(), "info");
      return;
    case "status": {
      const status = await client.status();
      notify(ctx, status.ok ? "NekoDrift is connected." : `NekoDrift unavailable: ${sanitizeStatusReason(status.unavailableReason)}`, status.ok ? "info" : "warning");
      return;
    }
    case "test":
      await client.say("Pi connected", { reaction: "waving" });
      notify(ctx, "NekoDrift test sent.", "info");
      return;
    case "react":
      await client.react(command.reaction);
      notify(ctx, `NekoDrift reaction set: ${command.reaction}`, "info");
      return;
    case "say":
      await client.say(command.message);
      notify(ctx, "NekoDrift message sent.", "info");
      return;
  }
}

function isTestLikeArgs(args: unknown): boolean {
  const command = isRecord(args) && typeof args.command === "string" ? args.command.slice(0, boundedCommandSliceLength) : "";
  return /\b(test|vitest|jest|pytest|npm\s+test|pnpm\s+test|yarn\s+test|cargo\s+test|go\s+test)\b/i.test(command);
}

function validateReaction(value: string): NekoDriftReaction {
  if (!allowedReactions.includes(value as NekoDriftReaction)) throw new Error("Invalid NekoDrift reaction.");
  return value as NekoDriftReaction;
}

function notify(ctx: NekoDriftPiCommandContext | undefined, message: string, type: "info" | "warning" | "error"): void {
  ctx?.ui?.notify?.(message, type);
}

function defaultSchedule(work: () => Promise<void>): void {
  void Promise.resolve().then(work).catch(() => undefined);
}

function sanitizeDebugError(error: unknown): string {
  if (!error) return "unknown";
  if (isRecord(error) && typeof error.code === "string") return sanitizeKnownErrorCode(error.code);
  if (error instanceof Error) return error.name.replace(/[^a-z0-9_-]/gi, "_").slice(0, 80) || "Error";
  return "unknown";
}

function sanitizeKnownErrorCode(code: string): string {
  const normalized = code.toLowerCase();
  if (normalized.includes("enoent")) return "ENOENT";
  if (normalized.includes("econnrefused")) return "ECONNREFUSED";
  if (normalized.includes("connect_timeout")) return "connect_timeout";
  if (normalized.includes("response_timeout")) return "response_timeout";
  if (normalized.includes("connection_closed")) return "connection_closed";
  if (normalized.includes("unavailable")) return "unavailable";
  return "NekoDriftClientError";
}

function sanitizeUserError(error: unknown): string {
  return error instanceof Error ? error.message.replace(/[\r\n]+/g, " ").slice(0, 140) : "NekoDrift command failed.";
}

function sanitizeStatusReason(reason: unknown): string {
  const text = typeof reason === "string" ? reason : "not running";
  if (/ENOENT|ECONNREFUSED|connect_timeout|response_timeout|unavailable/i.test(text)) return "not running";
  return "unavailable";
}

function isPiApi(value: unknown): value is NekoDriftPiExtensionApi {
  return isRecord(value) && (typeof value.on === "function" || typeof value.registerCommand === "function");
}

function isCommandContext(value: unknown): value is NekoDriftPiCommandContext {
  return isRecord(value) && (value.ui === undefined || isRecord(value.ui));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
