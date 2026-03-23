import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { parent_folder_id, folder_name, brand } = await req.json();
    if (!parent_folder_id || !folder_name) {
      return Response.json({ error: 'Missing parent_folder_id or folder_name' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // Create folder in Drive
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: folder_name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parent_folder_id]
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: 'Drive folder creation failed: ' + err }, { status: 500 });
    }

    const driveFolder = await res.json();

    // Save to ManualFolder entity
    const manualFolder = await base44.asServiceRole.entities.ManualFolder.create({
      name: folder_name,
      brand: brand || '',
      folder_type: 'model',
      drive_folder_id: driveFolder.id,
      manual_count: 0
    });

    return Response.json({ success: true, drive_folder_id: driveFolder.id, manual_folder_id: manualFolder.id, name: folder_name });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});