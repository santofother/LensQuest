import { createServer } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";

const port = Number(process.env.PORT || 8787);
const rooms = new Map();
const ROOM_TTL_MS = 6 * 60 * 60 * 1000;

function send(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16_384) throw new Error("Request is too large");
    chunks.push(chunk);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

function cleanName(value, fallback) {
  const name = String(value || "").trim().replace(/\s+/g, " ").slice(0, 32);
  return name || fallback;
}

function publicRoom(room) {
  return {
    id: room.id,
    name: room.name,
    hostName: room.players[0]?.name || "Host",
    playerCount: room.players.length,
    maxPlayers: 2,
    status: room.players.length >= 2 ? "full" : "waiting",
    createdAt: room.createdAt,
  };
}

function makeRoomId() {
  let id;
  do id = randomBytes(3).toString("hex").toUpperCase(); while (rooms.has(id));
  return id;
}

function findRoom(pathname) {
  const match = pathname.match(/^\/rooms\/([A-F0-9]{6})(?:\/(join|leave))?$/);
  if (!match) return null;
  return { room: rooms.get(match[1]), id: match[1], action: match[2] };
}

setInterval(() => {
  const cutoff = Date.now() - ROOM_TTL_MS;
  for (const [id, room] of rooms) if (room.updatedAt < cutoff) rooms.delete(id);
}, 15 * 60 * 1000).unref();

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

    if (request.method === "GET" && url.pathname === "/health") {
      return send(response, 200, { ok: true });
    }

    if (request.method === "GET" && url.pathname === "/rooms") {
      return send(response, 200, { rooms: [...rooms.values()].map(publicRoom).sort((a, b) => b.createdAt - a.createdAt) });
    }

    if (request.method === "POST" && url.pathname === "/rooms") {
      const body = await readJson(request);
      const hostName = cleanName(body.playerName, "Explorer");
      const id = makeRoomId();
      const code = String(Math.floor(1000 + Math.random() * 9000));
      const player = { id: randomUUID(), name: hostName };
      const now = Date.now();
      const room = { id, code, name: cleanName(body.name, `${hostName}'s room`), players: [player], createdAt: now, updatedAt: now };
      rooms.set(id, room);
      return send(response, 201, { room: publicRoom(room), code, playerId: player.id });
    }

    const route = findRoom(url.pathname);
    if (route && request.method === "GET" && !route.action) {
      if (!route.room) return send(response, 404, { error: "Room not found" });
      return send(response, 200, { room: { ...publicRoom(route.room), players: route.room.players } });
    }

    if (route && request.method === "POST" && route.action === "join") {
      if (!route.room) return send(response, 404, { error: "Room not found" });
      if (route.room.players.length >= 2) return send(response, 409, { error: "Room is full" });
      const body = await readJson(request);
      if (String(body.code || "") !== route.room.code) return send(response, 403, { error: "Incorrect room code" });
      const player = { id: randomUUID(), name: cleanName(body.playerName, "Explorer") };
      route.room.players.push(player);
      route.room.updatedAt = Date.now();
      return send(response, 200, { room: publicRoom(route.room), playerId: player.id });
    }

    if (route && request.method === "POST" && route.action === "leave") {
      if (!route.room) return send(response, 404, { error: "Room not found" });
      const body = await readJson(request);
      route.room.players = route.room.players.filter((player) => player.id !== body.playerId);
      route.room.updatedAt = Date.now();
      if (!route.room.players.length) rooms.delete(route.id);
      return send(response, 200, { ok: true });
    }

    return send(response, 404, { error: "Not found" });
  } catch (error) {
    return send(response, 400, { error: error instanceof Error ? error.message : "Bad request" });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`LensQuest multiplayer lobby listening on ${port}`);
});
