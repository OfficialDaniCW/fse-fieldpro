import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    console.log('[STAGING] Processing started by user:', user?.email);

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const stagingId = body.staging_id;

    if (!stagingId) {
      return Response.json({ error: 'No staging_id provided' }, { status: 400 });
    }

    // Fetch staging upload record
    console.log('[STAGING] Fetching staging record:', stagingId);
    const staging = await base44.entities.StagingUpload.get(stagingId);

    if (!staging) {
      return Response.json({ error: 'Staging record not found' }, { status: 404 });
    }

    // Update status to processing
    await base44.entities.StagingUpload.update(stagingId, { status: 'processing' });

    // Fetch and parse JSON file
    console.log('[STAGING] Fetching JSON data from:', staging.json_file_url);
    const jsonResponse = await fetch(staging.json_file_url);
    const jsonData = await jsonResponse.json();

    console.log('[STAGING] Parsed manual data:', {
      title: jsonData.title,
      manufacturer: jsonData.manufacturer,
      chapters: jsonData.chapters?.length || 0
    });

    // Build manual text and TOC
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

    // Process images - rename with manual reference
    const pageImages = [];
    if (staging.image_urls && staging.image_urls.length > 0) {
      console.log('[STAGING] Processing', staging.image_urls.length, 'images');
      
      staging.image_urls.forEach((img, idx) => {
        const originalName = img.original_name || `image_${idx}`;
        const match = originalName.match(/p(\d+)_img(\d+)/i);
        const pageNum = match ? parseInt(match[1]) : idx + 1;

        pageImages.push({
          filename: `${staging.manual_title.replace(/\s+/g, '_')}_img_${idx + 1}`,
          page_number: pageNum,
          image_url: img.url,
          original_name: originalName,
          width_px: null,
          height_px: null
        });
      });
    }

    console.log('[STAGING] Processed', pageImages.length, 'images');

    // Create manual record
    const manualRecord = {
      title: jsonData.title,
      manufacturer: jsonData.manufacturer,
      model: models,
      manual_type: jsonData.manual_type || 'Technical Manual',
      summary: jsonData.summary,
      source_url: jsonData.source_url,
      pdf_file: staging.pdf_url || jsonData.pdf_url || null,
      manual_text: manualText,
      table_of_contents: tableOfContents,
      error_codes: errorCodes,
      component_type: jsonData.component_type || 'Other',
      brand_category: jsonData.brand_category || 'Other',
      page_images: JSON.stringify(pageImages),
      processing_status: 'complete',
      version: jsonData.version || '1.0'
    };

    console.log('[STAGING] Creating manual record...');
    const createdManual = await base44.entities.Manual.create(manualRecord);
    console.log('[STAGING] Manual created:', createdManual.id);

    // Update staging record with manual_id and mark complete
    await base44.entities.StagingUpload.update(stagingId, {
      manual_id: createdManual.id,
      status: 'complete'
    });

    return Response.json({
      success: true,
      manual_id: createdManual.id,
      images_processed: pageImages.length,
      manual: {
        title: createdManual.title,
        manufacturer: createdManual.manufacturer,
        model: createdManual.model
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[STAGING] Error processing:', error);

    // Update staging with error if we have the ID
    try {
      const body = await req.json();
      if (body.staging_id) {
        await base44.entities.StagingUpload.update(body.staging_id, {
          status: 'failed',
          error_message: error.message
        });
      }
    } catch (e) {
      // Silent fail on update
    }

    return Response.json({ error: error.message }, { status: 500 });
  }
});