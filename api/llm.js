import { GoogleGenerativeAI } from '@google/generative-ai';
import { setCors, handleOptions } from './_lib/db.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, model = 'gemini-2.0-flash', response_json_schema, input_schema } = req.body || {};

  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const geminiModel = genAI.getGenerativeModel({
      model,
      ...(response_json_schema
        ? { generationConfig: { responseMimeType: 'application/json', responseSchema: response_json_schema } }
        : {}),
    });

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();

    if (response_json_schema || input_schema) {
      try {
        return res.json(JSON.parse(text));
      } catch {
        return res.json({ result: text });
      }
    }

    return res.json(text);
  } catch (err) {
    console.error('LLM API error:', err);
    res.status(500).json({ error: err.message });
  }
}
