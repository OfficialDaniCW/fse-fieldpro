import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { folder_id, filename, file_content_base64, mime_type } = await req.json();
    if (!folder_id || !filename || !file_content_base64) {
      return Response.json({ error: 'Missing folder_id, filename, or file_content_base64' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // Decode base64 to binary
    const binaryStr = atob(file_content_base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const fileMime = mime_type || 'application/json';

    // Use multipart upload
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    const metadata = JSON.stringify({ name: filename, parents: [folder_id] });
    const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`;
    const filePart = `--${boundary}\r\nContent-Type: ${fileMime}\r\n\r\n`;
    const closing = `\r\n--${boundary}--`;

    const metaBytes = new TextEncoder().encode(metaPart);
    const filePartBytes = new TextEncoder().encode(filePart);
    const closingBytes = new TextEncoder().encode(closing);

    const body = new Uint8Array(metaBytes.length + filePartBytes.length + bytes.length + closingBytes.length);
    body.set(metaBytes, 0);
    body.set(filePartBytes, metaBytes.length);
    body.set(bytes, metaBytes.length + filePartBytes.length);
    body.set(closingBytes, metaBytes.length + filePartBytes.length + bytes.length);

    const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return Response.json({ error: 'Drive upload failed: ' + errText }, { status: 500 });
    }

    const uploaded = await uploadRes.json();
    return Response.json({ success: true, file_id: uploaded.id, name: uploaded.name });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});