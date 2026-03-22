import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { manual_id, extract_parts } = await req.json();

    if (!manual_id) {
      return Response.json({ error: 'manual_id required' }, { status: 400 });
    }

    const manual = await base44.entities.Manual.get(manual_id);
    if (!manual) {
      return Response.json({ error: 'Manual not found' }, { status: 404 });
    }

    if (!manual.pdf_file) {
      return Response.json({ error: 'Manual has no PDF file' }, { status: 400 });
    }

    // Step 1: Extract text from PDF
    const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url: manual.pdf_file,
      json_schema: {
        type: "object",
        properties: {
          full_text: { type: "string", description: "All text content from the document" },
          error_codes: { type: "string", description: "Any error codes found with their descriptions" },
          troubleshooting: { type: "string", description: "Any troubleshooting steps or procedures" }
        }
      }
    });

    let manual_text = null;
    let error_codes = null;
    let troubleshooting_steps = null;

    if (extractResult.status === 'success' && extractResult.output) {
      manual_text = extractResult.output.full_text || null;
      error_codes = extractResult.output.error_codes || null;
      troubleshooting_steps = extractResult.output.troubleshooting || null;
    }

    // Step 2: Generate AI summary
    let summary = null;
    if (manual_text) {
      summary = await base44.integrations.Core.InvokeLLM({
        prompt: `Summarise this equipment manual in 2-3 sentences. Focus on: what equipment it covers, key maintenance topics, and any critical safety points.\n\nMANUAL TEXT:\n${manual_text.slice(0, 8000)}`,
      });
    }

    // Step 3: Update the manual record
    await base44.entities.Manual.update(manual_id, {
      manual_text,
      error_codes,
      troubleshooting_steps,
      summary,
      extracted_parts_status: extract_parts ? 'processing' : 'none'
    });

    // Step 4: Optionally extract parts
    let parts_extracted = 0;
    if (extract_parts && manual_text) {
      const partsResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are extracting parts data from a technical equipment manual. 
Extract ALL part numbers and components mentioned. For each part, provide as much detail as the manual gives.
Return only parts that have a clear part number or component identifier.

MANUAL: ${manual.title} (${manual.equipment_manufacturer} ${manual.equipment_model})
VERSION: ${manual.version || 'N/A'}

MANUAL TEXT:
${manual_text.slice(0, 12000)}`,
        response_json_schema: {
          type: "object",
          properties: {
            parts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  part_number: { type: "string" },
                  description: { type: "string" },
                  component_type: { type: "string" },
                  system_area: { type: "string" },
                  what_it_does: { type: "string" },
                  installation_step_1: { type: "string" },
                  installation_step_2: { type: "string" },
                  installation_step_3: { type: "string" },
                  safety_warning: { type: "string" },
                  variant_spec: { type: "string" }
                },
                required: ["part_number", "description"]
              }
            }
          }
        }
      });

      if (partsResult?.parts?.length > 0) {
        for (const part of partsResult.parts) {
          // Check if part number already exists
          const existing = await base44.entities.Part.filter({ part_number: part.part_number });
          if (!existing || existing.length === 0) {
            await base44.entities.Part.create({
              ...part,
              brand: manual.equipment_manufacturer,
              pump_model: manual.equipment_model,
            });
            parts_extracted++;
          }
        }
      }

      await base44.entities.Manual.update(manual_id, { extracted_parts_status: 'done' });
    }

    return Response.json({
      success: true,
      manual_text_length: manual_text?.length || 0,
      parts_extracted,
      has_error_codes: !!error_codes,
      has_troubleshooting: !!troubleshooting_steps,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});