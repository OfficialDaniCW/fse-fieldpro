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
    
    // Group by part_number
    const grouped = {};
    parts.forEach(part => {
      if (!grouped[part.part_number]) {
        grouped[part.part_number] = [];
      }
      grouped[part.part_number].push(part.id);
    });

    // Find duplicates
    const duplicates = Object.entries(grouped)
      .filter(([_, ids]) => ids.length > 1)
      .map(([part_number, ids]) => ({
        part_number,
        count: ids.length,
        ids
      }));

    const totalDuplicateRecords = duplicates.reduce((sum, d) => sum + d.count, 0);
    const uniquePartNumbers = Object.keys(grouped).length;

    return Response.json({
      total_parts: parts.length,
      unique_part_numbers: uniquePartNumbers,
      duplicate_count: duplicates.length,
      total_duplicate_records: totalDuplicateRecords,
      duplicates: duplicates.slice(0, 20) // Show first 20
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});