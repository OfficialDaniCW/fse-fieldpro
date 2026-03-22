import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Fetch all manuals with pending extraction status
    const pendingManuals = await base44.asServiceRole.entities.Manual.filter({ extracted_parts_status: 'pending' });
    
    if (pendingManuals.length === 0) {
      return Response.json({ success: true, processed: 0 });
    }

    let processedCount = 0;

    // Process each pending manual
    for (const manual of pendingManuals) {
      try {
        // Mark as processing
        await base44.asServiceRole.entities.Manual.update(manual.id, {
          extracted_parts_status: 'processing'
        });

        // Call the extraction function
        const response = await base44.asServiceRole.functions.invoke('bulkProcessManual', {
          manual_id: manual.id,
          extract_parts: true
        });

        if (response.data?.success) {
          processedCount++;
        } else {
          // Mark as failed / revert to pending for retry
          await base44.asServiceRole.entities.Manual.update(manual.id, {
            extracted_parts_status: 'pending'
          });
        }
      } catch (err) {
        // Log error and revert status
        console.error(`Error processing manual ${manual.id}:`, err.message);
        await base44.asServiceRole.entities.Manual.update(manual.id, {
          extracted_parts_status: 'pending'
        });
      }
    }

    return Response.json({
      success: true,
      processed: processedCount,
      total_pending: pendingManuals.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});