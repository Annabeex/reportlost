// lib/getRedditPosts.ts

export async function getRedditPosts(citySlug: string) {
  const url = `https://www.reddit.com/r/${citySlug}/search.json?q=lost%20OR%20found&restrict_sr=1&sort=new`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LostItemBot/1.0' },
      next: { revalidate: 3600 }, // 1h de cache
    });

    if (!res.ok) throw new Error(`Failed to fetch Reddit posts: ${res.statusText}`);

    const json = await res.json();
    const posts = json.data?.children || [];

    return posts.slice(0, 5).map((p: any) => ({
      id: p.data.id,
      title: p.data.title,
      url: `https://www.reddit.com${p.data.permalink}`,
    }));
  } catch (err) {
    console.error('Reddit API error:', err);
    return [];
  }
}
