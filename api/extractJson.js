import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Doar POST este permis' });
  }

  const { text } = req.body;

  const prompt = `Formatează în JSON următorul text:
"""
${text}
"""
Structura: { "data": "YYYY-MM-DD", "id_masa": "mic_dejun", "kcal": 0, "proteina": 0 }`;

  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Răspunde doar cu obiect JSON valid, fără explicații.' },
        { role: 'user', content: prompt }
      ]
    })
  });

  const data = await openaiRes.json();
  const raspuns = data.choices?.[0]?.message?.content || 'Eroare extragere.';

  const insert = await supabase.from('chat_messages').insert([
    { text: prompt, text_type: 'extract_request' },
    { text: raspuns, text_type: 'extract_response' }
  ]);

  return res.status(200).json({ raspuns });
}
