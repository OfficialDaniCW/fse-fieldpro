import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data, old_data } = body;
    const user = await base44.auth.me();

    // Determine what changed for update events
    let changes = null;
    if (event.type === 'update' && old_data && data) {
      changes = {};
      for (const key in data) {
        if (old_data[key] !== data[key]) {
          changes[key] = { from: old_data[key], to: data[key] };
        }
      }
    }

    // Log the activity
    await base44.asServiceRole.entities.ActivityLog.create({
      entity_type: event.entity_name,
      entity_id: event.entity_id,
      action: event.type,
      user_email: user?.email || 'unknown',
      changes: changes || null,
      timestamp: new Date().toISOString(),
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});