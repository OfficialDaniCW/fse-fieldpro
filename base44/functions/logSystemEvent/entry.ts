import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { level, category, message, data, timestamp } = body;

    // Create activity log entry
    await base44.entities.ActivityLog.create({
      entity_type: 'SystemLog',
      entity_id: `${category}-${timestamp}`,
      action: level,
      user_email: user.email,
      changes: {
        level,
        category,
        message,
        data: data ? JSON.parse(data) : {}
      },
      timestamp: new Date(timestamp)
    });

    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error logging event:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});