import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

function deriveBrand(pumpModel) {
  if (!pumpModel) return null;
  const m = pumpModel.toUpperCase();
  if (m.includes('GILBARCO') || m.includes('SK700') || m.includes('ENCORE') || m.includes('G-SITE')) return 'GILBARCO';
  if (m.includes('TOKHEIM') || m.includes('363') || m.includes('93XA') || m.includes('QUANTIUM') || m.includes('TQM')) return 'TOKHEIM';
  if (m.includes('WAYNE') || m.includes('7000') || m.includes('8000') || m.includes('9000') || m.includes('HELIX') || m.includes('VISTA') || m.includes('Q X10') || m.includes('QX10')) return 'WAYNE';
  if (m.includes('ELAFLEX') || m.includes('ZVA') || m.includes('ERV') || m.includes('EBV')) return 'ELAFLEX';
  if (m.includes('PUMPTRONICS') || m.includes('PUMPTRONIC') || m.includes('200 SERIES')) return 'PUMPTRONICS';
  if (m.includes('GVR') || m.includes('GLOBAL STAR') || m.includes('DRESSER')) return 'GVR';
  if (m.includes('FRANKLIN') || m.includes('FE PETRO')) return 'FRANKLIN FUELING';
  if (m.includes('OPW')) return 'OPW';
  if (m.includes('VEEDER') || m.includes('TLS')) return 'VEEDER-ROOT';
  return null;
}

const MODEL_LIKE_BRANDS = new Set(['363', '93XA', '8000', '9000', '7000', '200 SERIES', 'HELIX', 'VISTA']);

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

  // Fetch all parts
  let allParts = [];
  let skip = 0;
  while (true) {
    const batch = await base44.asServiceRole.entities.Part.list(undefined, 200, skip);
    if (!batch || batch.length === 0) break;
    allParts = allParts.concat(batch);
    skip += 200;
    if (batch.length < 200) break;
  }
  console.log(`Loaded ${allParts.length} parts`);

  // Compute needed updates
  const updates = [];
  for (const part of allParts) {
    const cur = part.brand;
    let next = cur;

    if (!cur) {
      next = deriveBrand(part.pump_model);
    } else if (MODEL_LIKE_BRANDS.has(cur.toUpperCase().trim()) || /^\d+$/.test(cur.trim())) {
      next = deriveBrand(part.pump_model) || cur.toUpperCase().trim();
    } else {
      next = cur.toUpperCase().trim();
    }

    if (next !== cur) {
      updates.push({ id: part.id, brand: next });
    }
  }

  console.log(`Need to update ${updates.length} parts`);

  // Apply in parallel batches of 50
  const BATCH = 50;
  let done = 0;
  for (let i = 0; i < updates.length; i += BATCH) {
    const chunk = updates.slice(i, i + BATCH);
    const results = await Promise.allSettled(chunk.map(u => base44.asServiceRole.entities.Part.update(u.id, { brand: u.brand })));
    const failed = results.filter(r => r.status === 'rejected');
    done += chunk.length - failed.length;
    if (failed.length > 0) console.error(`Batch ${i}-${i+BATCH}: ${failed.length} failures`, failed[0].reason?.message);
    console.log(`Progress: ${done} done`);
  }

  return Response.json({ total: allParts.length, updated: updates.length, done: true });
});