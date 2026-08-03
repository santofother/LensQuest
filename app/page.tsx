"use client";

import { useMemo, useState } from "react";
import { GAME_LOCATIONS, type GameLocation } from "./gameData";

type Coordinates = { lat: number; lng: number };
type GamePhase = "setup" | "guessing" | "reveal" | "gameover";
type RoundResult = {
  playerDistance: number;
  botDistance: number;
  damage: number;
  damaged: "player" | "bot" | "none";
};

const HEALTH_MODES = [
  { id: "blitz", label: "Blitz", health: 3000, detail: "Fast and unforgiving" },
  { id: "classic", label: "Classic", health: 7000, detail: "The balanced duel" },
  { id: "expedition", label: "Expedition", health: 12000, detail: "A longer battle" },
] as const;

const BOT_LEVELS = [
  { id: "wanderer", label: "Wanderer", error: 3600, detail: "Still learning the terrain" },
  { id: "rival", label: "Rival", error: 1500, detail: "Sharp, but beatable" },
  { id: "oracle", label: "Oracle", error: 620, detail: "Knows the world frighteningly well" },
] as const;

const EARTH_IMAGE =
  "https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57730/land_ocean_ice_2048.png";

function shuffle<T>(items: readonly T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function radians(value: number) {
  return (value * Math.PI) / 180;
}

function degrees(value: number) {
  return (value * 180) / Math.PI;
}

function distanceKm(a: Coordinates, b: Coordinates) {
  const radius = 6371;
  const latDelta = radians(b.lat - a.lat);
  const lngDelta = radians(b.lng - a.lng);
  const latA = radians(a.lat);
  const latB = radians(b.lat);
  const value =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(latA) * Math.cos(latB) * Math.sin(lngDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function botGuess(target: Coordinates, typicalError: number): Coordinates {
  const bearing = Math.random() * Math.PI * 2;
  const distance = typicalError * (0.35 + Math.random() * 1.05);
  const angular = distance / 6371;
  const startLat = radians(target.lat);
  const startLng = radians(target.lng);
  const lat = Math.asin(
    Math.sin(startLat) * Math.cos(angular) +
      Math.cos(startLat) * Math.sin(angular) * Math.cos(bearing),
  );
  const lng =
    startLng +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(startLat),
      Math.cos(angular) - Math.sin(startLat) * Math.sin(lat),
    );

  return { lat: degrees(lat), lng: ((degrees(lng) + 540) % 360) - 180 };
}

function formatDistance(value: number) {
  return value < 10 ? `${value.toFixed(1)} km` : `${Math.round(value).toLocaleString()} km`;
}

function mapPosition(point: Coordinates) {
  return {
    left: `${((point.lng + 180) / 360) * 100}%`,
    top: `${((90 - point.lat) / 180) * 100}%`,
  };
}

function HealthBar({
  label,
  value,
  maximum,
  tone,
}: {
  label: string;
  value: number;
  maximum: number;
  tone: "player" | "bot";
}) {
  const percent = Math.max(0, Math.min(100, (value / maximum) * 100));
  return (
    <div className={`health health--${tone}`}>
      <div className="health__label">
        <span>{label}</span>
        <strong>{Math.max(0, Math.round(value)).toLocaleString()} HP</strong>
      </div>
      <div className="health__track">
        <div className="health__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Marker({
  point,
  kind,
  label,
}: {
  point: Coordinates;
  kind: "player" | "bot" | "target";
  label: string;
}) {
  return (
    <span className={`map-marker map-marker--${kind}`} style={mapPosition(point)}>
      <span className="map-marker__dot" />
      <span className="map-marker__label">{label}</span>
    </span>
  );
}

function WorldGuessMap({
  playerGuess,
  botPoint,
  target,
  revealed,
  onPick,
}: {
  playerGuess: Coordinates | null;
  botPoint: Coordinates | null;
  target: Coordinates;
  revealed: boolean;
  onPick: (point: Coordinates) => void;
}) {
  function handlePick(event: React.MouseEvent<HTMLButtonElement>) {
    if (revealed) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(bounds.width, event.clientX - bounds.left));
    const y = Math.max(0, Math.min(bounds.height, event.clientY - bounds.top));
    onPick({ lng: (x / bounds.width) * 360 - 180, lat: 90 - (y / bounds.height) * 180 });
  }

  return (
    <div className="map-shell">
      <button
        className={`world-map ${revealed ? "world-map--locked" : ""}`}
        type="button"
        onClick={handlePick}
        aria-label={revealed ? "Round result map" : "Select your guess on the satellite map"}
      >
        {/* NASA Blue Marble satellite mosaic, public domain. */}
        <img src={EARTH_IMAGE} alt="Satellite photograph of Earth used as the guessing map" />
        <span className="world-map__shade" />
        {playerGuess && <Marker point={playerGuess} kind="player" label="You" />}
        {revealed && botPoint && <Marker point={botPoint} kind="bot" label="Bot" />}
        {revealed && <Marker point={target} kind="target" label="Location" />}
      </button>
      <div className="map-key">
        <span><i className="key-dot key-dot--player" />You</span>
        {revealed && <span><i className="key-dot key-dot--bot" />Bot</span>}
        {revealed && <span><i className="key-dot key-dot--target" />Location</span>}
        <span className="map-credit">NASA Blue Marble</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [modeId, setModeId] = useState<(typeof HEALTH_MODES)[number]["id"]>("classic");
  const [botId, setBotId] = useState<(typeof BOT_LEVELS)[number]["id"]>("rival");
  const [deck, setDeck] = useState<GameLocation[]>(() => shuffle(GAME_LOCATIONS));
  const [round, setRound] = useState(1);
  const [playerHealth, setPlayerHealth] = useState(7000);
  const [botHealth, setBotHealth] = useState(7000);
  const [playerPoint, setPlayerPoint] = useState<Coordinates | null>(null);
  const [botPoint, setBotPoint] = useState<Coordinates | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);

  const selectedMode = HEALTH_MODES.find((mode) => mode.id === modeId) ?? HEALTH_MODES[1];
  const selectedBot = BOT_LEVELS.find((bot) => bot.id === botId) ?? BOT_LEVELS[1];
  const location = deck[(round - 1) % deck.length];
  const target = useMemo(() => ({ lat: location.lat, lng: location.lng }), [location]);
  const multiplier = 1 + Math.floor((round - 1) / 2) * 0.5;

  function startGame() {
    const health = selectedMode.health;
    setDeck(shuffle(GAME_LOCATIONS));
    setRound(1);
    setPlayerHealth(health);
    setBotHealth(health);
    setPlayerPoint(null);
    setBotPoint(null);
    setResult(null);
    setPhase("guessing");
  }

  function lockGuess() {
    if (!playerPoint) return;
    const generatedBotPoint = botGuess(target, selectedBot.error);
    const playerDistance = distanceKm(playerPoint, target);
    const botDistance = distanceKm(generatedBotPoint, target);
    const damage = Math.max(1, Math.round(Math.abs(playerDistance - botDistance) * multiplier));
    const damaged =
      Math.abs(playerDistance - botDistance) < 1
        ? "none"
        : playerDistance > botDistance
          ? "player"
          : "bot";

    if (damaged === "player") setPlayerHealth((health) => Math.max(0, health - damage));
    if (damaged === "bot") setBotHealth((health) => Math.max(0, health - damage));
    setBotPoint(generatedBotPoint);
    setResult({ playerDistance, botDistance, damage, damaged });
    setPhase("reveal");
  }

  function continueGame() {
    if (playerHealth <= 0 || botHealth <= 0) {
      setPhase("gameover");
      return;
    }
    if (round % deck.length === 0) setDeck(shuffle(GAME_LOCATIONS));
    setRound((value) => value + 1);
    setPlayerPoint(null);
    setBotPoint(null);
    setResult(null);
    setPhase("guessing");
  }

  if (phase === "setup") {
    return (
      <main className="start-screen">
        <div className="start-screen__photo" aria-hidden="true" />
        <section className="start-panel">
          <div className="brand"><span className="brand__mark" />LensQuest <em>alpha</em></div>
          <div className="eyebrow">Photo location survival</div>
          <h1>See the frame.<br />Survive the world.</h1>
          <p className="start-panel__intro">
            Read the light, landscape, weather, and architecture. Place your guess,
            outsmart the bot, and protect your health as every round grows deadlier.
          </p>

          <fieldset className="choice-group">
            <legend>Choose your health</legend>
            <div className="choice-grid choice-grid--three">
              {HEALTH_MODES.map((mode) => (
                <button
                  type="button"
                  key={mode.id}
                  className={modeId === mode.id ? "choice-card choice-card--active" : "choice-card"}
                  onClick={() => setModeId(mode.id)}
                >
                  <strong>{mode.label}</strong>
                  <span>{mode.health.toLocaleString()} HP</span>
                  <small>{mode.detail}</small>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="choice-group">
            <legend>Choose your rival</legend>
            <div className="choice-grid choice-grid--three">
              {BOT_LEVELS.map((bot) => (
                <button
                  type="button"
                  key={bot.id}
                  className={botId === bot.id ? "choice-card choice-card--active" : "choice-card"}
                  onClick={() => setBotId(bot.id)}
                >
                  <strong>{bot.label}</strong>
                  <span>{bot.detail}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <button className="primary-button primary-button--large" type="button" onClick={startGame}>
            Begin the duel <span>→</span>
          </button>
          <p className="start-panel__note">{GAME_LOCATIONS.length} curated photographs · locations are approximate in this alpha</p>
        </section>
      </main>
    );
  }

  if (phase === "gameover") {
    const won = botHealth <= 0;
    return (
      <main className={`end-screen ${won ? "end-screen--won" : "end-screen--lost"}`}>
        <div className="brand"><span className="brand__mark" />LensQuest</div>
        <section className="end-card">
          <div className="eyebrow">Duel complete · {round} rounds</div>
          <h1>{won ? "You survived." : "The world won this time."}</h1>
          <p>
            {won
              ? `${selectedBot.label} ran out of health first. Your eye for place held up under pressure.`
              : `${selectedBot.label} landed the final hit. Study the clues and come back sharper.`}
          </p>
          <div className="final-health">
            <HealthBar label="You" value={playerHealth} maximum={selectedMode.health} tone="player" />
            <HealthBar label={selectedBot.label} value={botHealth} maximum={selectedMode.health} tone="bot" />
          </div>
          <div className="end-actions">
            <button className="primary-button" type="button" onClick={startGame}>Play again</button>
            <button className="text-button" type="button" onClick={() => setPhase("setup")}>Change mode</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="game-screen">
      <header className="game-header">
        <div className="brand"><span className="brand__mark" />LensQuest</div>
        <div className="round-chip">Round {round} <strong>×{multiplier.toFixed(1)}</strong></div>
        <button className="quit-button" type="button" onClick={() => setPhase("setup")}>End duel</button>
      </header>

      <section className="battle-strip">
        <HealthBar label="You" value={playerHealth} maximum={selectedMode.health} tone="player" />
        <div className="versus">VS</div>
        <HealthBar label={selectedBot.label} value={botHealth} maximum={selectedMode.health} tone="bot" />
      </section>

      <section className="game-grid">
        <article className="photo-stage">
          <img src={location.imageUrl} alt={location.alt} />
          <div className="photo-stage__topline">
            <span>{phase === "reveal" ? location.region : "Somewhere on Earth"}</span>
            <span>Photo {((round - 1) % deck.length) + 1}/{deck.length}</span>
          </div>
          <div className="photo-stage__caption">
            <div>
              <span className="caption-label">Clue photograph</span>
              <a href={location.sourceUrl} target="_blank" rel="noreferrer">
                {location.credit} ↗
              </a>
            </div>
            {phase === "reveal" && (
              <div className="location-reveal">
                <span>Approximate location</span>
                <strong>{location.name}</strong>
              </div>
            )}
          </div>
        </article>

        <aside className="guess-panel">
          <div className="guess-panel__heading">
            <div>
              <span className="caption-label">{phase === "reveal" ? "Round result" : "Your move"}</span>
              <h2>{phase === "reveal" ? location.name : "Where was this taken?"}</h2>
            </div>
            <div className="multiplier-badge">×{multiplier.toFixed(1)} damage</div>
          </div>

          <WorldGuessMap
            playerGuess={playerPoint}
            botPoint={botPoint}
            target={target}
            revealed={phase === "reveal"}
            onPick={setPlayerPoint}
          />

          {phase === "guessing" ? (
            <div className="guess-actions">
              <p>{playerPoint ? "Pin placed. Move it or lock in your guess." : "Tap the satellite photograph to place your pin."}</p>
              <button className="primary-button" type="button" disabled={!playerPoint} onClick={lockGuess}>
                Lock guess
              </button>
            </div>
          ) : (
            <div className="result-panel">
              <div className="distance-grid">
                <div><span>Your distance</span><strong>{formatDistance(result?.playerDistance ?? 0)}</strong></div>
                <div><span>Bot distance</span><strong>{formatDistance(result?.botDistance ?? 0)}</strong></div>
              </div>
              <div className={`damage-callout damage-callout--${result?.damaged ?? "none"}`}>
                <span>{result?.damaged === "player" ? "You take" : result?.damaged === "bot" ? `${selectedBot.label} takes` : "Dead heat"}</span>
                <strong>{result?.damaged === "none" ? "No damage" : `${result?.damage.toLocaleString()} damage`}</strong>
              </div>
              <button className="primary-button" type="button" onClick={continueGame}>
                {playerHealth <= 0 || botHealth <= 0 ? "See duel result" : "Next photograph"}
              </button>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
