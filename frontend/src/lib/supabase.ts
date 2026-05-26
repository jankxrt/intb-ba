import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type ABHEntry = {
  id: number;
  name: string;
  stadt: string;
  land: string | null;
  einwohner: string | null;
  partei: string | null;
  kontaktdaten: string | null;
  telefon: string | null;
  website: string | null;
  adresse: string | null;
  buergermeister: string | null;
  lat: number | null;
  lng: number | null;
  fax: string | null;
  typ: string | null;
  kontakt: string | null;
};

export type Lead = {
  id: number;
  name: string;
  stadt: string | null;
  land: string | null;
  buergermeister: string | null;
  partei: string | null;
  kontaktdaten: string | null;
  einwohner: number | null;
  status: string;
  notes: string | null;
  von: string | null;
  created_at: string;
};
