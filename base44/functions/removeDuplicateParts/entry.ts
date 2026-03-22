import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get batch size from query param (default 50)
    const url = new URL(req.url);
    const batchNum = parseInt(url.searchParams.get('batch') || '0');
    const batchSize = 50;

    // Fetch all parts
    const parts = await base44.asServiceRole.entities.Part.list();
    
    // Group by part_number and keep track of first occurrence
    const seen = {};
    const toDelete = [];

    parts.forEach(part => {
      if (!seen[part.part_number]) {
        seen[part.part_number] = part.id;
      } else {
        toDelete.push(part.id);
      }
    });

    const startIdx = batchNum * batchSize;
    const endIdx = Math.min(startIdx + batchSize, toDelete.length);
    const batch = toDelete.slice(startIdx, endIdx);

    let deleted = 0;
    for (const id of batch) {
      try {
        await base44.asServiceRole.entities.Part.delete(id);
        deleted++;
      } catch (e) {
        console.error(`Failed to delete ${id}:`, e.message);
      }
    }

    const isComplete = endIdx >= toDelete.length;

    return Response.json({
      success: true,
      batch_deleted: deleted,
      batch_num: batchNum,
      total_to_delete: toDelete.length,
      processed_so_far: endIdx,
      is_complete: isComplete,
      remaining_parts: parts.length - endIdx,
      message: isComplete 
        ? `Complete! Removed ${toDelete.length} duplicates. ${parts.length - toDelete.length} unique parts remain.`
        : `Batch ${batchNum + 1} complete. ${toDelete.length - endIdx} duplicates remaining.`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});