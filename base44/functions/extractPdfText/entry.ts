import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { pdf_url } = await req.json();
    if (!pdf_url) {
      return Response.json({ error: 'pdf_url is required' }, { status: 400 });
    }

    // Use the LLM to extract text from the PDF
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Extract ALL text content from this PDF document. Include everything: headings, body text, tables, error codes, part numbers, specifications, procedures, warnings. Format it clearly with proper line breaks. Do not summarise - extract the full text verbatim.`,
      file_urls: [pdf_url],
    });

    // Also generate a short summary
    const summary = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Read this PDF document and write a concise 2-3 sentence summary describing: what equipment it covers, what type of content it contains (e.g. error codes, installation, maintenance), and who would use it.`,
      file_urls: [pdf_url],
    });

    return Response.json({ manual_text: result, summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});