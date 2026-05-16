import { getDb, setCors, handleOptions } from './_lib/db.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, data } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Function name is required' });

  const sql = getDb();

  try {
    switch (name) {
      case 'logSystemEvent': {
        await sql`
          INSERT INTO activity_logs (entity_type, action, details)
          VALUES ('system', ${data?.level || 'info'}, ${JSON.stringify(data || null)})
        `;
        return res.json({ success: true });
      }

      case 'logActivityChange': {
        await sql`
          INSERT INTO activity_logs (entity_type, entity_id, action, details, user_id)
          VALUES (
            ${data?.entity_type || null}, ${data?.entity_id || null},
            ${data?.action || null}, ${JSON.stringify(data?.details || null)},
            ${data?.user_id || null}
          )
        `;
        return res.json({ success: true });
      }

      case 'bulkProcessManual':
      case 'processStagingManual':
      case 'processZipManual':
      case 'initManualExtraction':
      case 'extractPdfText':
      case 'extractManualDiagrams':
      case 'verifyExtractedParts':
      case 'linkPartsToManuals':
      case 'findDuplicateParts':
      case 'removeDuplicateParts':
      case 'fixPartBrands':
      case 'seedPrebakedWikis':
        return res.status(501).json({
          error: `Function '${name}' requires migration to Vercel. See docs/FUNCTION_MIGRATION.md`,
        });

      default:
        return res.status(404).json({ error: `Unknown function: ${name}` });
    }
  } catch (err) {
    console.error(`Function invoke error (${name}):`, err);
    res.status(500).json({ error: err.message });
  }
}
