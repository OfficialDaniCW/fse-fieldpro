import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const BATCH_SIZE = 20;

async function listFilesInFolder(folderId, accessToken) {
  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,parents,mimeType)&pageSize=1000`;
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
  const data = await res.json();
  return data.files || [];
}

async function listAllFilesRecursive(folderId, accessToken) {
  const allFiles = [];
  const queue = [{ id: folderId, path: '' }];

  while (queue.length > 0) {
    const { id, path } = queue.shift();
    const children = await listFilesInFolder(id, accessToken);
    for (const child of children) {
      const childPath = path ? `${path}/${child.name}` : child.name;
      if (child.mimeType === 'application/vnd.google-apps.folder') {
        queue.push({ id: child.id, path: childPath });
      } else {
        allFiles.push({ ...child, path: childPath, parentFolderId: id, parentFolderPath: path });
      }
    }
  }
  return allFiles;
}

async function downloadFile(fileId, accessToken) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error(`Failed to download file ${fileId}`);
  return await res.text();
}

async function getFileDownloadUrl(fileId, accessToken) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=webContentLink`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await res.json();
  return data.webContentLink || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // STEP 1 — Check if enabled
    const statusList = await base44.asServiceRole.entities.CrawlStatus.list();
    if (statusList.length === 0) {
      return Response.json({ error: 'CrawlStatus not configured. Run createDriveFolders first.' }, { status: 400 });
    }
    const crawlStatus = statusList[0];

    if (!crawlStatus.crawl_enabled) {
      return Response.json({ status: 'disabled', message: 'Crawler is disabled' });
    }
    if (crawlStatus.status === 'running') {
      return Response.json({ status: 'running', message: 'Crawl already in progress' });
    }
    if (!crawlStatus.drive_folder_id) {
      return Response.json({ error: 'No drive_folder_id set in CrawlStatus' }, { status: 400 });
    }

    // Mark as running
    await base44.asServiceRole.entities.CrawlStatus.update(crawlStatus.id, { status: 'running', last_error: null });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // STEP 2 — Get already-imported drive file IDs
    const allManuals = await base44.asServiceRole.entities.Manual.list('-created_date', 10000);
    const importedIds = new Set(allManuals.filter(m => m.drive_file_id).map(m => m.drive_file_id));

    // STEP 3 — List all files recursively, filter to manual_data.json not yet imported
    const allFiles = await listAllFilesRecursive(crawlStatus.drive_folder_id, accessToken);
    const pending = allFiles.filter(f => f.name === 'manual_data.json' && !importedIds.has(f.id));

    // STEP 4 — If nothing pending, mark complete
    if (pending.length === 0) {
      await base44.asServiceRole.entities.CrawlStatus.update(crawlStatus.id, {
        status: 'complete',
        crawl_enabled: false,
        last_sync_time: new Date().toISOString()
      });
      return Response.json({ processed: 0, remaining: 0, status: 'complete', message: 'All manuals imported' });
    }

    // STEP 5 — Process batch
    const batch = pending.slice(0, BATCH_SIZE);
    const manualFolders = await base44.asServiceRole.entities.ManualFolder.list();
    const imported = [];

    for (const file of batch) {
      try {
        // Download and parse JSON
        const rawText = await downloadFile(file.id, accessToken);
        const jsonData = JSON.parse(rawText);

        // Determine folder assignment from path (e.g. "Gilbarco/SK700_Series/manual_data.json")
        const pathParts = file.parentFolderPath ? file.parentFolderPath.split('/') : [];
        const brand = pathParts[0] || null;
        const modelName = pathParts[1] || null;

        let folderId = null;
        if (brand && modelName) {
          let matchedFolder = manualFolders.find(f =>
            f.brand === brand &&
            f.name.toLowerCase().replace(/\s+/g, '_') === modelName.toLowerCase()
          );
          if (!matchedFolder) {
            // Create a new ManualFolder for unrecognised paths
            matchedFolder = await base44.asServiceRole.entities.ManualFolder.create({
              name: modelName.replace(/_/g, ' '),
              brand,
              folder_type: 'model'
            });
          }
          folderId = matchedFolder.id;
        }

        // Format error_codes as pipe-separated
        const errorCodes = (jsonData.error_codes || [])
          .map(e => typeof e === 'object' ? `${e.code || ''}: ${e.description || e.meaning || ''} | Cause: ${e.cause || ''} | Action: ${e.action || ''}` : String(e))
          .join(' || ');

        // Format table of contents
        const tableOfContents = (jsonData.chapters || jsonData.sections || [])
          .map(ch => ch.title || ch.name || '')
          .filter(Boolean)
          .join(' | ');

        // Build manual text from chapters
        const manualText = (jsonData.chapters || jsonData.sections || [])
          .map(ch => `${ch.title || ''}\n${ch.full_text || ch.content || ''}`)
          .join('\n\n');

        // Look for a PDF in the same folder
        const siblingFiles = await listFilesInFolder(file.parentFolderId, accessToken);
        const pdfFile = siblingFiles.find(f => f.name.endsWith('.pdf'));
        const pdfUrl = pdfFile ? await getFileDownloadUrl(pdfFile.id, accessToken) : null;

        // Look for first diagram image
        const imagesFolder = siblingFiles.find(f => f.name === 'images' && f.mimeType === 'application/vnd.google-apps.folder');
        let explodedViewUrl = null;
        if (imagesFolder) {
          const imageSubfolders = await listFilesInFolder(imagesFolder.id, accessToken);
          const diagramsFolder = imageSubfolders.find(f => f.name === 'diagrams' && f.mimeType === 'application/vnd.google-apps.folder');
          if (diagramsFolder) {
            const diagrams = await listFilesInFolder(diagramsFolder.id, accessToken);
            const firstImg = diagrams.find(f => f.mimeType?.startsWith('image/'));
            if (firstImg) explodedViewUrl = await getFileDownloadUrl(firstImg.id, accessToken);
          }
        }

        // Create Manual record
        const manual = await base44.asServiceRole.entities.Manual.create({
          title: jsonData.title || `${brand} ${modelName}`,
          manufacturer: jsonData.manufacturer || brand || '',
          model: Array.isArray(jsonData.models_covered) ? jsonData.models_covered.join(', ') : (jsonData.model || modelName || ''),
          manual_type: jsonData.manual_type || 'Technical Manual',
          brand_category: jsonData.brand_category || brand || 'Other',
          component_type: jsonData.component_type || 'Other',
          summary: jsonData.summary || '',
          manual_text: manualText,
          table_of_contents: tableOfContents,
          error_codes: errorCodes,
          processing_status: 'complete',
          import_source: 'drive_crawler',
          drive_file_id: file.id,
          drive_folder_path: file.parentFolderPath || '',
          folder_id: folderId,
          pdf_url: pdfUrl,
          exploded_view_image_url: explodedViewUrl,
          parts_linked: 0,
          version: jsonData.version || jsonData.issue || ''
        });

        // Link parts
        try {
          const linkResult = await base44.asServiceRole.functions.invoke('linkPartsToManuals', { manual_id: manual.id });
          const partsLinked = linkResult?.parts_linked || 0;
          if (partsLinked > 0) {
            await base44.asServiceRole.entities.Manual.update(manual.id, { parts_linked: partsLinked });
          }
          imported.push({ title: manual.title, parts_linked: partsLinked });
        } catch (linkErr) {
          console.warn('Part linking failed for', manual.title, linkErr.message);
          imported.push({ title: manual.title, parts_linked: 0 });
        }

        // Activity log
        await base44.asServiceRole.entities.ActivityLog.create({
          entity_type: 'Manual',
          entity_id: manual.id,
          action: 'create',
          user_email: user.email,
          changes: { message: `Drive crawler imported: ${manual.title} — ${imported[imported.length - 1].parts_linked} parts linked` },
          timestamp: new Date().toISOString()
        });

      } catch (fileErr) {
        console.error('Failed to process file:', file.path, fileErr.message);
      }
    }

    // STEP 6 — Update CrawlStatus
    const remaining = pending.length - batch.length;
    await base44.asServiceRole.entities.CrawlStatus.update(crawlStatus.id, {
      last_sync_time: new Date().toISOString(),
      total_files_imported: (crawlStatus.total_files_imported || 0) + imported.length,
      status: 'idle'
    });

    // STEP 7 — Return summary
    return Response.json({
      processed: imported.length,
      imported: imported.map(i => i.title),
      remaining,
      next_batch_in: remaining > 0 ? '5 minutes' : null,
      status: remaining === 0 ? 'complete' : 'idle'
    });

  } catch (error) {
    console.error('driveManualCrawler error:', error);

    // Try to reset status on error
    try {
      const base44 = createClientFromRequest(req);
      const statusList = await base44.asServiceRole.entities.CrawlStatus.list();
      if (statusList.length > 0) {
        await base44.asServiceRole.entities.CrawlStatus.update(statusList[0].id, {
          status: 'error',
          last_error: error.message
        });
      }
    } catch (_) { /* ignore */ }

    return Response.json({ error: error.message }, { status: 500 });
  }
});