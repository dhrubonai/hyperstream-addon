export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json; charset=utf-8'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    try {
      if (path === '/' || path === '/manifest.json') {
        return new Response(JSON.stringify(getManifest()), { headers });
      }

      const catalogMatch = path.match(/^\/(movie|series|anime|other)\/catalog\/([^\/]+)\/([^\/]+)\.json$/);
      if (catalogMatch) {
        const [, type, catalogId, skip] = catalogMatch;
        const result = await handleCatalog(type, catalogId, skip);
        return new Response(JSON.stringify(result), { headers });
      }

      const metaMatch = path.match(/^\/(movie|series|anime|other)\/meta\/([^\/]+)\.json$/);
      if (metaMatch) {
        const [, type, id] = metaMatch;
        const result = await handleMeta(type, id);
        return new Response(JSON.stringify(result), { headers });
      }

      const streamMatch = path.match(/^\/stream\/(movie|series|anime|other)\/([^\/]+)\.json$/);
      if (streamMatch) {
        const [, type, id] = streamMatch;
        const result = await handleStream(type, id);
        return new Response(JSON.stringify(result), { headers });
      }

      return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
  }
};

function getManifest() {
  return {
    id: "dhrubonai.hyperstream",
    version: "2.0.0",
    name: "HyperStream",
    description: "Ultimate Streaming - Anime, Movies, Series & More",
    logo: "https://raw.githubusercontent.com/dhrubonai/hyperstream-addon/main/logo.png",
    resources: ["catalog", "meta", "stream"],
    types: ["movie", "series", "anime", "other"],
    catalogs: [
      { type: "anime", id: "anime_recent", name: "Recent Anime", extra: [{ name: "search" }] },
      { type: "anime", id: "anime_sub", name: "Anime Sub" },
      { type: "movie", id: "movies_trending", name: "Trending Movies", extra: [{ name: "search" }] },
      { type: "movie", id: "movies_popular", name: "Popular Movies" },
      { type: "series", id: "series_trending", name: "Trending Series", extra: [{ name: "search" }] },
      { type: "series", id: "series_popular", name: "Popular Series" },
      { type: "other", id: "adult_featured", name: "Adult Featured", extra: [{ name: "search" }] }
    ],
    behaviorHints: { adult: true, configurable: true }
  };
}

async function handleCatalog(type, catalogId, skip) {
  switch (type) {
    case 'anime': return getAnimeCatalog(catalogId, skip);
    case 'movie': return getMovieCatalog(catalogId, skip);
    case 'series': return getSeriesCatalog(catalogId, skip);
    case 'other': return getAdultCatalog(skip);
    default: return { metas: [] };
  }
}

async function getAnimeCatalog(catalogId, skip) {
  try {
    const page = Math.floor(parseInt(skip) / 20) + 1;
    const response = await fetch('https://anikotoapi.site/recent-anime?page=' + page + '&per_page=20');
    
    if (!response.ok) return { metas: [] };
    
    const data = await response.json();
    let animes = data.data || [];
    
    if (catalogId === 'anime_sub') animes = animes.filter(a => a.is_sub > 0);

    return {
      metas: animes.map(anime => ({
        id: 'anime:' + anime.id,
        type: 'anime',
        name: anime.title || 'Unknown',
        poster: anime.poster || '',
        description: (anime.description || '').substring(0, 300),
        genres: anime.terms_by_type?.genre || [],
        releaseInfo: String(anime.year || ''),
        rating: parseFloat(anime.score) || 0
      }))
    };
  } catch (e) {
    return { metas: [] };
  }
}

function getMovieCatalog(catalogId, skip) {
  const movies = [
    { id: '299534', title: 'Avengers: Endgame', poster: '/or06FN3Dka5tukK1e9sl16pB3iy.jpg', year: '2019', rating: 8.4 },
    { id: '678512', title: 'Oppenheimer', poster: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', year: '2023', rating: 8.6 },
    { id: '572692', title: 'Top Gun Maverick', poster: '/62HCnUTziyWcpDaBO2i1DX17ljH.jpg', year: '2022', rating: 8.3 },
    { id: '466420', title: 'Spider-Man No Way Home', poster: '/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg', year: '2021', rating: 8.2 },
    { id: '238049', title: 'The Batman', poster: '/74xTEgt7R36Fpooo50r9T25onhq.jpg', year: '2022', rating: 7.8 },
    { id: '675353', title: 'John Wick Chapter 4', poster: '/vZloFAK7NmvMGKE7VkF5AsaqJQ.jpg', year: '2023', rating: 7.9 },
    { id: '19995', title: 'Avatar', poster: '/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg', year: '2009', rating: 7.6 },
    { id: '155', title: 'The Dark Knight', poster: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', year: '2008', rating: 9.0 },
    { id: '27205', title: 'Inception', poster: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', year: '2010', rating: 8.8 },
    { id: '24428', title: 'The Avengers', poster: '/cezWGskPY5x7GaglTTRNWsFvQax.jpg', year: '2012', rating: 8.0 },
    { id: '338762', title: 'Interstellar', poster: '/gEU2QniE6E77NI6lCU6MxlNBVIx.jpg', year: '2014', rating: 8.6 },
    { id: '13', title: 'Forrest Gump', poster: '/arw2vcBveWOVZr5pxcBN5boNzMt.jpg', year: '1994', rating: 8.8 },
    { id: '12', title: 'Finding Nemo', poster: '/eHuGQ10r2mJhVbDGnnzjsmqjnaM.jpg', year: '2003', rating: 7.8 },
    { id: '59476', title: 'The Jungle Book', poster: '/mfOMOyDvUBxaLSo3oMKGeTyk5M.jpg', year: '2016', rating: 7.2 },
    { id: '301409', title: 'Lady Bird', poster: '/shAExqsKmpPzTL1lJsMLp0ZZson.jpg', year: '2017', rating: 7.3 },
    { id: '335984', title: 'Blade Runner 2049', poster: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg', year: '2017', rating: 7.6 },
    { id: '580489', title: 'Venom Let There Be Carnage', poster: '/vIgyYkXkg6NCzuKhB3HeC9zhCff.jpg', year: '2021', rating: 7.0 },
    { id: '564546', title: 'The Whale', poster: '/jLHOIpwZefJzgFQDmACsGd9TOjQ.jpg', year: '2022', rating: 8.0 },
    { id: '616037', title: 'Dune', poster: '/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', year: '2021', rating: 8.0 }
  ];

  const start = Math.min(parseInt(skip) || 0, movies.length);
  
  return {
    metas: movies.slice(start, start + 20).map(m => ({
      id: 'movie:' + m.id,
      type: 'movie',
      name: m.title,
      poster: 'https://image.tmdb.org/t/p/w500' + m.poster,
      releaseInfo: m.year,
      rating: m.rating
    }))
  };
}

function getSeriesCatalog(catalogId, skip) {
  const series = [
    { id: '1399', name: 'Game of Thrones', poster: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg', year: '2011', rating: 9.2 },
    { id: '82856', name: 'The Mandalorian', poster: '/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg', year: '2019', rating: 8.7 },
    { id: '66732', name: 'Stranger Things', poster: '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg', year: '2016', rating: 8.7 },
    { id: '60059', name: 'Breaking Bad', poster: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', year: '2008', rating: 9.5 },
    { id: '177212', name: 'The Last of Us', poster: '/uKvVj3q4ZN4LYcPkeT1Cya14WSL.jpg', year: '2023', rating: 8.8 },
    { id: '94957', name: 'House of the Dragon', poster: '/z2yahl2uefxDCl0nogcRBstwruJ.jpg', year: '2022', rating: 8.4 },
    { id: '84958', name: 'Loki', poster: '/voHUmluYmQFvH0UaPNrRdlTvjsY.jpg', year: '2021', rating: 8.3 },
    { id: '114200', name: 'The Boys', poster: '/mY7SeH4HFFxW1hiI6cWuwCRKptN.jpg', year: '2019', rating: 8.7 },
    { id: '1418', name: 'The Witcher', poster: '/7vjaCdMw15FEbXyLQTVa04URsPm.jpg', year: '2019', rating: 8.0 },
    { id: '85371', name: 'Squid Game', poster: '/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg', year: '2021', rating: 8.0 },
    { id: '95057', name: 'Wednesday', poster: '/9PFonBhy4cQy7Jz20NpMygczOkv.jpg', year: '2022', rating: 8.5 },
    { id: '67418', name: 'You', poster: '/doGwTWBH1pOsRbmSweGQAQAD1WL.jpg', year: '2018', rating: 8.1 },
    { id: '1100', name: 'Peaky Blinders', poster: '/vUUqzWA2YT45vLHDdDceDKWYfyx.jpg', year: '2013', rating: 8.7 },
    { id: '1396', name: 'Better Call Saul', poster: '/wFjboP0IXfejVOXFjbRL8QGGbE.jpg', year: '2015', rating: 8.8 },
    { id: '1622', name: 'Sherlock', poster: '/62FDVXEXUg1eqLvToTEuCWUUpH.jpg', year: '2010', rating: 8.8 },
    { id: '100088', name: 'The Crown', poster: '/BDDllpCTc1nkoFjOFO9jPY9pBDQ.jpg', year: '2016', rating: 8.6 },
    { id: '105971', name: 'Ted Lasso', poster: '/w2ejMKqbVPwTcgRz2DVpFqTzg5k.jpg', year: '2020', rating: 8.8 },
    { id: '80240', name: 'The Flash', poster: '/W9nytwFeBvbAxFsRAIk30ULNK6l.jpg', year: '2014', rating: 7.7 },
    { id: '60625', name: 'Rick and Morty', poster: '/gdIrmf4lNaxE36LoVuKuzpFuaoD.jpg', year: '2013', rating: 8.8 }
  ];

  const start = Math.min(parseInt(skip) || 0, series.length);
  
  return {
    metas: series.slice(start, start + 20).map(s => ({
      id: 'series:' + s.id,
      type: 'series',
      name: s.name,
      poster: 'https://image.tmdb.org/t/p/w500' + s.poster,
      releaseInfo: s.year,
      rating: s.rating
    }))
  };
}

function getAdultCatalog(skip) {
  const titles = ['Midnight Encounter', 'Secret Desires', 'Forbidden Pleasures', 'Intimate Moments', 
                  'Passionate Nights', 'Sensual Awakening', 'Hidden Fantasies', 'Wild Temptation'];
  
  const baseSkip = parseInt(skip) || 0;
  const items = [];

  for (let i = 0; i < 12; i++) {
    items.push({
      id: 'adult:' + (baseSkip + i + 1),
      type: 'other',
      name: titles[(baseSkip + i) % titles.length],
      poster: 'https://picsum.photos/seed/' + (baseSkip + i + 1) + '/300/450',
      genres: ['Adult'],
      releaseInfo: new Date().toISOString().substring(0, 10),
      rating: 4.0,
      behaviorHints: { adult: true }
    });
  }

  return { metas: items };
}

async function handleMeta(type, id) {
  const actualId = id.includes(':') ? id.split(':')[1] : id;

  switch (type) {
    case 'anime': return getAnimeMeta(actualId);
    case 'movie': return getMovieMeta(actualId);
    case 'series': return getSeriesMeta(actualId);
    case 'other': return getAdultMeta(id);
    default: return {};
  }
}

async function getAnimeMeta(id) {
  try {
    const response = await fetch('https://anikotoapi.site/series/' + id);
    if (!response.ok) return { meta: { id: 'anime:' + id, type: 'anime', name: 'Loading...' }};
    
    const data = await response.json();
    const anime = data.data?.anime;
    const episodes = data.data?.episodes || [];

    return {
      meta: {
        id: 'anime:' + anime.id,
        type: 'anime',
        name: anime.title || 'Unknown',
        poster: anime.poster || '',
        description: (anime.description || '').substring(0, 500),
        genres: anime.terms_by_type?.genre || [],
        releaseInfo: String(anime.year || ''),
        rating: parseFloat(anime.score) || 0,
        videos: episodes.slice(0, 50).map(ep => ({
          id: 'ep:' + anime.id + ':' + ep.id,
          title: ep.title || 'Episode ' + ep.number,
          season: 1,
          episode: ep.number
        }))
      }
    };
  } catch (e) {
    return { meta: { id: 'anime:' + id, type: 'anime', name: 'Error' }};
  }
}

function getMovieMeta(id) {
  const movieData = {
    '299534': { title: 'Avengers: Endgame', year: '2019', rating: 8.4, overview: 'The Avengers assemble to undo Thanos destruction.', poster: '/or06FN3Dka5tukK1e9sl16pB3iy.jpg' },
    '678512': { title: 'Oppenheimer', year: '2023', rating: 8.6, overview: 'Story of J. Robert Oppenheimer and the atomic bomb.', poster: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg' }
  };

  const m = movieData[id] || { title: 'Movie', year: '', rating: 0, overview: 'Description loading...', poster: '' };

  return {
    meta: {
      id: 'movie:' + id,
      type: 'movie',
      name: m.title,
      poster: m.poster ? 'https://image.tmdb.org/t/p/w500' + m.poster : undefined,
      description: m.overview,
      releaseInfo: m.year,
      rating: m.rating
    }
  };
}

function getSeriesMeta(id) {
  const seriesData = {
    '1399': { name: 'Game of Thrones', year: '2011', rating: 9.2, overview: 'Seven noble families fight for Westeros.', poster: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg' },
    '60059': { name: 'Breaking Bad', year: '2008', rating: 9.5, overview: 'Chemistry teacher turns to making meth.', poster: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg' }
  };

  const s = seriesData[id] || { name: 'Series', year: '', rating: 0, overview: 'Loading...', poster: '' };

  // Generate episodes
  const videos = [];
  for (let e = 1; e <= 10; e++) {
    videos.push({
      id: 'ep:' + id + ':s1:' + e,
      title: 'Episode ' + e,
      season: 1,
      episode: e
    });
  }

  return {
    meta: {
      id: 'series:' + id,
      type: 'series',
      name: s.name,
      poster: s.poster ? 'https://image.tmdb.org/t/p/w500' + s.poster : undefined,
      description: s.overview,
      releaseInfo: s.year,
      rating: s.rating,
      videos: videos
    }
  };
}

function getAdultMeta(id) {
  return {
    meta: {
      id: id,
      type: 'other',
      name: 'Premium Content',
      poster: 'https://picsum.photos/seed/' + Date.now() + '/300/450',
      description: 'Full HD content available.',
      genres: ['Adult'],
      behaviorHints: { adult: true }
    }
  };
}

async function handleStream(type, id) {
  const actualId = id.includes(':') ? id.split(':').pop() : id;

  switch (type) {
    case 'anime': return getAnimeStream(actualId);
    case 'movie': return getMovieStream(actualId);
    case 'series': return getSeriesStream(actualId);
    case 'other': return getAdultStream(id);
    default: return { streams: [] };
  }
}

async function getAnimeStream(animeId) {
  let embedUrl = 'https://megaplay.buzz/stream/s-2/' + animeId + '/sub';

  try {
    const response = await fetch('https://anikotoapi.site/series/' + animeId);
    if (response.ok) {
      const data = await response.json();
      const firstEp = data.data?.episodes?.[0];
      if (firstEp?.embed_url?.sub) embedUrl = firstEp.embed_url.sub;
    }
  } catch (e) {}

  return {
    streams: [{
      name: 'HyperStream Anime - SUB',
      url: embedUrl,
      behaviorHints: { notWebReady: false }
    }]
  };
}

function getMovieStream(tmdbId) {
  return {
    streams: [{
      name: 'HyperStream Movie',
      url: 'https://player.videasy.net/movie/' + tmdbId + '?autoplay=true',
      behaviorHints: { notWebReady: false, iframe: true }
    }]
  };
}

function getSeriesStream(tmdbId) {
  return {
    streams: [{
      name: 'HyperStream Series',
      url: 'https://player.videasy.net/tv/' + tmdbId + '/1/1?autoplay=true&next=true',
      behaviorHints: { notWebReady: false, iframe: true, bingeGroup: 'hyperstream-' + tmdbId }
    }]
  };
}

function getAdultStream(id) {
  const idx = parseInt(id.split(':').pop()) || 1;
  
  return {
    streams: [{
      name: 'Source 1',
      url: 'https://www.pornhub.com/embed/' + ((idx * 9973) % 100000000),
      behaviorHints: { notWebReady: false, iframe: true, adult: true }
    }]
  };
}
