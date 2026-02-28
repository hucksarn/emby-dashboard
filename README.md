# Emby + Subscription Portal (Proxy UI)

This project customizes the Emby Web UI to add a **Subscription** tab and load an external subscription portal inside Emby. The customization is delivered through a **reverse proxy** so the Emby server installation remains untouched. This makes it safe to run even when you do not have sudo or Docker access.

The repository contains:
- a **custom Emby Web UI build** (`custom-dashboard-ui/`)
- a **Node.js reverse proxy** that serves the custom UI and forwards all other traffic to Emby (`emby-proxy/`)
- an optional **subscription portal** app (local/dev use) (`portal/`)

## Why This Exists

- Emby Web is static and not designed to be extended with custom tabs.
- Many servers run Emby in Docker or locked environments (no root access).
- A reverse proxy lets us **override only the web UI** while keeping the Emby backend intact.
- The subscription portal can accept Emby credentials (SSO-style) and show per-user subscription data.

## What This Changes

- A **Subscription** tab is added to the Home tab list.
- The Subscription tab loads the portal URL in an iframe.
- The iframe URL is rebuilt when the Emby user changes so the portal session switches per user.

## Project Layout

- `custom-dashboard-ui/`
  - A copy of Emby Web UI with modifications.
  - Key file: `custom-dashboard-ui/modules/tabbedview/subscriptiontab.js`
- `emby-proxy/`
  - Node.js proxy server that serves `custom-dashboard-ui` for `/web` and proxies all other requests to Emby.
  - Key file: `emby-proxy/server.js`
- `portal/`
  - Optional subscription portal app (dev/local use).

## Requirements

- Node.js 16+ (for the proxy)
- An Emby server URL (local or remote)

## How It Works

1. Emby Web is accessed through the proxy (not directly).
2. The proxy serves custom web UI files from `custom-dashboard-ui/`.
3. All API/media requests go to the real Emby server.
4. The Subscription tab loads the portal URL and includes Emby user/token.

## Quick Start (Local)

### 1. Run Emby

Make sure Emby is running locally (example):

- Emby URL: `http://localhost:8096`

### 2. Start the proxy

```bash
cd /Users/hucksarn/Downloads/embyapp/emby-proxy
export EMBY_TARGET="http://localhost:8096"
export PROXY_PORT=8097
export WEB_ROOT="/Users/hucksarn/Downloads/embyapp/custom-dashboard-ui"
node server.js
```

### 3. Open Emby through the proxy

```
http://localhost:8097/web
```

## Quick Start (Server)

Example for the server setup used in this project:

- Emby backend: `http://79.127.235.178:15804`
- Proxy port: `5003`
- Subscription portal: `http://79.127.235.178:5002`

Start proxy:

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh";
nohup env \
  EMBY_TARGET="http://79.127.235.178:15804" \
  PROXY_PORT=5003 \
  WEB_ROOT="/home/alee20300/custom-dashboard-ui" \
  node /home/alee20300/emby-proxy/server.js \
  > /home/alee20300/emby-proxy/proxy.log 2>&1 &
```

Open Emby through proxy:

```
http://79.127.235.178:5003/emby/web
```

## Configuration

### Proxy (`emby-proxy/server.js`)

Environment variables:
- `EMBY_TARGET` (required): Real Emby server URL (e.g., `http://host:port`)
- `PROXY_PORT` (optional): Proxy listen port (default `8097`)
- `WEB_ROOT` (required): Path to `custom-dashboard-ui/`

### Subscription Portal URL

Edit this file to change the portal URL:

- `custom-dashboard-ui/modules/tabbedview/subscriptiontab.js`

Look for:

```js
var url = "http://79.127.235.178:5002";
```

## User Switching Behavior

The Subscription tab rebuilds the iframe URL on **Emby user change**. It includes:

- `embyUserId`
- `embyToken`

Your portal must accept these and **replace any previous session** for the new user.

## Build Notes

The Emby UI is already built and stored in `custom-dashboard-ui/`. This project does **not** require a build step unless you want to recompile or re-minify the Emby UI.

If you need a clean Emby UI, download a fresh Emby Web build and replace the folder, then reapply the changes.

## Common Issues

### Subscription tab is blank

- Verify proxy is running and serving the custom UI
- Open DevTools and check if `subscriptiontab.js` is loading
- Check that `/modules/tabbedview/subscriptiontab.js` exists in `custom-dashboard-ui`

### Portal is stuck on previous user

- The iframe reload is already forced on user change
- Ensure your portal invalidates old sessions and honors the new `embyToken`

## Git Workflow

Changes are made locally and pushed to GitHub. The server pulls the latest changes and restarts the proxy.

Typical flow:

```bash
# local machine
cd custom-dashboard-ui
# edit
# git add/commit
# git push

# server
cd /home/alee20300/custom-dashboard-ui
git pull
# restart proxy
```

## Security Notes

- The iframe includes Emby access tokens in the query string.
- Protect your portal with HTTPS in production.
- Avoid exposing tokens to third-party resources.

---

If you want improvements or a more detailed deployment guide, tell me your exact environment and I’ll add it.
