import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const before = url.searchParams.get('before');

  let query = supabase
    .from('chat_messages')
    .select('id, text, text_type, created_at')
    .order('created_at', { ascending: false })
    .limit(before ? 5 : 10);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const sorted = data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return res.status(200).json(sorted);
}