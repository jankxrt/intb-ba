import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  created_at: string;
};
