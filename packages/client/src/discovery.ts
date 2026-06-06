import { existsSync, lstatSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";

import { isRecord, maxIpcMessageBytes, openPetsIpcProtocol, openPetsIpcVersion, NekoDriftClientError } from "./protocol.js";

export interface NekoDriftDiscoveryFile {
  readonly protocolVersion: 1;
  readonly protocol: "nekodrift-ipc";
  readonly endpoint: string;
  readonly token: string;
  readonly appVersion: string;
  readonly pid: number;
  readonly platform: NodeJS.Platform;
}

export type ParsedIpcEndpoint =
  | { readonly kind: "tcp"; readonly host: string; readonly port: number }
  | { readonly kind: "path"; readonly path: string };

export function getDiscoveryFilePath(): string {
  if (process.env.NEKODRIFT_DISCOVERY_FILE) {
    return process.env.NEKODRIFT_DISCOVERY_FILE;
  }

  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Application Support", "NekoDrift", "runtime", "ipc.json");
  }

  if (process.platform === "win32") {
    return join(process.env.APPDATA ?? join(homedir(), "AppData", "Roaming"), "NekoDrift", "runtime", "ipc.json");
  }

  const xdg = getSecureXdgRuntimeDir();
  if (xdg) {
    return join(xdg, "nekodrift", "ipc.json");
  }

  return join(process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), "NekoDrift", "runtime", "ipc.json");
}

export function readDiscoveryFile(path = getDiscoveryFilePath()): NekoDriftDiscoveryFile {
  let raw: string;
  try {
    const stat = statSync(path);
    if (!stat.isFile()) throw new NekoDriftClientError("invalid_discovery", "NekoDrift discovery path is not a file.");
    if (stat.size > maxIpcMessageBytes) throw new NekoDriftClientError("invalid_discovery", "NekoDrift discovery file is too large.");
    raw = readFileSync(path, "utf8");
  } catch (error) {
    if (error instanceof NekoDriftClientError) throw error;
    throw new NekoDriftClientError("unavailable", `NekoDrift discovery file is unavailable: ${error instanceof Error ? error.message : "unknown error"}`);
  }

  if (Buffer.byteLength(raw, "utf8") > maxIpcMessageBytes) {
    throw new NekoDriftClientError("invalid_discovery", "NekoDrift discovery file is too large.");
  }

  try {
    return validateDiscovery(JSON.parse(raw) as unknown);
  } catch (error) {
    if (error instanceof NekoDriftClientError) throw error;
    throw new NekoDriftClientError("invalid_discovery", "NekoDrift discovery file is malformed JSON.");
  }
}

export function validateDiscovery(value: unknown): NekoDriftDiscoveryFile {
  if (!isRecord(value)) throw new NekoDriftClientError("invalid_discovery", "Discovery must be an object.");
  if (value.protocol !== openPetsIpcProtocol) throw new NekoDriftClientError("invalid_discovery", "Discovery protocol is invalid.");
  if (value.protocolVersion !== openPetsIpcVersion) throw new NekoDriftClientError("invalid_discovery", "Discovery protocol version is invalid.");
  if (typeof value.endpoint !== "string") throw new NekoDriftClientError("invalid_discovery", "Discovery endpoint is invalid.");
  if (typeof value.token !== "string" || value.token.length < 16 || value.token.length > 256) throw new NekoDriftClientError("invalid_discovery", "Discovery token is invalid.");
  if (typeof value.appVersion !== "string") throw new NekoDriftClientError("invalid_discovery", "Discovery app version is invalid.");
  if (typeof value.pid !== "number" || !Number.isInteger(value.pid) || value.pid <= 0) throw new NekoDriftClientError("invalid_discovery", "Discovery pid is invalid.");
  if (value.platform !== "darwin" && value.platform !== "linux" && value.platform !== "win32") throw new NekoDriftClientError("invalid_discovery", "Discovery platform is invalid.");

  const endpoint = parseIpcEndpoint(value.endpoint);
  if (value.platform !== process.platform && !allowsCrossPlatformDiscovery(value.platform, endpoint)) {
    throw new NekoDriftClientError("invalid_discovery", "Discovery platform does not match this client.");
  }

  return {
    protocolVersion: openPetsIpcVersion,
    protocol: openPetsIpcProtocol,
    endpoint: value.endpoint,
    token: value.token,
    appVersion: value.appVersion,
    pid: value.pid,
    platform: value.platform as NodeJS.Platform,
  };
}

export function validateEndpoint(endpoint: string): void {
  parseIpcEndpoint(endpoint);
}

export function parseIpcEndpoint(endpoint: string): ParsedIpcEndpoint {
  if (endpoint.length < 1 || endpoint.length > 240) throw new NekoDriftClientError("invalid_discovery", "Discovery endpoint length is invalid.");
  if (endpoint.includes("\0")) throw new NekoDriftClientError("invalid_discovery", "Discovery endpoint contains NUL.");

  if (endpoint.startsWith("tcp://")) {
    return parseTcpEndpoint(endpoint);
  }

  if (process.platform === "win32") {
    if (!endpoint.startsWith("\\\\.\\pipe\\nekodrift-") || endpoint.includes("/")) {
      throw new NekoDriftClientError("invalid_discovery", "Discovery endpoint is not an NekoDrift named pipe.");
    }
    return { kind: "path", path: endpoint };
  }

  if (!endpoint.startsWith("/") || endpoint.includes("://") || endpoint.includes("..")) {
    throw new NekoDriftClientError("invalid_discovery", "Discovery endpoint is not an absolute Unix socket path.");
  }

  if (!basename(endpoint).startsWith("nekodrift-") || !basename(endpoint).endsWith(".sock")) {
    throw new NekoDriftClientError("invalid_discovery", "Discovery endpoint filename is not an NekoDrift socket.");
  }

  const parent = dirname(endpoint);
  const parentName = basename(parent);
  const isTmpRuntime = parent.startsWith("/tmp/") && parentName.startsWith("nekodrift-");
  const isXdgRuntime = parentName === "nekodrift";
  if (!isTmpRuntime && !isXdgRuntime) {
    throw new NekoDriftClientError("invalid_discovery", "Discovery endpoint is outside an expected NekoDrift runtime directory.");
  }

  return { kind: "path", path: endpoint };
}

function parseTcpEndpoint(endpoint: string): ParsedIpcEndpoint {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new NekoDriftClientError("invalid_discovery", "Discovery TCP endpoint is invalid.");
  }

  if (url.protocol !== "tcp:" || url.username || url.password || (url.pathname !== "" && url.pathname !== "/") || url.search || url.hash) {
    throw new NekoDriftClientError("invalid_discovery", "Discovery TCP endpoint must be tcp://<host>:<port> with no credentials, path, query, or fragment.");
  }

  const host = url.hostname;

  // Reject 0.0.0.0 - not a valid target address
  if (host === "0.0.0.0") {
    throw new NekoDriftClientError("invalid_discovery", "Discovery TCP endpoint cannot use 0.0.0.0 as target host.");
  }

  // Validate IPv4 format
  if (!isValidIpv4(host)) {
    throw new NekoDriftClientError("invalid_discovery", "Discovery TCP endpoint host must be a valid IPv4 address.");
  }

  // Reject hostnames (contain letters)
  if (/[a-zA-Z]/.test(host)) {
    throw new NekoDriftClientError("invalid_discovery", "Discovery TCP endpoint host must be an IPv4 address, not a hostname.");
  }

  // Validate that it's a private/local address (loopback, private, or link-local)
  if (!isPrivateOrLocalIpv4(host)) {
    throw new NekoDriftClientError("invalid_discovery", `Discovery TCP endpoint host ${host} is not a private/local IPv4 address. Only loopback (127.0.0.1), private (10.x.x.x, 172.16-31.x.x, 192.168.x.x), or link-local (169.254.x.x) addresses are allowed.`);
  }

  const port = Number(url.port);
  if (!Number.isInteger(port) || port < 1 || port > 65_535 || String(port) !== url.port) {
    throw new NekoDriftClientError("invalid_discovery", "Discovery TCP endpoint port is invalid.");
  }

  return { kind: "tcp", host, port };
}

function isValidIpv4(host: string): boolean {
  const parts = host.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = Number(part);
    return String(num) === part && num >= 0 && num <= 255;
  });
}

function isPrivateOrLocalIpv4(host: string): boolean {
  const parts = host.split(".").map(Number);
  if (parts.length !== 4) return false;

  // Loopback: 127.0.0.0/8
  if (parts[0] === 127) return true;

  // Private: 10.0.0.0/8
  if (parts[0] === 10) return true;

  // Private: 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  // Private: 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;

  // Link-local: 169.254.0.0/16
  if (parts[0] === 169 && parts[1] === 254) return true;

  return false;
}

function allowsCrossPlatformDiscovery(platform: NodeJS.Platform, endpoint: ParsedIpcEndpoint): boolean {
  // Allow cross-platform discovery for TCP endpoints when:
  // - Desktop is Windows (win32) and client is Linux (WSL)
  // - The endpoint is a private/local IPv4 address (not just loopback)
  if (endpoint.kind !== "tcp" || platform !== "win32" || process.platform !== "linux") {
    return false;
  }
  // Additional validation: ensure the host is a valid private/local IPv4
  return isPrivateOrLocalIpv4(endpoint.host);
}

function getSecureXdgRuntimeDir(): string | null {
  const dir = process.env.XDG_RUNTIME_DIR;
  if (!dir || !existsSync(dir)) return null;
  try {
    const stat = lstatSync(dir);
    if (!stat.isDirectory() || stat.isSymbolicLink()) return null;
    if (typeof process.getuid === "function" && stat.uid !== process.getuid()) return null;
    if ((stat.mode & 0o777) !== 0o700) return null;
    return dir;
  } catch {
    return null;
  }
}
