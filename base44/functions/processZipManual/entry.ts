import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import JSZip from 'npm:jszip@3.10.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const formData = await req.formData();
    const zipFile = formData.get('file');

    if (!zipFile) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const zipBuffer = await zipFile.arrayBuffer();
    const zip = new JSZip();
    await zip.loadAsync(zipBuffer);

    // Find and parse the JSON metadata file
    let jsonFile = null;
    let jsonData = null;

    for (const [filename, file] of Object.entries(zip.files)) {
      if (filename.endsWith('.json') && !filename.startsWith('__MACOSX')) {
        const content = await file.async('text');
        jsonData = JSON.parse(content);
        jsonFile = filename;
        break;
      }
    }

    if (!jsonData) {
      return Response.json({ error: 'No JSON metadata file found in zip' }, { status: 400 });
    }

    // Extract and upload images
    const pageImages = [];
    const imageUrls = {};

    for (const [filename, file] of Object.entries(zip.files)) {
      if (filename.match(/\.png$/i) && !filename.startsWith('__MACOSX')) {
        // Extract image metadata from filename
        const match = filename.match(/p(\d+)_img(\d+)\.png/i);
        const pageNum = match ? parseInt(match[1]) : null;
        const imgNum = match ? parseInt(match[2]) : null;

        const buffer = await file.async('arraybuffer');
        const blob = new Blob([buffer], { type: 'image/png' });

        // Upload image using Base44 integration
        const uploadRes = await base44.integrations.Core.UploadFile({
          file: blob
        });

        pageImages.push({
          filename: filename.split('/').pop(),
          page_number: pageNum,
          image_url: uploadRes.file_url,
          width_px: null,
          height_px: null
        });

        imageUrls[filename] = uploadRes.file_url;
      }
    }

    // Map JSON data to Manual entity
    const models = jsonData.models_covered?.join(', ') || 'Unknown';
    const manualText = jsonData.sections
      ?.map(s => `${s.title}\n${s.content}`)
      .join('\n\n') || '';

    const tableOfContents = jsonData.sections
      ?.map(s => s.title)
      .join(' | ') || '';

    const manualRecord = {
      title: jsonData.title,
      manufacturer: jsonData.manufacturer,
      model: models,
      manual_type: jsonData.manual_type || 'Technical Manual',
      summary: jsonData.summary,
      source_url: jsonData.source_url,
      manual_text: manualText,
      table_of_contents: tableOfContents,
      error_codes: jsonData.error_codes?.join(' | ') || '',
      component_type: jsonData.component_type || 'Other',
      brand_category: jsonData.brand_category || 'Other',
      page_images: JSON.stringify(pageImages),
      processing_status: 'complete'
    };

    // Create manual record
    const createdManual = await base44.entities.Manual.create(manualRecord);

    return Response.json({
      success: true,
      manual_id: createdManual.id,
      images_uploaded: pageImages.length,
      manual: {
        title: createdManual.title,
        manufacturer: createdManual.manufacturer,
        model: createdManual.model
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error processing zip:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});