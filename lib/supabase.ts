import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const BUCKETS = {
  intakeVideos: "intake-videos",
  deliverableFiles: "deliverable-files"
} as const;

let _admin: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Server-only client using the service role key. Never import this from client components. */
export function getSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  if (!_admin) {
    _admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false }
    });
  }
  return _admin;
}

export async function createSignedUploadUrl(bucket: string, path: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
  if (error) throw error;
  return data;
}

export async function createSignedDownloadUrl(bucket: string, path: string, expiresInSeconds = 60 * 30) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function uploadServerSide(bucket: string, path: string, file: Buffer, contentType?: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType, upsert: true });
  if (error) throw error;
  return path;
}

export async function downloadServerSide(bucket: string, path: string): Promise<Buffer> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}
