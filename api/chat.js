/**
 * Vercel Serverless: proxy Groq para o chat do portfólio.
 * No painel Vercel: GROQ_API_KEY (obrigatória), GROQ_MODEL (opcional).
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'Chat backend not configured (set GROQ_API_KEY).' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const { messages } = body;
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'Invalid body: expected { messages: [...] }' });
    return;
  }

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: 1024,
        temperature: 0.6
      })
    });

    const data = await r.json();

    if (!r.ok) {
      const msg = (data.error && data.error.message) || data.message || JSON.stringify(data);
      res.status(r.status).json({ error: msg });
      return;
    }

    const reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    res.status(200).json({ reply: reply });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Upstream error' });
  }
};
