import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

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

    // Delete in batches of 5 with delays
    let deleted = 0;
    const batchSize = 5;
    
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize);
      
      for (const id of batch) {
        try {
          await base44.asServiceRole.entities.Part.delete(id);
          deleted++;
        } catch (e) {
          console.error(`Failed to delete ${id}:`, e.message);
        }
      }
      
      // Wait 1 second between batches
      if (i + batchSize < toDelete.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return Response.json({
      success: true,
      total_deleted: deleted,
      remaining_parts: parts.length - deleted,
      message: `Removed ${deleted} duplicate parts. ${parts.length - deleted} unique parts remain.`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});