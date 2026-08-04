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
    gameStatus: room.game?.status || null,
    createdAt: room.createdAt,
  };
}

function makeRoomId() {
  let id;
  do id = randomBytes(3).toString("hex").toUpperCase(); while (rooms.has(id));
  return id;
}

function findRoom(pathname) {
  const match = pathname.match(/^\/rooms\/([A-F0-9]{6})(?:\/(join|leave|start|game|guess|skip|next))?$/);
  if (!match) return null;
  return { room: rooms.get(match[1]), id: match[1], action: match[2] };
}

function distanceKm(a, b) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function currentLocation(game) {
  return game.deck[(game.round - 1) % game.deck.length];
}

function advanceRound(room) {
  const game = room.game;
  if (!game) return;
  if (room.players.some((player) => game.health[player.id] <= 0)) {
    game.status = "finished";
    game.revealDeadline = null;
  } else {
    game.round += 1;
    game.status = "playing";
    game.guesses = {};
    game.ready = {};
    game.skipVotes = {};
    game.result = null;
    game.revealDeadline = null;
    game.deadline = Date.now() + 60_000;
  }
  room.updatedAt = Date.now();
}

function resolveRound(room) {
  const game = room.game;
  if (!game || game.status !== "playing") return;
  const location = currentLocation(game);
  const guesses = Object.fromEntries(room.players.map((player) => [player.id, game.guesses[player.id] || { lat: 0, lng: 0 }]));
  const distances = Object.fromEntries(room.players.map((player) => [player.id, distanceKm(guesses[player.id], location)]));
  const [first, second] = room.players;
  const gap = Math.abs(distances[first.id] - distances[second.id]);
  const multiplier = 1 + Math.floor((game.round - 1) / 2) * 0.5;
  const damageCap = Math.round(game.startingHealth * 0.3);
  const damage = gap < 1 ? 0 : Math.max(1, Math.min(damageCap, Math.round(Math.pow(gap, 0.9) * 0.55 * multiplier)));
  const damagedPlayerId = gap < 1 ? null : distances[first.id] > distances[second.id] ? first.id : second.id;
  if (damagedPlayerId) game.health[damagedPlayerId] = Math.max(0, game.health[damagedPlayerId] - damage);
  game.guesses = guesses;
  game.result = { distances, damage, damagedPlayerId, target: location };
  game.status = "reveal";
  game.ready = {};
  game.revealDeadline = Date.now() + 15_000;
  room.updatedAt = Date.now();
}

function updateTimedRound(room) {
  const game = room.game;
  if (game?.status === "playing" && Date.now() >= game.deadline) resolveRound(room);
  if (game?.status === "reveal" && Date.now() >= game.revealDeadline) advanceRound(room);
}

function gameView(room, playerId) {
  updateTimedRound(room);
  const game = room.game;
  if (!game) return null;
  const reveal = game.status === "reveal" || game.status === "finished";
  return {
    roomId: room.id,
    roomName: room.name,
    status: game.status,
    round: game.round,
    locationId: currentLocation(game).id,
    deadline: game.deadline,
    revealDeadline: game.revealDeadline,
    players: room.players.map((player) => ({
      id: player.id,
      name: player.name,
      health: game.health[player.id],
      locked: Boolean(game.guesses[player.id]),
      ready: Boolean(game.ready[player.id]),
      skipped: Boolean(game.skipVotes[player.id]),
    })),
    playerId,
    guesses: reveal ? game.guesses : undefined,
    result: reveal ? game.result : undefined,
    startingHealth: game.startingHealth,
  };
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

    if (route && request.method === "POST" && route.action === "start") {
      if (!route.room) return send(response, 404, { error: "Room not found" });
      const body = await readJson(request);
      if (route.room.players[0]?.id !== body.playerId) return send(response, 403, { error: "Only the host can start" });
      if (route.room.players.length !== 2) return send(response, 409, { error: "Two players are required" });
      if (route.room.game) return send(response, 409, { error: "The game has already started" });
      const deck = Array.isArray(body.deck) ? body.deck.slice(0, 80).filter((item) =>
        item && typeof item.id === "string" && item.id.length <= 100 && Number.isFinite(item.lat) && item.lat >= -90 && item.lat <= 90 && Number.isFinite(item.lng) && item.lng >= -180 && item.lng <= 180,
      ) : [];
      if (deck.length < 5) return send(response, 400, { error: "Not enough playable photographs" });
      const health = [3000, 7000, 12000].includes(Number(body.health)) ? Number(body.health) : 7000;
      const now = Date.now();
      route.room.game = {
        status: "playing",
        deck,
        round: 1,
        startingHealth: health,
        health: Object.fromEntries(route.room.players.map((player) => [player.id, health])),
        guesses: {},
        ready: {},
        skipVotes: {},
        result: null,
        revealDeadline: null,
        deadline: now + 60_000,
      };
      route.room.updatedAt = now;
      return send(response, 200, { game: gameView(route.room, body.playerId) });
    }

    if (route && request.method === "GET" && route.action === "game") {
      if (!route.room?.game) return send(response, 404, { error: "Game not started" });
      const playerId = url.searchParams.get("playerId");
      if (!route.room.players.some((player) => player.id === playerId)) return send(response, 403, { error: "Player is not in this room" });
      return send(response, 200, { game: gameView(route.room, playerId) });
    }

    if (route && request.method === "POST" && route.action === "guess") {
      if (!route.room?.game) return send(response, 404, { error: "Game not started" });
      const body = await readJson(request);
      const game = route.room.game;
      if (game.status !== "playing") return send(response, 409, { error: "Round is not accepting guesses" });
      if (!route.room.players.some((player) => player.id === body.playerId)) return send(response, 403, { error: "Player is not in this room" });
      if (game.guesses[body.playerId]) return send(response, 409, { error: "Guess already locked" });
      const guess = { lat: Number(body.lat), lng: Number(body.lng) };
      if (!Number.isFinite(guess.lat) || guess.lat < -90 || guess.lat > 90 || !Number.isFinite(guess.lng) || guess.lng < -180 || guess.lng > 180) return send(response, 400, { error: "Invalid guess" });
      game.guesses[body.playerId] = guess;
      game.deadline = Math.min(game.deadline, Date.now() + 10_000);
      route.room.updatedAt = Date.now();
      if (route.room.players.every((player) => game.guesses[player.id])) resolveRound(route.room);
      return send(response, 200, { game: gameView(route.room, body.playerId) });
    }

    if (route && request.method === "POST" && route.action === "skip") {
      if (!route.room?.game) return send(response, 404, { error: "Game not started" });
      const body = await readJson(request);
      const game = route.room.game;
      if (game.status !== "playing") return send(response, 409, { error: "Round cannot be skipped now" });
      if (!route.room.players.some((player) => player.id === body.playerId)) return send(response, 403, { error: "Player is not in this room" });
      game.skipVotes[body.playerId] = true;
      if (route.room.players.every((player) => game.skipVotes[player.id])) advanceRound(route.room);
      route.room.updatedAt = Date.now();
      return send(response, 200, { game: gameView(route.room, body.playerId) });
    }

    if (route && request.method === "POST" && route.action === "next") {
      if (!route.room?.game) return send(response, 404, { error: "Game not started" });
      const body = await readJson(request);
      const game = route.room.game;
      if (game.status !== "reveal") return send(response, 409, { error: "Round is not ready to advance" });
      if (!route.room.players.some((player) => player.id === body.playerId)) return send(response, 403, { error: "Player is not in this room" });
      game.ready[body.playerId] = true;
      if (route.room.players.every((player) => game.ready[player.id])) advanceRound(route.room);
      route.room.updatedAt = Date.now();
      return send(response, 200, { game: gameView(route.room, body.playerId) });
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
