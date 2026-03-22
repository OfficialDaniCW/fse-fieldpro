import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { manual_id } = await req.json();

    if (!manual_id) {
      return Response.json({ error: 'manual_id required' }, { status: 400 });
    }

    // Step 1: Load manual record
    const manual = await base44.asServiceRole.entities.Manual.get(manual_id);

    if (!manual) {
      return Response.json({ error: 'Manual not found' }, { status: 404 });
    }

    if (!manual.pdf_file) {
      return Response.json({ error: 'Manual has no PDF file' }, { status: 400 });
    }

    // Step 2: Update to processing
    await base44.asServiceRole.entities.Manual.update(manual_id, { processing_status: 'processing' });

    // Step 3: Extract text from PDF using InvokeLLM
    let extractedData;
    try {
      const extraction = await base44.integrations.Core.InvokeLLM({
        model: 'gemini_3_pro',
        file_urls: [manual.pdf_file],
        prompt: `Extract the complete text content from this PDF manual.
Return a JSON object with these exact fields:
- title: the full document title
- manufacturer: the manufacturer name
- model: the specific equipment model(s) covered
- manual_type: type of manual (Service/Installation/Parts/Maintenance)
- summary: one paragraph plain-English summary of what this manual covers
- table_of_contents: array of section titles in order
- sections: array of objects, each with {heading, content, page_number}
- error_codes: array of objects, each with {code, description, cause, action}
- safety_warnings: array of plain-English safety warnings
- maintenance_schedule: array of {interval, tasks} objects
- parts_referenced: array of part numbers or descriptions mentioned
Return ONLY valid JSON, no markdown.`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            manufacturer: { type: 'string' },
            model: { type: 'string' },
            manual_type: { type: 'string' },
            summary: { type: 'string' },
            table_of_contents: { type: 'array', items: { type: 'string' } },
            sections: { type: 'array', items: { type: 'object' } },
            error_codes: { type: 'array', items: { type: 'object' } },
            safety_warnings: { type: 'array', items: { type: 'string' } },
            maintenance_schedule: { type: 'array', items: { type: 'object' } },
            parts_referenced: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      extractedData = extraction;
    } catch (error) {
      await base44.asServiceRole.entities.Manual.update(manual_id, {
        processing_status: 'failed',
        processing_error: `Text extraction failed: ${error.message}`
      });
      return Response.json({ error: `Extraction failed: ${error.message}` }, { status: 500 });
    }

    // Step 5: Build structured manual_text
    const sections = (extractedData.sections || []).map(s => `=== ${s.heading} ===\n${s.content}`).join('\n\n');
    const toc = (extractedData.table_of_contents || []).join(' | ');
    const errorCodesText = (extractedData.error_codes || [])
      .map(e => `${e.code}: ${e.description} | Cause: ${e.cause || 'N/A'} | Action: ${e.action || 'N/A'}`)
      .join('\n');
    const safetyText = (extractedData.safety_warnings || []).join('\n');
    const maintenanceText = (extractedData.maintenance_schedule || [])
      .map(m => `${m.interval}: ${m.tasks}`)
      .join('\n');

    const manual_text = `MANUAL: ${extractedData.title || manual.title}
MANUFACTURER: ${extractedData.manufacturer || manual.manufacturer}
MODEL: ${extractedData.model || manual.model}

SUMMARY: ${extractedData.summary || manual.summary || ''}

TABLE OF CONTENTS:
${toc}

${sections}

ERROR CODES:
${errorCodesText}

SAFETY:
${safetyText}

MAINTENANCE:
${maintenanceText}`;

    // Step 6: Assign to folder based on manufacturer + model
    let folder_id = null;
    try {
      const mfr = extractedData.manufacturer || manual.manufacturer;
      const folders = await base44.asServiceRole.entities.ManualFolder.filter({
        brand: mfr
      });
      if (folders?.length > 0) {
        folder_id = folders[0].id;
      }
    } catch (e) {
      console.log('Folder assignment skipped:', e.message);
    }

    // Step 7: Extract diagram (if enabled)
    let exploded_view_image_url = null;
    if (manual.extract_diagrams) {
      try {
        const diagramResult = await base44.integrations.Core.InvokeLLM({
          model: 'gemini_3_pro',
          file_urls: [manual.pdf_file],
          prompt: `Identify the main exploded view, assembly diagram, or parts diagram in this technical manual. Return the page number and a brief description of what it shows.`,
          response_json_schema: {
            type: 'object',
            properties: {
              has_diagram: { type: 'boolean' },
              page_number: { type: 'number' },
              description: { type: 'string' }
            }
          }
        });
        if (diagramResult?.has_diagram) {
          exploded_view_image_url = `pending_extraction_page_${diagramResult.page_number || 'unknown'}`;
        }
      } catch (e) {
        console.log('Diagram extraction skipped:', e.message);
      }
    }

    // Step 8 & 9: Link to parts
    let parts_linked = 0;
    try {
      const mfr = extractedData.manufacturer || manual.manufacturer;
      const allParts = await base44.asServiceRole.entities.Part.filter({
        brand: mfr
      });
      
      for (const part of allParts) {
        if (extractedData.parts_referenced?.some(p => 
          part.part_number?.toUpperCase() === p.toUpperCase() ||
          part.description?.toUpperCase().includes(p.toUpperCase())
        )) {
          const updatePayload = {
            source_manual_id: manual_id
          };
          
          // Capture manufacturer reference if found
          const matchedRef = extractedData.parts_referenced?.find(p => 
            part.part_number?.toUpperCase() === p.toUpperCase() ||
            part.description?.toUpperCase().includes(p.toUpperCase())
          );
          
          if (matchedRef && matchedRef !== part.part_number && !part.manufacturer_part_ref) {
            updatePayload.manufacturer_part_ref = matchedRef;
          }
          
          await base44.asServiceRole.entities.Part.update(part.id, updatePayload);
          parts_linked++;
        }
      }
    } catch (e) {
      console.log('Parts linking skipped:', e.message);
    }

    // Step 10: Update manual record
    await base44.asServiceRole.entities.Manual.update(manual_id, {
      manual_text,
      table_of_contents: toc,
      error_codes: errorCodesText,
      processing_status: 'complete',
      parts_linked,
      exploded_view_image_url: exploded_view_image_url || null,
      folder_id
    });

    // Log activity
    try {
      await base44.asServiceRole.entities.ActivityLog.create({
        entity_type: 'Manual',
        entity_id: manual_id,
        action: 'update',
        user_email: user.email,
        changes: {
          action: 'processed',
          parts_linked,
          status: 'complete'
        }
      });
    } catch (e) {
      console.log('Activity log skipped:', e.message);
    }

    return Response.json({
      success: true,
      manual_id,
      title: extractedData.title || manual.title,
      parts_linked,
      error_codes_count: extractedData.error_codes?.length || 0,
      sections_count: extractedData.sections?.length || 0
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});