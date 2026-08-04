"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GAME_LOCATIONS, type GameLocation } from "./gameData";

type Coordinates = { lat: number; lng: number };
type GamePhase = "setup" | "guessing" | "waiting" | "reveal" | "gameover";
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
  { id: "wanderer", label: "Wanderer", error: 3600, blunderChance: 0.38, detail: "Erratic · 38% blunder chance" },
  { id: "rival", label: "Rival", error: 1500, blunderChance: 0.24, detail: "Beatable · 24% blunder chance" },
  { id: "oracle", label: "Oracle", error: 620, blunderChance: 0.14, detail: "Sharp · 14% blunder chance" },
] as const;

const BLUNDER_DISTANCES = [3000, 5000, 10000] as const;
type SoundEffect = "start" | "lock" | "playerHit" | "botHit" | "neutral" | "advance";

const EARTH_IMAGE = "/world-map.webp";
const BLOCKED_PHOTO_IDS = new Set([
  "unsplash-PGeslSkvPQg", // Flower close-up incorrectly tagged as 0,0 instead of Seoul.
]);

function hasPlayableCoordinates(location: GameLocation) {
  return (
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng) &&
    Math.abs(location.lat) <= 85 &&
    Math.abs(location.lng) <= 180 &&
    !(Math.abs(location.lat) < 0.01 && Math.abs(location.lng) < 0.01) &&
    !BLOCKED_PHOTO_IDS.has(location.id)
  );
}

function shuffle<T>(items: readonly T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function worldRegion({ lat, lng }: Coordinates) {
  if (lat < -60) return "Antarctica";
  if (lat >= 7 && lat <= 33 && lng >= -120 && lng <= -58) return "Central America & Caribbean";
  if (lat >= -56 && lat <= 13 && lng >= -82 && lng <= -34) return "South America";
  if (lat >= -35 && lat <= 37 && lng >= -18 && lng <= 52 && (lng <= 35 || lat < 15)) return "Africa";
  if (lat >= -50 && lat <= 0 && (lng >= 110 || lng <= -150)) return "Oceania";
  if (lat >= 35 && lat <= 72 && lng >= -25 && lng <= 60 && (lng <= 30 || lat >= 50)) return "Europe";
  if (lat >= -10 && lat <= 80 && lng >= 25 && lng <= 180) return "Asia";
  if (lat >= 7 && lat <= 85 && lng >= -170 && lng <= -50) return "North America";
  return "Other";
}

function balancedShuffle(items: readonly GameLocation[]) {
  const buckets = new Map<string, GameLocation[]>();

  shuffle(items).forEach((item) => {
    const region = worldRegion(item);
    buckets.set(region, [...(buckets.get(region) ?? []), item]);
  });

  const regions = shuffle([...buckets.keys()]);
  const result: GameLocation[] = [];
  let hasPhotos = true;

  while (hasPhotos) {
    hasPhotos = false;
    shuffle(regions).forEach((region) => {
      const photo = buckets.get(region)?.pop();
      if (photo) {
        result.push(photo);
        hasPhotos = true;
      }
    });
  }

  return result;
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

function botGuess(target: Coordinates, typicalError: number, blunderChance: number) {
  const bearing = Math.random() * Math.PI * 2;
  const blundered = Math.random() < blunderChance;
  const blunderDistance = BLUNDER_DISTANCES[Math.floor(Math.random() * BLUNDER_DISTANCES.length)];
  const distance = blundered
    ? blunderDistance * (0.9 + Math.random() * 0.2)
    : typicalError * (0.35 + Math.random() * 1.05);
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

  return {
    point: { lat: degrees(lat), lng: ((degrees(lng) + 540) % 360) - 180 },
    blundered,
  };
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
  locked,
  onPick,
}: {
  playerGuess: Coordinates | null;
  botPoint: Coordinates | null;
  target: Coordinates;
  revealed: boolean;
  locked: boolean;
  onPick: (point: Coordinates) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [expanded, setExpanded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0, moved: false });
  const ignoreClickRef = useRef(false);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [target.lat, target.lng, revealed]);

  useEffect(() => {
    if (locked || revealed || botPoint) setExpanded(false);
  }, [locked, revealed, botPoint]);

  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return;

    function handleWheel(event: WheelEvent) {
      event.preventDefault();

      if (!event.ctrlKey && Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.15 && zoom > 1) {
        setPan(constrainedPan({ x: pan.x - event.deltaX, y: pan.y }));
        return;
      }

      if (event.deltaY === 0) return;
      const direction = event.deltaY < 0 ? 1 : -1;
      const step = Math.max(0.15, Math.min(0.65, Math.abs(event.deltaY) / 220));
      const nextZoom = Math.max(1, Math.min(5, Number((zoom + direction * step).toFixed(2))));
      if (nextZoom === zoom) return;

      const bounds = mapRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const pointerX = event.clientX - bounds.left;
      const pointerY = event.clientY - bounds.top;
      const worldOffsetX = (pointerX - bounds.width / 2 - pan.x) / zoom;
      const worldOffsetY = (pointerY - bounds.height / 2 - pan.y) / zoom;
      const nextPan = {
        x: pointerX - bounds.width / 2 - worldOffsetX * nextZoom,
        y: pointerY - bounds.height / 2 - worldOffsetY * nextZoom,
      };

      setZoom(nextZoom);
      setPan(constrainedPan(nextPan, nextZoom));
    }

    mapElement.addEventListener("wheel", handleWheel, { passive: false });
    return () => mapElement.removeEventListener("wheel", handleWheel);
  }, [zoom, pan.x, pan.y]);

  function constrainedPan(next: { x: number; y: number }, atZoom = zoom) {
    const bounds = mapRef.current?.getBoundingClientRect();
    if (!bounds || atZoom <= 1) return { x: 0, y: 0 };
    const maxX = (bounds.width * (atZoom - 1)) / 2;
    const maxY = (bounds.height * (atZoom - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    };
  }

  function changeZoom(change: number) {
    const nextZoom = Math.max(1, Math.min(5, Number((zoom + change).toFixed(1))));
    setZoom(nextZoom);
    setPan((current) => constrainedPan(current, nextZoom));
  }

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (zoom <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
      moved: false,
    };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag.active) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 5) drag.moved = true;
    setPan(constrainedPan({ x: drag.panX + deltaX, y: drag.panY + deltaY }));
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) return;
    ignoreClickRef.current = dragRef.current.moved;
    dragRef.current.active = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handlePick(event: React.MouseEvent<HTMLDivElement>) {
    if (revealed || locked) return;
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false;
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const transformedX = (event.clientX - bounds.left - bounds.width / 2 - pan.x) / zoom + bounds.width / 2;
    const transformedY = (event.clientY - bounds.top - bounds.height / 2 - pan.y) / zoom + bounds.height / 2;
    const x = Math.max(0, Math.min(bounds.width, transformedX));
    const y = Math.max(0, Math.min(bounds.height, transformedY));
    onPick({ lng: (x / bounds.width) * 360 - 180, lat: 90 - (y / bounds.height) * 180 });
  }

  return (
    <div className={`map-shell ${expanded ? "map-shell--expanded" : ""}`}>
      <div className="map-toolbar">
        <span>Scroll to zoom · drag to pan</span>
        <div className="map-toolbar__controls">
          <button type="button" onClick={() => changeZoom(-0.5)} disabled={zoom <= 1} aria-label="Zoom out">−</button>
          <span>{zoom.toFixed(1)}×</span>
          <button type="button" onClick={() => changeZoom(0.5)} disabled={zoom >= 5} aria-label="Zoom in">+</button>
          <button type="button" onClick={resetView} disabled={zoom === 1 && pan.x === 0 && pan.y === 0}>Reset</button>
          <button type="button" onClick={() => setExpanded((value) => !value)}>{expanded ? "Close" : "Expand"}</button>
        </div>
      </div>
      <div
        ref={mapRef}
        className={`world-map ${revealed || locked ? "world-map--locked" : ""}`}
        onClick={handlePick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="button"
        tabIndex={0}
        aria-label={revealed ? "Round result map" : locked ? "Your guess is locked" : "Select your guess on the satellite map"}
      >
        <div
          className="world-map__canvas"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            "--map-zoom": zoom,
          } as React.CSSProperties}
        >
          {/* NASA Blue Marble satellite mosaic, public domain. */}
          <img src={EARTH_IMAGE} alt="Satellite photograph of Earth used as the guessing map" draggable={false} />
          <span className="world-map__shade" />
          {playerGuess && <Marker point={playerGuess} kind="player" label="You" />}
          {revealed && botPoint && <Marker point={botPoint} kind="bot" label="Bot" />}
          {revealed && <Marker point={target} kind="target" label="Location" />}
        </div>
      </div>
      <div className="map-key">
        <span><i className="key-dot key-dot--player" />You</span>
        {revealed && <span><i className="key-dot key-dot--bot" />Bot</span>}
        {revealed && <span><i className="key-dot key-dot--target" />Location</span>}
        <span className="map-credit">NASA Blue Marble</span>
      </div>
    </div>
  );
}

function PhotoClue({
  location,
  revealed,
  round,
}: {
  location: GameLocation;
  revealed: boolean;
  round: number;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const viewerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 });

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [location.id, revealed]);

  function constrainedPan(next: { x: number; y: number }, atZoom = zoom) {
    const bounds = viewerRef.current?.getBoundingClientRect();
    if (!bounds || atZoom <= 1) return { x: 0, y: 0 };
    const maxX = (bounds.width * (atZoom - 1)) / 2;
    const maxY = (bounds.height * (atZoom - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    };
  }

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    function handleWheel(event: WheelEvent) {
      event.preventDefault();

      if (!event.ctrlKey && Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.15 && zoom > 1) {
        setPan(constrainedPan({ x: pan.x - event.deltaX, y: pan.y - event.deltaY }));
        return;
      }

      if (event.deltaY === 0) return;
      const direction = event.deltaY < 0 ? 1 : -1;
      const step = Math.max(0.16, Math.min(0.7, Math.abs(event.deltaY) / 190));
      const nextZoom = Math.max(1, Math.min(6, Number((zoom + direction * step).toFixed(2))));
      if (nextZoom === zoom) return;

      const bounds = viewerRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const pointerX = event.clientX - bounds.left;
      const pointerY = event.clientY - bounds.top;
      const imageX = (pointerX - bounds.width / 2 - pan.x) / zoom;
      const imageY = (pointerY - bounds.height / 2 - pan.y) / zoom;
      const nextPan = {
        x: pointerX - bounds.width / 2 - imageX * nextZoom,
        y: pointerY - bounds.height / 2 - imageY * nextZoom,
      };

      setZoom(nextZoom);
      setPan(constrainedPan(nextPan, nextZoom));
    }

    viewer.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewer.removeEventListener("wheel", handleWheel);
  }, [zoom, pan.x, pan.y]);

  function changeZoom(change: number) {
    const nextZoom = Math.max(1, Math.min(6, Number((zoom + change).toFixed(1))));
    setZoom(nextZoom);
    setPan((current) => constrainedPan(current, nextZoom));
  }

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (zoom <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag.active) return;
    setPan(constrainedPan({
      x: drag.panX + event.clientX - drag.startX,
      y: drag.panY + event.clientY - drag.startY,
    }));
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <article className="photo-stage">
      <div
        ref={viewerRef}
        className={`photo-stage__viewer ${zoom > 1 ? "photo-stage__viewer--zoomed" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="photo-stage__canvas"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <img src={location.imageUrl} alt={location.alt} draggable={false} />
        </div>
      </div>
      <div className="photo-stage__topline">
        <span>{revealed ? location.region : "Somewhere on Earth"}</span>
        <span>Round {round}</span>
      </div>
      <div className="photo-zoom-controls" aria-label="Photo zoom controls">
        <button type="button" onClick={() => changeZoom(-0.5)} disabled={zoom <= 1} aria-label="Zoom photo out">−</button>
        <span>{zoom.toFixed(1)}×</span>
        <button type="button" onClick={() => changeZoom(0.5)} disabled={zoom >= 6} aria-label="Zoom photo in">+</button>
        <button type="button" onClick={resetView} disabled={zoom === 1 && pan.x === 0 && pan.y === 0}>Reset</button>
      </div>
      <span className="photo-zoom-hint">Scroll to zoom · drag to pan</span>
      <div className="photo-stage__caption">
        <div>
          <span className="caption-label">Clue photograph</span>
          {revealed ? (
            <a href={location.sourceUrl} target="_blank" rel="noreferrer">
              {location.credit} ↗
            </a>
          ) : (
            <span className="credit-hidden">Photographer revealed after both guesses</span>
          )}
        </div>
        {revealed && (
          <div className="location-reveal">
            <span>Approximate location</span>
            <strong>{location.name}</strong>
          </div>
        )}
      </div>
    </article>
  );
}

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [modeId, setModeId] = useState<(typeof HEALTH_MODES)[number]["id"]>("classic");
  const [botId, setBotId] = useState<(typeof BOT_LEVELS)[number]["id"]>("rival");
  const [locationPool, setLocationPool] = useState<GameLocation[]>([...GAME_LOCATIONS]);
  const [libraryState, setLibraryState] = useState<"loading" | "ready" | "fallback">("loading");
  const [deck, setDeck] = useState<GameLocation[]>(() => balancedShuffle(GAME_LOCATIONS));
  const [round, setRound] = useState(1);
  const [playerHealth, setPlayerHealth] = useState(7000);
  const [botHealth, setBotHealth] = useState(7000);
  const [playerPoint, setPlayerPoint] = useState<Coordinates | null>(null);
  const [botPoint, setBotPoint] = useState<Coordinates | null>(null);
  const [botBlunder, setBotBlunder] = useState(false);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [firstLocker, setFirstLocker] = useState<"player" | "bot" | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const resolvingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const selectedMode = HEALTH_MODES.find((mode) => mode.id === modeId) ?? HEALTH_MODES[1];
  const selectedBot = BOT_LEVELS.find((bot) => bot.id === botId) ?? BOT_LEVELS[1];
  const location = deck[(round - 1) % deck.length];
  const target = useMemo(() => ({ lat: location.lat, lng: location.lng }), [location]);
  const multiplier = 1 + Math.floor((round - 1) / 2) * 0.5;

  function playSound(effect: SoundEffect) {
    if (!soundEnabled || typeof window === "undefined") return;
    const context = audioContextRef.current ?? new AudioContext();
    audioContextRef.current = context;
    void context.resume();
    const now = context.currentTime;

    function tone(frequency: number, offset: number, duration: number, type: OscillatorType, volume: number, endFrequency = frequency) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now + offset);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), now + offset + duration);
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(volume, now + offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + duration + 0.02);
    }

    if (effect === "start") {
      tone(330, 0, 0.18, "sine", 0.045, 420);
      tone(494, 0.11, 0.2, "sine", 0.05, 620);
      tone(659, 0.23, 0.28, "triangle", 0.045, 830);
    } else if (effect === "lock") {
      tone(700, 0, 0.09, "square", 0.025, 520);
      tone(420, 0.1, 0.12, "triangle", 0.035, 350);
    } else if (effect === "playerHit") {
      tone(145, 0, 0.28, "sawtooth", 0.065, 48);
      tone(82, 0.06, 0.34, "square", 0.035, 35);
    } else if (effect === "botHit") {
      tone(260, 0, 0.16, "triangle", 0.05, 520);
      tone(520, 0.12, 0.22, "sine", 0.055, 780);
    } else if (effect === "neutral") {
      tone(360, 0, 0.16, "sine", 0.035, 320);
    } else {
      tone(420, 0, 0.11, "sine", 0.035, 560);
      tone(640, 0.09, 0.16, "triangle", 0.035, 760);
    }
  }

  useEffect(() => {
    const preventBrowserZoom = (event: WheelEvent) => {
      if (event.ctrlKey) event.preventDefault();
    };

    window.addEventListener("wheel", preventBrowserZoom, { passive: false });
    return () => window.removeEventListener("wheel", preventBrowserZoom);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [phase, round]);

  useEffect(() => {
    let active = true;
    Promise.all(
      ["/commons-locations.json", "/worldwide-locations.json"].map((url) =>
        fetch(url).then((response) => {
          if (!response.ok) throw new Error("Location library unavailable");
          return response.json() as Promise<GameLocation[]>;
        }),
      ),
    )
      .then(([locations, worldwideLocations]) => {
        const seen = new Set<string>();
        const playableLocations = [...locations, ...worldwideLocations]
          .filter(hasPlayableCoordinates)
          .filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
        if (!active || playableLocations.length === 0) throw new Error("Location library is unavailable");
        setLocationPool([...GAME_LOCATIONS, ...playableLocations]);
        setLibraryState("ready");
      })
      .catch(() => {
        if (active) setLibraryState("fallback");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (phase !== "guessing" && phase !== "waiting") return;
    const countdown = window.setInterval(() => {
      setTimeLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(countdown);
  }, [phase, round]);

  useEffect(() => {
    if (phase !== "guessing" || botPoint) return;
    const thinkTime = 10000 + Math.random() * 18000;
    const botLockTimer = window.setTimeout(() => {
      const generatedGuess = botGuess(target, selectedBot.error, selectedBot.blunderChance);
      setBotPoint(generatedGuess.point);
      setBotBlunder(generatedGuess.blundered);
      setFirstLocker("bot");
      setTimeLeft((seconds) => Math.min(seconds, 12));
      playSound("lock");
    }, thinkTime);
    return () => window.clearTimeout(botLockTimer);
  }, [phase, round, botPoint, selectedBot.error, selectedBot.blunderChance, target]);

  useEffect(() => {
    if (phase !== "waiting" || !playerPoint) return;
    const responseDelay = 2500 + Math.random() * 2500;
    const responseTimer = window.setTimeout(() => {
      const generatedGuess = botGuess(target, selectedBot.error, selectedBot.blunderChance);
      setBotPoint(generatedGuess.point);
      setBotBlunder(generatedGuess.blundered);
      resolveRound(playerPoint, generatedGuess.point);
    }, responseDelay);
    return () => window.clearTimeout(responseTimer);
  }, [phase, round]);

  useEffect(() => {
    if (timeLeft > 0 || (phase !== "guessing" && phase !== "waiting")) return;
    const finalPlayerPoint = playerPoint ?? { lat: 0, lng: 0 };
    const generatedGuess = botPoint ? null : botGuess(target, selectedBot.error, selectedBot.blunderChance);
    const finalBotPoint = botPoint ?? generatedGuess!.point;
    if (generatedGuess) setBotBlunder(generatedGuess.blundered);
    setBotPoint(finalBotPoint);
    resolveRound(finalPlayerPoint, finalBotPoint);
  }, [timeLeft, phase]);

  function startGame() {
    const health = selectedMode.health;
    setDeck(balancedShuffle(locationPool));
    setRound(1);
    setPlayerHealth(health);
    setBotHealth(health);
    setPlayerPoint(null);
    setBotPoint(null);
    setBotBlunder(false);
    setResult(null);
    setTimeLeft(60);
    setFirstLocker(null);
    resolvingRef.current = false;
    playSound("start");
    setPhase("guessing");
  }

  function resolveRound(finalPlayerPoint: Coordinates, finalBotPoint: Coordinates) {
    if (resolvingRef.current) return;
    resolvingRef.current = true;
    const playerDistance = distanceKm(finalPlayerPoint, target);
    const botDistance = distanceKm(finalBotPoint, target);
    const distanceGap = Math.abs(playerDistance - botDistance);
    const damageCap = Math.round(selectedMode.health * 0.3);
    const scaledDamage = Math.round(Math.pow(distanceGap, 0.9) * 0.55 * multiplier);
    const damage = distanceGap < 1 ? 0 : Math.max(1, Math.min(damageCap, scaledDamage));
    const damaged =
      distanceGap < 1
        ? "none"
        : playerDistance > botDistance
          ? "player"
          : "bot";

    if (damaged === "player") setPlayerHealth((health) => Math.max(0, health - damage));
    if (damaged === "bot") setBotHealth((health) => Math.max(0, health - damage));
    setPlayerPoint(finalPlayerPoint);
    setBotPoint(finalBotPoint);
    setResult({ playerDistance, botDistance, damage, damaged });
    playSound(damaged === "player" ? "playerHit" : damaged === "bot" ? "botHit" : "neutral");
    setPhase("reveal");
  }

  function lockGuess() {
    if (!playerPoint || phase !== "guessing") return;
    playSound("lock");
    if (botPoint) {
      resolveRound(playerPoint, botPoint);
      return;
    }
    setFirstLocker("player");
    setTimeLeft(8);
    setPhase("waiting");
  }

  function continueGame() {
    if (playerHealth <= 0 || botHealth <= 0) {
      setPhase("gameover");
      return;
    }
    if (round % deck.length === 0) setDeck(balancedShuffle(locationPool));
    setRound((value) => value + 1);
    setPlayerPoint(null);
    setBotPoint(null);
    setBotBlunder(false);
    setResult(null);
    setTimeLeft(60);
    setFirstLocker(null);
    resolvingRef.current = false;
    playSound("advance");
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
            You have 60 seconds—once someone locks, their rival gets only seconds to answer.
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

          <button className="primary-button primary-button--large" type="button" onClick={startGame} disabled={libraryState === "loading"}>
            {libraryState === "loading" ? "Loading world library…" : "Begin the duel"} <span>→</span>
          </button>
          <p className="start-panel__note">
            {libraryState === "ready"
              ? "Curated photographs with visible geographic clues"
              : libraryState === "fallback"
                ? "Curated collection · expanded library unavailable"
                : "Curating the photo library…"}
          </p>
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
    <main className={`game-screen game-screen--${phase} ${phase === "reveal" ? `game-screen--impact-${result?.damaged ?? "none"}` : ""}`}>
      {phase === "guessing" && (
        <div className="round-intro" key={`round-intro-${round}`} aria-hidden="true">
          <span>Round</span>
          <strong>{round}</strong>
        </div>
      )}
      {phase === "reveal" && result && (
        <div className={`round-impact round-impact--${result.damaged}`} aria-hidden="true">
          <i className="round-impact__ring" />
          {Array.from({ length: 12 }, (_, index) => (
            <i key={index} className="round-impact__spark" style={{ "--spark-index": index } as React.CSSProperties} />
          ))}
        </div>
      )}
      <header className="game-header">
        <div className="brand"><span className="brand__mark" />LensQuest</div>
        <div className="round-status">
          <div className="round-chip">Round {round} <strong>×{multiplier.toFixed(1)}</strong></div>
          <div className={`timer-chip ${timeLeft <= 10 ? "timer-chip--urgent" : ""}`}>
            <span>{phase === "waiting" ? "Bot reply" : firstLocker === "bot" ? "Your reply" : "Time"}</span>
            <strong>0:{String(timeLeft).padStart(2, "0")}</strong>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="sound-button"
            type="button"
            aria-pressed={soundEnabled}
            onClick={() => setSoundEnabled((enabled) => !enabled)}
          >
            {soundEnabled ? "Sound on" : "Sound off"}
          </button>
          <button className="quit-button" type="button" onClick={() => setPhase("setup")}>End duel</button>
        </div>
      </header>

      <section className="battle-strip">
        <HealthBar label="You" value={playerHealth} maximum={selectedMode.health} tone="player" />
        <div className="versus">VS</div>
        <HealthBar label={selectedBot.label} value={botHealth} maximum={selectedMode.health} tone="bot" />
      </section>

      <section className="game-grid">
        <PhotoClue
          key={location.id}
          location={location}
          revealed={phase === "reveal"}
          round={round}
        />

        <aside className={`guess-panel ${phase === "reveal" ? "guess-panel--reveal" : ""}`}>
          <div className="guess-panel__heading">
            <div>
              <span className="caption-label">{phase === "reveal" ? "Round result" : phase === "waiting" ? "Guess locked" : "Your move"}</span>
              <h2>{phase === "reveal" ? location.name : phase === "waiting" ? "Opponent is choosing…" : "Where was this taken?"}</h2>
            </div>
            <div className="multiplier-badge">×{multiplier.toFixed(1)} damage</div>
          </div>

          <WorldGuessMap
            playerGuess={playerPoint}
            botPoint={botPoint}
            target={target}
            revealed={phase === "reveal"}
            locked={phase === "waiting"}
            onPick={setPlayerPoint}
          />

          {phase === "guessing" ? (
            <div className="guess-actions">
              {firstLocker === "bot" && (
                <div className="bot-lock-alert"><span>Bot locked</span><strong>Answer now</strong></div>
              )}
              <p>
                {firstLocker === "bot"
                  ? `The bot locked first. You have ${timeLeft} seconds to answer.`
                  : playerPoint
                    ? "Pin placed. Zoom, pan, refine it, or lock in your guess."
                    : "Tap the satellite photograph to place your pin."}
              </p>
              <button className="primary-button" type="button" disabled={!playerPoint} onClick={lockGuess}>
                {firstLocker === "bot" ? "Answer now" : "Lock guess"}
              </button>
            </div>
          ) : phase === "waiting" ? (
            <div className="waiting-panel">
              <div className="waiting-panel__pulse" />
              <span>You locked first</span>
              <strong>{selectedBot.label} has {timeLeft} seconds</strong>
              <p>The round reveals as soon as the bot commits.</p>
            </div>
          ) : (
            <div className="result-panel">
              <div className="lock-summary">
                {firstLocker === "player" ? "You locked first" : firstLocker === "bot" ? `${selectedBot.label} locked first` : "Time expired"}
              </div>
              {botBlunder && <div className="blunder-badge"><span>Bot blunder</span><strong>Wild miss!</strong></div>}
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
