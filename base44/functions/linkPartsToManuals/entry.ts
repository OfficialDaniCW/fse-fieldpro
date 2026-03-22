import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { manual_id } = await req.json();

    if (!manual_id) {
      return Response.json({ error: 'manual_id required' }, { status: 400 });
    }

    // Fetch the manual
    const manual = await base44.asServiceRole.entities.Manual.get(manual_id);
    if (!manual) {
      return Response.json({ error: 'Manual not found' }, { status: 404 });
    }

    // Get all parts
    const allParts = await base44.asServiceRole.entities.Part.list();

    let updatedCount = 0;
    const manualModel = (manual.model || '').toLowerCase().trim();

    // BUG FIX 5: Match parts by model using case-insensitive partial matching
    // If manual extracted "SK700-2" and part has "Gilbarco SK700-2 (MK2)", it should match
    for (const part of allParts) {
      const partModel = (part.pump_model || '').toLowerCase().trim();
      
      // Case-insensitive partial match: either string contains the other
      const modelMatches = manualModel && partModel && (
        partModel.includes(manualModel) || manualModel.includes(partModel)
      );

      if (modelMatches) {
        // Create manual link entry
        const newLink = {
          manual_id: manual.id,
          manual_title: manual.title,
          pdf_url: manual.pdf_file
        };

        // Get existing manual_links (avoiding duplicates)
        const existingLinks = part.manual_links || [];
        const linkExists = existingLinks.some(l => l.manual_id === manual.id);

        if (!linkExists) {
          const updatedLinks = [...existingLinks, newLink];
          await base44.asServiceRole.entities.Part.update(part.id, {
            manual_links: updatedLinks
          });
          updatedCount++;
        }
      }
    }

    return Response.json({
      success: true,
      manual_id,
      manual_title: manual.title,
      parts_linked: updatedCount
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Simple extraction: looks for common part names in manual text
function extractPartNamesFromManual(text) {
  const names = new Set();
  
  // Common part types and patterns
  const patterns = [
    /seal|gasket|valve|pump|filter|sensor|bearing|spring|bracket|connector|wire/gi,
    /flow meter|pressure switch|control unit|solenoid|coil|relay/gi
  ];

  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => names.add(match.toLowerCase()));
    }
  });

  return Array.from(names);
}