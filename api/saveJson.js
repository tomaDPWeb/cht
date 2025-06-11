import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Doar POST este permis' });
  }

  const { json } = req.body;

  let obj;
  try {
    obj = JSON.parse(json);
  } catch (e) {
    return res.status(400).json({ error: 'JSON invalid' });
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select('id')
    .eq('text_type', 'extract_response')
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Nu s-a găsit mesajul de tip extract_response' });
  }

  const update = await supabase
    .from('chat_messages')
    .update({ json_validat: obj })
    .eq('id', data.id);

  return res.status(200).json({ success: true });
}
