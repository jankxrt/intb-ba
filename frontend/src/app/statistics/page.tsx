"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const BL_GEO_URL = "/data/bundeslaender.geo.json";
const LK_GEO_URL = "/data/landkreise.geo.json";

const kontaktiertSet = new Set(["Y", "J", "YES", "JA"]);

interface BundeslandStats { total: number; contacted: number }
interface SizeStats { total: number; contacted: number }

type SizeCategory = "Millionenstadt" | "Groß" | "Mittel" | "Klein" | "N.N.";

const SIZE_ORDER: SizeCategory[] = ["Millionenstadt", "Groß", "Mittel", "Klein", "N.N."];

const SIZE_META: Record<SizeCategory, { label: string; sub: string; color: string }> = {
  Millionenstadt: { label: "Millionenstadt",  sub: "≥ 1 Mio.",    color: "rgb(168,85,247)"  },
  Groß:           { label: "Großstadt",        sub: "100k–1 Mio.", color: "rgb(239,68,68)"   },
  Mittel:         { label: "Mittelstadt",       sub: "20k–100k",   color: "rgb(249,115,22)"  },
  Klein:          { label: "Kleinstadt",        sub: "< 20k",      color: "rgb(34,197,94)"   },
  "N.N.":         { label: "Unbekannt",         sub: "keine Angabe",color: "rgb(148,163,184)" },
};

function getCitySize(einwohner: string): SizeCategory {
  if (!einwohner || einwohner.trim() === "" || einwohner === "0" || einwohner === "#N/A") return "N.N.";
  const n = parseInt(einwohner.replace(/\D/g, ""), 10);
  if (isNaN(n) || n === 0) return "N.N.";
  if (n >= 1_000_000) return "Millionenstadt";
  if (n >= 100_000)   return "Groß";
  if (n >= 20_000)    return "Mittel";
  return "Klein";
}

interface CsvRow {
  stadt: string;
  type: string; // "Stadt" | "Landkreis"
  land: string;
  kontakt: string;
  size: SizeCategory;
}

interface GeoFeature {
  type: string;
  properties: Record<string, string>;
  geometry: { type: string; coordinates: unknown };
}
interface GeoCollection { type: string; features: GeoFeature[] }

// ── projection helpers ────────────────────────────────────────────────────────
function flattenCoords(coords: unknown): [number, number][] {
  if (!Array.isArray(coords)) return [];
  if (typeof coords[0] === "number") return [coords as [number, number]];
  return (coords as unknown[]).flatMap(flattenCoords);
}
function bboxOf(features: GeoFeature[]) {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  features.forEach(f =>
    flattenCoords(f.geometry.coordinates).forEach(([lng, lat]) => {
      if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
    })
  );
  return { minLng, maxLng, minLat, maxLat };
}
function projectionForBbox(bbox: ReturnType<typeof bboxOf>, w: number, h: number, pad = 0.82) {
  const { minLng, maxLng, minLat, maxLat } = bbox;
  const dLon = maxLng - minLng || 0.1, dLat = maxLat - minLat || 0.1;
  return {
    center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2] as [number, number],
    scale: Math.min((w * pad) / (dLon * Math.PI / 180), (h * pad) / (dLat * Math.PI / 180)),
  };
}

// ── name matching ─────────────────────────────────────────────────────────────

// Manual aliases for CSV Stadt values that don't match GeoJSON NAME_3 structurally.
const CSV_ALIASES: Record<string, string> = {
  "Neckar-Odenw.Kreis":         "Neckar-Odenwald-Kreis",
  "Kreis Neuss":                "Rhein-Kreis Neuss",
  "Alb-Donau-Kreis in Ehingen": "Alb-Donau-Kreis",
};

// GeoJSON NAME_3 values that use English names — map to their German equivalents
// so normName can match them against German CSV entries.
const GEO_ALIASES: Record<string, string> = {
  "Cleves":                  "Kleve",
  "Hanover":                 "Hannover",
  "Cologne Städte":          "Köln Städte",
  "Munich Städte":           "München Städte",
  "Nuremberg Städte":        "Nürnberg Städte",
  "Heilbronn city Städte":   "Heilbronn Städte",
};

function normName(s: string): string {
  return s
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/\s*\(.*$/, "")           // strip parenthetical: "(Standort …)"
    .replace(/\s+in\s+\S.*$/i, "")     // strip "in Ulm" / "in Ehingen" suffix
    .replace(/\s+städte$/i, "")         // strip GeoJSON kreisfreie-Stadt suffix
    .replace(/\bmittlerer\s+/gi, "")    // strip "Mittlerer " prefix
    .replace(/-kreis\b/gi, "")          // strip "-Kreis" wherever it appears
    .replace(/\bkreis\b/gi, "")         // strip standalone "Kreis" word
    .replace(/kreis$/gi, "")            // strip compound suffix e.g. "bodenseekreis"
    .replace(/[-.\s]+/g, " ")           // normalise all separators to a space
    .trim();
}

function buildLookup(rows: CsvRow[]): Map<string, CsvRow[]> {
  const map = new Map<string, CsvRow[]>();
  rows.forEach(row => {
    const resolved = CSV_ALIASES[row.stadt] ?? row.stadt;
    const key = normName(resolved);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  });
  return map;
}

function matchRows(geoName: string, lookup: Map<string, CsvRow[]>): CsvRow[] {
  const resolved = GEO_ALIASES[geoName] ?? geoName;
  return lookup.get(normName(resolved)) ?? [];
}

// ── fill colors ───────────────────────────────────────────────────────────────
// Stadt (kreisfreie Stadt): violet  |  Landkreis: sky blue  |  no data: slate
function fillFor(geoType3: string, matched: CsvRow[], hovered: boolean): string {
  const isStadt = geoType3 === "Kreisfreie Städte";
  if (hovered) return isStadt ? "rgba(139,92,246,0.80)" : "rgba(14,165,233,0.80)";
  if (matched.length === 0) return "rgba(148,163,184,0.18)";
  const contacted = matched.some(r => kontaktiertSet.has(r.kontakt.trim().toUpperCase()));
  if (isStadt) return contacted ? "rgba(139,92,246,0.70)" : "rgba(139,92,246,0.26)";
  return contacted ? "rgba(14,165,233,0.70)" : "rgba(14,165,233,0.26)";
}

export default function Statistics() {
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [blStats, setBlStats] = useState<Record<string, BundeslandStats>>({});
  const [sizeStats, setSizeStats] = useState<Record<SizeCategory, SizeStats>>({} as Record<SizeCategory, SizeStats>);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [selectedLand, setSelectedLand] = useState<string | null>(null);
  const [landkreiseGeo, setLandkreiseGeo] = useState<GeoCollection | null>(null);
  const [loadingLk, setLoadingLk] = useState(false);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState({ width: 400, height: 460 });

  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setMapSize({ width: el.clientWidth, height: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    Papa.parse<string[]>("/data/abs_bundesland.csv", {
      download: true, skipEmptyLines: true, encoding: "ISO-8859-1",
      complete: ({ data }) => {
        const headers = data[0];
        const stadtIdx = headers.findIndex(h => h.trim() === "Stadt");
        const typeIdx  = headers.findIndex(h => h.trim() === "Type");
        const landIdx  = headers.findIndex(h => h.trim() === "Land");
        const kontIdx  = headers.findIndex(h => h.trim() === "Kontakt");
        const ewnIdx   = headers.findIndex(h => h.trim() === "Einwohner");
        const rows: CsvRow[] = [];
        const acc: Record<string, BundeslandStats> = {};
        const szAcc = {} as Record<SizeCategory, SizeStats>;
        data.slice(1).forEach(row => {
          const land = row[landIdx]?.trim();
          if (!land) return;
          const kontakt = row[kontIdx]?.trim() ?? "";
          const size    = getCitySize(row[ewnIdx] ?? "");
          const r: CsvRow = {
            stadt: row[stadtIdx]?.trim() ?? "",
            type:  row[typeIdx]?.trim()  ?? "",
            land, kontakt, size,
          };
          rows.push(r);
          if (!acc[land]) acc[land] = { total: 0, contacted: 0 };
          acc[land].total++;
          if (!szAcc[size]) szAcc[size] = { total: 0, contacted: 0 };
          szAcc[size].total++;
          if (kontaktiertSet.has(kontakt.toUpperCase())) {
            acc[land].contacted++;
            szAcc[size].contacted++;
          }
        });
        setCsvRows(rows);
        setBlStats(acc);
        setSizeStats(szAcc);
        setLoading(false);
      },
    });
  }, []);

  async function handleLandClick(name: string) {
    setSelectedLand(name);
    setHoveredFeature(null);
    if (!landkreiseGeo) {
      setLoadingLk(true);
      const data: GeoCollection = await fetch(LK_GEO_URL).then(r => r.json());
      setLandkreiseGeo(data);
      setLoadingLk(false);
    }
  }

  const lookup = buildLookup(csvRows);

  // Bundesland choropleth fill
  const maxTotal = Math.max(...Object.values(blStats).map(s => s.total), 1);
  function blFill(name: string, hovered: boolean) {
    if (hovered) return "rgba(14,165,233,0.85)";
    const s = blStats[name];
    if (!s) return "var(--surface-muted)";
    return `rgba(14,165,233,${(0.15 + (s.total / maxTotal) * 0.65).toFixed(2)})`;
  }

  const lkFeatures = selectedLand && landkreiseGeo
    ? landkreiseGeo.features.filter(f => f.properties.NAME_1 === selectedLand)
    : [];
  const zoomedProj = lkFeatures.length > 0
    ? projectionForBbox(bboxOf(lkFeatures), mapSize.width, mapSize.height)
    : null;

  // Tooltip info for hovered Landkreis
  const hoveredRows = hoveredFeature ? matchRows(hoveredFeature, lookup) : [];
  const hoveredType3 = hoveredFeature
    ? lkFeatures.find(f => f.properties.NAME_3 === hoveredFeature)?.properties.TYPE_3 ?? ""
    : "";

  const totalContacts  = Object.values(blStats).reduce((a, s) => a + s.total, 0);
  const totalContacted = Object.values(blStats).reduce((a, s) => a + s.contacted, 0);
  const sortedStates   = Object.entries(blStats).sort((a, b) => b[1].total - a[1].total);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Statistik</h1>
          <p className="text-sm text-[color:var(--muted)]">Auswertungen und Übersichten der Kontaktdaten.</p>
        </header>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Gesamt Kontakte" value={loading ? "—" : totalContacts.toString()} />
          <StatCard label="Kontaktiert" value={loading ? "—" : `${totalContacted} (${totalContacts ? Math.round((totalContacted / totalContacts) * 100) : 0}%)`} />
          <StatCard label="Bundesländer" value={loading ? "—" : Object.keys(blStats).length.toString()} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* ── Map panel ── */}
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm flex flex-col gap-3">
            {/* Header row */}
            <div className="flex items-center justify-between gap-3 min-h-[28px]">
              <div className="flex items-center gap-2">
                {selectedLand && (
                  <button
                    onClick={() => { setSelectedLand(null); setHoveredFeature(null); }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-2.5 py-1 text-xs font-medium text-[color:var(--foreground)] hover:bg-[color:var(--surface-hover)] transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Deutschland
                  </button>
                )}
                <p className="text-sm font-semibold text-[color:var(--muted-strong)]">
                  {selectedLand ?? "Verteilung nach Bundesland"}
                </p>
              </div>

              {/* Hover tooltip */}
              {hoveredFeature && (
                <div className="text-right text-xs text-[color:var(--muted)] leading-snug">
                  {selectedLand ? (
                    <>
                      <span className="font-medium text-[color:var(--foreground)]">{hoveredFeature.replace(/ Städte$/, "")}</span>
                      {" · "}
                      <span style={{ color: hoveredType3 === "Kreisfreie Städte" ? "rgb(139,92,246)" : "rgb(14,165,233)" }}>
                        {hoveredType3 === "Kreisfreie Städte" ? "Kreisfreie Stadt" : "Landkreis"}
                      </span>
                      {hoveredRows.length > 0 && (
                        <> · {hoveredRows.some(r => kontaktiertSet.has(r.kontakt.toUpperCase()))
                          ? <span className="text-green-600 dark:text-green-400">Kontaktiert</span>
                          : <span>Nicht kontaktiert</span>}
                        </>
                      )}
                      {hoveredRows.length === 0 && <> · <span className="opacity-60">Keine Daten</span></>}
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-[color:var(--foreground)]">{hoveredFeature}</span>
                      {blStats[hoveredFeature] && <> · {blStats[hoveredFeature].total} Einträge</>}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Map canvas */}
            <div ref={mapRef} className="relative flex-1" style={{ minHeight: 340 }}>
              {loadingLk && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-[color:var(--surface)] opacity-80">
                  <span className="text-sm text-[color:var(--muted)]">Lade Karte…</span>
                </div>
              )}

              {/* Bundesland overview */}
              {!selectedLand && (
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{ center: [10.4, 51.2], scale: 2400 }}
                  width={mapSize.width} height={mapSize.height}
                  style={{ width: "100%", height: "100%" }}
                >
                  <Geographies geography={BL_GEO_URL}>
                    {({ geographies }) => geographies.map(geo => {
                      const name = geo.properties.name as string;
                      return (
                        <Geography
                          key={geo.rsmKey} geography={geo}
                          fill={blFill(name, hoveredFeature === name)}
                          stroke="var(--border)" strokeWidth={0.5}
                          onClick={() => handleLandClick(name)}
                          onMouseEnter={() => setHoveredFeature(name)}
                          onMouseLeave={() => setHoveredFeature(null)}
                          style={{
                            default: { outline: "none", cursor: "pointer", transition: "fill 0.15s" },
                            hover: { outline: "none", cursor: "pointer" },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })}
                  </Geographies>
                </ComposableMap>
              )}

              {/* Landkreis drill-down */}
              {selectedLand && landkreiseGeo && zoomedProj && (
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{ center: zoomedProj.center, scale: zoomedProj.scale }}
                  width={mapSize.width} height={mapSize.height}
                  style={{ width: "100%", height: "100%" }}
                >
                  <Geographies geography={landkreiseGeo}>
                    {({ geographies }) => geographies
                      .filter(geo => geo.properties.NAME_1 === selectedLand)
                      .map(geo => {
                        const name3  = geo.properties.NAME_3 as string;
                        const type3  = geo.properties.TYPE_3 as string;
                        const matched = matchRows(name3, lookup);
                        const hovered = hoveredFeature === name3;
                        return (
                          <Geography
                            key={geo.rsmKey} geography={geo}
                            fill={fillFor(type3, matched, hovered)}
                            stroke="var(--border)" strokeWidth={0.8}
                            onMouseEnter={() => setHoveredFeature(name3)}
                            onMouseLeave={() => setHoveredFeature(null)}
                            style={{
                              default: { outline: "none", cursor: "default", transition: "fill 0.12s" },
                              hover:   { outline: "none" },
                              pressed: { outline: "none" },
                            }}
                          />
                        );
                      })
                    }
                  </Geographies>
                </ComposableMap>
              )}
            </div>

            {/* Legend */}
            {!selectedLand && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[color:var(--muted)]">Wenig</span>
                  <div className="h-2 flex-1 rounded-full" style={{ background: "linear-gradient(to right,rgba(14,165,233,0.15),rgba(14,165,233,0.80))" }} />
                  <span className="text-xs text-[color:var(--muted)]">Viel</span>
                </div>
                <p className="text-center text-xs text-[color:var(--muted)]">Klicken zum Vergrößern</p>
              </>
            )}
            {selectedLand && (
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                <LegendDot color="rgba(14,165,233,0.70)"  label="Landkreis – kontaktiert" />
                <LegendDot color="rgba(14,165,233,0.26)"  label="Landkreis – offen" />
                <LegendDot color="rgba(139,92,246,0.70)"  label="Kreisfreie Stadt – kontaktiert" />
                <LegendDot color="rgba(139,92,246,0.26)"  label="Kreisfreie Stadt – offen" />
                <LegendDot color="rgba(148,163,184,0.35)" label="Keine Daten" />
              </div>
            )}
          </div>

          {/* Stats table */}
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[color:var(--border)]">
              <p className="text-sm font-semibold text-[color:var(--muted-strong)]">Nach Bundesland</p>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-[color:var(--surface-muted)] text-xs uppercase tracking-wide text-[color:var(--muted)]">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold border-b border-[color:var(--border)]">Bundesland</th>
                    <th className="px-4 py-2 text-right font-semibold border-b border-[color:var(--border)]">Gesamt</th>
                    <th className="px-4 py-2 text-right font-semibold border-b border-[color:var(--border)]">Kontaktiert</th>
                    <th className="px-4 py-2 text-right font-semibold border-b border-[color:var(--border)]">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? <tr><td colSpan={4} className="px-4 py-8 text-center text-[color:var(--muted)] text-sm">Lade Daten…</td></tr>
                    : sortedStates.map(([name, s]) => (
                      <tr
                        key={name}
                        className="border-b border-[color:var(--border)] transition-colors hover:bg-[color:var(--surface-hover)]"
                        style={!selectedLand && hoveredFeature === name ? { backgroundColor: "var(--surface-hover)" } : undefined}
                        onMouseEnter={() => !selectedLand && setHoveredFeature(name)}
                        onMouseLeave={() => setHoveredFeature(null)}
                      >
                        <td className="px-4 py-2 font-medium">{name}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{s.total}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{s.contacted}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-[color:var(--muted)]">
                          {s.total ? Math.round((s.contacted / s.total) * 100) : 0}%
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* City-size breakdown */}
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-[color:var(--muted-strong)]">Stadtgrößen</p>
          {loading ? (
            <p className="text-sm text-[color:var(--muted)]">Lade Daten…</p>
          ) : (
            <div className="flex flex-col gap-3">
              {SIZE_ORDER.map(cat => {
                const s = sizeStats[cat];
                const total = s?.total ?? 0;
                const contacted = s?.contacted ?? 0;
                const grandTotal = Object.values(sizeStats).reduce((a, x) => a + x.total, 0) || 1;
                const pctOfAll = total / grandTotal;
                const pctContacted = total > 0 ? contacted / total : 0;
                const meta = SIZE_META[cat];
                return (
                  <div key={cat} className="grid grid-cols-[140px_1fr_56px] items-center gap-3 sm:grid-cols-[180px_1fr_72px]">
                    {/* Label */}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[color:var(--foreground)]">{meta.label}</span>
                      <span className="text-xs text-[color:var(--muted)]">{meta.sub}</span>
                    </div>

                    {/* Stacked bar: contacted (solid) + not contacted (faded) + empty */}
                    <div className="relative h-6 w-full overflow-hidden rounded-md bg-[color:var(--surface-muted)]">
                      {/* total slice */}
                      <div
                        className="absolute inset-y-0 left-0 rounded-md"
                        style={{ width: `${pctOfAll * 100}%`, backgroundColor: meta.color, opacity: 0.22 }}
                      />
                      {/* contacted slice */}
                      <div
                        className="absolute inset-y-0 left-0 rounded-md"
                        style={{ width: `${pctOfAll * pctContacted * 100}%`, backgroundColor: meta.color, opacity: 0.85 }}
                      />
                      {/* count labels */}
                      <div className="absolute inset-0 flex items-center px-2 gap-1.5">
                        <span className="text-xs font-semibold" style={{ color: meta.color }}>
                          {total}
                        </span>
                        {contacted > 0 && (
                          <span className="text-xs text-[color:var(--muted)]">
                            · {contacted} kontaktiert
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Percentage of total */}
                    <span className="text-right text-sm tabular-nums text-[color:var(--muted)]">
                      {Math.round(pctOfAll * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] shadow-sm transition-colors hover:bg-[color:var(--surface-hover)]"
        >
          ← Zurück zur Übersicht
        </Link>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block h-3 w-3 flex-shrink-0 rounded-full border border-[color:var(--border)]" style={{ background: color }} />
      <span className="text-xs text-[color:var(--muted)]">{label}</span>
    </div>
  );
}
