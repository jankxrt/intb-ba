"use client";
import { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useDragScroll } from '@/lib/useDragScroll';

const VON_OPTIONS = ['Ramin Goo', 'Jan Kortmann', 'Isabel Magallanes', 'Barbara Stasiak'];

const LEAD_STATUS_OPTIONS = ['neu', 'kontaktiert', 'persönlicher kontakt', 'antwort', 'abgeschlossen', 'abgelehnt'];

function AddLeadModal({ name, onConfirm, onCancel }: {
  name: string;
  onConfirm: (von: string | null, notes: string, status: string) => void;
  onCancel: () => void;
}) {
  const [von, setVon] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('neu');
  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="animate-scale-in relative w-full max-w-md rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="mb-0.5 text-base font-semibold text-[color:var(--foreground)]">Lead hinzufügen</h2>
        <p className="mb-5 text-sm text-[color:var(--muted)] line-clamp-1">{name}</p>

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
                className="h-10 w-full appearance-none rounded-md border border-[color:var(--border-strong)] bg-[color:var(--surface)] pl-3 pr-9 text-sm text-[color:var(--foreground)] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] capitalize"
              >
                {LEAD_STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
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
            onClick={() => onConfirm(von || null, notes, status)}
            className="h-9 rounded-md bg-[color:var(--foreground)] px-4 text-sm font-semibold text-[color:var(--background)] transition-opacity hover:opacity-80"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
}

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

const leadStatusClass: Record<string, string> = {
  neu:                   'bg-blue-50   text-blue-700   border border-blue-200   dark:bg-blue-950/40  dark:text-blue-300  dark:border-blue-800',
  kontaktiert:           'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
  'persönlicher kontakt':'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
  antwort:               'bg-sky-50    text-sky-700    border border-sky-200    dark:bg-sky-950/40   dark:text-sky-300   dark:border-sky-800',
  abgeschlossen:         'bg-green-50  text-green-700  border border-green-200  dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
  abgelehnt:             'bg-red-50    text-red-700    border border-red-200    dark:bg-red-950/40   dark:text-red-300   dark:border-red-800',
};

const STATUS_ORDER: Record<string, number> = {
  neu: 0, kontaktiert: 1, 'persönlicher kontakt': 2, antwort: 3, abgeschlossen: 4, abgelehnt: 5,
};

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

const BUNDESLAENDER = ['Baden-Württemberg','Bayern','Berlin','Brandenburg','Bremen','Hamburg','Hessen','Mecklenburg-Vorpommern','Niedersachsen','Nordrhein-Westfalen','Rheinland-Pfalz','Saarland','Sachsen','Sachsen-Anhalt','Schleswig-Holstein','Thüringen'];

function AddABHModal({ onSave, onCancel }: { onSave: (fields: Record<string, string>) => Promise<void>; onCancel: () => void }) {
  const [fields, setFields] = useState<Record<string, string>>({ Name: '', Stadt: '', Land: '', Einwohner: '', Partei: '', Adresse: '', Website: '', Telefon: '' });
  const [emails, setEmails] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setFields(f => ({ ...f, [k]: v }));
  const setEmail = (i: number, v: string) => setEmails(em => em.map((e, idx) => idx === i ? v : e));
  const addEmail = () => setEmails(em => [...em, '']);
  const removeEmail = (i: number) => setEmails(em => em.filter((_, idx) => idx !== i));

  async function handleSave() {
    if (!fields.Name.trim() || !fields.Stadt.trim()) return;
    setSaving(true);
    await onSave({ ...fields, Kontaktdaten: emails.filter(Boolean).join('; ') });
    setSaving(false);
  }

  const inputCls = "h-9 w-full rounded-md border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-3 text-sm text-[color:var(--foreground)] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]";
  const labelCls = "mb-1 block text-xs font-medium text-[color:var(--muted-strong)]";

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="animate-scale-in relative w-full max-w-lg rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <h2 className="mb-5 text-base font-semibold text-[color:var(--foreground)]">ABH hinzufügen</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className={labelCls}>Name *</label><input className={inputCls} value={fields.Name} onChange={e => set('Name', e.target.value)} autoFocus /></div>
          <div><label className={labelCls}>Stadt *</label><input className={inputCls} value={fields.Stadt} onChange={e => set('Stadt', e.target.value)} /></div>
          <div><label className={labelCls}>Bundesland</label>
            <div className="relative">
              <select className={inputCls + ' appearance-none pr-8'} value={fields.Land} onChange={e => set('Land', e.target.value)}>
                <option value="">–</option>
                {BUNDESLAENDER.map(bl => <option key={bl} value={bl}>{bl}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
          <div><label className={labelCls}>Einwohner</label><input className={inputCls} value={fields.Einwohner} onChange={e => set('Einwohner', e.target.value)} placeholder="z.B. 50000" /></div>
          <div><label className={labelCls}>Partei</label><input className={inputCls} value={fields.Partei} onChange={e => set('Partei', e.target.value)} /></div>
          <div className="col-span-2"><label className={labelCls}>Adresse</label><input className={inputCls} value={fields.Adresse} onChange={e => set('Adresse', e.target.value)} /></div>
          <div><label className={labelCls}>Website</label><input className={inputCls} value={fields.Website} onChange={e => set('Website', e.target.value)} /></div>
          <div><label className={labelCls}>Telefon</label><input className={inputCls} value={fields.Telefon} onChange={e => set('Telefon', e.target.value)} /></div>
          <div className="col-span-2">
            <label className={labelCls}>E-Mail Adressen</label>
            <div className="flex flex-col gap-1.5">
              {emails.map((em, i) => (
                <div key={i} className="flex gap-1.5">
                  <input className={inputCls} value={em} onChange={e => setEmail(i, e.target.value)} placeholder="email@example.com" />
                  {emails.length > 1 && <button onClick={() => removeEmail(i)} className="h-9 w-9 shrink-0 rounded-md border border-[color:var(--border)] text-[color:var(--muted)] hover:text-red-600 transition-colors text-lg leading-none">–</button>}
                </div>
              ))}
              <button onClick={addEmail} className="self-start text-xs text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors">+ E-Mail hinzufügen</button>
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="h-9 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface-hover)]">Abbrechen</button>
          <button onClick={handleSave} disabled={saving || !fields.Name.trim() || !fields.Stadt.trim()} className="h-9 rounded-md bg-[color:var(--foreground)] px-4 text-sm font-semibold text-[color:var(--background)] transition-opacity hover:opacity-80 disabled:opacity-40">
            {saving ? 'Speichern…' : 'Hinzufügen'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditABHModal({ row, headers, onSave, onCancel }: { row: string[]; headers: string[]; onSave: (originalStadt: string, fields: Record<string, string>) => Promise<void>; onCancel: () => void }) {
  const get = (key: string) => row[headers.findIndex(h => h.trim() === key)] ?? '';
  const [fields, setFields] = useState<Record<string, string>>({ Name: get('Name'), Stadt: get('Stadt'), Land: get('Land'), Einwohner: get('Einwohner'), Partei: get('Partei'), Adresse: get('Adresse'), Website: get('Website'), Telefon: get('Telefon') });
  const [emails, setEmails] = useState<string[]>(() => { const raw = get('Kontaktdaten'); const parts = raw.split(/[;,]/).map(e => e.trim()).filter(Boolean); return parts.length ? parts : ['']; });
  const [saving, setSaving] = useState(false);
  const originalStadt = get('Stadt');
  const set = (k: string, v: string) => setFields(f => ({ ...f, [k]: v }));
  const setEmail = (i: number, v: string) => setEmails(em => em.map((e, idx) => idx === i ? v : e));
  const addEmail = () => setEmails(em => [...em, '']);
  const removeEmail = (i: number) => setEmails(em => em.filter((_, idx) => idx !== i));

  async function handleSave() {
    setSaving(true);
    await onSave(originalStadt, { ...fields, Kontaktdaten: emails.filter(Boolean).join('; ') });
    setSaving(false);
  }

  const inputCls = "h-9 w-full rounded-md border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-3 text-sm text-[color:var(--foreground)] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]";
  const labelCls = "mb-1 block text-xs font-medium text-[color:var(--muted-strong)]";

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="animate-scale-in relative w-full max-w-lg rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <h2 className="mb-1 text-base font-semibold text-[color:var(--foreground)]">Eintrag bearbeiten</h2>
        <p className="mb-5 text-sm text-[color:var(--muted)]">{originalStadt}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className={labelCls}>Name</label><input className={inputCls} value={fields.Name} onChange={e => set('Name', e.target.value)} autoFocus /></div>
          <div><label className={labelCls}>Stadt</label><input className={inputCls} value={fields.Stadt} onChange={e => set('Stadt', e.target.value)} /></div>
          <div><label className={labelCls}>Bundesland</label>
            <div className="relative">
              <select className={inputCls + ' appearance-none pr-8'} value={fields.Land} onChange={e => set('Land', e.target.value)}>
                <option value="">–</option>
                {BUNDESLAENDER.map(bl => <option key={bl} value={bl}>{bl}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
          <div><label className={labelCls}>Einwohner</label><input className={inputCls} value={fields.Einwohner} onChange={e => set('Einwohner', e.target.value)} /></div>
          <div><label className={labelCls}>Partei</label><input className={inputCls} value={fields.Partei} onChange={e => set('Partei', e.target.value)} /></div>
          <div className="col-span-2"><label className={labelCls}>Adresse</label><input className={inputCls} value={fields.Adresse} onChange={e => set('Adresse', e.target.value)} /></div>
          <div><label className={labelCls}>Website</label><input className={inputCls} value={fields.Website} onChange={e => set('Website', e.target.value)} /></div>
          <div><label className={labelCls}>Telefon</label><input className={inputCls} value={fields.Telefon} onChange={e => set('Telefon', e.target.value)} /></div>
          <div className="col-span-2">
            <label className={labelCls}>E-Mail Adressen</label>
            <div className="flex flex-col gap-1.5">
              {emails.map((em, i) => (
                <div key={i} className="flex gap-1.5">
                  <input className={inputCls} value={em} onChange={e => setEmail(i, e.target.value)} placeholder="email@example.com" />
                  {emails.length > 1 && <button onClick={() => removeEmail(i)} className="h-9 w-9 shrink-0 rounded-md border border-[color:var(--border)] text-[color:var(--muted)] hover:text-red-600 transition-colors text-lg leading-none">–</button>}
                </div>
              ))}
              <button onClick={addEmail} className="self-start text-xs text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors">+ E-Mail hinzufügen</button>
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="h-9 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface-hover)]">Abbrechen</button>
          <button onClick={handleSave} disabled={saving} className="h-9 rounded-md bg-[color:var(--foreground)] px-4 text-sm font-semibold text-[color:var(--background)] transition-opacity hover:opacity-80 disabled:opacity-40">
            {saving ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
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
  const [leadStatus, setLeadStatus] = useState<Map<string, string>>(new Map());
  const [addingLead, setAddingLead] = useState<string | null>(null);
  const [pendingLeadRow, setPendingLeadRow] = useState<string[] | null>(null);
  const [hideLeads, setHideLeads] = useState(false);
  const [excludedBundeslaender, setExcludedBundeslaender] = useState<Set<string>>(new Set());
  const [sizeFilter, setSizeFilter] = useState<string>('');
  const [showAddABH, setShowAddABH] = useState(false);
  const [editingRow, setEditingRow] = useState<string[] | null>(null);

  useEffect(() => {
    Papa.parse<string[]>('/data/abs_bundesland.csv', {
      download: true,
      skipEmptyLines: true,
      encoding: 'ISO-8859-1',
      complete: (result) => setData(result.data),
      error: () => setError('Fehler: CSV Datei konnte nicht geladen werden.')
    });
  }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, bundeslandFilter, parteiFilter, excludedBundeslaender, sizeFilter]);
  useEffect(() => { setCurrentPage(1); }, [rowsPerPage]);
  useEffect(() => { setCurrentPage(1); }, [sortCol, sortDir]);

  useEffect(() => {
    supabase.from('leads').select('name, status').then(({ data }) => {
      if (data) setLeadStatus(new Map(data.map((r: { name: string; status: string }) => [r.name, r.status])));
    });
  }, []);

  async function addLead(row: string[], von: string | null, notes: string, status: string = 'neu') {
    const name = row[nameIndex]?.trim();
    if (!name || leadStatus.has(name)) return;
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
      von:            von,
      notes:          notes || null,
      status:         status,
    });
    setLeadStatus(prev => new Map([...prev, [name, status]]));
    setAddingLead(null);
  }

  async function saveABH(fields: Record<string, string>) {
    await fetch('/api/abh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
    Papa.parse<string[]>('/data/abs_bundesland.csv', {
      download: true, skipEmptyLines: true, encoding: 'ISO-8859-1',
      complete: (r) => setData(r.data), error: () => {},
    });
    setShowAddABH(false);
  }

  async function editABH(originalStadt: string, fields: Record<string, string>) {
    await fetch('/api/abh', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stadt: originalStadt, fields }) });
    Papa.parse<string[]>('/data/abs_bundesland.csv', {
      download: true, skipEmptyLines: true, encoding: 'ISO-8859-1',
      complete: (r) => setData(r.data), error: () => {},
    });
    setEditingRow(null);
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
  const telefonnIndex     = headers.findIndex(h => h.trim() === 'Telefon');
  const websiteIndex      = headers.findIndex(h => h.trim() === 'Website');
  const adresseIndex      = headers.findIndex(h => h.trim() === 'Adresse');
  const typIndex          = headers.findIndex(h => /^typ(e)?$/i.test(h.trim()));

  function deriveTyp(name: string): 'Stadt' | 'Kreis' | 'N.N.' {
    if (name.includes('KRV')) return 'Kreis';
    if (name.includes('STV')) return 'Stadt';
    return 'N.N.';
  }

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
    const matchesHideLeads =
      !hideLeads || !leadStatus.has(row[nameIndex]?.trim());
    const matchesExclude =
      excludedBundeslaender.size === 0 || !excludedBundeslaender.has(row[bundeslandIndex]);
    const matchesSize = (() => {
      if (!sizeFilter) return true;
      const pop = row[einwohnerIndex]?.replace(/\D/g, '');
      const n = pop ? parseInt(pop, 10) : 0;
      if (sizeFilter === 'N.N.') return !n || isNaN(n);
      if (isNaN(n) || n === 0) return false;
      if (sizeFilter === 'Millionenstadt') return n >= 1_000_000;
      if (sizeFilter === 'Groß')           return n >= 100_000 && n < 1_000_000;
      if (sizeFilter === 'Mittel')          return n >= 20_000  && n < 100_000;
      if (sizeFilter === 'Klein')           return n < 20_000;
      return true;
    })();
    return matchesSearch && matchesBundesland && matchesPartei && matchesHideLeads && matchesExclude && matchesSize;
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
    } else if (sortCol === typIndex) {
      const aTyp = deriveTyp(a[nameIndex] ?? '');
      const bTyp = deriveTyp(b[nameIndex] ?? '');
      cmp = aTyp.localeCompare(bTyp, 'de', { sensitivity: 'base' });
    } else if (sortCol === kontaktiertIndex) {
      const aStatus = leadStatus.get(a[nameIndex]?.trim()) ?? '';
      const bStatus = leadStatus.get(b[nameIndex]?.trim()) ?? '';
      const aOrd = STATUS_ORDER[aStatus] ?? -1;
      const bOrd = STATUS_ORDER[bStatus] ?? -1;
      cmp = aOrd - bOrd;
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
  const HIDDEN_COLS = new Set(['Lat', 'Lng', 'Fax', 'LAT', 'LNG', 'FAX']);
  const visibleColIndices = headers.map((h, i) => i).filter(i => headers[i].trim() !== '' && !HIDDEN_COLS.has(headers[i].trim()));
  const showAll = rowsPerPage === 0;
  const effectiveRows = showAll ? finalDisplayRows.length : rowsPerPage;
  const indexOfLastRow = currentPage * effectiveRows;
  const indexOfFirstRow = indexOfLastRow - effectiveRows;
  const currentPaginationRows = showAll ? finalDisplayRows : finalDisplayRows.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = showAll ? 1 : Math.ceil(finalDisplayRows.length / effectiveRows);

  function leadRowStyle(status: string | undefined): React.CSSProperties {
    switch (status) {
      case 'kontaktiert':           return { borderLeft: '4px solid #7c3aed' };
      case 'persönlicher kontakt':  return { borderLeft: '4px solid #ea580c' };
      case 'antwort':               return { borderLeft: '4px solid #0284c7' };
      case 'abgeschlossen':         return { borderLeft: '4px solid #16a34a' };
      case 'abgelehnt':             return { borderLeft: '4px solid #dc2626' };
      default:                      return {};
    }
  }

  const headerDisplayNames: Record<string, string> = {
    'Kontakt':    'Status',
    'Einwohner':  'Größe',
  };

  function colWidth(index: number): string {
    if (index === nameIndex)         return '200px';
    if (index === stadtIndex)        return '110px';
    if (index === bundeslandIndex)   return '110px';
    if (index === einwohnerIndex)    return '80px';
    if (index === kontaktiertIndex)  return '80px';
    if (index === parteiIndex)       return '110px';
    if (index === kontaktdatenIndex) return '220px';
    if (index === telefonnIndex)     return '130px';
    if (index === websiteIndex)      return '180px';
    return '90px';
  }

  const dragScroll = useDragScroll();

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
          <div className="flex items-center gap-3">
            {data.length > 0 && (
              <div className="text-sm text-[color:var(--muted)]">
                {finalDisplayRows.length !== rows.length
                  ? <><span className="font-medium text-[color:var(--foreground)]">{finalDisplayRows.length}</span> von {rows.length} Einträgen</>
                  : <>{rows.length} Einträge</>
                }
              </div>
            )}
            <button
              onClick={() => setShowAddABH(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm font-medium text-[color:var(--foreground)] shadow-sm transition-colors hover:bg-[color:var(--surface-hover)]"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              ABH hinzufügen
            </button>
          </div>
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
                {/* Row 1: Search + filters + reset */}
                <div className="md:col-span-4">
                  <label htmlFor="search" className="mb-1 block text-sm font-medium text-[color:var(--muted-strong)]">Suche</label>
                  <input
                    id="search"
                    type="text"
                    placeholder="Name, Stadt..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 w-full rounded-md border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-3 text-sm text-[color:var(--foreground)] shadow-sm outline-none placeholder:text-[color:var(--muted)] focus-visible:border-[color:var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="bundesland" className="mb-1 block text-sm font-medium text-[color:var(--muted-strong)]">Bundesland</label>
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

                <div className="md:col-span-2">
                  <label htmlFor="partei" className="mb-1 block text-sm font-medium text-[color:var(--muted-strong)]">Partei</label>
                  <div className="relative">
                    <select
                      id="partei"
                      value={parteiFilter}
                      onChange={(e) => setParteiFilter(e.target.value)}
                      className="h-10 w-full appearance-none rounded-md border border-[color:var(--border-strong)] bg-[color:var(--surface)] pl-3 pr-9 text-sm text-[color:var(--foreground)] shadow-sm outline-none focus-visible:border-[color:var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                    >
                      <option value="">Alle Parteien</option>
                      {uniqueParteien.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="sizeFilter" className="mb-1 block text-sm font-medium text-[color:var(--muted-strong)]">Stadtgröße</label>
                  <div className="relative">
                    <select
                      id="sizeFilter"
                      value={sizeFilter}
                      onChange={(e) => setSizeFilter(e.target.value)}
                      className="h-10 w-full appearance-none rounded-md border border-[color:var(--border-strong)] bg-[color:var(--surface)] pl-3 pr-9 text-sm text-[color:var(--foreground)] shadow-sm outline-none focus-visible:border-[color:var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                    >
                      <option value="">Alle Größen</option>
                      <option value="Millionenstadt">Millionenstadt (≥ 1 Mio.)</option>
                      <option value="Groß">Großstadt (100k–1 Mio.)</option>
                      <option value="Mittel">Mittelstadt (20k–100k)</option>
                      <option value="Klein">Kleinstadt (&lt; 20k)</option>
                      <option value="N.N.">Unbekannt</option>
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {/* Exclude Bundesland */}
                <div className="md:col-span-2">
                  <label htmlFor="excludeBl" className="mb-1 block text-sm font-medium text-[color:var(--muted-strong)]">Ausschließen</label>
                  <div className="relative">
                    <select
                      id="excludeBl"
                      value=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        setExcludedBundeslaender(prev => new Set([...prev, val]));
                        setBundeslandFilter(f => f === val ? '' : f);
                      }}
                      className="h-10 w-full appearance-none rounded-md border border-[color:var(--border-strong)] bg-[color:var(--surface)] pl-3 pr-9 text-sm text-[color:var(--foreground)] shadow-sm outline-none focus-visible:border-[color:var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                    >
                      <option value="">Bundesland…</option>
                      {uniqueBundeslander.filter(bl => !excludedBundeslaender.has(bl)).map((bl) => (
                        <option key={bl} value={bl}>{bl}</option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                <div className="md:col-span-12 flex flex-wrap items-center gap-2">
                  {/* Hide leads toggle */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hideLeads}
                      onChange={e => setHideLeads(e.target.checked)}
                      className="h-4 w-4 rounded border-[color:var(--border-strong)] accent-violet-600 cursor-pointer"
                    />
                    <span className="text-sm text-[color:var(--muted-strong)]">
                      Bereits hinzugefügte ausblenden
                      {hideLeads && leadStatus.size > 0 && (
                        <span className="ml-1 text-[color:var(--muted)]">({leadStatus.size})</span>
                      )}
                    </span>
                  </label>
                  {/* Excluded Bundesland tags */}
                  {excludedBundeslaender.size > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-[color:var(--muted)]">Ausgeschlossen:</span>
                      {[...excludedBundeslaender].map(bl => (
                        <button
                          key={bl}
                          onClick={() => setExcludedBundeslaender(prev => { const s = new Set(prev); s.delete(bl); return s; })}
                          className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
                        >
                          {bl}
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true"><path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </section>

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
                      <th scope="col" style={{ minWidth: '44px' }} className="sticky top-0 border-b border-[color:var(--border)] bg-[color:var(--surface-muted)] px-2 py-3" />
                      <th scope="col" style={{ minWidth: '36px' }} className="sticky top-0 border-b border-[color:var(--border)] bg-[color:var(--surface-muted)] px-1 py-3" />
                      {visibleColIndices.map((index) => (
                        <th
                          key={index}
                          scope="col"
                          onClick={() => handleSort(index)}
                          style={{ minWidth: colWidth(index) }}
                          className="sticky top-0 border-b border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-3 font-semibold cursor-pointer select-none hover:bg-[color:var(--surface-hover)] transition-colors"
                          aria-sort={sortCol === index ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          <span className="inline-flex items-center">
                            {headerDisplayNames[headers[index].trim()] ?? headers[index]}
                            <SortIcon col={index} sortCol={sortCol} sortDir={sortDir} />
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody key={`${currentPage}-${sortCol}-${sortDir}`}>
                    {currentPaginationRows.length > 0 ? (
                      currentPaginationRows.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className={`animate-row-in hover:bg-[color:var(--surface-hover)] ${leadStatus.get(row[nameIndex]?.trim()) ? `lead-${leadStatus.get(row[nameIndex]?.trim())}` : ''}`}
                          style={{
                            animationDelay: `${rowIndex * 25}ms`,
                            ...leadRowStyle(leadStatus.get(row[nameIndex]?.trim())),
                          }}
                        >
                          {/* Lead button — left column */}
                          {(() => {
                            const rowName = row[nameIndex]?.trim();
                            const isLead = leadStatus.has(rowName);
                            const isAdding = addingLead === rowName;
                            return (
                              <td className="px-2 py-2.5 align-middle">
                                <button
                                  onClick={() => { if (!isLead && !isAdding) setPendingLeadRow(row); }}
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
                          <td className="px-1 py-2.5 align-middle">
                            <button
                              onClick={() => setEditingRow(row)}
                              title="Eintrag bearbeiten"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--muted)] transition-colors hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--foreground)]"
                            >
                              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M8.5 1.5a1.5 1.5 0 0 1 2.121 2.121L4 10.243 1 11l.757-3L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          </td>
                          {visibleColIndices.map((cellIndex) => {
                            const cell = row[cellIndex] ?? '';
                            let displayContent: ReactNode = cell;
                            let cellClassName = '';

                            if (cellIndex === einwohnerIndex) {
                              const category = getCitySizeCategory(cell);
                              displayContent = category;
                              cellClassName = categoryClassMap[category] || '';
                            } else if (cellIndex === kontaktiertIndex) {
                              const rowName = row[nameIndex]?.trim();
                              const leadSt = leadStatus.get(rowName);
                              if (leadSt) {
                                displayContent = leadSt;
                                cellClassName = `lead-status-badge ${leadStatusClass[leadSt] ?? ''}`;
                              } else {
                                displayContent = '—';
                                cellClassName = 'lead-status-empty';
                              }
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
                                {cellClassName?.startsWith('lead-status-badge') ? (
                                  <div className="flex w-full justify-center">
                                    <div className={`table-button ${cellClassName.replace('lead-status-badge', '').trim()}`}>
                                      {displayContent}
                                    </div>
                                  </div>
                                ) : cellClassName === 'lead-status-empty' ? (
                                  <div className="flex w-full justify-center text-[color:var(--muted)]">
                                    {displayContent}
                                  </div>
                                ) : cellClassName ? (
                                  <div className="flex w-full justify-center">
                                    <div className={`table-button ${cellClassName}`.trim()}>
                                      {displayContent}
                                    </div>
                                  </div>
                                ) : cellIndex === telefonnIndex ? (
                                  <div className="whitespace-nowrap tabular-nums">
                                    {displayContent}
                                  </div>
                                ) : cellIndex === typIndex ? (
                                  <div className="flex w-full justify-center">
                                    {(() => {
                                      const typ = deriveTyp(row[nameIndex] ?? '');
                                      const cls =
                                        typ === 'Stadt' ? 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800' :
                                        typ === 'Kreis' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' :
                                        'bg-[color:var(--surface-muted)] text-[color:var(--muted)] border border-[color:var(--border)]';
                                      return <div className={`table-button ${cls}`}>{typ}</div>;
                                    })()}
                                  </div>
                                ) : cellIndex === adresseIndex ? (
                                  <div className="line-clamp-2 break-words leading-snug">
                                    {cell ? (
                                      <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cell)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="underline-offset-2 hover:underline"
                                      >
                                        {cell}
                                      </a>
                                    ) : null}
                                  </div>
                                ) : cellIndex === websiteIndex ? (
                                  <div className="whitespace-nowrap truncate max-w-[180px]">
                                    {cell ? <a href={cell.startsWith('http') ? cell : `https://${cell}`} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">{displayContent}</a> : null}
                                  </div>
                                ) : cellIndex === kontaktdatenIndex ? (
                                  <div className="flex flex-col gap-0.5 font-mono text-xs">
                                    {String(cell ?? '').split(/[;,]/).map(e => e.trim()).filter(Boolean).map((email, i) => (
                                      <a key={i} href={`mailto:${email}`} className="underline-offset-2 hover:underline truncate max-w-[200px]">{email}</a>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="line-clamp-2 break-words leading-snug">
                                    {displayContent}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={visibleColIndices.length + 2} className="px-3 py-12 text-center">
                          <p className="text-sm font-medium text-[color:var(--foreground)]">Keine Einträge gefunden.</p>
                          {(searchTerm !== '' || bundeslandFilter !== '' || parteiFilter !== '' || hideLeads || excludedBundeslaender.size > 0 || sizeFilter !== '') && (
                            <button
                              onClick={() => { setSearchTerm(''); setBundeslandFilter(''); setParteiFilter(''); setSortCol(null); setSortDir('asc'); setHideLeads(false); setExcludedBundeslaender(new Set()); setSizeFilter(''); }}
                              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1.5 text-xs font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface-hover)]"
                            >
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                                <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                              Filter zurücksetzen
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-[color:var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-[color:var(--muted)]">
                    {finalDisplayRows.length} Ergebnis{finalDisplayRows.length !== 1 ? 'se' : ''}
                    {filteredRows.length !== finalDisplayRows.length && (
                      <span className="ml-1 text-xs">({filteredRows.length} Einträge, zusammengeführt nach Stadt)</span>
                    )}
                  </p>
                  {(searchTerm !== '' || bundeslandFilter !== '' || parteiFilter !== '' || hideLeads || excludedBundeslaender.size > 0 || sizeFilter !== '') && (
                    <button
                      onClick={() => { setSearchTerm(''); setBundeslandFilter(''); setParteiFilter(''); setSortCol(null); setSortDir('asc'); setHideLeads(false); setExcludedBundeslaender(new Set()); setSizeFilter(''); }}
                      className="inline-flex items-center gap-1 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-2.5 py-1 text-xs font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface-hover)]"
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true"><path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      Filter zurücksetzen
                    </button>
                  )}
                </div>

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
      {pendingLeadRow && (
        <AddLeadModal
          name={pendingLeadRow[nameIndex]?.trim() ?? ''}
          onConfirm={(von, notes, status) => { addLead(pendingLeadRow, von, notes, status); setPendingLeadRow(null); }}
          onCancel={() => setPendingLeadRow(null)}
        />
      )}
      {showAllModal && (
        <ConfirmModal
          count={finalDisplayRows.length}
          onConfirm={() => { setRowsPerPage(0); setShowAllModal(false); }}
          onCancel={() => setShowAllModal(false)}
        />
      )}
      {showAddABH && (
        <AddABHModal
          onSave={saveABH}
          onCancel={() => setShowAddABH(false)}
        />
      )}
      {editingRow && (
        <EditABHModal
          row={editingRow}
          headers={headers}
          onSave={editABH}
          onCancel={() => setEditingRow(null)}
        />
      )}
    </main>
  );
}
