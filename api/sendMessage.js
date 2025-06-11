import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Doar POST este permis' });
  }

  const { mesaj } = req.body;
  if (!mesaj) {
    return res.status(400).json({ error: 'Mesajul lipsește' });
  }

  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: mesaj }]
    })
  });

  const data = await openaiRes.json();
  const raspuns = data.choices?.[0]?.message?.content || 'Eroare la răspuns.';
  const promptTokens = data.usage?.prompt_tokens || null;
  const completionTokens = data.usage?.completion_tokens || null;

  await supabase.from('chat_messages').insert([
    { text: mesaj, text_type: 'sent', tokens: promptTokens },
    { text: raspuns, text_type: 'response', tokens: completionTokens }
  ]);

  return res.status(200).json({ raspuns });
}