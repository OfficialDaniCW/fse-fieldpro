import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { manual_id, extract_parts, extract_diagrams } = await req.json();

    if (!manual_id) {
      return Response.json({ error: 'manual_id required' }, { status: 400 });
    }

    // Fetch the manual record by listing and finding
    const allManuals = await base44.entities.Manual.list();
    const manual = allManuals.find(m => m.id === manual_id);
    if (!manual) {
      return Response.json({ error: 'Manual not found' }, { status: 404 });
    }

    if (!manual.pdf_file) {
      return Response.json({ error: 'Manual has no PDF file' }, { status: 400 });
    }

    // Step 1: Extract full text from PDF using LLM vision (same approach as extractPdfText)
    const manual_text = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract ALL text content from this PDF document. Include everything: headings, body text, tables, error codes, part numbers, specifications, procedures, warnings, safety notes. Format with proper line breaks. Do not summarise - extract the full text verbatim as it appears in the document.`,
      file_urls: [manual.pdf_file],
    });

    // Step 2: Extract structured error codes and troubleshooting from the text
    let error_codes = null;
    let troubleshooting_steps = null;

    if (manual_text && manual_text.length > 100) {
      const structured = await base44.integrations.Core.InvokeLLM({
        prompt: `From the following equipment manual text, extract:
1. All error codes and fault codes with their meanings and recommended actions (format each as "CODE: description")
2. All troubleshooting procedures and diagnostic steps (format as numbered steps)

If none exist, return empty strings.

MANUAL TEXT:
${manual_text.slice(0, 10000)}`,
        response_json_schema: {
          type: "object",
          properties: {
            error_codes: { type: "string", description: "Error codes with descriptions, one per line" },
            troubleshooting_steps: { type: "string", description: "Troubleshooting procedures as numbered steps" }
          }
        }
      });

      error_codes = structured?.error_codes || null;
      troubleshooting_steps = structured?.troubleshooting_steps || null;
    }

    // Step 3: Generate AI summary
    let summary = null;
    if (manual_text) {
      summary = await base44.integrations.Core.InvokeLLM({
        prompt: `Summarise this equipment manual in 2-3 sentences. Cover: what equipment it's for, key maintenance/installation topics, and any critical safety points.\n\nMANUAL TEXT:\n${manual_text.slice(0, 6000)}`,
      });
    }

    // Step 4: Extract diagrams if enabled (only for complex equipment)
    let diagram_url = null;
    if (extract_diagrams && manual.pdf_file) {
      try {
        const diagramResult = await base44.integrations.Core.InvokeLLM({
          model: 'gemini_3_pro',
          prompt: `This is a technical manual for ${manual.equipment_manufacturer} ${manual.equipment_model}. 
    Analyze the PDF and identify if there is an exploded view diagram, assembly diagram, or parts diagram that shows the internal structure and components.
    Return: 1) "has_diagram": true/false, 2) "page_numbers": estimated page numbers where diagrams appear, 3) "description": brief description of what the diagram shows.`,
          file_urls: [manual.pdf_file],
          response_json_schema: {
            type: "object",
            properties: {
              has_diagram: { type: "boolean" },
              page_numbers: { type: "string" },
              description: { type: "string" }
            }
          }
        });

        if (diagramResult?.has_diagram) {
          // Note: In production, you'd extract the actual image from the PDF
          // For now, we mark it as detected so admin can manually extract if needed
          diagram_url = "pending_extraction";
        }
      } catch (e) {
        console.log("Diagram extraction skipped:", e.message);
      }
    }

    // Step 5: Update manual record with extracted content
    await base44.entities.Manual.update(manual_id, {
      manual_text: manual_text || null,
      error_codes,
      troubleshooting_steps,
      summary,
      exploded_view_image_url: diagram_url,
      extracted_parts_status: extract_parts ? 'processing' : 'none'
    });

    // Step 6: Optionally extract parts from manual
    let parts_extracted = 0;
    if (extract_parts && manual_text) {
      const partsResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are extracting spare parts data from a technical equipment manual.
Extract ALL part numbers, components, and assemblies mentioned that have an identifiable part number or reference code.
For each part, extract as much detail as the manual provides.
Only include items with a clear part number or alphanumeric reference code.

MANUAL: ${manual.title} (${manual.equipment_manufacturer} ${manual.equipment_model}) ${manual.version ? `v${manual.version}` : ''}

MANUAL TEXT:
${manual_text.slice(0, 14000)}`,
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
          const existing = await base44.entities.Part.filter({ part_number: part.part_number });
          if (!existing || existing.length === 0) {
            await base44.entities.Part.create({
              ...part,
              brand: manual.equipment_manufacturer,
              pump_model: manual.equipment_model,
              source_manual_id: manual_id
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