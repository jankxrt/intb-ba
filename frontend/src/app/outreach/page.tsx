"use client";
import { useState, useEffect, useMemo } from 'react';
import { supabase, type Lead } from '@/lib/supabase';
import { useDragScroll } from '@/lib/useDragScroll';

const STATUS_OPTIONS = ['neu', 'kontaktiert', 'antwort', 'abgeschlossen', 'abgelehnt'];
const VON_OPTIONS = ['Ramin Goo', 'Jan Kortmann', 'Isabel Magallanes', 'Barbara Stasiak'];

const statusClass: Record<string, string> = {
  neu:           'bg-blue-50   text-blue-700   border-blue-200   dark:bg-blue-950/40  dark:text-blue-300  dark:border-blue-800',
  kontaktiert:   'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
  antwort:       'bg-sky-50    text-sky-700    border-sky-200    dark:bg-sky-950/40   dark:text-sky-300   dark:border-sky-800',
  abgeschlossen: 'bg-green-50  text-green-700  border-green-200  dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
  abgelehnt:     'bg-red-50    text-red-700    border-red-200    dark:bg-red-950/40   dark:text-red-300   dark:border-red-800',
};

function rowStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'kontaktiert':   return { borderLeft: '3px solid #7c3aed' };
    case 'antwort':       return { borderLeft: '3px solid #0284c7' };
    case 'abgeschlossen': return { borderLeft: '3px solid #16a34a' };
    case 'abgelehnt':     return { borderLeft: '3px solid #dc2626' };
    default:              return {};
  }
}

const chevronBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E")`;
const chevronStyle = { backgroundImage: chevronBg, backgroundRepeat: 'no-repeat' as const, backgroundPosition: 'right 6px center' };

function StatusBadge({ status, id, onChange }: { status: string; id: number; onChange: (id: number, val: string) => void }) {
  const cls = statusClass[status] ?? 'bg-gray-50 text-gray-600 border-gray-200';
  return (
    <select
      value={status}
      onChange={e => onChange(id, e.target.value)}
      className={`table-button border cursor-pointer appearance-none pr-5 ${cls}`}
      style={chevronStyle}
    >
      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

function VonSelect({ von, id, onChange }: { von: string | null; id: number; onChange: (id: number, val: string | null) => void }) {
  const assigned = !!von;
  return (
    <select
      value={von ?? ''}
      onChange={e => onChange(id, e.target.value || null)}
      className={`table-button border cursor-pointer appearance-none pr-5 transition-colors ${
        assigned
          ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
          : 'bg-[color:var(--surface-muted)] text-[color:var(--muted)] border-[color:var(--border)]'
      }`}
      style={chevronStyle}
    >
      <option value="">Nicht zugewiesen</option>
      {VON_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
    </select>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

type SortField = 'name' | 'stadt' | 'land' | 'status' | 'von' | 'created_at';

function EditLeadModal({ lead, onSave, onCancel }: {
  lead: Lead;
  onSave: (updated: Partial<Lead>) => void;
  onCancel: () => void;
}) {
  const [von, setVon] = useState(lead.von ?? '');
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? '');

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="animate-scale-in relative w-full max-w-md rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="mb-0.5 text-base font-semibold text-[color:var(--foreground)]">Lead bearbeiten</h2>
        <p className="mb-5 text-sm text-[color:var(--muted)] line-clamp-1">{lead.name}</p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[color:var(--muted-strong)]">Zuständig</label>
            <div className="relative">
              <select
                value={von}
                onChange={e => setVon(e.target.value)}
                autoFocus
                className="h-10 w-full appearance-none rounded-md border border-[color:var(--border-strong)] bg-[color:var(--surface)] pl-3 pr-9 text-sm text-[color:var(--foreground)] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
              >
                <option value="">Nicht zugewiesen</option>
                {VON_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[color:var(--muted-strong)]">Status</label>
            <div className="relative">
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="h-10 w-full appearance-none rounded-md border border-[color:var(--border-strong)] bg-[color:var(--surface)] pl-3 pr-9 text-sm text-[color:var(--foreground)] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[color:var(--muted-strong)]">Anmerkungen</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optionale Notizen zum Lead…"
              rows={3}
              className="w-full resize-none rounded-md border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-sm outline-none placeholder:text-[color:var(--muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="h-9 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface-hover)]"
          >
            Abbrechen
          </button>
          <button
            onClick={() => onSave({ von: von || null, status, notes: notes || null })}
            className="h-9 rounded-md bg-[color:var(--foreground)] px-4 text-sm font-semibold text-[color:var(--background)] transition-opacity hover:opacity-80"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <span className="ml-1 inline-flex flex-col leading-none" aria-hidden="true">
      <svg width="8" height="5" viewBox="0 0 8 5" fill="none" className={active && dir === 'asc' ? 'text-[color:var(--foreground)]' : 'text-[color:var(--muted)] opacity-40'}>
        <path d="M4 0L7.46 4.5H0.54L4 0Z" fill="currentColor" />
      </svg>
      <svg width="8" height="5" viewBox="0 0 8 5" fill="none" className={active && dir === 'desc' ? 'text-[color:var(--foreground)]' : 'text-[color:var(--muted)] opacity-40'}>
        <path d="M4 5L0.54 0.5H7.46L4 5Z" fill="currentColor" />
      </svg>
    </span>
  );
}

export default function OutreachPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const dragScroll = useDragScroll();
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editLeadId, setEditLeadId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => { fetchLeads(); }, []);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setLeads(data ?? []);
    setLoading(false);
  }

  async function updateStatus(id: number, status: string) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    await supabase.from('leads').update({ status }).eq('id', id);
  }

  async function updateVon(id: number, von: string | null) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, von } : l));
    await supabase.from('leads').update({ von }).eq('id', id);
  }

  async function updateLead(id: number, patch: Partial<Lead>) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
    await supabase.from('leads').update(patch).eq('id', id);
  }

  async function deleteLead(id: number) {
    setDeletingId(id);
    setConfirmDeleteId(null);
    await supabase.from('leads').delete().eq('id', id);
    setLeads(prev => prev.filter(l => l.id !== id));
    setDeletingId(null);
  }

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  const filteredLeads = useMemo(() => {
    let result = leads;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        [l.name, l.stadt, l.land, l.partei, l.kontaktdaten, l.status, l.von]
          .some(v => v && v.toLowerCase().includes(q))
      );
    }
    return [...result].sort((a, b) => {
      const aVal = (a[sortField] ?? '') as string;
      const bVal = (b[sortField] ?? '') as string;
      const cmp = aVal.localeCompare(bVal, 'de', { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [leads, search, sortField, sortDir]);

  const byStatus = STATUS_OPTIONS.reduce<Record<string, number>>((acc, s) => {
    acc[s] = (search ? filteredLeads : leads).filter(l => l.status === s).length;
    return acc;
  }, {});

  const byVon = VON_OPTIONS.reduce<Record<string, number>>((acc, v) => {
    acc[v] = (search ? filteredLeads : leads).filter(l => l.von === v).length;
    return acc;
  }, {});

  const cols: { label: string; field: SortField; width: number }[] = [
    { label: 'Name',       field: 'name',       width: 200 },
    { label: 'Stadt',      field: 'stadt',      width: 110 },
    { label: 'Bundesland', field: 'land',       width: 130 },
    { label: 'E-Mail',     field: 'status',     width: 210 }, // not sortable by email, use status sort sentinel
    { label: 'Von',        field: 'von',        width: 150 },
    { label: 'Status',     field: 'status',     width: 130 },
    { label: 'Hinzugefügt', field: 'created_at', width: 100 },
  ];

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Outreach</h1>
            <p className="text-sm text-[color:var(--muted)]">
              {leads.length} Lead{leads.length !== 1 ? 's' : ''} gespeichert
              {search && filteredLeads.length !== leads.length && (
                <span className="ml-1">· {filteredLeads.length} angezeigt</span>
              )}
            </p>
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-[color:var(--danger-border)] bg-[color:var(--danger-bg)] px-4 py-3 text-sm text-[color:var(--danger-fg)]">
            {error}
          </div>
        )}

        {/* Search bar */}
        {!loading && leads.length > 0 && (
          <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm">
            <div className="relative">
              <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Suche nach Name, Stadt, Partei, Status, Zuständig…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-10 w-full rounded-md border border-[color:var(--border-strong)] bg-[color:var(--surface)] pl-9 pr-9 text-sm text-[color:var(--foreground)] shadow-sm outline-none placeholder:text-[color:var(--muted)] focus-visible:border-[color:var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
                  aria-label="Suche leeren"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              )}
            </div>
          </section>
        )}

        {loading ? (
          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-6 text-sm text-[color:var(--muted-strong)] shadow-sm">
            Lade Leads...
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-6 py-16 text-center shadow-sm">
            <p className="text-sm font-medium text-[color:var(--foreground)]">Noch keine Leads</p>
            <p className="mt-1 text-sm text-[color:var(--muted)]">Füge Leads über die Übersicht hinzu.</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-6 py-16 text-center shadow-sm">
            <p className="text-sm font-medium text-[color:var(--foreground)]">Keine Ergebnisse für „{search}"</p>
            <button
              onClick={() => setSearch('')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1.5 text-xs font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface-hover)]"
            >
              Suche zurücksetzen
            </button>
          </div>
        ) : (
          <section className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
            <div
              ref={dragScroll.ref}
              className="overflow-x-auto cursor-grab"
              onMouseDown={dragScroll.onMouseDown}
              onMouseMove={dragScroll.onMouseMove}
              onMouseUp={dragScroll.onMouseUp}
              onMouseLeave={dragScroll.onMouseLeave}
            >
              <table className="w-full border-collapse text-sm text-[color:var(--muted-strong)]">
                <thead className="text-left text-xs uppercase tracking-wide text-[color:var(--muted)]">
                  <tr className="bg-[color:var(--surface-muted)]">
                    {/* Name */}
                    <th onClick={() => handleSort('name')} className="cursor-pointer select-none border-b border-[color:var(--border)] px-3 py-3 font-semibold hover:bg-[color:var(--surface-hover)] transition-colors" style={{ minWidth: 200 }}>
                      <span className="inline-flex items-center">Name <SortIcon active={sortField === 'name'} dir={sortDir} /></span>
                    </th>
                    {/* Stadt */}
                    <th onClick={() => handleSort('stadt')} className="cursor-pointer select-none border-b border-[color:var(--border)] px-3 py-3 font-semibold hover:bg-[color:var(--surface-hover)] transition-colors" style={{ minWidth: 110 }}>
                      <span className="inline-flex items-center">Stadt <SortIcon active={sortField === 'stadt'} dir={sortDir} /></span>
                    </th>
                    {/* Bundesland */}
                    <th onClick={() => handleSort('land')} className="cursor-pointer select-none border-b border-[color:var(--border)] px-3 py-3 font-semibold hover:bg-[color:var(--surface-hover)] transition-colors" style={{ minWidth: 130 }}>
                      <span className="inline-flex items-center">Bundesland <SortIcon active={sortField === 'land'} dir={sortDir} /></span>
                    </th>
                    {/* E-Mail — not sortable */}
                    <th className="border-b border-[color:var(--border)] px-3 py-3 font-semibold" style={{ minWidth: 210 }}>E-Mail</th>
                    {/* Von */}
                    <th onClick={() => handleSort('von')} className="cursor-pointer select-none border-b border-[color:var(--border)] px-3 py-3 font-semibold hover:bg-[color:var(--surface-hover)] transition-colors" style={{ minWidth: 150 }}>
                      <span className="inline-flex items-center">Von <SortIcon active={sortField === 'von'} dir={sortDir} /></span>
                    </th>
                    {/* Status */}
                    <th onClick={() => handleSort('status')} className="cursor-pointer select-none border-b border-[color:var(--border)] px-3 py-3 font-semibold hover:bg-[color:var(--surface-hover)] transition-colors" style={{ minWidth: 130 }}>
                      <span className="inline-flex items-center">Status <SortIcon active={sortField === 'status'} dir={sortDir} /></span>
                    </th>
                    {/* Date */}
                    <th onClick={() => handleSort('created_at')} className="cursor-pointer select-none border-b border-[color:var(--border)] px-3 py-3 font-semibold hover:bg-[color:var(--surface-hover)] transition-colors" style={{ minWidth: 100 }}>
                      <span className="inline-flex items-center">Hinzugefügt <SortIcon active={sortField === 'created_at'} dir={sortDir} /></span>
                    </th>
                    {/* Anmerkungen */}
                    <th className="border-b border-[color:var(--border)] px-3 py-3 font-semibold" style={{ minWidth: 180 }}>Anmerkungen</th>
                    <th className="border-b border-[color:var(--border)] px-3 py-3" style={{ minWidth: 80 }} />
                  </tr>
                </thead>
                <tbody key={filteredLeads.map(l => l.id).join(',')}>
                  {filteredLeads.map((lead, i) => (
                    <tr
                      key={lead.id}
                      className="animate-row-in hover:bg-[color:var(--surface-hover)] transition-colors"
                      style={{ animationDelay: `${i * 20}ms`, ...rowStyle(lead.status) }}
                    >
                      <td className="px-3 py-2.5 align-middle">
                        <div className="line-clamp-2 font-medium leading-snug">{lead.name}</div>
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        <div className="line-clamp-1 leading-snug">{lead.stadt ?? '—'}</div>
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        <div className="line-clamp-1 leading-snug">{lead.land ?? '—'}</div>
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        {lead.kontaktdaten ? (
                          <a href={`mailto:${lead.kontaktdaten}`} className="whitespace-nowrap font-mono text-xs hover:underline">
                            {lead.kontaktdaten}
                          </a>
                        ) : (
                          <span className="text-[color:var(--muted)]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        <VonSelect von={lead.von} id={lead.id} onChange={updateVon} />
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        <StatusBadge status={lead.status} id={lead.id} onChange={updateStatus} />
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        <span className="text-xs tabular-nums text-[color:var(--muted)]">{formatDate(lead.created_at)}</span>
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        {confirmDeleteId === lead.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => deleteLead(lead.id)}
                              disabled={deletingId === lead.id}
                              className="h-6 rounded-md bg-red-500 px-2 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                            >
                              Löschen
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="h-6 rounded-md border border-[color:var(--border)] px-2 text-xs text-[color:var(--muted)] hover:bg-[color:var(--surface-hover)] transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(lead.id)}
                            aria-label="Lead entfernen"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--muted)] transition-colors hover:bg-[color:var(--danger-bg)] hover:text-[color:var(--danger-fg)]"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary strip */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[color:var(--border)] px-4 py-3">
              {/* Status counts */}
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(s => (
                  <span key={s} className={`table-button border ${statusClass[s]}`}>
                    {s}: {byStatus[s] ?? 0}
                  </span>
                ))}
              </div>
              {/* Separator */}
              <div className="hidden h-4 w-px bg-[color:var(--border)] sm:block" />
              {/* Von counts */}
              <div className="flex flex-wrap gap-2">
                {VON_OPTIONS.map(v => {
                  const count = byVon[v] ?? 0;
                  const initials = v.split(' ').map(w => w[0]).join('');
                  return (
                    <span key={v} title={v} className={`table-button border ${count > 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800' : 'bg-[color:var(--surface-muted)] text-[color:var(--muted)] border-[color:var(--border)]'}`}>
                      {initials}: {count}
                    </span>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
