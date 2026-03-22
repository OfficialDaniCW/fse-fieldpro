import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    // Only process on creation
    if (event?.type !== 'create') {
      return Response.json({ skipped: true, reason: 'not_create_event' });
    }

    // Only mark as pending if the manual has a PDF file
    if (data?.pdf_file) {
      await base44.asServiceRole.entities.Manual.update(data.id, {
        extracted_parts_status: 'pending'
      });

      return Response.json({ success: true, marked_pending: true });
    }

    // No PDF yet, mark as 'none'
    await base44.asServiceRole.entities.Manual.update(data.id, {
      extracted_parts_status: 'none'
    });

    return Response.json({ success: true, marked_none: true });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});