"use client";
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { ABHEntry } from '@/lib/supabase';

const parteiClass: Record<string, string> = {
  'AfD':   'bg-blue-50   text-blue-700   border-blue-200   dark:bg-blue-950/40  dark:text-blue-300  dark:border-blue-800',
  'CDU':   'bg-gray-100  text-gray-800   border-gray-300   dark:bg-gray-800/60  dark:text-gray-200  dark:border-gray-600',
  'CSU':   'bg-gray-100  text-gray-800   border-gray-300   dark:bg-gray-800/60  dark:text-gray-200  dark:border-gray-600',
  'SPD':   'bg-red-50    text-red-700    border-red-200    dark:bg-red-950/40   dark:text-red-300   dark:border-red-800',
  'FDP':   'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800',
  'Grüne': 'bg-green-50  text-green-700  border-green-200  dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
  'Linke': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-800',
  'BSW':   'bg-rose-50   text-rose-700   border-rose-200   dark:bg-rose-950/40  dark:text-rose-300  dark:border-rose-800',
};

function parteiCls(partei: string | null): string {
  if (!partei) return '';
  const key = Object.keys(parteiClass).find(k => partei.toLowerCase().includes(k.toLowerCase()));
  return key ? parteiClass[key] : 'bg-[color:var(--surface-muted)] text-[color:var(--foreground)] border-[color:var(--border)]';
}

function formatEinwohner(raw: string | null): string {
  if (!raw) return '—';
  const n = parseInt(raw.replace(/\D/g, ''), 10);
  if (isNaN(n)) return raw;
  return n.toLocaleString('de-DE');
}

export default function PlanungPage() {
  const [allABH, setAllABH] = useState<ABHEntry[]>([]);
  const [leadNames, setLeadNames] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(10);
  const [addingIds, setAddingIds] = useState<Set<number>>(new Set());
  const [addingAll, setAddingAll] = useState(false);

  useEffect(() => {
    async function load() {
      const [abhRes, leadsRes] = await Promise.all([
        supabase.from('auslaenderbehoerden').select('*').order('name'),
        supabase.from('leads').select('name'),
      ]);
      if (abhRes.data) setAllABH(abhRes.data);
      if (leadsRes.data) setLeadNames(new Set(leadsRes.data.map((l: { name: string }) => l.name)));
      setLoading(false);
    }
    load();
  }, []);

  const uncontacted = useMemo(
    () => allABH.filter(e => !leadNames.has(e.name)),
    [allABH, leadNames]
  );

  const shown = useMemo(
    () => uncontacted.slice(0, Math.max(1, count)),
    [uncontacted, count]
  );

  const contactedCount = allABH.length - uncontacted.length;
  const progressPct = allABH.length > 0 ? Math.round((contactedCount / allABH.length) * 100) : 0;

  async function addOne(entry: ABHEntry) {
    if (addingIds.has(entry.id) || leadNames.has(entry.name)) return;
    setAddingIds(prev => new Set([...prev, entry.id]));
    const einwStr = entry.einwohner?.replace(/\D/g, '');
    const { error } = await supabase.from('leads').insert({
      name:           entry.name,
      stadt:          entry.stadt          || null,
      land:           entry.land           || null,
      buergermeister: entry.buergermeister || null,
      partei:         entry.partei         || null,
      kontaktdaten:   entry.kontaktdaten   || null,
      einwohner:      einwStr ? parseInt(einwStr, 10) : null,
      von:            null,
      notes:          null,
      status:         'neu',
    });
    if (!error) {
      setLeadNames(prev => new Set([...prev, entry.name]));
    }
    setAddingIds(prev => { const next = new Set(prev); next.delete(entry.id); return next; });
  }

  async function addAllShown() {
    const toAdd = shown.filter(e => !leadNames.has(e.name) && !addingIds.has(e.id));
    if (toAdd.length === 0) return;
    setAddingAll(true);
    setAddingIds(prev => new Set([...prev, ...toAdd.map(e => e.id)]));
    await Promise.all(
      toAdd.map(async entry => {
        const einwStr = entry.einwohner?.replace(/\D/g, '');
        const { error } = await supabase.from('leads').insert({
          name:           entry.name,
          stadt:          entry.stadt          || null,
          land:           entry.land           || null,
          buergermeister: entry.buergermeister || null,
          partei:         entry.partei         || null,
          kontaktdaten:   entry.kontaktdaten   || null,
          einwohner:      einwStr ? parseInt(einwStr, 10) : null,
          von:            null,
          notes:          null,
          status:         'neu',
        });
        if (!error) {
          setLeadNames(prev => new Set([...prev, entry.name]));
        }
        setAddingIds(prev => { const next = new Set(prev); next.delete(entry.id); return next; });
      })
    );
    setAddingAll(false);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">

        {/* Page header */}
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Planung</h1>
          {!loading && (
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              {uncontacted.length} von {allABH.length} ABHs noch nicht kontaktiert
            </p>
          )}
        </header>

        {/* Stats + control card */}
        {loading ? (
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-6 text-sm text-[color:var(--muted)] shadow-sm">
            Lade Daten…
          </div>
        ) : (
          <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-6">
              {/* Big counter */}
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tabular-nums text-[color:var(--foreground)]">
                  {uncontacted.length}
                </span>
                <span className="text-sm text-[color:var(--muted)]">nicht kontaktiert</span>
              </div>

              <div className="hidden h-10 w-px bg-[color:var(--border)] sm:block" />

              {/* Progress */}
              <div className="flex flex-col gap-1.5 min-w-[160px]">
                <div className="flex justify-between text-xs text-[color:var(--muted)]">
                  <span>{contactedCount} kontaktiert</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--surface-muted)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--foreground)] transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <div className="hidden h-10 w-px bg-[color:var(--border)] sm:block" />

              {/* Count input */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-[color:var(--muted-strong)]">Zeige</label>
                <input
                  type="number"
                  min={1}
                  max={uncontacted.length || 1}
                  value={count}
                  onChange={e => setCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="h-9 w-20 rounded-md border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-3 text-sm tabular-nums text-[color:var(--foreground)] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                />
                <span className="text-sm text-[color:var(--muted)]">Einträge</span>
              </div>

              {/* Add-all button */}
              {shown.filter(e => !leadNames.has(e.name)).length > 0 && (
                <button
                  onClick={addAllShown}
                  disabled={addingAll}
                  className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[color:var(--foreground)] px-4 py-2 text-sm font-semibold text-[color:var(--background)] transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  {addingAll ? (
                    <>
                      <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60 20" />
                      </svg>
                      Wird hinzugefügt…
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                      Alle {shown.filter(e => !leadNames.has(e.name)).length} hinzufügen
                    </>
                  )}
                </button>
              )}
            </div>
          </section>
        )}

        {/* Table */}
        {!loading && (
          uncontacted.length === 0 ? (
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-6 py-16 text-center shadow-sm">
              <svg className="mx-auto mb-3 text-[color:var(--muted)]" width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-sm font-medium text-[color:var(--foreground)]">Alle ABHs sind bereits in Outreach</p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">Es gibt keine nicht-kontaktierten Einträge mehr.</p>
            </div>
          ) : (
            <section className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm text-[color:var(--muted-strong)]">
                  <thead className="text-left text-xs uppercase tracking-wide text-[color:var(--muted)]">
                    <tr className="bg-[color:var(--surface-muted)]">
                      <th className="border-b border-[color:var(--border)] px-4 py-3 font-semibold" style={{ minWidth: 220 }}>Name</th>
                      <th className="border-b border-[color:var(--border)] px-4 py-3 font-semibold" style={{ minWidth: 110 }}>Stadt</th>
                      <th className="border-b border-[color:var(--border)] px-4 py-3 font-semibold" style={{ minWidth: 130 }}>Bundesland</th>
                      <th className="border-b border-[color:var(--border)] px-4 py-3 font-semibold" style={{ minWidth: 100 }}>Größe</th>
                      <th className="border-b border-[color:var(--border)] px-4 py-3 font-semibold" style={{ minWidth: 90 }}>Partei</th>
                      <th className="border-b border-[color:var(--border)] px-4 py-3" style={{ minWidth: 130 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((entry, i) => {
                      const isAdding = addingIds.has(entry.id);
                      const isAdded  = leadNames.has(entry.name);
                      return (
                        <tr
                          key={entry.id}
                          className="hover:bg-[color:var(--surface-hover)] transition-colors"
                          style={{ animationDelay: `${i * 15}ms` }}
                        >
                          <td className="px-4 py-2.5 align-middle">
                            <span className="font-medium leading-snug">{entry.name}</span>
                          </td>
                          <td className="px-4 py-2.5 align-middle text-[color:var(--muted-strong)]">
                            {entry.stadt || '—'}
                          </td>
                          <td className="px-4 py-2.5 align-middle text-[color:var(--muted-strong)]">
                            {entry.land || '—'}
                          </td>
                          <td className="px-4 py-2.5 align-middle tabular-nums text-[color:var(--muted)]">
                            {formatEinwohner(entry.einwohner)}
                          </td>
                          <td className="px-4 py-2.5 align-middle">
                            {entry.partei ? (
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${parteiCls(entry.partei)}`}>
                                {entry.partei}
                              </span>
                            ) : (
                              <span className="text-[color:var(--muted)]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 align-middle text-right">
                            {isAdded ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Hinzugefügt
                              </span>
                            ) : (
                              <button
                                onClick={() => addOne(entry)}
                                disabled={isAdding}
                                className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1.5 text-xs font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface-hover)] disabled:opacity-50"
                              >
                                {isAdding ? (
                                  <>
                                    <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none">
                                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60 20" />
                                    </svg>
                                    Wird hinzugefügt…
                                  </>
                                ) : (
                                  <>
                                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    </svg>
                                    Zu Outreach
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {uncontacted.length > count && (
                <div className="border-t border-[color:var(--border)] px-4 py-3 text-xs text-[color:var(--muted)]">
                  {uncontacted.length - Math.min(count, uncontacted.length)} weitere Einträge nicht angezeigt — erhöhe die Anzahl oben
                </div>
              )}
            </section>
          )
        )}
      </div>
    </main>
  );
}
