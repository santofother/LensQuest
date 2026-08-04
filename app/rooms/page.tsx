"use client";

import { useEffect, useState } from "react";

type RoomSummary = {
  id: string;
  name: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  status: "waiting" | "full";
  createdAt: number;
};

type RoomDetail = RoomSummary & { players: Array<{ id: string; name: string }> };
type Membership = { roomId: string; playerId: string; code?: string };

const API_ROOT = "/multiplayer";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "The room server did not respond");
  return body as T;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [joinTarget, setJoinTarget] = useState<RoomSummary | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [membership, setMembership] = useState<Membership | null>(null);
  const [activeRoom, setActiveRoom] = useState<RoomDetail | null>(null);
  const [message, setMessage] = useState("Connecting to the private room server…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const savedName = window.localStorage.getItem("lensquest-player-name");
    if (savedName) setPlayerName(savedName);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        if (membership) {
          const body = await api<{ room: RoomDetail }>(`/rooms/${membership.roomId}`);
          if (!cancelled) setActiveRoom(body.room);
        } else {
          const body = await api<{ rooms: RoomSummary[] }>("/rooms");
          if (!cancelled) {
            setRooms(body.rooms);
            setMessage(body.rooms.length ? "Choose a room or host your own." : "No open rooms yet. Start one for your friends.");
          }
        }
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Room server unavailable");
      }
    }
    void refresh();
    const timer = window.setInterval(refresh, 3000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [membership]);

  async function createRoom() {
    if (!playerName.trim()) return setMessage("Choose your player name first.");
    setBusy(true);
    try {
      window.localStorage.setItem("lensquest-player-name", playerName.trim());
      const body = await api<{ room: RoomSummary; code: string; playerId: string }>("/rooms", {
        method: "POST",
        body: JSON.stringify({ name: roomName, playerName }),
      });
      setMembership({ roomId: body.room.id, playerId: body.playerId, code: body.code });
      setMessage("Room created. Share both codes with your friend.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create room");
    } finally {
      setBusy(false);
    }
  }

  async function joinRoom() {
    if (!joinTarget || !playerName.trim()) return setMessage("Choose a player name and room.");
    setBusy(true);
    try {
      window.localStorage.setItem("lensquest-player-name", playerName.trim());
      const body = await api<{ room: RoomSummary; playerId: string }>(`/rooms/${joinTarget.id}/join`, {
        method: "POST",
        body: JSON.stringify({ code: joinCode, playerName }),
      });
      setMembership({ roomId: body.room.id, playerId: body.playerId });
      setJoinTarget(null);
      setJoinCode("");
      setMessage("Joined. Waiting for the host to start the duel.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not join room");
    } finally {
      setBusy(false);
    }
  }

  async function leaveRoom() {
    if (!membership) return;
    try {
      await api(`/rooms/${membership.roomId}/leave`, {
        method: "POST",
        body: JSON.stringify({ playerId: membership.playerId }),
      });
    } finally {
      setMembership(null);
      setActiveRoom(null);
      setMessage("Left the room.");
    }
  }

  return (
    <main className="rooms-screen">
      <header className="rooms-header">
        <a className="brand" href="../"><span className="brand__mark" />LensQuest</a>
        <a className="rooms-back" href="../">Back to practice</a>
      </header>

      <section className="rooms-hero">
        <div>
          <span className="eyebrow">Private multiplayer</span>
          <h1>Meet your friends<br />at the edge of the map.</h1>
        </div>
        <p>Host a named room, share its six-character room ID and four-digit access code, and watch your friend arrive in the lobby.</p>
      </section>

      <section className="rooms-layout">
        <aside className="room-host-card">
          <span className="caption-label">Your identity</span>
          <label><span>Player name</span><input value={playerName} maxLength={20} placeholder="Your display name" onChange={(event) => setPlayerName(event.target.value)} /></label>
          <label><span>Room name</span><input value={roomName} maxLength={32} placeholder="Friday night explorers" onChange={(event) => setRoomName(event.target.value)} /></label>
          <button className="primary-button" type="button" disabled={busy || Boolean(membership)} onClick={createRoom}>Host private room</button>
          <small>Rooms are temporary and disappear after everyone leaves.</small>
        </aside>

        <div className="room-browser-card">
          <div className="room-browser-heading">
            <div><span className="caption-label">Friend servers</span><h2>{membership ? "Current lobby" : "Private room browser"}</h2></div>
            <span className="room-live"><i /> Live</span>
          </div>

          {membership ? (
            <div className="active-lobby">
              <div className="active-lobby__codes"><span>Room ID <strong>{membership.roomId}</strong></span>{membership.code && <span>Access code <strong>{membership.code}</strong></span>}</div>
              <h3>{activeRoom?.name || "Loading room…"}</h3>
              <div className="lobby-seats">
                {[0, 1].map((index) => <div key={index} className={activeRoom?.players[index] ? "lobby-seat lobby-seat--filled" : "lobby-seat"}><span>{index + 1}</span><strong>{activeRoom?.players[index]?.name || "Waiting for friend…"}</strong></div>)}
              </div>
              <p>{activeRoom?.playerCount === 2 ? "Both players are connected. Live round synchronization is the next multiplayer step." : "Share the room ID and access code with your friend."}</p>
              <button className="text-button" type="button" onClick={leaveRoom}>Leave room</button>
            </div>
          ) : rooms.length ? (
            <div className="room-list">
              {rooms.map((room) => (
                <article key={room.id} className={room.status === "full" ? "room-row room-row--full" : "room-row"}>
                  <div><strong>{room.name}</strong><span>Hosted by {room.hostName} · {room.id}</span></div>
                  <span>{room.playerCount}/{room.maxPlayers}</span>
                  <button type="button" disabled={room.status === "full"} onClick={() => setJoinTarget(room)}>{room.status === "full" ? "Full" : "Join"}</button>
                </article>
              ))}
            </div>
          ) : <div className="rooms-empty"><span>◎</span><strong>The room list is quiet.</strong><p>Host the first private room and invite a friend.</p></div>}

          <p className="room-message" aria-live="polite">{message}</p>
        </div>
      </section>

      {joinTarget && (
        <div className="room-dialog-backdrop" role="presentation" onMouseDown={() => setJoinTarget(null)}>
          <section className="room-dialog" role="dialog" aria-modal="true" aria-label={`Join ${joinTarget.name}`} onMouseDown={(event) => event.stopPropagation()}>
            <span className="caption-label">Join {joinTarget.name}</span>
            <h2>Enter the host&apos;s access code.</h2>
            <input value={joinCode} inputMode="numeric" maxLength={4} autoFocus placeholder="4-digit code" onChange={(event) => setJoinCode(event.target.value.replace(/\D/g, ""))} />
            <div><button className="text-button" type="button" onClick={() => setJoinTarget(null)}>Cancel</button><button className="primary-button" type="button" disabled={busy || joinCode.length !== 4} onClick={joinRoom}>Join room</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
