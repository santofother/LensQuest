# LensQuest on Docker

The stack contains four services:

- `app`: the LensQuest Next.js application
- `multiplayer`: an in-memory private-room browser and lobby API
- `gateway`: one internal web address for the game and `/multiplayer/` API
- `cloudflared`: a remotely managed Cloudflare Tunnel client

## Start it

1. Copy `.env.example` to `.env`.
2. In Cloudflare Zero Trust, create a remotely managed tunnel and copy its token into `CLOUDFLARE_TUNNEL_TOKEN` in `.env`.
3. Add a Public Hostname to that tunnel. Set its service type to HTTP and its URL to `http://gateway:8080`.
4. Start the stack:

   ```sh
   docker compose up -d --build
   ```

The game is also available locally at `http://localhost:3000` unless `LENSQUEST_PORT` is changed.

## Keep the tunnel token private

`.env` and every other local environment file are ignored by Git. Only `.env.example`, which contains a placeholder, is committed. Do not put the real token in `docker-compose.yml` or `.env.example`.

## Multiplayer status

The Docker build enables private friend matches at `/rooms`. Players can host rooms, share a room ID plus four-digit access code, join, choose the health mode, and start a synchronized duel. Photographs, guesses, reply timers, damage, health, and round advancement are coordinated by the multiplayer service. Reveal screens advance automatically after 15 seconds, either player can ready up sooner, and a photograph is skipped only after both players vote to skip it.

Rooms and active matches live in server memory and expire after six hours; restarting the multiplayer container clears them.
