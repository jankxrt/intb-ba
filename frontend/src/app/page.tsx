"use client";
import { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

function ConfirmModal({ count, onConfirm, onCancel }: { count: number; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="animate-scale-in relative w-full max-w-sm rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="shrink-0 text-amber-500">
            <path d="M9 7h2v5H9V7Zm0 6h2v2H9v-2Z" fill="currentColor"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M10 1a9 9 0 1 0 0 18A9 9 0 0 0 10 1ZM3 10a7 7 0 1 1 14 0A7 7 0 0 1 3 10Z" fill="currentColor"/>
          </svg>
          <h2 className="text-base font-semibold text-[color:var(--foreground)]">Alle Einträge anzeigen?</h2>
        </div>
        <p className="mb-5 text-sm text-[color:var(--muted)]">
          Es werden alle <span className="font-medium text-[color:var(--foreground)]">{count}</span> Einträge auf einmal geladen. Bei großen Datensätzen kann dies zu Verzögerungen führen.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="h-9 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="h-9 rounded-md bg-amber-500 px-4 text-sm font-medium text-white transition-colors hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Trotzdem anzeigen
          </button>
        </div>
      </div>
    </div>
  );
}
import Link from "next/link";
import Papa from 'papaparse';

const getCitySizeCategory = (populationString: string): string => {
  if (!populationString || populationString.trim() === '' || populationString === '0') return 'N.N.';
  const population = parseInt(populationString.replace(/\D/g, ''), 10);
  if (isNaN(population)) return 'N.N.';
  if (population >= 1000000) return 'Millionenstadt';
  if (population >= 100000) return 'Groß';
  if (population >= 20000) return 'Mittel';
  return 'Klein';
};

const categoryClassMap: Record<string, string> = {
  'Klein': 'sm-sc',
  'Mittel': 'md-sc',
  'Groß': 'bg-sc',
  'Millionenstadt': 'mil-sc',
  'N.N.': 'nn-sc'
};

const partyClassMap: Record<string, string> = {
  'CDU/CSU': 'cdu-sc',
  'Freie Wähler': 'fw-sc',
  'FW': 'fww-sc',
  'Grüne': 'gruene-sc',
  'Parteilos': 'parteilos-sc',
  'FDP': 'fdp-sc',
  '#N/A': 'na-sc',
  'Freisinger Mitte': 'fsm-sc',
  'BBV': 'bbv-sc',
  'UBV': 'ubv-sc',
  'WGK': 'wgk-sc',
  'Die Linke': 'linke-sc',
  'FWG': 'fwg-sc',
  'SPD': 'spd-sc'
};

const kontaktiertSet = new Set(['Y', 'J', 'YES', 'JA']);

type SortDir = 'asc' | 'desc';

function SortIcon({ col, sortCol, sortDir }: { col: number; sortCol: number | null; sortDir: SortDir }) {
  const active = sortCol === col;
  return (
    <span className="ml-1.5 inline-flex flex-col leading-none" aria-hidden="true">
      <svg
        width="8" height="5" viewBox="0 0 8 5" fill="none"
        className={active && sortDir === 'asc' ? 'text-[color:var(--foreground)]' : 'text-[color:var(--muted)] opacity-40'}
      >
        <path d="M4 0L7.46 4.5H0.54L4 0Z" fill="currentColor" />
      </svg>
      <svg
        width="8" height="5" viewBox="0 0 8 5" fill="none"
        className={active && sortDir === 'desc' ? 'text-[color:var(--foreground)]' : 'text-[color:var(--muted)] opacity-40'}
      >
        <path d="M4 5L0.54 0.5H7.46L4 5Z" fill="currentColor" />
      </svg>
    </span>
  );
}

export default function App() {
  const [data, setData] = useState<string[][]>([]);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [bundeslandFilter, setBundeslandFilter] = useState<string>('');
  const [parteiFilter, setParteiFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showAllModal, setShowAllModal] = useState(false);
  const [leadNames, setLeadNames] = useState<Set<string>>(new Set());
  const [addingLead, setAddingLead] = useState<string | null>(null);

  useEffect(() => {
    Papa.parse<string[]>('/data/abs_bundesland.csv', {
      download: true,
      skipEmptyLines: true,
      encoding: 'ISO-8859-1',
      complete: (result) => setData(result.data),
      error: () => setError('Fehler: CSV Datei konnte nicht geladen werden.')
    });
  }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, bundeslandFilter, parteiFilter]);
  useEffect(() => { setCurrentPage(1); }, [rowsPerPage]);
  useEffect(() => { setCurrentPage(1); }, [sortCol, sortDir]);

  useEffect(() => {
    supabase.from('leads').select('name').then(({ data }) => {
      if (data) setLeadNames(new Set(data.map((r: { name: string }) => r.name)));
    });
  }, []);

  async function addLead(row: string[]) {
    const name = row[nameIndex]?.trim();
    if (!name || leadNames.has(name)) return;
    setAddingLead(name);
    const einwStr = row[einwohnerIndex]?.replace(/\D/g, '');
    await supabase.from('leads').insert({
      name,
      stadt:          row[stadtIndex]?.trim()         || null,
      land:           row[bundeslandIndex]?.trim()     || null,
      buergermeister: row[headers.findIndex(h => h.trim() === 'Bürgermeister')]?.trim() || null,
      partei:         row[parteiIndex]?.trim()         || null,
      kontaktdaten:   row[kontaktdatenIndex]?.trim()   || null,
      einwohner:      einwStr ? parseInt(einwStr, 10)  : null,
    });
    setLeadNames(prev => new Set([...prev, name]));
    setAddingLead(null);
  }

  const headers = data.length > 0 ? data[0] : [];
  const rows = data.length > 0 ? data.slice(1) : [];

  const nameIndex = headers.findIndex(h => h.trim() === 'Name');
  const stadtIndex = headers.findIndex(h => h.trim() === 'Stadt');
  const bundeslandIndex = headers.findIndex(h => h.trim() === 'Land');
  const kontaktiertIndex = headers.findIndex(h => h.trim() === 'Kontakt');
  const einwohnerIndex = headers.findIndex(h => h.trim() === 'Einwohner');
  const parteiIndex       = headers.findIndex(h => h.trim() === 'Partei');
  const kontaktdatenIndex = headers.findIndex(h => h.trim() === 'Kontaktdaten');

  const uniqueBundeslander = Array.from(
    new Set(rows.map(row => row[bundeslandIndex]))
  ).filter(Boolean).sort();

  const uniqueParteien = Array.from(
    new Set(rows.map(row => row[parteiIndex]?.trim()).filter(p => p && p !== '#N/A'))
  ).sort((a, b) => a.localeCompare(b, 'de'));

  const filteredRows = rows.filter((row) => {
    const matchesSearch = row.some(cell =>
      cell && cell.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesBundesland =
      bundeslandFilter === '' || row[bundeslandIndex] === bundeslandFilter;
    const matchesPartei =
      parteiFilter === '' || row[parteiIndex]?.trim() === parteiFilter;
    return matchesSearch && matchesBundesland && matchesPartei;
  });

  const mergedRowsMap = new Map<string, string[]>();
  filteredRows.forEach(row => {
    const stadt = row[stadtIndex];
    if (mergedRowsMap.has(stadt)) {
      const existingRow = mergedRowsMap.get(stadt)!;
      if (nameIndex !== -1 && !existingRow[nameIndex].includes(row[nameIndex])) {
        existingRow[nameIndex] = `${existingRow[nameIndex]} & ${row[nameIndex]}`;
      }
      if (kontaktiertIndex !== -1) {
        const isContacted = row[kontaktiertIndex]?.toUpperCase() === 'Y' || row[kontaktiertIndex]?.toUpperCase() === 'J';
        if (isContacted) existingRow[kontaktiertIndex] = 'Y';
      }
    } else {
      mergedRowsMap.set(stadt, [...row]);
    }
  });

  const mergedRows = Array.from(mergedRowsMap.values());

  const finalDisplayRows = sortCol === null ? mergedRows : [...mergedRows].sort((a, b) => {
    const aVal = a[sortCol] ?? '';
    const bVal = b[sortCol] ?? '';
    let cmp = 0;

    if (sortCol === einwohnerIndex) {
      const aNum = parseInt(aVal.replace(/\D/g, ''), 10) || 0;
      const bNum = parseInt(bVal.replace(/\D/g, ''), 10) || 0;
      if (aNum === 0 && bNum === 0) return 0;
      if (aNum === 0) return 1;
      if (bNum === 0) return -1;
      cmp = aNum - bNum;
    } else if (sortCol === kontaktiertIndex) {
      const aYes = kontaktiertSet.has(aVal.trim().toUpperCase()) ? 1 : 0;
      const bYes = kontaktiertSet.has(bVal.trim().toUpperCase()) ? 1 : 0;
      cmp = aYes - bYes;
    } else {
      const emptyValues = new Set(['', '#n/a', 'n/a', 'n.n.', '-']);
      const aEmpty = emptyValues.has(aVal.trim().toLowerCase());
      const bEmpty = emptyValues.has(bVal.trim().toLowerCase());
      if (aEmpty && bEmpty) return 0;
      if (aEmpty) return 1;
      if (bEmpty) return -1;
      cmp = aVal.localeCompare(bVal, 'de', { sensitivity: 'base' });
    }

    return sortDir === 'asc' ? cmp : -cmp;
  });

  const validHeaderCount = headers.filter(h => h.trim() !== '').length;
  const showAll = rowsPerPage === 0;
  const effectiveRows = showAll ? finalDisplayRows.length : rowsPerPage;
  const indexOfLastRow = currentPage * effectiveRows;
  const indexOfFirstRow = indexOfLastRow - effectiveRows;
  const currentPaginationRows = showAll ? finalDisplayRows : finalDisplayRows.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = showAll ? 1 : Math.ceil(finalDisplayRows.length / effectiveRows);

  function colWidth(index: number): string {
    if (index === nameIndex)         return '200px';
    if (index === stadtIndex)        return '110px';
    if (index === bundeslandIndex)   return '110px';
    if (index === einwohnerIndex)    return '80px';
    if (index === kontaktiertIndex)  return '80px';
    if (index === parteiIndex)       return '110px';
    if (index === kontaktdatenIndex) return '220px';
    return '90px';
  }

  function handleSort(colIndex: number) {
    if (sortCol === colIndex) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colIndex);
      setSortDir('asc');
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">ABH Datenbank</h1>
            <p className="text-sm text-[color:var(--muted)]">
              Suche, filtere und blättere durch die Ausländerbehörden.
            </p>
          </div>
          {data.length > 0 && (
            <div className="text-sm text-[color:var(--muted)]">
              {finalDisplayRows.length} Einträge
            </div>
          )}
        </header>

        {error && (
          <div className="rounded-lg border border-[color:var(--danger-border)] bg-[color:var(--danger-bg)] px-4 py-3 text-sm text-[color:var(--danger-fg)]">
            {error}
          </div>
        )}

        {!error && data.length === 0 && (
          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-6 text-sm text-[color:var(--muted-strong)] shadow-sm">
            Lade Daten...
          </div>
        )}

        {data.length > 0 && (
          <>
            <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
                <div className="md:col-span-5">
                  <label htmlFor="search" className="mb-1 block text-sm font-medium text-[color:var(--muted-strong)]">
                    Suche
                  </label>
                  <input
                    id="search"
                    type="text"
                    placeholder="Name, Stadt..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 w-full rounded-md border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-3 text-sm text-[color:var(--foreground)] shadow-sm outline-none placeholder:text-[color:var(--muted)] focus-visible:border-[color:var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                  />
                </div>

                <div className="md:col-span-3">
                  <label htmlFor="bundesland" className="mb-1 block text-sm font-medium text-[color:var(--muted-strong)]">
                    Bundesland
                  </label>
                  <div className="relative">
                    <select
                      id="bundesland"
                      value={bundeslandFilter}
                      onChange={(e) => setBundeslandFilter(e.target.value)}
                      className="h-10 w-full appearance-none rounded-md border border-[color:var(--border-strong)] bg-[color:var(--surface)] pl-3 pr-9 text-sm text-[color:var(--foreground)] shadow-sm outline-none focus-visible:border-[color:var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                    >
                      <option value="">Alle</option>
                      {uniqueBundeslander.map((bl) => (
                        <option key={bl} value={bl}>{bl}</option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label htmlFor="partei" className="mb-1 block text-sm font-medium text-[color:var(--muted-strong)]">
                    Partei
                  </label>
                  <div className="relative">
                    <select
                      id="partei"
                      value={parteiFilter}
                      onChange={(e) => setParteiFilter(e.target.value)}
                      className="h-10 w-full appearance-none rounded-md border border-[color:var(--border-strong)] bg-[color:var(--surface)] pl-3 pr-9 text-sm text-[color:var(--foreground)] shadow-sm outline-none focus-visible:border-[color:var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                    >
                      <option value="">Alle</option>
                      {uniqueParteien.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                <div className="md:col-span-1 flex items-end">
                  <button
                    type="button"
                    disabled={searchTerm === '' && bundeslandFilter === '' && parteiFilter === '' && sortCol === null}
                    onClick={() => {
                      setSearchTerm('');
                      setBundeslandFilter('');
                      setParteiFilter('');
                      setSortCol(null);
                      setSortDir('asc');
                    }}
                    className="h-10 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-sm font-medium text-[color:var(--foreground)] shadow-sm transition-colors hover:bg-[color:var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm text-[color:var(--muted-strong)]">
                  <thead className="text-left text-xs uppercase tracking-wide text-[color:var(--muted)]">
                    <tr className="bg-[color:var(--surface-muted)]">
                      {headers.slice(0, validHeaderCount).map((header, index) => (
                        <th
                          key={index}
                          scope="col"
                          onClick={() => handleSort(index)}
                          style={{ minWidth: colWidth(index) }}
                          className="sticky top-0 border-b border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-3 font-semibold cursor-pointer select-none hover:bg-[color:var(--surface-hover)] transition-colors"
                          aria-sort={sortCol === index ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          <span className="inline-flex items-center">
                            {header}
                            <SortIcon col={index} sortCol={sortCol} sortDir={sortDir} />
                          </span>
                        </th>
                      ))}
                      <th scope="col" style={{ minWidth: '44px' }} className="sticky top-0 border-b border-[color:var(--border)] bg-[color:var(--surface-muted)] px-2 py-3" />
                    </tr>
                  </thead>

                  <tbody key={`${currentPage}-${sortCol}-${sortDir}`}>
                    {currentPaginationRows.length > 0 ? (
                      currentPaginationRows.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className="animate-row-in hover:bg-[color:var(--surface-hover)]"
                          style={{ animationDelay: `${rowIndex * 25}ms` }}
                        >
                          {row.slice(0, validHeaderCount).map((cell, cellIndex) => {
                            let displayContent: ReactNode = cell;
                            let cellClassName = '';

                            if (cellIndex === einwohnerIndex) {
                              const category = getCitySizeCategory(cell);
                              displayContent = category;
                              cellClassName = categoryClassMap[category] || '';
                            } else if (cellIndex === kontaktiertIndex) {
                              const isYes = kontaktiertSet.has(cell.trim().toUpperCase());
                              displayContent = isYes ? 'Ja' : 'Nein';
                              cellClassName = isYes ? 'yes-sc' : 'no-sc';
                            } else if (cellIndex === parteiIndex) {
                              const party = cell.trim();
                              cellClassName = partyClassMap[party] || 'default-sc';
                            } else if (cellIndex === nameIndex && cell.trim() !== '') {
                              const query = encodeURIComponent(cell);
                              displayContent = (
                                <a
                                  href={`https://www.google.com/search?q=${query}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-medium underline-offset-4 hover:underline focus-visible:underline"
                                >
                                  {cell}
                                </a>
                              );
                            }

                            return (
                              <td key={cellIndex} title={typeof cell === 'string' ? cell : undefined} className="px-3 py-2.5 align-middle">
                                {cellClassName ? (
                                  <div className="flex w-full justify-center">
                                    <div className={`table-button ${cellClassName}`.trim()}>
                                      {displayContent}
                                    </div>
                                  </div>
                                ) : cellIndex === kontaktdatenIndex ? (
                                  <div className="whitespace-nowrap font-mono text-xs">
                                    {displayContent}
                                  </div>
                                ) : (
                                  <div className="line-clamp-2 break-words leading-snug">
                                    {displayContent}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                          {/* Lead button */}
                          {(() => {
                            const rowName = row[nameIndex]?.trim();
                            const isLead = leadNames.has(rowName);
                            const isAdding = addingLead === rowName;
                            return (
                              <td className="px-2 py-2.5 align-middle">
                                <button
                                  onClick={() => addLead(row)}
                                  disabled={isLead || isAdding}
                                  title={isLead ? 'Bereits als Lead gespeichert' : 'Als Lead hinzufügen'}
                                  className={`inline-flex h-7 items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] ${
                                    isLead
                                      ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300 cursor-default'
                                      : 'border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--foreground)] hover:bg-[color:var(--surface-hover)] disabled:opacity-50'
                                  }`}
                                >
                                  {isAdding ? '…' : isLead ? '✓' : '+'}
                                </button>
                              </td>
                            );
                          })()}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={validHeaderCount + 1} className="px-3 py-12 text-center text-sm text-[color:var(--muted-strong)]">
                          Keine Einträge gefunden.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-[color:var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[color:var(--muted)]">
                  {finalDisplayRows.length} Treffer
                  {filteredRows.length !== finalDisplayRows.length
                    ? ` (${filteredRows.length} Zeilen vor Zusammenführung)`
                    : ''}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label htmlFor="rowsPerPage" className="text-sm font-medium text-[color:var(--muted-strong)]">
                      Zeilen
                    </label>
                    <div className="relative">
                      <select
                        id="rowsPerPage"
                        value={rowsPerPage}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val === 0) { setShowAllModal(true); return; }
                          setRowsPerPage(val);
                        }}
                        className="h-9 appearance-none rounded-md border border-[color:var(--border-strong)] bg-[color:var(--surface)] pl-3 pr-8 text-sm text-[color:var(--foreground)] shadow-sm outline-none focus-visible:border-[color:var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={0}>Alle</option>
                      </select>
                      <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-[color:var(--muted-strong)]" aria-label="Seitennavigation">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                      className="inline-flex h-9 flex-shrink-0 items-center justify-center rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-4 font-semibold text-[color:var(--foreground)] shadow-sm transition-colors hover:bg-[color:var(--surface-hover)] active:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface)]"
                      aria-label="Vorherige Seite"
                    >
                      Zurück
                    </button>

                    <span className="inline-flex h-9 items-center whitespace-nowrap rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 font-medium text-[color:var(--muted-strong)]">
                      Seite {currentPage} von {totalPages || 1}
                    </span>

                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      className="inline-flex h-9 flex-shrink-0 items-center justify-center rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-4 font-semibold text-[color:var(--foreground)] shadow-sm transition-colors hover:bg-[color:var(--surface-hover)] active:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface)]"
                      aria-label="Nächste Seite"
                    >
                      Weiter
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
      {showAllModal && (
        <ConfirmModal
          count={finalDisplayRows.length}
          onConfirm={() => { setRowsPerPage(0); setShowAllModal(false); }}
          onCancel={() => setShowAllModal(false)}
        />
      )}
    </main>
  );
}
