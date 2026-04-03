import { NextResponse } from 'next/server';

type NewsItem = {
  title: string;
  link: string;
  source: 'Bloomberg' | 'Yahoo Finance';
  published?: string;
};

const MAX_ITEMS = 20;

const feeds = [
  { source: 'Bloomberg' as const, url: 'https://feeds.bloomberg.com/markets/news.rss' },
  { source: 'Yahoo Finance' as const, url: 'https://finance.yahoo.com/news/rssindex' },
];

const getTag = (content: string, tag: string) => {
  const tagMatch = content.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return tagMatch?.[1]?.trim() ?? '';
};

const decodeXml = (value: string) =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");

async function readFeed(url: string, source: NewsItem['source']): Promise<NewsItem[]> {
  const response = await fetch(url, {
    next: { revalidate: 900 },
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'application/rss+xml, application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    return [];
  }

  const xml = await response.text();
  const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);

  return itemBlocks
    .map((block) => ({
      source,
      title: decodeXml(getTag(block, 'title')),
      link: decodeXml(getTag(block, 'link')),
      published: decodeXml(getTag(block, 'pubDate')),
    }))
    .filter((item) => item.title && item.link);
}

export async function GET() {
  try {
    const data = await Promise.all(feeds.map((feed) => readFeed(feed.url, feed.source)));

    const merged = data
      .flat()
      .sort((a, b) => {
        const left = a.published ? Date.parse(a.published) : 0;
        const right = b.published ? Date.parse(b.published) : 0;
        return right - left;
      })
      .slice(0, MAX_ITEMS);

    return NextResponse.json({ items: merged });
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
