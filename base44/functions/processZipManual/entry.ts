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

    const zip = new JSZip();
    await zip.loadAsync(zipFile);

    // Find and parse manual_data.json
    let jsonData = null;
    for (const [filename, file] of Object.entries(zip.files)) {
      if (filename === 'manual_data.json' || filename.endsWith('/manual_data.json')) {
        const content = await file.async('text');
        jsonData = JSON.parse(content);
        break;
      }
    }

    if (!jsonData) {
      return Response.json({ error: 'No manual_data.json found in zip' }, { status: 400 });
    }

    // Extract and upload images from images/ folder
    const pageImages = [];
    for (const [filename, file] of Object.entries(zip.files)) {
      if (filename.startsWith('images/') && filename.match(/\.(png|jpg|jpeg)$/i)) {
        const blob = await file.async('blob');

        const uploadRes = await base44.integrations.Core.UploadFile({
          file: blob
        });

        const cleanFilename = filename.split('/').pop();
        const match = cleanFilename.match(/p(\d+)_img(\d+)/i);
        const pageNum = match ? parseInt(match[1]) : null;

        pageImages.push({
          filename: cleanFilename,
          page_number: pageNum,
          image_url: uploadRes.file_url,
          width_px: null,
          height_px: null
        });
      }
    }

    // Extract and upload PDF from source_pdf/ folder
    let pdfUrl = null;
    for (const [filename, file] of Object.entries(zip.files)) {
      if (filename.startsWith('source_pdf/') && filename.endsWith('.pdf')) {
        const blob = await file.async('blob');

        const uploadRes = await base44.integrations.Core.UploadFile({
          file: blob
        });
        pdfUrl = uploadRes.file_url;
        break;
      }
    }

    // Build manual text from chapters
    const manualText = jsonData.chapters
      ?.map(ch => `${ch.title}\n${ch.full_text || ''}`)
      .join('\n\n') || '';

    const tableOfContents = jsonData.chapters
      ?.map(ch => ch.title)
      .join(' | ') || '';

    const errorCodes = jsonData.chapters
      ?.flatMap(ch => ch.error_codes || [])
      .join(' | ') || '';

    const models = jsonData.models_covered?.join(', ') || 'Unknown';

    const manualRecord = {
      title: jsonData.title,
      manufacturer: jsonData.manufacturer,
      model: models,
      manual_type: 'Technical Manual',
      summary: jsonData.summary,
      source_url: jsonData.source_url,
      pdf_file: pdfUrl,
      manual_text: manualText,
      table_of_contents: tableOfContents,
      error_codes: errorCodes,
      component_type: 'Other',
      brand_category: 'Gilbarco',
      page_images: JSON.stringify(pageImages),
      processing_status: 'complete',
      version: jsonData.issue || '1.0'
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