import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { allowedReactions } from "./local-ipc-protocol.js";
import { pickReactionMessage, reactionMessagePools } from "./reaction-messages.js";

const distDir = dirname(fileURLToPath(import.meta.url));
const appDir = dirname(distDir);
const repoRoot = resolve(appDir, "../..");
const packageJson = JSON.parse(readFileSync(join(appDir, "package.json"), "utf8")) as { scripts?: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string>; description?: string; author?: string };
const rootPackageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as { scripts?: Record<string, string> };
const workspaceConfig = readFileSync(join(repoRoot, "pnpm-workspace.yaml"), "utf8");
const builderConfigPath = join(appDir, "electron-builder.yml");
const builderConfig = readFileSync(builderConfigPath, "utf8");

assert.equal(packageJson.description, "NekoDrift tray-first desktop companion app.");
assert.equal(packageJson.author, "NekoDrift");
assert.match(packageJson.scripts?.["dev:debug"] ?? "", /NEKODRIFT_LOG_LEVEL=debug NEKODRIFT_LOG_CONSOLE=1 pnpm dev/, "desktop debug dev script must enable verbose log mirroring.");
assert.match(packageJson.scripts?.package ?? "", /node scripts\/clean-package-output\.cjs && electron-builder/);
assert.match(packageJson.scripts?.["package:dir"] ?? "", /node scripts\/clean-package-output\.cjs && electron-builder --dir/);
assert.equal(rootPackageJson.scripts?.["package:desktop:dir"], "pnpm build && pnpm --filter @neko-drift/desktop package:dir");
assert.equal(packageJson.dependencies?.["@neko-drift/claude"], "workspace:*");
assert.equal(packageJson.dependencies?.["@neko-drift/cli"], "workspace:*");
assert.equal(packageJson.dependencies?.["@neko-drift/cursor"], "workspace:*");
assert.equal(packageJson.dependencies?.["@neko-drift/mcp"], "workspace:*");
assert.equal(packageJson.dependencies?.["@neko-drift/agent"], "workspace:*");
assert.equal(packageJson.dependencies?.["@neko-drift/agent-events"], "workspace:*");
assert.equal(packageJson.dependencies?.["@img/sharp-win32-x64"], undefined, "sharp platform binaries must stay optional transitive deps, not direct host-breaking dependencies.");
assert.match(workspaceConfig, /supportedArchitectures:[\s\S]*?os:[\s\S]*?- darwin[\s\S]*?- win32[\s\S]*?- linux/, "pnpm must install optional sharp binaries for desktop release OS targets.");
assert.match(workspaceConfig, /supportedArchitectures:[\s\S]*?cpu:[\s\S]*?- x64[\s\S]*?- arm64/, "pnpm must install optional sharp binaries for desktop release CPU targets.");
assert.match(workspaceConfig, /supportedArchitectures:[\s\S]*?libc:[\s\S]*?- glibc/, "pnpm must install optional sharp binaries for Linux glibc release targets.");
assert.match(packageJson.devDependencies?.["electron-builder"] ?? "", /^\^26\.(?:9|[1-9]\d)\./, "desktop AppImage packaging must use electron-builder 26.9+ for conditional Linux sandbox handling.");
assert.match(builderConfig, /appId:\s*dev\.nekodrift\.app/);
assert.match(builderConfig, /productName:\s*NekoDrift/);
assert.match(builderConfig, /executableName:\s*nekodrift/, "desktop packages must use a safe executable name for the stricter AppImage toolset.");
assert.match(builderConfig, /output:\s*dist-electron/);
assert.match(builderConfig, /linux:[\s\S]*?target:[\s\S]*?- AppImage[\s\S]*?- deb[\s\S]*?- rpm[\s\S]*?- tar\.gz/, "desktop Linux packaging must include AppImage, deb, rpm, and tar.gz targets.");
assert.match(builderConfig, /publish:\s*null/);
assert.doesNotMatch(builderConfig, /no-sandbox/, "desktop packaging must not force --no-sandbox for every Linux AppImage launch.");
assert.match(builderConfig, /toolsets:\s*\n\s*appimage:\s*1\.0\.3/, "desktop AppImage packaging must use the AppImage 1.0.3 toolset so the launcher can conditionally fall back when Linux sandboxing is unavailable.");
assert.match(builderConfig, /asar:\s*true/);
assert.match(builderConfig, /asarUnpack:/);
assert.match(builderConfig, /node_modules\/\*\*/);
assert.match(builderConfig, /dist\/\*\*/);
assert.match(builderConfig, /control-center-preload\.cjs/);
assert.match(builderConfig, /pet-preload\.cjs/);
assert.match(builderConfig, /plugin-sdk-preload\.cjs/);
assert.match(builderConfig, /plugin-command-form-preload\.cjs/);
assert.match(builderConfig, /assets\/\*\*/);
assert.match(builderConfig, /extraResources:[\s\S]*from:\s*\.\.\/\.\.\/plugins\/official[\s\S]*to:\s*plugins\/official/, "desktop packages must include bundled official plugins as extra resources.");
assert.match(builderConfig, /icon:\s*assets\/app-icon\.icns/);

assert.ok(existsSync(join(appDir, "control-center-preload.cjs")), "control-center-preload.cjs must exist for Control Center IPC.");
assert.ok(existsSync(join(appDir, "pet-preload.cjs")), "pet-preload.cjs must exist for pet window motion state updates.");
assert.ok(existsSync(join(appDir, "plugin-sdk-preload.cjs")), "plugin-sdk-preload.cjs must exist for JavaScript plugin SDK hosting.");
assert.ok(existsSync(join(appDir, "plugin-command-form-preload.cjs")), "plugin-command-form-preload.cjs must exist for plugin command forms.");
assert.ok(existsSync(join(appDir, "assets", "tray-icon.png")), "tray icon must exist for packaging.");
assert.ok(existsSync(join(appDir, "assets", "app-icon.icns")), "app icon must exist for packaging.");
assert.ok(existsSync(join(appDir, "assets", "app-icon.ico")), "Windows app icon must exist for packaging.");
assertNonEmptyFile(join(appDir, "assets", "default-pet-spritesheet.webp"), "default pet spritesheet must exist for packaging.");
assertNonEmptyFile(join(appDir, "assets", "default-pet-thumbnail.png"), "default pet thumbnail must exist for Pet Manager preview.");
for (const icon of ["claude.svg", "cursor.svg", "agent.svg", "pi.svg", "vscode.svg", "windsurf.svg", "zed.svg"]) {
  assertSafeBundledSvg(join(appDir, "assets", "integrations", icon), `integration icon must be safe and packaged: ${icon}`);
}
assert.match(readFileSync(join(appDir, "src", "assets.ts"), "utf8"), /assets["']?,\s*["']tray-icon\.png|join\("assets", "tray-icon\.png"\)/, "tray icon code must keep using assets/tray-icon.png.");
const petWindowSource = readFileSync(join(appDir, "src", "pet-window.ts"), "utf8");
const controlCenterPreloadSource = readFileSync(join(appDir, "control-center-preload.cjs"), "utf8");
const controlCenterRendererSource = readFileSync(join(appDir, "src", "renderer", "src", "main.tsx"), "utf8");
const petPreloadSource = readFileSync(join(appDir, "pet-preload.cjs"), "utf8");
const reactionMessagesSource = readFileSync(join(appDir, "src", "reaction-messages.ts"), "utf8");
const displaySource = readFileSync(join(appDir, "src", "display.ts"), "utf8");
const updateCheckerSource = readFileSync(join(appDir, "src", "update-checker.ts"), "utf8");
const traySource = readFileSync(join(appDir, "src", "tray.ts"), "utf8");
const windowsSource = readFileSync(join(appDir, "src", "windows.ts"), "utf8");
const agentSetupSource = readFileSync(join(appDir, "src", "agent-setup.ts"), "utf8");
const loggerSource = readFileSync(join(appDir, "src", "logger.ts"), "utf8");
const mainSource = readFileSync(join(appDir, "src", "main.ts"), "utf8");
const localIpcSourceForLogging = readFileSync(join(appDir, "src", "local-ipc.ts"), "utf8");
const localIpcPathsSource = readFileSync(join(appDir, "src", "local-ipc-paths.ts"), "utf8");
const leaseManagerSource = readFileSync(join(appDir, "src", "lease-manager.ts"), "utf8");
const defaultPetControllerSource = readFileSync(join(appDir, "src", "default-pet-controller.ts"), "utf8");
const agentPetControllerSourceForLogging = readFileSync(join(appDir, "src", "agent-pet-controller.ts"), "utf8");
const mappingDoc = readFileSync(join(repoRoot, "docs", "mapping.md"), "utf8");
assert.match(loggerSource, /nekodrift\.log/, "desktop logger must write a user-sendable nekodrift.log file.");
assert.match(loggerSource, /nekodrift\.previous\.log/, "desktop logger must retain a previous log file for bug reports.");
assert.match(loggerSource, /NEKODRIFT_LOG_LEVEL/, "desktop logger must support verbose dev logging via environment.");
assert.match(loggerSource, /normalizeLogLevel\(process\.env\.NEKODRIFT_LOG_LEVEL\) \?\? "debug"/, "desktop production logger must default to debug for user-sendable diagnostics.");
assert.match(loggerSource, /redacted-token/, "desktop logger must redact token-looking values.");
assert.match(mainSource, /initializeLogger\(\)/, "desktop startup must initialize logging before subsystem startup.");
assert.match(mainSource, /process\.platform === "linux"[\s\S]*?appendSwitch\("ozone-platform", "x11"\)/, "Linux desktop pets must prefer X11/Xwayland because GNOME Wayland blocks always-on-top and programmatic window dragging.");
assert.match(mainSource, /hasSwitch\("ozone-platform"\)/, "Linux X11 preference must let users override Electron's Ozone backend explicitly.");
assert.match(traySource, /Open Logs Folder/, "desktop tray must expose user-sendable logs for bug reports.");
assert.match(localIpcSourceForLogging, /request received/, "desktop IPC must log request methods for diagnostics.");
assert.match(localIpcPathsSource, /NEKODRIFT_IPC_BIND[\s\S]*?NEKODRIFT_IPC_ENDPOINT[\s\S]*?validateBindHost[\s\S]*?validateAdvertisedHost/, "WSL NAT IPC must separate bind and advertised endpoints with validation.");
assert.match(localIpcPathsSource, /NEKODRIFT_IPC_ENDPOINT only controls the advertised discovery endpoint[\s\S]*?NEKODRIFT_IPC_BIND to opt into TCP IPC listening/, "NEKODRIFT_IPC_ENDPOINT-only mode must not start TCP listening; NEKODRIFT_IPC_BIND is the explicit TCP opt-in.");
assert.match(localIpcPathsSource, /NEKODRIFT_IPC_ENDPOINT must use the same port as NEKODRIFT_IPC_BIND unless NEKODRIFT_IPC_BIND uses port 0/, "WSL NAT advertised endpoint must not silently override mismatched ports.");
assert.match(leaseManagerSource, /acquired/, "lease manager must log lease acquisition details.");
assert.match(defaultPetControllerSource, /show requested/, "default pet controller must log show lifecycle events.");
assert.match(agentPetControllerSourceForLogging, /show requested/, "agent pet controller must log show lifecycle events.");
assert.ok(petWindowSource.includes("defaultPetSprite.frameWidth * defaultPetSprite.columns") && petWindowSource.includes("defaultPetSprite.frameHeight * defaultPetSprite.rows"), "pet renderer must derive universal spritesheet dimensions from frame size and row/column counts.");
for (const reaction of ["idle", "thinking", "working", "editing", "running", "testing", "waiting", "waving", "success", "error", "celebrating"]) {
  assert.match(reactionMessagesSource, new RegExp(`${reaction}:\\s*\\[`), `reaction messages must define a pool for: ${reaction}`);
}
assert.match(reactionMessagesSource, /satisfies Record<NekoDriftReaction, readonly string\[\]>/, "reaction-only bubble message pools must be exhaustive over NekoDriftReaction.");
assert.match(petWindowSource, /pickReactionMessage\(display\.reaction\)/, "reaction-only bubbles must render randomized messages instead of raw lowercase reaction ids.");
assert.match(petWindowSource, /function preparePetTransientDisplay/, "reaction-only bubbles must prepare a stable random message before rerenders.");
assert.match(petWindowSource, /function mergePetTransientDisplay/, "reaction-only events must not replace an active explicit message bubble.");
assert.match(petWindowSource, /return \{ \.\.\.current, reaction: next\.reaction, dismissToken: next\.dismissToken \?\? current\.dismissToken \}/, "reaction-only updates merged into an active message must carry the latest dismiss token.");
assert.match(petWindowSource, /function getTransientDisplayDurationMs[\s\S]*?12_000[\s\S]*?message\.length \* 70/, "speech bubbles must stay visible longer for longer messages without becoming permanent.");
assert.match(defaultPetControllerSource, /getTransientDisplayDurationMs\(transientDisplay\)/, "default pet speech bubble timeout must be length-aware.");
assert.match(agentPetControllerSourceForLogging, /getTransientDisplayDurationMs\(preparedDisplay\)/, "agent pet speech bubble timeout must be length-aware.");
assert.match(petWindowSource, /function getTransientReactionAnimationMs/, "finite reaction animations must expose their own shorter lifetime.");
assert.match(petWindowSource, /function clearTransientReaction/, "finite reaction animations must be clearable while the bubble remains visible.");
assert.match(petWindowSource, /webContents\.send\("nekodrift:pet-reaction-state"/, "finite reaction animations must clear sprite state without reloading the bubble.");
assert.match(petPreloadSource, /nekodrift:pet-reaction-state/, "pet preload must accept in-place reaction state updates.");
assert.match(petWindowSource, /const webContents = window\.webContents[\s\S]*?const removeListeners = \(\): void => \{[\s\S]*?if \(!webContents\.isDestroyed\(\)\)/, "pet window cleanup must capture webContents and avoid touching destroyed BrowserWindow objects.");
assert.match(petWindowSource, /window\.on\("close", removeListeners\);\s*window\.once\("closed", removeListeners\);/, "pet window cleanup must run before and after close so agent lease release and Cmd/Ctrl+W are idempotent.");
assert.match(displaySource, /width:\s*220/, "pet windows must stay tightly bounded around pet and bubble.");
assert.match(displaySource, /height:\s*320/, "pet windows must be tall enough for adaptive long message bubbles at large pet scale without becoming a huge click shield.");
assert.match(petWindowSource, /function getBubbleClassName/, "pet bubbles must classify explicit messages by length.");
assert.match(petWindowSource, /is-long-message/, "pet bubbles must have a long-message layout.");
assert.match(petWindowSource, /is-very-long-message/, "pet bubbles must have a very-long-message layout for 140-character say messages.");
assert.match(petWindowSource, /body \{ -webkit-app-region: no-drag; pointer-events: none; \}/, "transparent pet window background must not capture clicks or drags.");
assert.match(petWindowSource, /function installMousePassthroughAndDrag/, "pet windows must install real mouse passthrough and controlled drag behavior.");
assert.match(petWindowSource, /setIgnoreMouseEvents\(true, \{ forward: true \}\)/, "transparent pet window background must use OS-level mouse passthrough.");
assert.match(petWindowSource, /setIgnoreMouseEvents\(false\)/, "visible pet and bubble hit targets must re-enable mouse handling.");
assert.match(petWindowSource, /nekodrift:pet-ready/, "pet windows must resync passthrough after each renderer reload.");
assert.match(petWindowSource, /function installMousePassthroughAndDrag[\s\S]*?const rearmPassthrough[\s\S]*?process\.platform !== "win32"[\s\S]*?rearmWindowsMouseForwarding\(reason\)/, "Windows pet reloads must toggle forwarded mouse passthrough to re-register hover and drag tracking.");
assert.match(petWindowSource, /scheduleWindowsMouseForwardingRearm\(`\$\{reason\}\+75ms`, 75\);[\s\S]*?scheduleWindowsMouseForwardingRearm\(`\$\{reason\}\+175ms`, 175\);/, "Windows pet reloads must retry mouse forwarding rearm after load settles.");
assert.match(petWindowSource, /nekodrift:pet-probe-hit-test/, "Windows pet reloads must probe current cursor hit target when mousemove forwarding is stale.");
assert.match(petWindowSource, /export function recoverPetMouseInterop/, "pet windows must expose a controlled mouse interop recovery hook for OS display and resume events.");
assert.match(petWindowSource, /petMouseInteropRecovery\.set\(window, scheduleMouseInteropRecovery\)/, "pet windows must register their mouse interop recovery callback.");
assert.match(petWindowSource, /function installMousePassthroughAndDrag[\s\S]*?scheduleWindowsForwardingWatch[\s\S]*?rearmWindowsMouseForwarding\(reason, false\)[\s\S]*?scheduleWindowsForwardingWatch\(reason\)/, "Windows pet passthrough must keep rearming while idle so hover and drag recover after pet reloads without noisy logs.");
assert.match(petPreloadSource, /nekodrift:pet-probe-hit-test[\s\S]*?elementFromPoint\(clientX, clientY\)[\s\S]*?reportInteractiveHit/, "pet preload must answer main-process cursor hit-test probes.");
assert.match(petWindowSource, /did-finish-load", rearmAfterLoad/, "pet windows must re-arm mouse passthrough after every content load.");
assert.match(petWindowSource, /did-fail-load", handleLoadFailure/, "pet windows must restore passthrough after failed content loads.");
assert.match(petWindowSource, /window\.setIgnoreMouseEvents\(false\);[\s\S]*?await window\.loadFile/, "pet reloads must reset OS mouse passthrough before navigation.");
assert.match(petWindowSource, /function allocateWindowLoadSequence/, "pet content reloads must allocate request sequence before async rendering.");
assert.match(petWindowSource, /tryUpdateLoadedPetContent\(window, render, "default", sequence\)/, "default pet transient updates must avoid BrowserWindow reloads when the pet document is already loaded.");
assert.match(petPreloadSource, /nekodrift:pet-content-state[\s\S]*?document\.body\.innerHTML/, "pet preload must accept sanitized in-place content updates for transient bubbles and badges.");
assert.match(petWindowSource, /windowLoadChains\.set\(window, next\)/, "pet content reloads must serialize loadFile calls per BrowserWindow.");
assert.match(petWindowSource, /next\.catch\(\(\) => \{\}\)\.finally/, "pet content reload chain cleanup must not create unhandled rejections.");
assert.match(petWindowSource, /destroyed-after-write/, "pet content reloads must re-check destroyed windows after writing HTML.");
assert.match(petWindowSource, /process\.platform === "win32" \? "none" : "drop-shadow/, "Windows pet windows must avoid CSS drop-shadow on transparent layered windows.");
assert.match(petWindowSource, /process\.platform === "win32" \? "none" : "blur\(10px\)"/, "Windows pet windows must avoid backdrop-filter on transparent layered windows.");
assert.match(petWindowSource, /\.pet-shell[\s\S]*?-webkit-app-region: no-drag; cursor: grab;/, "pet dragging must avoid Electron draggable regions so right-click context menus work.");
assert.match(petPreloadSource, /nekodrift:pet-hit-test/, "pet preload must report visible pet and bubble hit testing for passthrough.");
assert.match(petPreloadSource, /nekodrift:pet-ready/, "pet preload must report readiness after installing mouse handlers.");
assert.match(petPreloadSource, /nekodrift:pet-drag-start/, "pet preload must start controlled pet dragging from the sprite.");
assert.match(defaultPetControllerSource, /powerMonitor\.on\("resume", recoverDefaultPetWindowAfterResume\)/, "default pet must recover mouse interop after Windows sleep or resume.");
assert.match(defaultPetControllerSource, /recoverDefaultPetMouseInterop\("display-change"\)/, "default pet must recover mouse interop after monitor topology changes.");
assert.match(windowsSource, /recoverDefaultPetMouseInterop\("default-pet-changed"\)/, "changing default pet must recover mouse interop for dragging without app restart.");
assert.match(petWindowSource, /function installPetContextMenu/, "pet windows must install a native right-click context menu.");
assert.match(petWindowSource, /webContents\.on\("context-menu"/, "pet context menu must be handled in the Electron main process.");
assert.match(petWindowSource, /Menu\.buildFromTemplate/, "pet context menu must use a small native Electron menu.");
assert.doesNotMatch(petPreloadSource, /setIgnoreMouseEvents/, "pet preload must not call Electron window APIs directly.");
const agentPetControllerSource = readFileSync(join(appDir, "src", "agent-pet-controller.ts"), "utf8");
const localIpcSource = readFileSync(join(appDir, "src", "local-ipc.ts"), "utf8");
assert.match(agentPetControllerSource, /dismissedAgentPets = new Set<string>/, "agent pets must remember manual close while leases remain active.");
assert.match(agentPetControllerSource, /dismissAgentPetForActiveLease/, "agent pet context-menu close must dismiss the pet for the active lease.");
assert.match(agentPetControllerSource, /dismissedAgentPets\.has\(petId\)/, "dismissed agent pets must not reopen on later same-lease reactions.");
assert.match(agentPetControllerSource, /function clearAgentPetLeaseState/, "agent pet lease cleanup must clear dismissal, timers, and hidden transient state.");
assert.match(localIpcSource, /handleLastExplicitLease/, "agent pet dismissal must clear when the explicit lease group ends.");
assert.match(localIpcSource, /clearAgentPetLeaseState\(petId\)/, "last explicit lease cleanup must reset dismissed agent pet state.");
assert.match(localIpcSource, /reason: applied\.reason/, "IPC responses must report dismissed explicit pet events as not shown.");
assert.match(updateCheckerSource, /alvinunreal\/nekodrift/, "GitHub release notice must check the public NekoDrift repository.");
assert.match(updateCheckerSource, /api\.github\.com\/repos\/\$\{githubRepository\}\/releases\/latest/, "update checker must use GitHub latest release API.");
assert.match(updateCheckerSource, /shell\.openExternal\(url\)/, "update action must open the GitHub release page externally.");
assert.match(traySource, /Update available:/, "tray menu must surface available updates.");
assert.match(windowsSource, /nekodrift:check-for-updates/, "settings window must be able to trigger update checks.");
assert.match(windowsSource, /nekodrift:get-reaction-animation-settings/, "settings window must be able to load reaction animation metadata.");
assert.match(windowsSource, /reactionAnimationOverrides/, "settings window must be able to persist reaction animation overrides.");
assert.match(windowsSource, /nekodrift-pet-preview/, "settings reaction preview must use a scoped internal pet preview protocol.");
assert.match(windowsSource, /nekodrift:open-update-release-page/, "settings window must be able to open the release page.");
assert.match(controlCenterPreloadSource, /checkForUpdates/, "Control Center preload must expose update checks.");
assert.match(controlCenterPreloadSource, /getReactionAnimationSettings/, "Control Center preload must expose reaction animation settings metadata.");
assert.match(controlCenterRendererSource, /function SettingsView\(\)/, "Control Center must include the settings page.");
assert.match(controlCenterRendererSource, /getPetsState/, "Control Center must include the pets page data bridge.");
assert.match(controlCenterRendererSource, /function IntegrationsView\(\)/, "Control Center must include the integrations page.");
assert.match(petWindowSource, /max-width:\s*min\(220px/, "very long message bubbles must stay capped within the tight pet window.");
assert.match(petWindowSource, /-webkit-line-clamp:\s*8/, "very long message bubbles must allow enough visible lines.");
assert.match(petWindowSource, /createSpriteStateCss\("\.sprite"\)/, "built-in sprite CSS must react to reaction state.");
assert.match(petWindowSource, /createSpriteStateCss\("\.installed-sprite"\)/, "installed sprite CSS must react to reaction state.");
assert.match(petWindowSource, /html\[data-motion-state=\"\$\{motion\}\"\] \$\{selector\}/, "sprite CSS must let drag motion override reaction state.");
assert.match(petWindowSource, /\.sprite, \.installed-sprite, \.bubble/, "reduced-motion CSS must include built-in and installed sprites.");
assert.match(petWindowSource, /function createAgentPetWindow[\s\S]*?installMotionStatePublisher\(window\)/, "agent pet windows must publish motion state so dragged non-default pets run.");
assert.match(petWindowSource, /loadExplicitPetContent[\s\S]*?state\.preferences\.petScale/, "explicit agent pet windows must use the saved pet scale preference.");
assert.match(petWindowSource, /interface AgentPetWindowOptions[\s\S]*?readonly scale: PetScaleValue/, "new agent pet windows must receive the current pet scale explicitly for their first render.");
assert.match(petWindowSource, /loadExplicitPetContent\(window, options\.petId, options\.display, options\.badge, dismissToken, options\.scale\)/, "agent pet first render must not fall back to the medium default scale.");
assert.match(agentPetControllerSourceForLogging, /function getPreferredPetScale\(\): PetScaleValue/, "agent pet reloads must share one explicit saved scale helper.");
assert.match(agentPetControllerSourceForLogging, /loadExplicitPetContent\(window, petId, display, badge, getCurrentDismissToken\(petId, display, badge\), scale\)/, "agent pet refreshes must pass the saved pet scale explicitly.");
assert.match(agentPetControllerSourceForLogging, /loadExplicitPetContent\(window, petId, preparedDisplay, statusBadges\.get\(petId\) \?\? null, preparedDisplay\.dismissToken, getPreferredPetScale\(\)\)/, "agent pet transient updates must pass the saved pet scale explicitly.");
assert.match(mappingDoc, /\| 3 \| `waving` \| `waving`, Claude `Notification`\. \|/, "mapping docs must describe waving animation row and notification mapping.");
assert.match(mappingDoc, /reaction-animation-mapping\.ts/, "mapping docs must reference the shared reaction animation mapping source of truth.");
assert.match(mappingDoc, /overrid/i, "mapping docs must mention that reaction animation defaults can be overridden in Settings.");
assert.doesNotMatch(mappingDoc, /bubble-only|currently \*\*bubble states\*\*/i, "mapping docs must not describe reactions as bubble-only.");
for (const reaction of allowedReactions) {
  const pool = reactionMessagePools[reaction];
  assert.ok(pool.length >= 8, `reaction message pool must include clear variants for: ${reaction}`);
  for (const message of pool) {
    assert.match(message, /^[A-Z]/, `reaction message must start uppercase: ${message}`);
    assert.doesNotMatch(message, /[\r\n]/, `reaction message must be single-line: ${message}`);
    assert.ok(message.length <= 36, `reaction message must stay bubble-friendly: ${message}`);
  }
}
assert.equal(pickReactionMessage("success", () => 0), reactionMessagePools.success[0], "reaction message picking must be deterministic when random is injected.");
assert.doesNotMatch(controlCenterRendererSource, /OnboardingView|getOnboardingSnapshot|completeOnboarding/, "Control Center must not include the removed onboarding route.");
assert.match(controlCenterRendererSource, /function IntegrationsView\(\)/, "Control Center must include integrations.");
assert.match(controlCenterRendererSource, /Claude Code/, "Control Center integrations must include Claude Code.");
// Agent integration check - verified via agent status types
assert.match(controlCenterRendererSource, /Cursor/, "Control Center integrations must include Cursor.");
assert.match(controlCenterRendererSource, /Pi/, "Control Center integrations must include Pi.");
// JSONC safety check - handled in agent-setup.ts
assert.match(windowsSource, /refreshDefaultPetContent\(\);\s*refreshAgentPetContent\(\);/, "pet scale preference changes must refresh default and agent pet windows.");
assert.ok(existsSync(join(appDir, "scripts", "clean-package-output.cjs")), "package output cleanup helper must exist.");
assert.ok(existsSync(join(distDir, "main.js")), "desktop main build output must exist before packaging checks run.");
assert.ok(existsSync(join(repoRoot, "packages", "claude", "dist", "index.js")), "@neko-drift/claude must be built before packaging.");
assert.ok(existsSync(join(repoRoot, "packages", "client", "dist", "index.js")), "@neko-drift/client must be built before packaging.");
assert.ok(existsSync(join(repoRoot, "packages", "mcp", "dist", "index.js")), "@neko-drift/mcp must be built before packaging.");
assert.ok(existsSync(join(repoRoot, "packages", "cli", "dist", "index.js")), "@neko-drift/cli must be built before packaging.");
assert.ok(existsSync(join(repoRoot, "packages", "agent", "dist", "plugin.js")), "@neko-drift/agent plugin must be built before packaging.");
assert.ok(existsSync(join(repoRoot, "packages", "agent-events", "dist", "index.js")), "@neko-drift/agent-events must be built before packaging.");

if (process.argv.includes("--output")) {
  checkPackageOutput();
} else {
  checkCleanupHelper();
}

console.error("Packaging contract validation passed.");

function checkPackageOutput(): void {
  const outputDir = join(appDir, "dist-electron");
  assert.ok(existsSync(outputDir), "dist-electron output must exist after packaging.");
  assertNoForbiddenOutput(outputDir);
  assertNoEscapingSymlinks(outputDir);

  const appResourceDir = findPackagedAppResourceDir(outputDir);
  assert.ok(appResourceDir, "packaged app resources directory was not found.");
  assert.ok(existsSync(join(appResourceDir, "app.asar")), "packaged app.asar is missing.");
  assertBundledOfficialPlugins(appResourceDir);
  const appContents = join(appResourceDir, "app.asar.unpacked");
  assert.ok(existsSync(appContents), "packaged app.asar.unpacked resources are missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "@neko-drift", "claude", "dist", "index.js")), "packaged @neko-drift/claude runtime is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "@neko-drift", "claude", "dist", "cli.js")), "packaged @neko-drift/claude CLI runtime is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "@neko-drift", "claude", "package.json")), "packaged @neko-drift/claude package metadata is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "@neko-drift", "client", "dist", "index.js")), "packaged @neko-drift/client runtime is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "@neko-drift", "client", "package.json")), "packaged @neko-drift/client package metadata is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "@neko-drift", "mcp", "dist", "index.js")), "packaged @neko-drift/mcp runtime is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "@neko-drift", "mcp", "package.json")), "packaged @neko-drift/mcp package metadata is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "@neko-drift", "cli", "dist", "index.js")), "packaged @neko-drift/cli runtime is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "@neko-drift", "opencode", "dist", "plugin.js")), "packaged @neko-drift/agent plugin runtime is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "@neko-drift", "opencode", "package.json")), "packaged @neko-drift/agent package metadata is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "@neko-drift", "cursor", "dist", "index.js")), "packaged @neko-drift/cursor runtime is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "@neko-drift", "cursor", "package.json")), "packaged @neko-drift/cursor package metadata is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "@neko-drift", "agent-events", "dist", "index.js")), "packaged @neko-drift/agent-events runtime is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "@modelcontextprotocol", "sdk")), "packaged MCP SDK runtime dependency is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "zod", "index.cjs")), "packaged zod runtime dependency is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "yauzl", "index.js")), "packaged yauzl runtime dependency is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "yauzl", "fd-slicer.js")), "packaged yauzl fd-slicer helper is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "buffer-crc32", "index.js")), "packaged yauzl transitive dependency buffer-crc32 is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "pend", "index.js")), "packaged yauzl transitive dependency pend is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "sharp", "lib", "index.js")), "packaged sharp runtime is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "@img", "sharp-win32-x64", "lib", "sharp-win32-x64.node")), "packaged Windows x64 sharp native binary is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "@img", "sharp-linux-x64", "lib", "sharp-linux-x64.node")), "packaged Linux x64 sharp native binary is missing.");
  assert.ok(existsSync(join(appContents, "node_modules", "@img", "sharp-darwin-x64", "lib", "sharp-darwin-x64.node")), "packaged macOS x64 sharp native binary is missing.");
  assertRegularNonSymlink(join(appContents, "node_modules", "@neko-drift", "mcp", "dist", "index.js"));
  assertRegularNonSymlink(join(appContents, "node_modules", "@neko-drift", "cli", "dist", "index.js"));
  assertRegularNonSymlink(join(appContents, "node_modules", "@neko-drift", "opencode", "dist", "plugin.js"));
  assertRegularNonSymlink(join(appContents, "node_modules", "@neko-drift", "claude", "dist", "cli.js"));
  assertCommandSmoke(appContents);
}

function findPackagedAppResourceDir(outputDir: string): string | null {
  const candidates: string[] = [];
  collectDirectories(outputDir, candidates, 4);

  for (const dir of candidates) {
    if (existsSync(join(dir, "app.asar")) || existsSync(join(dir, "app", "dist", "main.js"))) {
      return dir;
    }
  }

  return null;
}

function collectDirectories(dir: string, result: string[], depth: number): void {
  if (depth < 0 || !existsSync(dir)) return;
  result.push(dir);
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) collectDirectories(join(dir, entry.name), result, depth - 1);
  }
}

function assertNoForbiddenOutput(outputDir: string): void {
  const forbiddenSegments = new Set(["v1", "web", ".env", ".claude"]);
  for (const path of walk(outputDir)) {
    const rel = relative(outputDir, path);
    const segments = rel.split(/[\\/]/g);
    assert.ok(!segments.includes("docs") || !segments.includes("phases"), `package output must not include phase docs: ${rel}`);
    for (const segment of segments) {
      assert.ok(!forbiddenSegments.has(segment) && !segment.startsWith(".env"), `package output contains forbidden path segment: ${rel}`);
    }
  }
}

function assertNoEscapingSymlinks(outputDir: string): void {
  const outputReal = realpathSync(outputDir);
  for (const path of walk(outputDir)) {
    const stat = lstatSync(path);
    if (!stat.isSymbolicLink()) continue;
    const target = realpathSync(path);
    assert.ok(isInside(outputReal, target), `package output symlink escapes package directory: ${relative(outputDir, path)} -> ${target}`);
  }
}

function walk(dir: string): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    result.push(path);
    if (entry.isDirectory()) {
      result.push(...walk(path));
    }
  }
  return result;
}

function isInside(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function checkCleanupHelper(): void {
  const sentinel = join(appDir, "dist-electron", ".nekodrift-clean-sentinel");
  mkdirSync(dirname(sentinel), { recursive: true });
  writeFileSync(sentinel, "stale", "utf8");
  const result = spawnSync(process.execPath, [join(appDir, "scripts", "clean-package-output.cjs")], { cwd: appDir, encoding: "utf8" });
  assert.equal(result.status, 0, `cleanup helper failed: ${result.stderr || result.stdout}`);
  assert.ok(!existsSync(sentinel), "cleanup helper did not remove stale package output sentinel.");
}

function assertRegularNonSymlink(path: string): void {
  assert.ok(!lstatSync(path).isSymbolicLink(), `packaged command file must not be a symlink: ${path}`);
  assert.ok(lstatSync(path).isFile(), `packaged command file must be regular: ${path}`);
}

function assertNonEmptyFile(path: string, message: string): void {
  assert.ok(existsSync(path), message);
  const stat = lstatSync(path);
  assert.ok(stat.isFile(), message);
  assert.ok(stat.size > 0, message);
}

function assertBundledOfficialPlugins(resourceDir: string): void {
  for (const id of ["nekodrift.ambient-companion", "nekodrift.break-buddy", "nekodrift.pet-pal", "nekodrift.focus-buddy", "nekodrift.wander-buddy", "nekodrift.quick-reminders", "nekodrift.github-notifications"]) {
    const dir = join(resourceDir, "plugins", "official", id);
    const manifestPath = join(dir, "nekodrift.plugin.json");
    assertNonEmptyFile(manifestPath, `packaged bundled plugin manifest is missing: ${id}`);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { entry?: string };
    if (manifest.entry) assertNonEmptyFile(join(dir, manifest.entry), `packaged bundled plugin entry is missing: ${id}`);
  }
}

function assertSafeBundledSvg(path: string, message: string): void {
  assertNonEmptyFile(path, message);
  const source = readFileSync(path, "utf8");
  assert.doesNotMatch(source, /<script\b/i, `${message}: script tags are not allowed.`);
  assert.doesNotMatch(source, /\son[a-z]+\s*=/i, `${message}: event attributes are not allowed.`);
  assert.doesNotMatch(source, /(?:href|xlink:href)\s*=\s*["'](?:https?:|file:|javascript:)/i, `${message}: external or script hrefs are not allowed.`);
  assert.doesNotMatch(source.replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/gi, ""), /https?:\/\//i, `${message}: remote references are not allowed.`);
}

function assertCommandSmoke(appContents: string): void {
  const mcpEntry = join(appContents, "node_modules", "@neko-drift", "mcp", "dist", "index.js");
  const mcp = spawnSync(process.execPath, [mcpEntry, "--version"], { encoding: "utf8" });
  assert.equal(mcp.status, 0, `packaged MCP command smoke failed: ${mcp.stderr || mcp.stdout}`);

  const hookEntry = join(appContents, "node_modules", "@neko-drift", "claude", "dist", "cli.js");
  const hook = spawnSync(process.execPath, [hookEntry, "hook", "--nekodrift-managed"], {
    input: JSON.stringify({ hook_event_name: "Notification", message: "safe" }),
    encoding: "utf8",
    env: { ...process.env, NEKODRIFT_DISCOVERY_FILE: join(appContents, "missing-ipc.json") },
  });
  assert.equal(hook.status, 0, `packaged Claude hook command smoke failed: ${hook.stderr || hook.stdout}`);
  assert.equal(hook.stdout, "");

  const agentPlugin = join(appContents, "node_modules", "@neko-drift", "opencode", "dist", "plugin.js");
  const plugin = spawnSync(process.execPath, ["--input-type=module", "--eval", `const mod = await import(${JSON.stringify(`file://${agentPlugin}`)}); if (!mod.default?.server || !mod.default?.id) process.exit(2);`], { encoding: "utf8" });
  assert.equal(plugin.status, 0, `packaged Agent plugin smoke failed: ${plugin.stderr || plugin.stdout}`);
}
