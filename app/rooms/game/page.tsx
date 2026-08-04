"use client";

import { useEffect, useMemo, useState } from "react";
import { GAME_LOCATIONS, type GameLocation } from "../../gameData";

type Point = { lat: number; lng: number };
type GamePlayer = { id: string; name: string; health: number; locked: boolean; ready: boolean; skipped: boolean };
type GameState = {
  roomId: string;
  roomName: string;
  status: "playing" | "reveal" | "finished";
  round: number;
  locationId: string;
  deadline: number;
  revealDeadline: number | null;
  players: GamePlayer[];
  playerId: string;
  guesses?: Record<string, Point>;
  result?: { distances: Record<string, number>; damage: number; damagedPlayerId: string | null; target: Point };
  startingHealth: number;
};

const API_ROOT = "/multiplayer";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, { ...init, headers: { "content-type": "application/json", ...(init?.headers || {}) } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Private game server unavailable");
  return body as T;
}

function markerStyle(point: Point) {
  return { left: `${((point.lng + 180) / 360) * 100}%`, top: `${((90 - point.lat) / 180) * 100}%` };
}

function formatDistance(distance = 0) {
  return distance < 10 ? `${distance.toFixed(1)} km` : `${Math.round(distance).toLocaleString()} km`;
}

export default function PrivateGamePage() {
  const [roomId, setRoomId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [game, setGame] = useState<GameState | null>(null);
  const [locations, setLocations] = useState<GameLocation[]>(GAME_LOCATIONS);
  const [guess, setGuess] = useState<Point | null>(null);
  const [message, setMessage] = useState("Joining the private duel…");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRoomId(params.get("room") || "");
    setPlayerId(params.get("player") || "");
    Promise.all(["/commons-locations.json", "/worldwide-locations.json"].map((url) => fetch(url).then((response) => response.ok ? response.json() as Promise<GameLocation[]> : [])))
      .then((lists) => setLocations([...GAME_LOCATIONS, ...lists.flat()]));
  }, []);

  useEffect(() => {
    if (!roomId || !playerId) return;
    let cancelled = false;
    async function refresh() {
      try {
        const body = await api<{ game: GameState }>(`/rooms/${roomId}/game?playerId=${encodeURIComponent(playerId)}`);
        if (!cancelled) { setGame(body.game); setMessage(""); }
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Connection lost");
      }
    }
    void refresh();
    const poll = window.setInterval(refresh, 750);
    const clock = window.setInterval(() => setNow(Date.now()), 250);
    return () => { cancelled = true; window.clearInterval(poll); window.clearInterval(clock); };
  }, [roomId, playerId]);

  useEffect(() => { setGuess(null); }, [game?.round]);

  const location = useMemo(() => locations.find((item) => item.id === game?.locationId), [locations, game?.locationId]);
  const you = game?.players.find((player) => player.id === playerId);
  const opponent = game?.players.find((player) => player.id !== playerId);
  const secondsLeft = game?.status === "playing" ? Math.max(0, Math.ceil((game.deadline - now) / 1000)) : 0;
  const revealSeconds = game?.status === "reveal" && game.revealDeadline ? Math.max(0, Math.ceil((game.revealDeadline - now) / 1000)) : 0;
  const multiplier = game ? 1 + Math.floor((game.round - 1) / 2) * 0.5 : 1;

  function pickGuess(event: React.MouseEvent<HTMLDivElement>) {
    if (!game || game.status !== "playing" || you?.locked) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setGuess({ lng: ((event.clientX - bounds.left) / bounds.width) * 360 - 180, lat: 90 - ((event.clientY - bounds.top) / bounds.height) * 180 });
  }

  async function lockGuess() {
    if (!guess || !game || busy) return;
    setBusy(true);
    try {
      const body = await api<{ game: GameState }>(`/rooms/${roomId}/guess`, { method: "POST", body: JSON.stringify({ playerId, ...guess }) });
      setGame(body.game);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not lock guess");
    } finally { setBusy(false); }
  }

  async function readyNext() {
    if (!game || busy) return;
    setBusy(true);
    try {
      const body = await api<{ game: GameState }>(`/rooms/${roomId}/next`, { method: "POST", body: JSON.stringify({ playerId }) });
      setGame(body.game);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not advance round");
    } finally { setBusy(false); }
  }

  async function voteSkip() {
    if (!game || busy || you?.skipped) return;
    setBusy(true);
    try {
      const body = await api<{ game: GameState }>(`/rooms/${roomId}/skip`, { method: "POST", body: JSON.stringify({ playerId }) });
      setGame(body.game);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not vote to skip");
    } finally { setBusy(false); }
  }

  if (!game || !location || !you || !opponent) return <main className="private-game-loading"><div className="brand"><span className="brand__mark" />LensQuest</div><strong>{message || "Loading shared photograph…"}</strong><a href="../">Return to rooms</a></main>;

  if (game.status === "finished") {
    const won = you.health > opponent.health;
    return <main className={`private-game-finish ${won ? "private-game-finish--won" : ""}`}><div className="brand"><span className="brand__mark" />LensQuest</div><section><span className="eyebrow">Private duel complete</span><h1>{won ? "Victory." : "Defeat."}</h1><p>{you.name} {you.health.toLocaleString()} HP · {opponent.name} {opponent.health.toLocaleString()} HP</p><a className="primary-button" href="../">Return to private rooms</a></section></main>;
  }

  const revealed = game.status === "reveal";
  const yourGuess = revealed ? game.guesses?.[you.id] : guess;
  const opponentGuess = revealed ? game.guesses?.[opponent.id] : null;

  return (
    <main className="private-game-screen">
      <header className="private-game-header"><div className="brand"><span className="brand__mark" />LensQuest <em>{game.roomName}</em></div><div><span>Round {game.round} · ×{multiplier.toFixed(1)}</span><strong>{revealed ? `Next 0:${String(revealSeconds).padStart(2, "0")}` : `0:${String(secondsLeft).padStart(2, "0")}`}</strong></div><a href="../">Leave</a></header>
      <section className="private-health"><div><span>{you.name}</span><strong>{you.health.toLocaleString()} HP</strong><i><b style={{ width: `${(you.health / game.startingHealth) * 100}%` }} /></i></div><em>VS</em><div><span>{opponent.name}</span><strong>{opponent.health.toLocaleString()} HP</strong><i><b style={{ width: `${(opponent.health / game.startingHealth) * 100}%` }} /></i></div></section>
      <section className="private-game-grid">
        <figure className="private-photo"><img src={location.imageUrl} alt={location.alt} /><figcaption><span>Round {game.round} photograph</span>{revealed && <div><strong>{location.name}</strong><small>{location.region} · {location.credit}</small></div>}</figcaption></figure>
        <aside className="private-guess-card">
          <div className="private-guess-heading"><div><span className="caption-label">{revealed ? "Round result" : you.locked ? "Guess locked" : "Your move"}</span><h2>{revealed ? location.name : you.locked ? `Waiting for ${opponent.name}` : "Where was this taken?"}</h2></div><span>×{multiplier.toFixed(1)} damage</span></div>
          <div className={`private-world-map ${you.locked || revealed ? "private-world-map--locked" : ""}`} onClick={pickGuess} role="button" aria-label="World guessing map"><img src="/world-map.webp" alt="Satellite map of Earth" />{yourGuess && <i className="private-map-pin private-map-pin--you" style={markerStyle(yourGuess)}><b />You</i>}{opponentGuess && <i className="private-map-pin private-map-pin--opponent" style={markerStyle(opponentGuess)}><b />{opponent.name}</i>}{revealed && game.result && <i className="private-map-pin private-map-pin--target" style={markerStyle(game.result.target)}><b />Location</i>}</div>
          {!revealed ? <div className="private-lock-area"><p>{you.locked ? `${opponent.name} has ${secondsLeft} seconds to answer.` : opponent.locked ? `${opponent.name} locked first. You have ${secondsLeft} seconds.` : opponent.skipped ? `${opponent.name} wants to skip this photograph.` : "Place a pin, then lock your answer."}</p><div className="private-round-actions"><button className="private-skip-button" type="button" disabled={you.skipped || busy} onClick={voteSkip}>{you.skipped ? `Waiting for ${opponent.name}` : opponent.skipped ? "Agree to skip" : "Vote to skip"}</button><button className="primary-button" type="button" disabled={!guess || you.locked || busy} onClick={lockGuess}>{you.locked ? "Answer locked" : "Lock guess"}</button></div></div> : <div className="private-result"><div><span>Your distance</span><strong>{formatDistance(game.result?.distances[you.id])}</strong></div><div><span>{opponent.name}</span><strong>{formatDistance(game.result?.distances[opponent.id])}</strong></div><p><span>{game.result?.damagedPlayerId ? `${game.result.damagedPlayerId === you.id ? you.name : opponent.name} takes` : "Dead heat"}</span><strong>{game.result?.damage ? `${game.result.damage.toLocaleString()} damage` : "No damage"}</strong></p><button className="primary-button" type="button" disabled={you.ready || busy} onClick={readyNext}>{you.ready ? `Waiting · auto next in ${revealSeconds}s` : `Ready now · auto next in ${revealSeconds}s`}</button></div>}
          {message && <p className="room-message">{message}</p>}
        </aside>
      </section>
    </main>
  );
}
