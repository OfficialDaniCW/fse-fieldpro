import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { manual_id } = await req.json();

    if (!manual_id) {
      return Response.json({ error: 'manual_id required' }, { status: 400 });
    }

    // Set processing status to pending
    await base44.asServiceRole.entities.Manual.update(manual_id, {
      processing_status: 'pending'
    });

    // Queue the manual for processing (non-blocking)
    // In production, this would queue to a job processor
    // For now, trigger bulkProcessManual directly
    try {
      await base44.asServiceRole.functions.invoke('bulkProcessManual', { manual_id });
    } catch (e) {
      console.log('Background processing queued:', manual_id);
    }

    return Response.json({
      success: true,
      manual_id,
      message: 'Manual queued for processing'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});