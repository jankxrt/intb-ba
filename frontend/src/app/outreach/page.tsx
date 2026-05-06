"use client";
import { useState, useEffect } from 'react';
import { supabase, type Lead } from '@/lib/supabase';

const STATUS_OPTIONS = ['neu', 'kontaktiert', 'antwort', 'abgeschlossen', 'abgelehnt'];

const statusClass: Record<string, string> = {
  neu:           'bg-blue-50   text-blue-700   border-blue-200   dark:bg-blue-950/40  dark:text-blue-300  dark:border-blue-800',
  kontaktiert:   'bg-amber-50  text-amber-700  border-amber-200  dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  antwort:       'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
  abgeschlossen: 'bg-green-50  text-green-700  border-green-200  dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
  abgelehnt:     'bg-red-50    text-red-700    border-red-200    dark:bg-red-950/40   dark:text-red-300   dark:border-red-800',
};

function StatusBadge({ status, id, onChange }: { status: string; id: number; onChange: (id: number, status: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`table-button border ${statusClass[status] ?? 'bg-gray-50 text-gray-600 border-gray-200'} cursor-pointer`}
      >
        {status}
      </button>
      {open && (
        <div
          className="animate-scale-in absolute left-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => { onChange(id, s); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-xs hover:bg-[color:var(--surface-hover)] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OutreachPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setLeads(data ?? []);
    setLoading(false);
  }

  async function updateStatus(id: number, status: string) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    await supabase.from('leads').update({ status }).eq('id', id);
  }

  async function deleteLead(id: number) {
    setDeletingId(id);
    await supabase.from('leads').delete().eq('id', id);
    setLeads(prev => prev.filter(l => l.id !== id));
    setDeletingId(null);
  }

  const byStatus = STATUS_OPTIONS.reduce<Record<string, Lead[]>>((acc, s) => {
    acc[s] = leads.filter(l => l.status === s);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Outreach</h1>
          <p className="text-sm text-[color:var(--muted)]">
            {leads.length} Lead{leads.length !== 1 ? 's' : ''} gespeichert
          </p>
        </header>

        {error && (
          <div className="rounded-lg border border-[color:var(--danger-border)] bg-[color:var(--danger-bg)] px-4 py-3 text-sm text-[color:var(--danger-fg)]">
            {error}
          </div>
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
        ) : (
          <section className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm text-[color:var(--muted-strong)]">
                <thead className="text-left text-xs uppercase tracking-wide text-[color:var(--muted)]">
                  <tr className="bg-[color:var(--surface-muted)]">
                    <th className="border-b border-[color:var(--border)] px-3 py-3 font-semibold" style={{ minWidth: '180px' }}>Name</th>
                    <th className="border-b border-[color:var(--border)] px-3 py-3 font-semibold" style={{ minWidth: '110px' }}>Stadt</th>
                    <th className="border-b border-[color:var(--border)] px-3 py-3 font-semibold" style={{ minWidth: '130px' }}>Bundesland</th>
                    <th className="border-b border-[color:var(--border)] px-3 py-3 font-semibold" style={{ minWidth: '100px' }}>Partei</th>
                    <th className="border-b border-[color:var(--border)] px-3 py-3 font-semibold" style={{ minWidth: '210px' }}>E-Mail</th>
                    <th className="border-b border-[color:var(--border)] px-3 py-3 font-semibold" style={{ minWidth: '120px' }}>Status</th>
                    <th className="border-b border-[color:var(--border)] px-3 py-3 font-semibold" style={{ minWidth: '60px' }}></th>
                  </tr>
                </thead>
                <tbody key={leads.length}>
                  {leads.map((lead, i) => (
                    <tr
                      key={lead.id}
                      className="animate-row-in hover:bg-[color:var(--surface-hover)]"
                      style={{ animationDelay: `${i * 20}ms` }}
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
                        {lead.partei && lead.partei !== '#N/A' ? (
                          <div className="flex justify-center">
                            <div className={`table-button ${lead.partei.toLowerCase().replace(/[^a-z]/g, '')}-sc default-sc`}>
                              {lead.partei}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[color:var(--muted)]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        {lead.kontaktdaten ? (
                          <a
                            href={`mailto:${lead.kontaktdaten}`}
                            className="whitespace-nowrap font-mono text-xs"
                          >
                            {lead.kontaktdaten}
                          </a>
                        ) : (
                          <span className="text-[color:var(--muted)]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        <StatusBadge status={lead.status} id={lead.id} onChange={updateStatus} />
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        <button
                          onClick={() => deleteLead(lead.id)}
                          disabled={deletingId === lead.id}
                          aria-label="Lead entfernen"
                          className="flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--muted)] transition-colors hover:bg-[color:var(--danger-bg)] hover:text-[color:var(--danger-fg)] disabled:opacity-40"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary strip */}
            <div className="flex flex-wrap gap-3 border-t border-[color:var(--border)] px-4 py-3">
              {STATUS_OPTIONS.map(s => (
                <span key={s} className={`table-button border ${statusClass[s]}`}>
                  {s}: {byStatus[s]?.length ?? 0}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
