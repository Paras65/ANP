import { Router, Request, Response } from 'express';
import { Article } from '../models/Article.model.js';
import { logger } from '../utils/logger.js';

const router = Router();

// 1. GET /api/rss & /api/rss.xml - RSS 2.0 News Syndication Feed (Google News & Media Standards)
router.get(['/rss', '/rss.xml', '/feed.xml'], async (_req: Request, res: Response) => {
  try {
    res.set({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, stale-while-revalidate=1800'
    });

    const articles = await Article.find({ status: 'PUBLISHED', deletedAt: null })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(35)
      .populate('districtId')
      .populate('categoryId')
      .lean();

    const baseUrl = process.env.FRONTEND_URL 
      || (_req.headers.origin as string) 
      || `${_req.protocol}://${_req.get('host')}`;
    const buildDate = new Date().toUTCString();

    let itemsXml = '';
    for (const art of articles) {
      const artId = (art as any)._id?.toString() || '';
      const title = (art as any).titleHindi || (art as any).title || 'समाचार';
      const summary = (art as any).summaryHindi || (art as any).summary || (art as any).excerpt || '';
      const pubDate = (art as any).publishedAt ? new Date((art as any).publishedAt).toUTCString() : buildDate;
      const district = (art as any).districtId?.nameHindi || (art as any).districtId?.name || 'कवर्धा';
      const category = (art as any).categoryId?.nameHindi || (art as any).categoryId?.name || 'ताज़ा खबर';
      const imageUrl = (art as any).coverImage || `${baseUrl}/logo-512.png`;
      const link = `${baseUrl}/?article=${artId}`;

      itemsXml += `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="false">${artId}</guid>
      <pubDate>${pubDate}</pubDate>
      <category><![CDATA[${category}]]></category>
      <category><![CDATA[${district}]]></category>
      <description><![CDATA[${summary}]]></description>
      ${imageUrl ? `<enclosure url="${imageUrl.replace(/&/g, '&amp;')}" type="image/jpeg" length="0" />` : ''}
    </item>`;
    }

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>एम्बिशन न्यूज़ — कवर्धा (कबीरधाम) • छत्तीसगढ़ एवं मध्यप्रदेश न्यूज़</title>
    <link>${baseUrl}</link>
    <description>कवर्धा (कबीरधाम), छत्तीसगढ़ के 33 और मध्यप्रदेश के 55 जिलों की ताज़ा ब्रेकिंग खबरें, वीडियो बुलेटिन और लाइव मंडी भाव। निष्पक्ष एवं निर्भीक पत्रकारिता।</description>
    <language>hi</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/api/rss" rel="self" type="application/rss+xml" />
    <image>
      <url>${baseUrl}/logo-512.png</url>
      <title>एम्बिशन न्यूज़</title>
      <link>${baseUrl}</link>
    </image>${itemsXml}
  </channel>
</rss>`;

    res.send(rssXml.trim());
  } catch (err: any) {
    logger.error('Failed to generate RSS feed:', err);
    res.status(500).send('<?xml version="1.0"?><error>Failed to generate RSS feed</error>');
  }
});

// 2. GET /api/sitemap-news.xml - Dynamic Google News XML Sitemap for rapid Google indexing
router.get(['/sitemap-news.xml', '/sitemap-news'], async (_req: Request, res: Response) => {
  try {
    res.set({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, stale-while-revalidate=1800'
    });

    // Google News sitemap standard: articles published in the last 48 hours
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentArticles = await Article.find({
      status: 'PUBLISHED',
      deletedAt: null,
      publishedAt: { $gte: twoDaysAgo }
    })
      .sort({ publishedAt: -1 })
      .limit(100)
      .lean();

    const baseUrl = process.env.FRONTEND_URL 
      || (_req.headers.origin as string) 
      || 'https://ambitionnews.init65.co.in';

    let urlsXml = '';
    for (const art of recentArticles) {
      const artId = (art as any)._id?.toString() || '';
      const title = (art as any).titleHindi || (art as any).title || 'समाचार';
      const pubDate = (art as any).publishedAt ? new Date((art as any).publishedAt).toISOString() : new Date().toISOString();
      const imageUrl = (art as any).coverImage;

      urlsXml += `
  <url>
    <loc>${baseUrl}/?article=${artId}</loc>
    <news:news>
      <news:publication>
        <news:name>एम्बिशन न्यूज़</news:name>
        <news:language>hi</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title><![CDATA[${title}]]></news:title>
    </news:news>
    ${imageUrl ? `<image:image><image:loc>${imageUrl.replace(/&/g, '&amp;')}</image:loc></image:image>` : ''}
  </url>`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/videos</loc>
    <changefreq>hourly</changefreq>
    <priority>0.95</priority>
  </url>
  <url>
    <loc>${baseUrl}/mandi</loc>
    <changefreq>hourly</changefreq>
    <priority>0.90</priority>
  </url>${urlsXml}
</urlset>`;

    res.send(xml.trim());
  } catch (err: any) {
    logger.error('Failed to generate news sitemap:', err);
    res.status(500).send('<?xml version="1.0"?><error>Failed to generate news sitemap</error>');
  }
});

export default router;
