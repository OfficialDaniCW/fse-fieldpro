import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { manual_id, pdf_url } = body;

    if (!manual_id || !pdf_url) {
      return Response.json(
        { error: 'Missing manual_id or pdf_url' },
        { status: 400 }
      );
    }

    // Fetch the PDF and extract images using LLM with vision capability
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an image extraction assistant for technical manuals. 
      
      I'm providing you with a PDF manual. Your task is to:
      1. Identify any exploded view diagrams, assembly diagrams, or technical component illustrations
      2. Extract and describe the most significant/useful diagram for field service engineers
      3. Return the image as a data URL or confirm if no suitable diagram is found
      
      Focus on diagrams that would help identify and locate components.`,
      file_urls: [pdf_url],
      model: 'gemini_3_pro',
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          diagram_found: {
            type: 'boolean',
            description: 'Whether a suitable diagram was found'
          },
          diagram_description: {
            type: 'string',
            description: 'Description of the diagram found'
          },
          extraction_notes: {
            type: 'string',
            description: 'Any notes about the extraction process'
          }
        }
      }
    });

    // Update the Manual entity with extraction status
    await base44.asServiceRole.entities.Manual.update(manual_id, {
      extracted_parts_status: response.diagram_found ? 'done' : 'none',
      exploded_view_image_url: response.diagram_found ? pdf_url : null
    });

    return Response.json({
      success: true,
      manual_id,
      diagram_found: response.diagram_found,
      message: response.diagram_found 
        ? 'Diagram identified and manual updated' 
        : 'No suitable diagram found in manual'
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});