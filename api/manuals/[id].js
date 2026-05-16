import { getDb, setCors, handleOptions } from '../_lib/db.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  const sql = getDb();
  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM manuals WHERE id = ${id}`;
      if (!rows[0]) return res.status(404).json({ error: 'Not found' });
      return res.json(rows[0]);
    }

    if (req.method === 'PUT') {
      const data = req.body;
      const rows = await sql`
        UPDATE manuals SET
          title             = COALESCE(${data.title ?? null}, title),
          manufacturer      = COALESCE(${data.manufacturer ?? null}, manufacturer),
          model             = COALESCE(${data.model ?? null}, model),
          manual_type       = COALESCE(${data.manual_type ?? null}, manual_type),
          version           = COALESCE(${data.version ?? null}, version),
          component_type    = COALESCE(${data.component_type ?? null}, component_type),
          pdf_url           = COALESCE(${data.pdf_url ?? null}, pdf_url),
          pdf_file          = COALESCE(${data.pdf_file ?? null}, pdf_file),
          source_url        = COALESCE(${data.source_url ?? null}, source_url),
          image_urls        = COALESCE(${data.image_urls ? JSON.stringify(data.image_urls) : null}::jsonb, image_urls),
          processing_status = COALESCE(${data.processing_status ?? null}, processing_status),
          brand_category    = COALESCE(${data.brand_category ?? null}, brand_category),
          part_ids          = COALESCE(${data.part_ids ?? null}, part_ids),
          wiki_content      = COALESCE(${data.wiki_content ?? null}, wiki_content)
        WHERE id = ${id}
        RETURNING *
      `;
      if (!rows[0]) return res.status(404).json({ error: 'Not found' });
      return res.json(rows[0]);
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM manuals WHERE id = ${id}`;
      return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Manual [id] API error:', err);
    res.status(500).json({ error: err.message });
  }
}
