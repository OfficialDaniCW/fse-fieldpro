import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { manual_id } = await req.json();

    if (!manual_id) {
      return Response.json({ error: 'manual_id required' }, { status: 400 });
    }

    // Set processing status to processing
    await base44.asServiceRole.entities.Manual.update(manual_id, {
      processing_status: 'processing'
    });

    // BUG FIX 4: Trigger bulkProcessManual immediately and synchronously (not queued)
    // This ensures the manual is processed right away
    let result;
    try {
      result = await base44.asServiceRole.functions.invoke('bulkProcessManual', { manual_id });
    } catch (e) {
      console.log('Error during processing:', e.message);
      // Update status to failed if processing fails
      await base44.asServiceRole.entities.Manual.update(manual_id, {
        processing_status: 'failed',
        processing_error: `Processing error: ${e.message}`
      });
      throw e;
    }

    return Response.json({
      success: true,
      manual_id,
      message: 'Manual processed successfully',
      processingResult: result
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});