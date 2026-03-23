import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    // Handle both direct calls (with manual_id) and automation triggers (with event.entity_id)
    const manual_id = payload.manual_id || payload.event?.entity_id;

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
    const manualManufacturer = (manual.manufacturer || '').toLowerCase().trim();

    console.log(`[LINK] Linking manual "${manual.title}" (${manualManufacturer} / ${manualModel})`);

    // Match parts only if:
    // 1. Manufacturer matches (REQUIRED) AND
    // 2. Model matches (if available)
    for (const part of allParts) {
      const partBrand = (part.brand || '').toLowerCase().trim();
      const partModel = (part.pump_model || '').toLowerCase().trim();
      
      // First check: manufacturer MUST match
      if (!manualManufacturer || !partBrand) {
        continue;
      }

      const manufacturerMatches = partBrand.includes(manualManufacturer) || manualManufacturer.includes(partBrand);
      
      if (!manufacturerMatches) {
        continue;
      }

      // Second check: if manual has a specific model, part model should match
      let shouldLink = false;
      
      if (manualModel && partModel) {
        // Both have models, check if they match
        shouldLink = partModel.includes(manualModel) || manualModel.includes(partModel);
      } else if (!manualModel && manualManufacturer) {
        // Manual is generic (no specific model), link all parts of that manufacturer
        shouldLink = true;
      }

      if (!shouldLink) {
        continue;
      }

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
        console.log(`[LINK] Linked to part ${part.part_number}`);
      }
    }

    console.log(`[LINK] Linked ${updatedCount} parts to manual "${manual.title}"`);

    return Response.json({
      success: true,
      manual_id,
      manual_title: manual.title,
      parts_linked: updatedCount
    });
  } catch (error) {
    console.error('[LINK] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});