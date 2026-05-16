import { getDb, setCors, handleOptions } from '../_lib/db.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  const sql = getDb();
  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM parts WHERE id = ${id}`;
      if (!rows[0]) return res.status(404).json({ error: 'Not found' });
      return res.json(rows[0]);
    }

    if (req.method === 'PUT') {
      const data = req.body;
      const rows = await sql`
        UPDATE parts SET
          part_number           = COALESCE(${data.part_number}, part_number),
          description           = COALESCE(${data.description ?? null}, description),
          manufacturer_part_ref = COALESCE(${data.manufacturer_part_ref ?? null}, manufacturer_part_ref),
          brand                 = COALESCE(${data.brand ?? null}, brand),
          pump_model            = COALESCE(${data.pump_model ?? null}, pump_model),
          system_area           = COALESCE(${data.system_area ?? null}, system_area),
          component_type        = COALESCE(${data.component_type ?? null}, component_type),
          image_url             = COALESCE(${data.image_url ?? null}, image_url),
          manual_ids            = COALESCE(${data.manual_ids ?? null}, manual_ids),
          notes                 = COALESCE(${data.notes ?? null}, notes),
          is_verified           = COALESCE(${data.is_verified ?? null}, is_verified)
        WHERE id = ${id}
        RETURNING *
      `;
      if (!rows[0]) return res.status(404).json({ error: 'Not found' });
      return res.json(rows[0]);
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM parts WHERE id = ${id}`;
      return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Part [id] API error:', err);
    res.status(500).json({ error: err.message });
  }
}
