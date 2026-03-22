import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const wikis = [
      {
        title: '',
        manufacturer: '',
        model: '',
        manual_type: '',
        summary: '',
        manual_text: '',
        error_codes: '',
        component_type: '',
        extract_diagrams: false
      },
      {
        title: '',
        manufacturer: '',
        model: '',
        manual_type: '',
        summary: '',
        manual_text: '',
        error_codes: '',
        component_type: '',
        extract_diagrams: false
      },
      {
        title: '',
        manufacturer: '',
        model: '',
        manual_type: '',
        summary: '',
        manual_text: '',
        error_codes: '',
        component_type: '',
        extract_diagrams: false
      },
      {
        title: '',
        manufacturer: '',
        model: '',
        manual_type: '',
        summary: '',
        manual_text: '',
        error_codes: '',
        component_type: '',
        extract_diagrams: false
      },
      {
        title: '',
        manufacturer: '',
        model: '',
        manual_type: '',
        summary: '',
        manual_text: '',
        error_codes: '',
        component_type: '',
        extract_diagrams: false
      }
    ];

    // Create all 5 wiki records
    const results = await base44.asServiceRole.entities.Manual.bulkCreate(wikis);

    return Response.json({
      success: true,
      message: '5 empty wiki records created',
      count: results.length,
      records: results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});