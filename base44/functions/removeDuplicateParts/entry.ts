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

    // Delete duplicate records
    let deleted = 0;
    for (const id of toDelete) {
      await base44.asServiceRole.entities.Part.delete(id);
      deleted++;
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