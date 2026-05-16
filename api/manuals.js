import { getDb, setCors, handleOptions } from './_lib/db.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      const manuals = await sql`SELECT * FROM manuals ORDER BY created_date DESC`;
      return res.json(manuals);
    }

    if (req.method === 'POST') {
      const data = req.body;
      const manual = await sql`
        INSERT INTO manuals (
          title, manufacturer, model, manual_type, version, component_type,
          pdf_url, pdf_file, source_url, image_urls, processing_status,
          brand_category, part_ids, wiki_content
        ) VALUES (
          ${data.title || ''}, ${data.manufacturer || null}, ${data.model || null},
          ${data.manual_type || null}, ${data.version || null}, ${data.component_type || null},
          ${data.pdf_url || null}, ${data.pdf_file || null}, ${data.source_url || null},
          ${JSON.stringify(data.image_urls || null)}, ${data.processing_status || null},
          ${data.brand_category || null}, ${data.part_ids || []}, ${data.wiki_content || null}
        )
        RETURNING *
      `;
      return res.status(201).json(manual[0]);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Manuals API error:', err);
    res.status(500).json({ error: err.message });
  }
}
