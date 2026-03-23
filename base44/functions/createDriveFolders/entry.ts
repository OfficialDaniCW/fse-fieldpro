import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const BRAND_STRUCTURE = {
  "Gilbarco":    ["SK700_Series", "Euroline", "FuelPOS", "Encore"],
  "Tokheim":     ["Quantium_Series", "Payment_Terminals", "Legacy"],
  "Wayne":       ["Helix_Series", "Global_Star", "Legacy"],
  "GVR":         ["Tank_Gauges", "Sensors"],
  "Elaflex":     ["Nozzles", "Couplings"],
  "POS_Systems": [],
  "CCTV_Security": [],
  "Other":       ["Pumptronics", "Hytek", "Dunclare", "Scheidt_Bachman"]
};

async function createFolder(name, parentId, accessToken) {
  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : []
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Failed to create folder "${name}": ${JSON.stringify(data)}`);
  return data.id;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // Create root folder
    const rootId = await createFolder('FSE_FieldPro_Manuals', null, accessToken);
    let foldersCreated = 1;

    // Get existing ManualFolder records to update with drive_folder_id
    const existingFolders = await base44.asServiceRole.entities.ManualFolder.list();

    for (const [brand, models] of Object.entries(BRAND_STRUCTURE)) {
      // Create brand folder
      const brandFolderId = await createFolder(brand, rootId, accessToken);
      foldersCreated++;

      // Update matching ManualFolder record
      const brandRecord = existingFolders.find(f => f.brand === brand && !f.parent_folder_id);
      if (brandRecord) {
        await base44.asServiceRole.entities.ManualFolder.update(brandRecord.id, { drive_folder_id: brandFolderId });
      }

      // Create model subfolders
      for (const model of models) {
        const modelFolderId = await createFolder(model, brandFolderId, accessToken);
        foldersCreated++;

        // Create images subfolder with diagrams and components inside
        const imagesFolderId = await createFolder('images', modelFolderId, accessToken);
        await createFolder('diagrams', imagesFolderId, accessToken);
        await createFolder('components', imagesFolderId, accessToken);
        foldersCreated += 3;

        // Update matching ManualFolder record
        const modelRecord = existingFolders.find(f =>
          f.name.toLowerCase().includes(model.toLowerCase().replace(/_/g, ' ')) ||
          model.toLowerCase().replace(/_/g, ' ').includes(f.name.toLowerCase())
        );
        if (modelRecord) {
          await base44.asServiceRole.entities.ManualFolder.update(modelRecord.id, { drive_folder_id: modelFolderId });
        }
      }
    }

    // Update or create CrawlStatus record
    const statusList = await base44.asServiceRole.entities.CrawlStatus.list();
    const statusData = {
      drive_folder_id: rootId,
      drive_folder_name: 'FSE_FieldPro_Manuals',
      folders_created: true,
      status: 'idle'
    };

    if (statusList.length > 0) {
      await base44.asServiceRole.entities.CrawlStatus.update(statusList[0].id, statusData);
    } else {
      await base44.asServiceRole.entities.CrawlStatus.create({
        ...statusData,
        crawl_enabled: false,
        total_files_imported: 0,
        webhook_registered: false
      });
    }

    return Response.json({
      success: true,
      folders_created: foldersCreated,
      root_folder_id: rootId,
      message: 'Folders ready in Google Drive',
      drive_link: `https://drive.google.com/drive/folders/${rootId}`
    });
  } catch (error) {
    console.error('createDriveFolders error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});