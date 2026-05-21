// pages/api/recommend.js

const STREAMING_PROVIDER_IDS = {
  'Netflix': 8,
  'Prime Video': 119,
  'Hotstar': 122,
  'SonyLiv': 237,
  'YouTube': 192,
};

async function getClaudeRecommendations(answers) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are a warm, knowledgeable friend helping someone pick what to watch during a meal. Give smart, specific recommendations — not just popular titles.

User preferences:
- Mood: ${answers.mood}
- Watching with: ${answers.company}
- Time available: ${answers.time}
- Attention level: ${answers.energy}
- Language preference: ${answers.language}
- Streaming service: ${answers.streaming}
- Country: India

Rules:
- Match language preference strictly. If Hindi, suggest Hindi content. If Tamil, suggest Tamil. If "Any language", mix it up.
- Match time: "Under 30 min" = short episodes only. "Full movie" = films only. "Start a series" = first episodes of series.
- Match mood carefully. "Just switch off" = reality shows, sitcoms, light content. "Feel something" = emotional dramas.
- For India: prioritize content actually available on Indian streaming platforms.
- Suggest 1 primary pick and 4 alternatives (so we have backups after TMDB verification).

Respond ONLY with valid JSON, no markdown:
{
  "primary": { "title": "Title", "type": "Movie|Series|Mini-series|Documentary", "year": "2024", "why": "Two warm sentences on why this fits perfectly.", "language": "Hindi|English|Tamil|etc" },
  "alternatives": [
    { "title": "Alt 1", "type": "Series", "year": "2023", "why": "One sentence.", "language": "Hindi" },
    { "title": "Alt 2", "type": "Movie", "year": "2022", "why": "One sentence.", "language": "English" },
    { "title": "Alt 3", "type": "Series", "year": "2024", "why": "One sentence.", "language": "Tamil" },
    { "title": "Alt 4", "type": "Movie", "year": "2021", "why": "One sentence.", "language": "Hindi" }
  ]
}`
      }]
    })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Anthropic error: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in Claude response');
  return JSON.parse(match[0]);
}

async function searchTMDB(title, type) {
  const isMovie = type === 'Movie';
  const endpoint = isMovie
    ? `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1`
    : `https://api.themoviedb.org/3/search/tv?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1`;

  const res = await fetch(endpoint);
  const data = await res.json();
  return data.results?.[0] || null;
}

async function checkStreamingAvailability(tmdbId, type, providerIds) {
  if (!tmdbId || !providerIds.length) return { available: true, providers: [] };

  const mediaType = type === 'Movie' ? 'movie' : 'tv';
  const res = await fetch(
    `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/watch/providers?api_key=${process.env.TMDB_API_KEY}`
  );
  const data = await res.json();
  const indiaProviders = data.results?.IN;

  if (!indiaProviders) return { available: false, providers: [] };

  const allProviders = [
    ...(indiaProviders.flatrate || []),
    ...(indiaProviders.free || []),
    ...(indiaProviders.ads || []),
  ];

  const matchedProviders = allProviders.filter(p => providerIds.includes(p.provider_id));
  const allProviderNames = allProviders.map(p => p.provider_name);

  return {
    available: matchedProviders.length > 0,
    providers: matchedProviders.map(p => p.provider_name),
    allProviders: allProviderNames,
  };
}

async function enrichTitle(item, providerIds, anyPlatform) {
  try {
    const tmdb = await searchTMDB(item.title, item.type);
    if (!tmdb) return { ...item, verified: false };

    const streamCheck = await checkStreamingAvailability(tmdb.id, item.type, anyPlatform ? [] : providerIds);

    return {
      ...item,
      tmdbId: tmdb.id,
      poster: tmdb.poster_path ? `https://image.tmdb.org/t/p/w300${tmdb.poster_path}` : null,
      rating: tmdb.vote_average ? Math.round(tmdb.vote_average * 10) / 10 : null,
      overview: tmdb.overview || null,
      verified: true,
      streamingMatch: anyPlatform ? true : streamCheck.available,
      streamingProviders: streamCheck.providers,
      allProviders: streamCheck.allProviders || [],
    };
  } catch {
    return { ...item, verified: false };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { answers } = req.body;
  if (!answers) return res.status(400).json({ error: 'Missing answers' });

  try {
    // 1. Get Claude's picks
    const claudePicks = await getClaudeRecommendations(answers);

    // 2. Figure out provider IDs
    const anyPlatform = answers.streaming === 'Any / not sure';
    const providerIds = anyPlatform ? [] : [STREAMING_PROVIDER_IDS[answers.streaming]].filter(Boolean);

    // 3. Enrich all titles with TMDB in parallel
    const allTitles = [claudePicks.primary, ...claudePicks.alternatives];
    const enriched = await Promise.all(allTitles.map(t => enrichTitle(t, providerIds, anyPlatform)));

    // 4. Try to find a verified primary that streams on their platform
    const [primaryEnriched, ...altEnriched] = enriched;
    let finalPrimary = primaryEnriched;
    let finalAlts = altEnriched;

    // If primary doesn't stream on their platform, promote the first alt that does
    if (!anyPlatform && !primaryEnriched.streamingMatch) {
      const matchIdx = altEnriched.findIndex(a => a.streamingMatch);
      if (matchIdx !== -1) {
        finalPrimary = altEnriched[matchIdx];
        finalAlts = [primaryEnriched, ...altEnriched.filter((_, i) => i !== matchIdx)];
      }
    }

    // 5. Return top 2 alts
    return res.status(200).json({
      primary: finalPrimary,
      alternatives: finalAlts.slice(0, 2),
    });

  } catch (err) {
    console.error('Recommend error:', err);
    return res.status(500).json({ error: err.message });
  }
}
