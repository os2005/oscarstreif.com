"use client";

import { type TouchEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./treffpunkt.module.css";

type LatLngPoint = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  weight: number;
};

type LatLng = {
  lat: number;
  lng: number;
};

type Mode = "median" | "mean" | "fair" | "hoodometer";

type XYPoint = {
  x: number;
  y: number;
};

type WeightedXYPoint = XYPoint & {
  weight: number;
};

type Result = {
  lat: number;
  lng: number;
  scoreMeters: number;
  maxMeters: number;
  averageMeters: number;
  label: string;
  hoodPlace?: {
    name: string;
    distanceToFairPointMeters: number;
  };
};

type StoredScenario = {
  code: string;
  people: LatLngPoint[];
  mode: Mode;
  lambda: number;
};

type TreffpunktClientProps = {
  initialScenarioCode?: string;
};

type LeafletIcon = unknown;

type LeafletMouseEvent = {
  latlng: {
    lat: number;
    lng: number;
  };
};

type LeafletBounds = {
  pad: (ratio: number) => LeafletBounds;
};

type LeafletLayerGroup = {
  clearLayers: () => void;
};

type LeafletMap = {
  fitBounds: (bounds: LeafletBounds, options?: { animate?: boolean; maxZoom?: number }) => void;
  invalidateSize: () => void;
  on: (eventName: "click", handler: (event: LeafletMouseEvent) => void) => void;
  setView: (center: [number, number], zoom: number) => void;
};

type LeafletMarker = {
  addTo: (layer: LeafletLayerGroup) => LeafletMarker;
  bindPopup: (html: string) => LeafletMarker;
};

type LeafletApi = {
  divIcon: (options: {
    className: string;
    html: string;
    iconAnchor: [number, number];
    iconSize: [number, number];
  }) => LeafletIcon;
  latLngBounds: (latLngs: [number, number][]) => LeafletBounds;
  layerGroup: () => { addTo: (map: LeafletMap) => LeafletLayerGroup };
  map: (
    element: HTMLElement,
    options: {
      attributionControl: boolean;
      center: [number, number];
      zoom: number;
      zoomControl: boolean;
    },
  ) => LeafletMap;
  marker: (latLng: [number, number], options: { icon: LeafletIcon }) => LeafletMarker;
  tileLayer: (
    urlTemplate: string,
    options: {
      attribution: string;
      maxZoom: number;
    },
  ) => { addTo: (map: LeafletMap) => void };
};

declare global {
  interface Window {
    L?: LeafletApi;
  }
}

const KARLSRUHE = { lat: 49.0069, lng: 8.4037 };
const EARTH_RADIUS_M = 6_371_000;
const LEAFLET_CSS_ID = "leaflet-css";
const LEAFLET_SCRIPT_ID = "leaflet-js";
const STORAGE_KEY = "treffpunkt-karlsruhe-v2";
const calculationMethods: Array<{
  value: Mode;
  label: string;
  detail: string;
}> = [
  {
    value: "hoodometer",
    label: "Hoodometer",
    detail: "Nimmt den Fairness-Mittelpunkt und wählt den nächstgelegenen deiner gesetzten Wohnorte.",
  },
  {
    value: "median",
    label: "Geometrischer Median",
    detail: "Minimiert die gewichtete Summe aller Luftlinien und bleibt dadurch robuster gegen einzelne Ausreißer.",
  },
  {
    value: "mean",
    label: "Schwerpunkt",
    detail: "Berechnet den gewichteten Durchschnitt aller Wohnorte. Orte mit mehr Personen ziehen den Punkt stärker.",
  },
  {
    value: "fair",
    label: "Fairness",
    detail: "Startet beim Median und bestraft zusätzlich den längsten Einzelweg, damit niemand extrem weit rausfällt.",
  },
];

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeWeight(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(99, Math.max(1, Math.round(value)));
}

function normalizePoint(point: LatLngPoint, index: number): LatLngPoint {
  return {
    id: point.id || createId("p"),
    lat: point.lat,
    lng: point.lng,
    label: point.label.trim() || `Wohnort ${index + 1}`,
    weight: normalizeWeight(point.weight),
  };
}

function formatDistance(meters: number) {
  if (!Number.isFinite(meters)) return "-";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

function haversineMeters(a: LatLng, b: LatLng) {
  const phi1 = (a.lat * Math.PI) / 180;
  const phi2 = (b.lat * Math.PI) / 180;
  const dPhi = ((b.lat - a.lat) * Math.PI) / 180;
  const dLambda = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDPhi = Math.sin(dPhi / 2);
  const sinDLambda = Math.sin(dLambda / 2);
  const h =
    sinDPhi * sinDPhi + Math.cos(phi1) * Math.cos(phi2) * sinDLambda * sinDLambda;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

function totalPeople(points: LatLngPoint[]) {
  return points.reduce((sum, point) => sum + normalizeWeight(point.weight), 0);
}

function nearestHoodometerPlace(point: LatLng, people: LatLngPoint[]) {
  return people.reduce((best, place) =>
    haversineMeters(point, place) < haversineMeters(point, best) ? place : best,
  );
}

function projectionOrigin(points: LatLngPoint[]) {
  const weightSum = totalPeople(points);
  if (!weightSum) return KARLSRUHE;

  return {
    lat: points.reduce((sum, p) => sum + p.lat * normalizeWeight(p.weight), 0) / weightSum,
    lng: points.reduce((sum, p) => sum + p.lng * normalizeWeight(p.weight), 0) / weightSum,
  };
}

function latLngToXY(point: LatLngPoint, origin: { lat: number; lng: number }): WeightedXYPoint {
  const latRad = (origin.lat * Math.PI) / 180;
  return {
    x: ((point.lng - origin.lng) * Math.PI * EARTH_RADIUS_M * Math.cos(latRad)) / 180,
    y: ((point.lat - origin.lat) * Math.PI * EARTH_RADIUS_M) / 180,
    weight: normalizeWeight(point.weight),
  };
}

function xyToLatLng(point: XYPoint, origin: { lat: number; lng: number }) {
  const latRad = (origin.lat * Math.PI) / 180;
  return {
    lat: origin.lat + (point.y * 180) / (Math.PI * EARTH_RADIUS_M),
    lng: origin.lng + (point.x * 180) / (Math.PI * EARTH_RADIUS_M * Math.cos(latRad)),
  };
}

function euclidean(a: XYPoint, b: XYPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function meanXY(points: WeightedXYPoint[]): XYPoint {
  const weightSum = points.reduce((sum, point) => sum + point.weight, 0);
  return {
    x: points.reduce((sum, p) => sum + p.x * p.weight, 0) / weightSum,
    y: points.reduce((sum, p) => sum + p.y * p.weight, 0) / weightSum,
  };
}

function geometricMedianXY(points: WeightedXYPoint[]) {
  if (points.length === 1) return points[0];

  let current = meanXY(points);
  for (let iteration = 0; iteration < 500; iteration += 1) {
    let numeratorX = 0;
    let numeratorY = 0;
    let denominator = 0;

    for (const point of points) {
      const distance = Math.max(euclidean(current, point), 1e-9);
      numeratorX += (point.weight * point.x) / distance;
      numeratorY += (point.weight * point.y) / distance;
      denominator += point.weight / distance;
    }

    const next = {
      x: numeratorX / denominator,
      y: numeratorY / denominator,
    };

    if (euclidean(current, next) < 0.01) return next;
    current = next;
  }

  return current;
}

function fairScore(candidate: XYPoint, points: WeightedXYPoint[], lambda: number) {
  const distances = points.map((point) => ({
    distance: euclidean(candidate, point),
    weight: point.weight,
  }));
  const weightedSum = distances.reduce((sum, entry) => sum + entry.distance * entry.weight, 0);
  const max = Math.max(...distances.map((entry) => entry.distance));
  return weightedSum + lambda * max;
}

function fairPointXY(points: WeightedXYPoint[], lambda: number) {
  let best = geometricMedianXY(points);
  let bestScore = fairScore(best, points, lambda);

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const spread = Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
    300,
  );

  let step = spread / 2;
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: -1, y: -1 },
  ];

  for (let iteration = 0; iteration < 120; iteration += 1) {
    let improved = false;

    for (const direction of directions) {
      const length = Math.hypot(direction.x, direction.y);
      const candidate = {
        x: best.x + (direction.x / length) * step,
        y: best.y + (direction.y / length) * step,
      };
      const score = fairScore(candidate, points, lambda);
      if (score < bestScore) {
        best = candidate;
        bestScore = score;
        improved = true;
      }
    }

    if (!improved) step *= 0.65;
    if (step < 0.05) break;
  }

  return best;
}

function evaluateResult(result: Omit<Result, "scoreMeters" | "maxMeters" | "averageMeters">, people: LatLngPoint[]) {
  const distances = people.map((point) => ({
    distance: haversineMeters(result, point),
    weight: normalizeWeight(point.weight),
  }));
  const scoreMeters = distances.reduce((sum, entry) => sum + entry.distance * entry.weight, 0);
  const peopleCount = totalPeople(people);

  return {
    ...result,
    scoreMeters,
    maxMeters: Math.max(...distances.map((entry) => entry.distance)),
    averageMeters: scoreMeters / peopleCount,
  } satisfies Result;
}

function computeResult(people: LatLngPoint[], mode: Mode, lambda: number): Result | null {
  if (!people.length) return null;
  const origin = projectionOrigin(people);
  const xy = people.map((point) => latLngToXY(point, origin));
  let target: XYPoint;

  if (mode === "mean") target = meanXY(xy);
  else if (mode === "fair" || mode === "hoodometer") target = fairPointXY(xy, lambda);
  else target = geometricMedianXY(xy);

  const latLng = xyToLatLng(target, origin);
  if (mode === "hoodometer") {
    const hoodPlace = nearestHoodometerPlace(latLng, people);
    const hoodName = hoodPlace.label.trim() || "Wohnort";
    return evaluateResult(
      {
        lat: hoodPlace.lat,
        lng: hoodPlace.lng,
        label: `Die Hood liegt bei ${hoodName}`,
        hoodPlace: {
          name: hoodName,
          distanceToFairPointMeters: haversineMeters(latLng, hoodPlace),
        },
      },
      people,
    );
  }

  const label =
    mode === "mean"
      ? "Schwerpunkt / Durchschnitt"
      : mode === "fair"
        ? "Fairness-Treffpunkt"
        : "Geometrischer Median";

  return evaluateResult({ ...latLng, label }, people);
}

function modeLabel(mode: Mode) {
  switch (mode) {
    case "hoodometer":
      return "Hoodometer";
    case "mean":
      return "Schwerpunkt";
    case "fair":
      return "Fairness";
    default:
      return "Geometrischer Median";
  }
}

async function ensureLeaflet() {
  if (typeof window === "undefined") return null;
  if (window.L) return window.L;

  if (!document.getElementById(LEAFLET_CSS_ID)) {
    const link = document.createElement("link");
    link.id = LEAFLET_CSS_ID;
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }

  await new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(LEAFLET_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      if (window.L) resolve();
      else existingScript.addEventListener("load", () => resolve(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = LEAFLET_SCRIPT_ID;
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Leaflet konnte nicht geladen werden."));
    document.body.appendChild(script);
  });

  return window.L;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function markerHtml(kind: "person" | "result", label: string, content = "") {
  const className = kind === "result" ? "tm-marker tm-marker-result" : "tm-marker tm-marker-person";
  return `<div class="${className}" title="${escapeHtml(label)}"><span>${escapeHtml(content)}</span></div>`;
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getShareUrl(code: string) {
  if (typeof window === "undefined") return `/treffpunkt/${code}`;
  const isPublicDomain = window.location.hostname === "oscarstreif.com" || window.location.hostname === "treffpunkt.oscarstreif.com";
  const origin = isPublicDomain ? "https://oscarstreif.com" : window.location.origin;
  return `${origin}/treffpunkt/${code}`;
}

function normalizeScenarioCode(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function TreffpunktClient({ initialScenarioCode }: TreffpunktClientProps) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LeafletLayerGroup | null>(null);
  const loadedScenarioRef = useRef<string | null>(null);
  const lastAutoFitSignatureRef = useRef<string | null>(null);
  const panelTouchStartYRef = useRef<number | null>(null);
  const [people, setPeople] = useState<LatLngPoint[]>([]);
  const [dirtyPointIds, setDirtyPointIds] = useState<Set<string>>(() => new Set());
  const [mode, setMode] = useState<Mode>("median");
  const [lambda, setLambda] = useState(0.8);
  const [mapReady, setMapReady] = useState(false);
  const [notice, setNotice] = useState("Karte laden...");
  const [storageReady, setStorageReady] = useState(false);
  const [scenarioCodeInput, setScenarioCodeInput] = useState(initialScenarioCode ?? "");
  const [isSharing, setIsSharing] = useState(false);
  const [isLoadingScenario, setIsLoadingScenario] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = window.setTimeout(() => {
      const stored = safeJsonParse<{
        people?: LatLngPoint[];
        mode?: Mode;
        lambda?: number;
      }>(window.localStorage.getItem(STORAGE_KEY), {});

      if (stored.people?.length) setPeople(stored.people.map(normalizePoint));
      if (stored.mode) setMode(stored.mode);
      if (typeof stored.lambda === "number") setLambda(stored.lambda);
      setStorageReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !storageReady) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ people, mode, lambda }),
    );
  }, [people, mode, lambda, storageReady]);

  const result = useMemo(() => computeResult(people, mode, lambda), [people, mode, lambda]);
  const peopleCount = useMemo(() => totalPeople(people), [people]);
  const pointPositionSignature = useMemo(
    () => people.map((point) => `${point.id}:${point.lat.toFixed(6)},${point.lng.toFixed(6)}`).join("|"),
    [people],
  );
  const shellClassName = `${styles.shell} ${isPanelCollapsed ? styles.shellCollapsed : ""}`;

  const addPoint = useCallback((lat: number, lng: number) => {
    setPeople((prev) => [
      ...prev,
      {
        id: createId("p"),
        lat,
        lng,
        label: `Wohnort ${prev.length + 1}`,
        weight: 1,
      },
    ]);
    setNotice("Wohnort gesetzt. Du kannst Name und Personenzahl unten anpassen.");
  }, []);

  const updatePoint = useCallback((pointId: string, patch: Partial<Pick<LatLngPoint, "label" | "weight">>) => {
    setDirtyPointIds((prev) => new Set(prev).add(pointId));
    setPeople((prev) =>
      prev.map((point) =>
        point.id === pointId
          ? {
              ...point,
              ...patch,
              weight: patch.weight === undefined ? point.weight : normalizeWeight(patch.weight),
            }
          : point,
      ),
    );
  }, []);

  const deletePoint = useCallback((pointId: string) => {
    setPeople((prev) => prev.filter((point) => point.id !== pointId));
    setDirtyPointIds((prev) => {
      const next = new Set(prev);
      next.delete(pointId);
      return next;
    });
    setNotice("Wohnort entfernt.");
  }, []);

  const savePoint = useCallback((pointId: string) => {
    setPeople((prev) => prev.map((point, index) => (point.id === pointId ? normalizePoint(point, index) : point)));
    setDirtyPointIds((prev) => {
      const next = new Set(prev);
      next.delete(pointId);
      return next;
    });
    setNotice("Wohnort gespeichert.");
  }, []);

  const applyScenario = useCallback((scenario: StoredScenario) => {
    setPeople(scenario.people.map(normalizePoint));
    setMode(scenario.mode);
    setLambda(scenario.lambda);
    setScenarioCodeInput(scenario.code);
    setDirtyPointIds(new Set());
    loadedScenarioRef.current = scenario.code;
    setNotice(`Szenario ${scenario.code} geladen.`);
  }, []);

  const handlePanelTouchStart = (event: TouchEvent<HTMLButtonElement>) => {
    panelTouchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handlePanelTouchEnd = (event: TouchEvent<HTMLButtonElement>) => {
    const startY = panelTouchStartYRef.current;
    panelTouchStartYRef.current = null;
    const endY = event.changedTouches[0]?.clientY ?? null;

    if (startY === null || endY === null) return;

    const deltaY = endY - startY;
    if (deltaY > 42) setIsPanelCollapsed(true);
    if (deltaY < -42) setIsPanelCollapsed(false);
  };

  const loadScenario = useCallback(
    async (rawCode: string, options: { updateUrl?: boolean } = {}) => {
      const code = normalizeScenarioCode(rawCode);
      if (!code) {
        setNotice("Gib zuerst einen Szenario-Code ein.");
        return;
      }

      setIsLoadingScenario(true);
      try {
        const response = await fetch(`/api/treffpunkt/scenarios/${encodeURIComponent(code)}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          setNotice("Dieses Szenario wurde nicht gefunden.");
          return;
        }

        const scenario = (await response.json()) as StoredScenario;
        applyScenario(scenario);

        if (options.updateUrl !== false && typeof window !== "undefined") {
          window.history.replaceState(null, "", `/treffpunkt/${scenario.code}`);
        }
      } catch {
        setNotice("Szenario konnte gerade nicht geladen werden.");
      } finally {
        setIsLoadingScenario(false);
      }
    },
    [applyScenario],
  );

  useEffect(() => {
    const code = initialScenarioCode ? normalizeScenarioCode(initialScenarioCode) : "";
    if (!code || loadedScenarioRef.current === code) return;
    void loadScenario(code, { updateUrl: false });
  }, [initialScenarioCode, loadScenario]);

  useEffect(() => {
    let cancelled = false;

    ensureLeaflet()
      .then((L) => {
        if (!L || cancelled || !mapEl.current || mapRef.current) return;

        const map = L.map(mapEl.current, {
          center: [KARLSRUHE.lat, KARLSRUHE.lng],
          zoom: 13,
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        layerRef.current = L.layerGroup().addTo(map);
        map.on("click", (event) => addPoint(event.latlng.lat, event.latlng.lng));
        mapRef.current = map;
        setMapReady(true);
        setNotice("Karte bereit. Klicke Wohnorte in Karlsruhe an.");

        setTimeout(() => map.invalidateSize(), 100);
        setTimeout(() => map.invalidateSize(), 500);
      })
      .catch(() => {
        setNotice("Die Karte konnte nicht geladen werden. Prüfe deine Internetverbindung oder den Leaflet-CDN-Zugriff.");
      });

    return () => {
      cancelled = true;
    };
  }, [addPoint]);

  useEffect(() => {
    const L = window.L;
    const layer = layerRef.current;
    if (!mapReady || !L || !layer || !mapRef.current) return;

    layer.clearLayers();

    const resultIcon = L.divIcon({
      html: markerHtml("result", "Treffpunkt"),
      className: "tm-marker-wrapper",
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    for (const [index, point] of people.entries()) {
      const safeLabel = escapeHtml(point.label);
      const personIcon = L.divIcon({
        html: markerHtml("person", point.label, String(index + 1)),
        className: "tm-marker-wrapper",
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      L.marker([point.lat, point.lng], { icon: personIcon })
        .bindPopup(`<strong>${safeLabel}</strong><br/>${normalizeWeight(point.weight)} Person(en)`)
        .addTo(layer);
    }

    if (result) {
      L.marker([result.lat, result.lng], { icon: resultIcon })
        .bindPopup(
          `<strong>${result.label}</strong><br/>Gewichtete Summe: ${formatDistance(result.scoreMeters)}<br/>Gewichteter Ø: ${formatDistance(result.averageMeters)}<br/>Max: ${formatDistance(result.maxMeters)}`,
        )
        .addTo(layer);
    }
  }, [mapReady, people, result]);

  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!mapReady || !L || !map) return;
    if (lastAutoFitSignatureRef.current === pointPositionSignature) return;

    lastAutoFitSignatureRef.current = pointPositionSignature;
    if (!people.length) return;

    const latLngs = people.map((point) => [point.lat, point.lng] as [number, number]);
    if (latLngs.length === 1) {
      map.setView(latLngs[0], 15);
      return;
    }

    const bounds = L.latLngBounds(latLngs).pad(0.18);
    map.fitBounds(bounds, { animate: true, maxZoom: 15 });
  }, [mapReady, people, pointPositionSignature]);

  useEffect(() => {
    const timer = window.setTimeout(() => mapRef.current?.invalidateSize(), 220);
    return () => window.clearTimeout(timer);
  }, [isPanelCollapsed]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/treffpunkt/sw.js", { scope: "/treffpunkt/" }).catch(() => {
      // Non-critical: the app still works without offline caching.
    });
  }, []);

  const shareScenario = async () => {
    if (!people.length) {
      setNotice("Setze zuerst mindestens einen Wohnort.");
      return;
    }

    setIsSharing(true);
    try {
      const response = await fetch("/api/treffpunkt/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ people, mode, lambda }),
      });

      if (!response.ok) {
        setNotice("Szenario konnte nicht gespeichert werden.");
        return;
      }

      const scenario = (await response.json()) as StoredScenario;
      const url = getShareUrl(scenario.code);
      const text = result
        ? `Hoodometer Karlsruhe: ${result.label}. Szenario-Code: ${scenario.code}`
        : `Hoodometer Karlsruhe Szenario-Code: ${scenario.code}`;

      setScenarioCodeInput(scenario.code);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `/treffpunkt/${scenario.code}`);
      }

      if (navigator.share) {
        await navigator.share({ title: "Hoodometer Karlsruhe", text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
      }

      setNotice(`Szenario ${scenario.code} gespeichert und geteilt.`);
    } catch {
      setNotice("Szenario konnte gerade nicht geteilt werden.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <main className={shellClassName}>
      <section className={styles.mapPanel} aria-label="Karlsruhe-Karte">
        <div ref={mapEl} className={styles.map} />
        {!mapReady && <div className={styles.loading}>Karte laden...</div>}
      </section>

      <aside className={styles.controlPanel} aria-label="Treffpunkt-Steuerung">
        <button
          type="button"
          className={styles.sheetToggle}
          aria-expanded={!isPanelCollapsed}
          onClick={() => setIsPanelCollapsed((current) => !current)}
          onTouchStart={handlePanelTouchStart}
          onTouchEnd={handlePanelTouchEnd}
        >
          <span className={styles.sheetGrip} aria-hidden="true" />
          <span>{isPanelCollapsed ? "Details anzeigen" : "Karte größer"}</span>
        </button>

        <div className={styles.headerBlock}>
          <p className={styles.eyebrow}>Karlsruhe</p>
          <h1>Hoodometer</h1>
          <p>
            Wohnorte anklicken, benennen, Personenzahl setzen. Hoodometer berechnet den gewichteten Treffpunkt.
          </p>
        </div>

        <section className={styles.methodField} aria-label="Berechnungsmethode">
          <span className={styles.fieldLabel}>Modus</span>
          <div className={styles.methodOptions}>
            {calculationMethods.map((method) => {
              const isActive = mode === method.value;

              return (
                <button
                  type="button"
                  className={`${styles.methodChoice} ${isActive ? styles.methodActive : ""}`}
                  key={method.value}
                  onClick={() => setMode(method.value)}
                  aria-pressed={isActive}
                >
                  <span className={styles.methodChoiceLabel}>
                    {method.label}
                    <span className={styles.methodInfoDot} aria-hidden="true">
                      i
                    </span>
                  </span>
                  {isActive && <span className={styles.methodDetail}>{method.detail}</span>}
                </button>
              );
            })}
          </div>
        </section>

        {(mode === "fair" || mode === "hoodometer") && (
          <label className={styles.field}>
            Fairness-Gewichtung lambda: {lambda.toFixed(1)}
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={lambda}
              onChange={(event) => setLambda(Number(event.target.value))}
            />
          </label>
        )}

        <div className={styles.resultCard}>
          <span>{modeLabel(mode)}</span>
          <h2>{result ? result.label : "Noch kein Ergebnis"}</h2>
          {result ? (
            <dl>
              <div>
                <dt>Koordinate</dt>
                <dd>
                  {result.lat.toFixed(5)}, {result.lng.toFixed(5)}
                </dd>
              </div>
              {result.hoodPlace && (
                <div>
                  <dt>Zum fairen Punkt</dt>
                  <dd>{formatDistance(result.hoodPlace.distanceToFairPointMeters)}</dd>
                </div>
              )}
              <div>
                <dt>Gewichtete Summe</dt>
                <dd>{formatDistance(result.scoreMeters)}</dd>
              </div>
              <div>
                <dt>Gewichteter Durchschnitt</dt>
                <dd>{formatDistance(result.averageMeters)}</dd>
              </div>
              <div>
                <dt>Max. Einzelweg</dt>
                <dd>{formatDistance(result.maxMeters)}</dd>
              </div>
            </dl>
          ) : (
            <p>Setze mindestens einen Wohnort auf der Karte.</p>
          )}
        </div>

        <div className={styles.scenarioPanel}>
          <label className={styles.field}>
            Szenario-Code
            <input
              type="text"
              inputMode="text"
              placeholder="z. B. ka7m2q"
              value={scenarioCodeInput}
              onChange={(event) => setScenarioCodeInput(event.target.value)}
            />
          </label>
          <div className={styles.actions}>
            <button type="button" onClick={() => void loadScenario(scenarioCodeInput)} disabled={isLoadingScenario}>
              {isLoadingScenario ? "Lade..." : "Szenario laden"}
            </button>
            <button type="button" onClick={() => void shareScenario()} disabled={isSharing}>
              {isSharing ? "Teile..." : "Szenario teilen"}
            </button>
          </div>
        </div>

        <div className={styles.listBlock}>
          <div className={styles.listHeader}>
            <h3>Wohnorte</h3>
            <span>
              {people.length} Orte · {peopleCount} Personen
            </span>
          </div>

          {people.length ? (
            <div className={styles.placeList}>
              {people.map((point, index) => {
                const isDirty = dirtyPointIds.has(point.id);

                return (
                  <article className={styles.placeRow} key={point.id}>
                    <span className={styles.placeIndex}>Wohnort {index + 1}</span>
                    <button
                      type="button"
                      className={styles.deletePoint}
                      aria-label={`${point.label} löschen`}
                      onClick={() => deletePoint(point.id)}
                    >
                      x
                    </button>
                    <label>
                      Name
                      <input
                        type="text"
                        value={point.label}
                        onChange={(event) => updatePoint(point.id, { label: event.target.value })}
                      />
                    </label>
                    <label>
                      Personen
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={point.weight}
                        onChange={(event) => updatePoint(point.id, { weight: Number(event.target.value) })}
                      />
                    </label>
                    <button
                      type="button"
                      className={`${styles.savePoint} ${isDirty ? styles.savePointDirty : ""}`}
                      disabled={!isDirty}
                      onClick={() => savePoint(point.id)}
                    >
                      Speichern
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className={styles.emptyState}>Klicke auf die Karte, um den ersten Wohnort hinzuzufügen.</p>
          )}
        </div>

        <p className={styles.notice}>{notice}</p>
        <p className={styles.footnote}>
          Rechnet aktuell mit Luftlinie. Die Personenzahl gewichtet den Einfluss eines Wohnorts auf den Treffpunkt.
        </p>
      </aside>
    </main>
  );
}
