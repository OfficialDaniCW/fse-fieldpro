import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const CRAWL_INTERVAL_MINUTES = 5;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use service role — this is called by the scheduler, not a user
    const statusList = await base44.asServiceRole.entities.CrawlStatus.list();
    if (statusList.length === 0) return Response.json({ status: 'no_config' });

    const crawlStatus = statusList[0];

    if (!crawlStatus.crawl_enabled) {
      return Response.json({ status: 'disabled' });
    }

    if (crawlStatus.status === 'running') {
      return Response.json({ status: 'already_running' });
    }

    // Check if enough time has passed since last crawl
    if (crawlStatus.last_sync_time) {
      const lastCrawl = new Date(crawlStatus.last_sync_time).getTime();
      const elapsed = (Date.now() - lastCrawl) / 1000 / 60; // minutes
      if (elapsed < CRAWL_INTERVAL_MINUTES) {
        return Response.json({ status: 'too_soon', next_in_minutes: Math.ceil(CRAWL_INTERVAL_MINUTES - elapsed) });
      }
    }

    // Invoke the crawler
    const result = await base44.asServiceRole.functions.invoke('driveManualCrawler', {});
    return Response.json({ status: 'invoked', result });

  } catch (error) {
    console.error('processManualQueue error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});