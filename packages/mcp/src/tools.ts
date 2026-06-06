import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { allowedReactions, createNekoDriftClient, NekoDriftClientError, type NekoDriftClient, type NekoDriftLeaseResult, type NekoDriftReaction, type NekoDriftStatusResult } from "@neko-drift/client";
import { z } from "zod";

export const reactionSchema = z.enum(allowedReactions);

export const saySchema = z.object({
  message: z.string().trim().min(1).max(140)
    .refine((value) => !/[\r\n]/.test(value), "Message must be single-line.")
    .refine((value) => !/```|<script|function\s+\w+|=>|\b(class|import|export|const|let|var)\b/.test(value), "Message looks like code.")
    .refine((value) => !/https?:\/\/|www\.|\/[\w.-]+\/[\w./-]+|[A-Za-z]:\\/.test(value), "Message contains URL or path-like content.")
    .refine((value) => !/(api[_-]?key|secret|token|password|passwd|BEGIN [A-Z ]+PRIVATE KEY)/i.test(value), "Message looks secret-like."),
  reaction: reactionSchema.optional(),
});

export const reactSchema = z.object({ reaction: reactionSchema });

export interface NekoDriftMcpStatus {
  readonly [key: string]: unknown;
  ok: boolean;
  appRunning: boolean;
  configuredPetId?: string;
  actualTargetPetId?: string;
  actualTargetPetName?: string;
  usingDefaultPet: boolean;
  routingImplemented: boolean;
  unavailableReason?: string;
  fallbackReason?: string;
}

export interface LeaseContext {
  lease?: NekoDriftLeaseResult;
  staleLeaseId?: string;
  degradedReason?: string;
}

export interface ToolContext {
  readonly configuredPetId?: string;
  readonly client?: NekoDriftClient;
  readonly lease?: LeaseContext;
  readonly leaseReady?: Promise<void>;
}

export function createToolContext(configuredPetId?: string): ToolContext & { readonly client: NekoDriftClient } {
  return {
    configuredPetId,
    client: createNekoDriftClient(),
  };
}

export async function handleStatus(context: ToolContext): Promise<CallToolResult> {
  await context.leaseReady;
  const client = context.client ?? createNekoDriftClient();
  const leaseId = context.lease?.lease?.leaseId ?? context.lease?.staleLeaseId;
  const status = await client.status({ leaseId });
  const structured = createMcpStatus(status, context.configuredPetId, context.lease?.lease, context.lease?.degradedReason, context.lease?.staleLeaseId);
  const configuredText = context.configuredPetId
    ? `Configured --pet ${context.configuredPetId}; actual target is ${structured.actualTargetPetId ?? "unavailable"}.`
    : "No --pet configured; actual target is the desktop default pet.";

  if (!structured.appRunning) {
    return {
      content: [{ type: "text", text: `NekoDrift is unavailable. ${configuredText} ${structured.unavailableReason ?? "Open the NekoDrift desktop app and try again."}` }],
      structuredContent: structured,
    };
  }

  return {
    content: [{ type: "text", text: `NekoDrift is running. ${configuredText}` }],
    structuredContent: structured,
  };
}

async function ensureLease(context: ToolContext): Promise<boolean> {
  if (context.lease?.lease) return true;
  try {
    const client = context.client ?? createNekoDriftClient();
    const newLease = await client.acquireLease({ requestedPetId: context.configuredPetId });
    if (context.lease) {
      context.lease.lease = newLease;
      context.lease.staleLeaseId = undefined;
      context.lease.degradedReason = undefined;
    }
    return !!newLease;
  } catch {
    return false;
  }
}

export async function handleReact(input: unknown, context: ToolContext): Promise<CallToolResult> {
  await context.leaseReady;
  const parsed = reactSchema.safeParse(input);
  if (!parsed.success) return toolError("Invalid reaction. Use one of: " + allowedReactions.join(", "));
  if (!(await ensureLease(context))) return toolError(`NekoDrift lease is unavailable. ${sanitizeUnavailableReason(context.lease?.degradedReason) ?? "Open NekoDrift and try again."}`);

  try {
    const client = context.client ?? createNekoDriftClient();
    const result = await client.react(parsed.data.reaction, { leaseId: context.lease!.lease!.leaseId });
    return {
      content: [{ type: "text", text: `NekoDrift reaction sent: ${parsed.data.reaction}` }],
      structuredContent: { ok: true, reaction: parsed.data.reaction, result },
    };
  } catch (error) {
    return toolError(`NekoDrift desktop app is not running or local IPC is unavailable. ${sanitizeError(error)}`);
  }
}

export async function handleSay(input: unknown, context: ToolContext): Promise<CallToolResult> {
  await context.leaseReady;
  const parsed = saySchema.safeParse(input);
  if (!parsed.success) return toolError("Invalid message. Keep it short, single-line, and avoid code, secrets, URLs, and file paths.");
  if (!(await ensureLease(context))) return toolError(`NekoDrift lease is unavailable. ${sanitizeUnavailableReason(context.lease?.degradedReason) ?? "Open NekoDrift and try again."}`);

  try {
    const client = context.client ?? createNekoDriftClient();
    const result = await client.say(parsed.data.message, { reaction: parsed.data.reaction, leaseId: context.lease!.lease!.leaseId });
    return {
      content: [{ type: "text", text: "NekoDrift message sent." }],
      structuredContent: { ok: true, result },
    };
  } catch (error) {
    return toolError(`NekoDrift desktop app is not running or local IPC is unavailable. ${sanitizeError(error)}`);
  }
}

export function createMcpStatus(status: NekoDriftStatusResult, configuredPetId?: string, lease?: NekoDriftLeaseResult, degradedReason?: string, staleLeaseId?: string): NekoDriftMcpStatus {
  if (status.leaseActive === false || staleLeaseId) {
    return {
      ok: false,
      appRunning: status.appRunning === true,
      configuredPetId,
      usingDefaultPet: true,
      routingImplemented: true,
      unavailableReason: sanitizeUnavailableReason(degradedReason ?? status.unavailableReason ?? status.staleReason),
      leaseId: typeof status.leaseId === "string" ? status.leaseId : staleLeaseId,
      leaseActive: false,
      staleReason: typeof status.staleReason === "string" ? status.staleReason : "unknown_lease",
    } as NekoDriftMcpStatus;
  }
  if (lease) {
    const statusTargetPetId = typeof status.actualTargetPetId === "string" ? status.actualTargetPetId : undefined;
    const statusTargetPetName = typeof status.actualTargetPetName === "string" ? status.actualTargetPetName : undefined;
    const statusUsingDefault = typeof status.usingDefaultPet === "boolean" ? status.usingDefaultPet : undefined;
    const statusFallbackReason = typeof status.fallbackReason === "string" ? status.fallbackReason : undefined;
    return {
      ok: status.appRunning === true && status.ok !== false,
      appRunning: status.appRunning === true,
      configuredPetId,
      actualTargetPetId: statusTargetPetId ?? lease.actualTargetPetId,
      actualTargetPetName: statusTargetPetName ?? lease.actualTargetPetName,
      usingDefaultPet: statusUsingDefault ?? lease.usingDefaultPet,
      routingImplemented: true,
      fallbackReason: statusFallbackReason ?? lease.fallbackReason,
      leaseId: lease.leaseId,
      leaseActive: lease.leaseActive,
    };
  }
  const defaultPet = isRecord(status.defaultPet) ? status.defaultPet : undefined;
  const actualTargetPetId = typeof defaultPet?.id === "string" ? defaultPet.id : undefined;
  const actualTargetPetName = typeof defaultPet?.displayName === "string" ? defaultPet.displayName : undefined;
  const appRunning = status.appRunning === true;

  return {
    ok: appRunning && status.ok !== false,
    appRunning,
    configuredPetId,
    actualTargetPetId,
    actualTargetPetName,
    usingDefaultPet: true,
    routingImplemented: true,
    unavailableReason: appRunning ? undefined : sanitizeUnavailableReason(degradedReason ?? status.unavailableReason),
    fallbackReason: undefined,
  };
}

export function toolError(message: string): CallToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

export function sanitizeUnavailableReason(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0) return "NekoDrift desktop app is unavailable.";
  if (/\/|\\|\.sock|pipe|token|ipc\.json|ENOENT|ECONNREFUSED|EACCES/i.test(value)) {
    return "NekoDrift desktop app or local IPC is unavailable.";
  }
  return value.slice(0, 160);
}

function sanitizeError(error: unknown): string {
  if (error instanceof NekoDriftClientError) return sanitizeUnavailableReason(error.message) ?? "NekoDrift is unavailable.";
  return "Open NekoDrift and try again.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export type { NekoDriftReaction };
