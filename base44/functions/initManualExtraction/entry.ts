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

    // Only process if manual has a PDF file
    if (!data?.pdf_file) {
      return Response.json({ skipped: true, reason: 'no_pdf_file' });
    }

    // Set to pending
    await base44.asServiceRole.entities.Manual.update(data.id, {
      processing_status: 'pending'
    });

    // Queue for processing (non-blocking)
    // In production, this would queue to a job processor
    // For now, trigger bulkProcessManual via service role
    try {
      await base44.asServiceRole.functions.invoke('bulkProcessManual', {
        manual_id: data.id
      });
    } catch (e) {
      // Processing error logged but doesn't block manual creation
      console.log('Processing queued with error:', e.message);
      await base44.asServiceRole.entities.Manual.update(data.id, {
        processing_status: 'processing'
      });
    }

    return Response.json({
      success: true,
      manual_id: data.id,
      status: 'queued_for_processing'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});