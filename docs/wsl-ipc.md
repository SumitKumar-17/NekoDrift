# WSL and cross-OS IPC

NekoDrift normally uses OS-native local IPC:

- Windows desktop app: Windows named pipe
- macOS/Linux desktop app: Unix socket

That works when the desktop app and MCP process run in the same OS environment. For Windows desktop + WSL agent workflows, use the opt-in TCP transport instead.

## Modes of operation

### Mirrored mode (recommended)

WSL2 with **mirrored networking mode** allows WSL processes to reach Windows services bound to `127.0.0.1`. This is the simplest and safest configuration.

**Windows (PowerShell):**
```powershell
$env:NEKODRIFT_IPC_BIND = "tcp://127.0.0.1:37645"
$env:NEKODRIFT_IPC_ENDPOINT = "tcp://127.0.0.1:37645"
NekoDrift.exe
```

**WSL (Bash):**
```bash
export NEKODRIFT_DISCOVERY_FILE="/mnt/c/Users/<WindowsUser>/AppData/Roaming/NekoDrift/runtime/ipc.json"
npx -y @neko-drift/mcp
```

### NAT mode

WSL2 with **NAT networking mode** requires the Windows app to listen on an address WSL can reach and to advertise the Windows host IP to WSL clients.

**Step 1: Get the Windows host IP from WSL**

```bash
# In WSL, get the Windows host IP
WIN_HOST=$(ip route show | grep -i default | awk '{ print $3 }')
echo "Windows host IP: $WIN_HOST"
```

**Step 2: Configure Windows desktop app**

```powershell
# Bind to all interfaces for incoming connections from WSL.
# This can expose the port on private/LAN interfaces if Windows Firewall allows it.
$env:NEKODRIFT_IPC_BIND = "tcp://0.0.0.0:37645"
# Advertise the Windows host IP to WSL clients
$env:NEKODRIFT_IPC_ENDPOINT = "tcp://172.25.32.1:37645"  # Replace with your actual WIN_HOST
NekoDrift.exe
```

If you know the specific Windows virtual adapter address that WSL can reach, you can bind that address instead of `0.0.0.0` to reduce exposure.

**Step 3: Configure WSL client**

```bash
export NEKODRIFT_DISCOVERY_FILE="/mnt/c/Users/<WindowsUser>/AppData/Roaming/NekoDrift/runtime/ipc.json"
npx -y @neko-drift/mcp
```

If you use OpenCode, prefer putting the discovery-file override directly in the OpenCode MCP entry. OpenCode uses the `environment` key for per-MCP environment variables:

```jsonc
{
  "mcp": {
    "nekodrift": {
      "type": "local",
      "command": ["npx", "-y", "@neko-drift/cli@latest", "mcp"],
      "enabled": true,
      "environment": {
        "NEKODRIFT_DISCOVERY_FILE": "/mnt/c/Users/<WindowsUser>/AppData/Roaming/NekoDrift/runtime/ipc.json"
      }
    }
  }
}
```

This avoids relying on OpenCode inheriting the shell environment that launched it.

## Environment variables reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEKODRIFT_IPC_BIND` | TCP endpoint to bind the server to; setting this opts into TCP IPC | `tcp://0.0.0.0:37645` |
| `NEKODRIFT_IPC_ENDPOINT` | TCP endpoint advertised in discovery file; this does not start TCP listening by itself | `tcp://172.25.32.1:37645` |
| `NEKODRIFT_DISCOVERY_FILE` | Path to the discovery JSON file (client-side) | `/mnt/c/Users/.../ipc.json` |

### Variable combinations

- **Neither set**: Uses platform default (named pipe on Windows, Unix socket on macOS/Linux)
- **Only `NEKODRIFT_IPC_ENDPOINT`**: Invalid. `NEKODRIFT_IPC_ENDPOINT` only advertises; set `NEKODRIFT_IPC_BIND` to opt into TCP IPC.
- **Only `NEKODRIFT_IPC_BIND`**: Binds to the specified endpoint and advertises the same (cannot use `0.0.0.0` alone)
- **Both set**: Binds to `NEKODRIFT_IPC_BIND`, advertises `NEKODRIFT_IPC_ENDPOINT` (required for NAT mode with `0.0.0.0`)

## Security considerations

⚠️ **Important security warnings:**

1. **Never bind to public IPs**: Only use `127.0.0.1` (loopback), `0.0.0.0` with a private advertised endpoint, or private network addresses (10.x.x.x, 172.16-31.x.x, 192.168.x.x, 169.254.x.x).

2. **Always use the discovery token**: Even with TCP, clients must present the per-run token from the discovery file. The token is randomly generated on each app start.

3. **Firewall considerations**: Binding to `0.0.0.0` listens on all Windows interfaces, including private/LAN interfaces. Ensure Windows Firewall blocks external access to the NekoDrift port except from the WSL virtual network.

4. **Network isolation**: In NAT mode, the advertised Windows host IP is intended for WSL. Binding to `0.0.0.0` can still expose the listener more broadly if firewall rules permit it.

5. **Host validation**: The desktop app validates that incoming TCP connections originate from private/local addresses when bound to non-loopback interfaces.

## Supported endpoint formats

- `tcp://127.0.0.1:<port>` - Loopback only (safest)
- `tcp://0.0.0.0:<port>` - All interfaces (requires separate advertised endpoint)
- `tcp://10.x.x.x:<port>` - Private network (RFC 1918)
- `tcp://172.16.x.x:<port>` to `tcp://172.31.x.x:<port>` - Private network (RFC 1918)
- `tcp://192.168.x.x:<port>` - Private network (RFC 1918)
- `tcp://169.254.x.x:<port>` - Link-local (APIPA)

**Not allowed:**
- Hostnames (e.g., `tcp://localhost:<port>`)
- `0.0.0.0` as advertised endpoint
- Public routable IPs

## Notes and limitations

- TCP is opt-in. Same-OS setups continue to use named pipes or Unix sockets by default.
- WSL networking differs by version and configuration. Mirrored mode is recommended when available.
- Cross-machine IPC is not intended or supported. Private LAN peers may still be able to reach a `0.0.0.0` listener if Windows Firewall allows it, so restrict the port to the WSL virtual network.

## Quick health check

After starting the desktop app with the appropriate environment variables and exporting `NEKODRIFT_DISCOVERY_FILE` in WSL, run:

```bash
npx -y @neko-drift/mcp
```

Then use your MCP client's `nekodrift_status` tool to confirm the desktop app is reachable.

For NAT mode, check raw TCP reachability from WSL before testing MCP:

```bash
cat "$NEKODRIFT_DISCOVERY_FILE"
nc -vz $(jq -r '.endpoint | sub("^tcp://"; "") | split(":")[0]' "$NEKODRIFT_DISCOVERY_FILE") \
  $(jq -r '.endpoint | split(":")[-1]' "$NEKODRIFT_DISCOVERY_FILE")
```

If `cat` works but `nekodrift_status` still says IPC is unavailable, confirm the OpenCode MCP entry has `environment.NEKODRIFT_DISCOVERY_FILE` set and restart OpenCode.
