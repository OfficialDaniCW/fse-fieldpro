import { getDb, setCors, handleOptions } from './_lib/db.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      const uploads = await sql`SELECT * FROM staging_uploads ORDER BY created_date DESC`;
      return res.json(uploads);
    }

    if (req.method === 'POST') {
      const data = req.body;
      const upload = await sql`
        INSERT INTO staging_uploads (
          manual_title, manufacturer, json_file_url, image_urls,
          md_file_url, pdf_file_url, status, result
        ) VALUES (
          ${data.manual_title || null}, ${data.manufacturer || null},
          ${data.json_file_url || null}, ${JSON.stringify(data.image_urls || null)},
          ${data.md_file_url || null}, ${data.pdf_file_url || null},
          ${data.status || 'pending'}, ${JSON.stringify(data.result || null)}
        )
        RETURNING *
      `;
      return res.status(201).json(upload[0]);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Staging uploads API error:', err);
    res.status(500).json({ error: err.message });
  }
}
