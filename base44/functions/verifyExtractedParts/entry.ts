import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { manual_id, tsg_parts_map } = body;

    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!manual_id || !tsg_parts_map) {
      return Response.json({ error: 'manual_id and tsg_parts_map required' }, { status: 400 });
    }

    // Fetch the manual
    const manual = await base44.asServiceRole.entities.Manual.get(manual_id);
    if (!manual) {
      return Response.json({ error: 'Manual not found' }, { status: 404 });
    }

    // Get all parts (for lookup)
    const allParts = await base44.asServiceRole.entities.Part.list();

    // If manual_links doesn't exist, extract from manual_text by part number patterns
    const extractedPartNumbers = manual.manual_links?.map(m => m.manual_id) || [];

    let verified = 0, flagged = 0, updated = 0;
    const verificationResults = [];

    // Process each part in TSG map that might relate to this manual
    for (const [tsgPartNumber, tsgDescription] of Object.entries(tsg_parts_map)) {
      const existingPart = allParts.find(p => p.part_number === tsgPartNumber);

      if (!existingPart) {
        // New part from manual — needs review
        verificationResults.push({
          part_number: tsgPartNumber,
          status: 'new_part',
          message: 'New part found in manual extraction — needs admin review'
        });
        flagged++;
        continue;
      }

      // Check if description matches TSG original
      if (existingPart.description !== tsgDescription) {
        verificationResults.push({
          part_number: tsgPartNumber,
          status: 'discrepancy',
          message: `Description mismatch: TSG says "${tsgDescription}", current is "${existingPart.description}"`,
          tsg_original: tsgDescription,
          current: existingPart.description
        });
        flagged++;

        // Log the discrepancy
        await base44.asServiceRole.entities.PartVerification.create({
          part_id: existingPart.id,
          part_number: tsgPartNumber,
          tsg_original_description: tsgDescription,
          current_description: existingPart.description,
          description_matches_tsg: false,
          manual_id,
          verification_status: 'discrepancy',
          discrepancies: { description: { tsg: tsgDescription, current: existingPart.description } },
          verified_by: user.email,
          verified_date: new Date().toISOString()
        });
        continue;
      }

      // Description matches — mark as verified
      verificationResults.push({
        part_number: tsgPartNumber,
        status: 'verified',
        message: 'Part verified against TSG original'
      });
      verified++;

      await base44.asServiceRole.entities.PartVerification.create({
        part_id: existingPart.id,
        part_number: tsgPartNumber,
        tsg_original_description: tsgDescription,
        current_description: existingPart.description,
        description_matches_tsg: true,
        manual_id,
        verification_status: 'verified',
        verified_by: user.email,
        verified_date: new Date().toISOString()
      });
    }

    return Response.json({
      success: true,
      verified,
      flagged,
      updated,
      results: verificationResults,
      message: `Verification complete: ${verified} verified, ${flagged} flagged`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});