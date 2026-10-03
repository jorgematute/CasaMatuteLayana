export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_CASAMATUTELAYANA_CASAMATUTELAYANASUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?? process.env.NEXT_PUBLIC_CASAMATUTELAYANA_CASAMATUTELAYANASUPABASE_ANON_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_CASAMATUTELAYANA_CASAMATUTELAYANASUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error('Configura la URL y la clave pública de Supabase en las variables NEXT_PUBLIC correspondientes.');
  }

  return { url, key };
}