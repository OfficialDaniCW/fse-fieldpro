import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Derive the correct brand name from pump_model string
function deriveBrand(pumpModel) {
  if (!pumpModel) return null;
  const m = pumpModel.toUpperCase();

  if (m.includes('GILBARCO') || m.includes('SK700') || m.includes('ENCORE') || m.includes('G-SITE')) return 'GILBARCO';
  if (m.includes('TOKHEIM') || m.includes('363') || m.includes('93XA') || m.includes('QUANTIUM') || m.includes('TQM')) return 'TOKHEIM';
  if (m.includes('WAYNE') || m.includes('7000') || m.includes('8000') || m.includes('9000') || m.includes('HELIX') || m.includes('VISTA')) return 'WAYNE';
  if (m.includes('ELAFLEX') || m.includes('ZVA') || m.includes('ERV') || m.includes('EBV')) return 'ELAFLEX';
  if (m.includes('PUMPTRONICS') || m.includes('PUMPTRONIC') || m.includes('200 SERIES')) return 'PUMPTRONICS';
  if (m.includes('GVR') || m.includes('GLOBAL STAR') || m.includes('DRESSER')) return 'GVR';
  if (m.includes('Q X10') || m.includes('QX10')) return 'WAYNE';
  if (m.includes('FRANKLIN') || m.includes('FE PETRO') || m.includes('SUBMERSIBLE')) return 'FRANKLIN FUELING';
  if (m.includes('OPW')) return 'OPW';
  if (m.includes('VEEDER') || m.includes('TLS')) return 'VEEDER-ROOT';

  return null;
}

// Known bad brand values that are actually model identifiers, not proper brands
const MODEL_LIKE_BRANDS = ['363', '93XA', '8000', '9000', '7000', '200 SERIES', 'HELIX', 'VISTA'];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const { dry_run = false } = await req.json().catch(() => ({}));

  // Fetch all parts in pages of 200
  let allParts = [];
  let skip = 0;
  const batchSize = 200;

  while (true) {
    const batch = await base44.asServiceRole.entities.Part.list(undefined, batchSize, skip);
    if (!batch || batch.length === 0) break;
    allParts = allParts.concat(batch);
    skip += batchSize;
    if (batch.length < batchSize) break;
  }

  console.log(`Loaded ${allParts.length} parts`);

  const updates = [];
  const skipped = [];
  const issues = [];

  for (const part of allParts) {
    const currentBrand = part.brand;
    const pumpModel = part.pump_model;

    let newBrand = currentBrand;

    // If brand is null/empty — try to derive from pump_model
    if (!currentBrand) {
      const derived = deriveBrand(pumpModel);
      if (derived) {
        newBrand = derived;
      }
    }
    // If brand looks like a model number — replace with proper brand
    else if (MODEL_LIKE_BRANDS.includes(currentBrand.toUpperCase().trim()) || /^\d+$/.test(currentBrand.trim())) {
      const derived = deriveBrand(pumpModel);
      if (derived) {
        newBrand = derived;
      } else {
        issues.push({ id: part.id, part_number: part.part_number, brand: currentBrand, pump_model: pumpModel });
      }
    }
    // Otherwise just uppercase it
    else {
      newBrand = currentBrand.toUpperCase().trim();
    }

    // Only update if something changed
    if (newBrand !== currentBrand) {
      updates.push({ id: part.id, part_number: part.part_number, old_brand: currentBrand, new_brand: newBrand });
      if (!dry_run) {
        await base44.asServiceRole.entities.Part.update(part.id, { brand: newBrand });
      }
    } else {
      skipped.push(part.id);
    }
  }

  return Response.json({
    total: allParts.length,
    updated: updates.length,
    skipped: skipped.length,
    could_not_derive: issues.length,
    dry_run,
    updates: dry_run ? updates.slice(0, 50) : updates.slice(0, 20),
    issues: issues.slice(0, 20),
  });
});