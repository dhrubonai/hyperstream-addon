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
      // Manifest endpoint
      if (path === '/' || path === '/manifest.json') {
        return new Response(JSON.stringify(getManifest()), { headers });
      }

      // Catalog endpoint: /{type}/catalog/{id}.json or /{type}/catalog/{id}/{extra}.json
      const catalogMatch = path.match(/^\/(movie|series|anime|other)\/catalog\/([^\/]+)(?:\/([^\/]+))?\.json$/);
      if (catalogMatch) {
        const [, type, catalogId, extra] = catalogMatch;
        const skip = url.searchParams.get('skip') || '0';
        const result = await handleCatalog(type, catalogId, skip, url.searchParams);
        return new Response(JSON.stringify(result), { headers });
      }

      // Meta endpoint: /{type}/meta/{id}.json
      const metaMatch = path.match(/^\/(movie|series|anime|other)\/meta\/([^\/]+)\.json$/);
      if (metaMatch) {
        const [, type, id] = metaMatch;
        const result = await handleMeta(type, id);
        return new Response(JSON.stringify(result), { headers });
      }

      // Stream endpoint: /stream/{type}/{id}.json
      const streamMatch = path.match(/^\/stream\/(movie|series|anime|other)\/([^\/]+)\.json$/);
      if (streamMatch) {
        const [, type, id] = streamMatch;
        const result = await handleStream(type, id);
        return new Response(JSON.stringify(result), { headers });
      }

      return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
  }
};

function getManifest() {
  return {
    id: "com.dhrubonai.hyperstream",
    version: "3.0.0",
    name: "HyperStream",
    description: "Ultimate Streaming - Anime, Movies, Series & More",
    logo: "https://raw.githubusercontent.com/dhrubonai/hyperstream-addon/main/logo.png",
    resources: ["catalog", "meta", "stream"],
    types: ["movie", "series", "anime", "other"],
    catalogs: [
      { 
        type: "anime", 
        id: "anime_recent", 
        name: "Recent Anime", 
        extra: [{ name: "search" }, { name: "skip" }] 
      },
      { 
        type: "anime", 
        id: "anime_sub", 
        name: "Anime Sub",
        extra: [{ name: "skip" }]
      },
      { 
        type: "movie", 
        id: "movies_trending", 
        name: "Trending Movies", 
        extra: [{ name: "search" }, { name: "skip" }] 
      },
      { 
        type: "movie", 
        id: "movies_popular", 
        name: "Popular Movies",
        extra: [{ name: "skip" }]
      },
      { 
        type: "series", 
        id: "series_trending", 
        name: "Trending Series", 
        extra: [{ name: "search" }, { name: "skip" }] 
      },
      { 
        type: "series", 
        id: "series_popular", 
        name: "Popular Series",
        extra: [{ name: "skip" }]
      },
      { 
        type: "other", 
        id: "adult_featured", 
        name: "Adult Featured", 
        extra: [{ name: "search" }, { name: "skip" }] 
      }
    ],
    behaviorHints: { 
      adult: true, 
      configurable: true,
      configurationRequired: false
    }
  };
}

async function handleCatalog(type, catalogId, skip, searchParams) {
  switch (type) {
    case 'anime': return getAnimeCatalog(catalogId, skip, searchParams);
    case 'movie': return getMovieCatalog(catalogId, skip, searchParams);
    case 'series': return getSeriesCatalog(catalogId, skip, searchParams);
    case 'other': return getAdultCatalog(skip, searchParams);
    default: return { metas: [] };
  }
}

async function getAnimeCatalog(catalogId, skip, searchParams) {
  try {
    const page = Math.floor(parseInt(skip) / 20) + 1;
    
    // Check for search
    const searchQuery = searchParams.get('search');
    let apiUrl = 'https://anikotoapi.site/recent-anime?page=' + page + '&per_page=20';
    if (searchQuery) {
      apiUrl = 'https://anikotoapi.site/search?q=' + encodeURIComponent(searchQuery);
    }
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) return { metas: [] };
    
    const data = await response.json();
    let animes = data.data || [];

    if (catalogId === 'anime_sub' && !searchQuery) {
      animes = animes.filter(a => a.is_sub > 0);
    }

    return {
      metas: animes.slice(0, 20).map(anime => ({
        id: 'anime:' + anime.id,
        type: 'anime',
        name: anime.title || 'Unknown Anime',
        poster: anime.poster || 'https://via.placeholder.com/300x450?text=No+Poster',
        description: (anime.description || 'No description available').substring(0, 300),
        genres: anime.terms_by_type?.genre || [],
        releaseInfo: String(anime.year || new Date().getFullYear()),
        imdbRating: String(parseFloat(anime.score) || 7.0),
        behaviorHints: {
          defaultVideoId: 'anime:' + anime.id + ':1:1'
        }
      }))
    };
  } catch (e) {
    console.error('Anime catalog error:', e);
    return { metas: [] };
  }
}

function getMovieCatalog(catalogId, skip, searchParams) {
  const movies = [
    { id: 'tt4154796', title: 'Avengers: Endgame', poster: '/or06FN3Dka5tukK1e9sl16pB3iy.jpg', year: '2019', rating: '8.4' },
    { id: 'tt15398776', title: 'Oppenheimer', poster: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', year: '2023', rating: '8.6' },
    { id: 'tt3624082', title: 'Top Gun: Maverick', poster: '/62HCnUTziyWcpDaBO2i1DX17ljH.jpg', year: '2022', rating: '8.3' },
    { id: 'tt10872600', title: 'Spider-Man: No Way Home', poster: '/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg', year: '2021', rating: '8.2' },
    { id: 'tt1877830', title: 'The Batman', poster: '/74xTEgt7R36Fpooo50r9T25onhq.jpg', year: '2022', rating: '7.8' },
    { id: 'tt10366206', title: 'John Wick: Chapter 4', poster: '/vZloFAK7NmvMGKE7VkF5AsaqJQ.jpg', year: '2023', rating: '7.9' },
    { id: 'tt0499549', title: 'Avatar', poster: '/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg', year: '2009', rating: '7.6' },
    { id: 'tt0468569', title: 'The Dark Knight', poster: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', year: '2008', rating: '9.0' },
    { id: 'tt1375666', title: 'Inception', poster: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', year: '2010', rating: '8.8' },
    { id: 'tt0848228', title: 'The Avengers', poster: '/cezWGskPY5x7GaglTTRNWsFvQax.jpg', year: '2012', rating: '8.0' },
    { id: 'tt0816692', title: 'Interstellar', poster: '/gEU2QniE6E77NI6lCU6MxlNBVIx.jpg', year: '2014', rating: '8.6' },
    { id: 'tt0109830', title: 'Forrest Gump', poster: '/arw2vcBveWOVZr5pxcBN5boNzMt.jpg', year: '1994', rating: '8.8' },
    { id: 'tt0266543', title: 'Finding Nemo', poster: '/eHuGQ10r2mJhVbDGnnzjsmqjnaM.jpg', year: '2003', rating: '7.8' },
    { id: 'tt3040964', title: 'The Jungle Book', poster: '/mfOMOyDvUBxaLSo3oMKGeTyk5M.jpg', year: '2016', rating: '7.2' },
    { id: 'tt4975722', title: 'Lady Bird', poster: '/shAExqsKmpPzTL1lJsMLp0ZZson.jpg', year: '2017', rating: '7.3' },
    { id: 'tt1856101', title: 'Blade Runner 2049', poster: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg', year: '2017', rating: '7.6' },
    { id: 'tt9419884', title: 'Venom: Let There Be Carnage', poster: '/vIgyYkXkg6NCzuKhB3HeC9zhCff.jpg', year: '2021', rating: '7.0' },
    { id: 'tt13833688', title: 'The Whale', poster: '/jLHOIpwZefJzgFQDmACsGd9TOjQ.jpg', year: '2022', rating: '8.0' },
    { id: 'tt1160419', title: 'Dune: Part One', poster: '/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', year: '2021', rating: '8.0' },
    { id: 'tt1517268', title: 'The Shawshank Redemption', poster: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', year: '1994', rating: '9.3' }
  ];

  const start = Math.min(parseInt(skip) || 0, movies.length);
  
  // Filter by search if provided
  let filteredMovies = movies;
  const searchQuery = searchParams.get('search');
  if (searchQuery) {
    filteredMovies = movies.filter(m => 
      m.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  return {
    metas: filteredMovies.slice(start, start + 20).map(m => ({
      id: m.id,
      type: 'movie',
      name: m.title,
      poster: 'https://image.tmdb.org/t/p/w500' + m.poster,
      releaseInfo: m.year,
      imdbRating: m.rating,
      behaviorHints: {
        defaultVideoId: m.id
      }
    }))
  };
}

function getSeriesCatalog(catalogId, skip, searchParams) {
  const series = [
    { id: 'tt0944947', name: 'Game of Thrones', poster: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg', year: '2011–2019', rating: '9.2' },
    { id: 'tt8178634', name: 'The Mandalorian', poster: '/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg', year: '2019–', rating: '8.7' },
    { id: 'tt4574234', name: 'Stranger Things', poster: '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg', year: '2016–', rating: '8.7' },
    { id: 'tt0903747', name: 'Breaking Bad', poster: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', year: '2008–2013', rating: '9.5' },
    { id: 'tt3581920', name: 'The Last of Us', poster: '/uKvVj3q4ZN4LYcPkeT1Cya14WSL.jpg', year: '2023–', rating: '8.8' },
    { id: 'tt11198330', name: 'House of the Dragon', poster: '/z2yahl2uefxDCl0nogcRBstwruJ.jpg', year: '2022–', rating: '8.4' },
    { id: 'tt3029516', name: 'Loki', poster: '/voHUmluYmQFvH0UaPNrRdlTvjsY.jpg', year: '2021–', rating: '8.3' },
    { id: 'tt1190634', name: 'The Boys', poster: '/mY7SeH4HFFxW1hiI6cWuwCRKptN.jpg', year: '2019–', rating: '8.7' },
    { id: 'tt7183020', name: 'The Witcher', poster: '/7vjaCdMw15FEbXyLQTVa04URsPm.jpg', year: '2019–', rating: '8.0' },
    { id: 'tt10554269', name: 'Squid Game', poster: '/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg', year: '2021–', rating: '8.0' },
    { id: 'tt13457460', name: 'Wednesday', poster: '/9PFonBhy4cQy7Jz20NpMygczOkv.jpg', year: '2022–', rating: '8.5' },
    { id: 'tt7564450', name: 'You', poster: '/doGwTWBH1pOsRbmSweGQAQAD1WL.jpg', year: '2018–', rating: '8.1' },
    { id: 'tt2442560', name: 'Peaky Blinders', poster: '/vUUqzWA2YT45vLHDdDceDKWYfyx.jpg', year: '2013–2022', rating: '8.7' },
    { id: 'tt3032476', name: 'Better Call Saul', poster: '/wFjboP0IXfejVOXFjbRL8QGGbE.jpg', year: '2015–2022', rating: '8.8' },
    { id: 'tt1474384', name: 'Sherlock', poster: '/62FDVXEXUg1eqLvToTEuCWUUpH.jpg', year: '2010–2017', rating: '8.8' },
    { id: 'tt6513056', name: 'The Crown', poster: '/BDDllpCTc1nkoFjOFO9jPY9pBDQ.jpg', year: '2016–2023', rating: '8.6' },
    { id: 'tt11965092', name: 'Ted Lasso', poster: '/w2ejMKqbVPwTcgRz2DVpFqTzg5k.jpg', year: '2020–2023', rating: '8.8' },
    { id: 'tt3107288', name: 'The Flash', poster: '/W9nytwFeBvbAxFsRAIk30ULNK6l.jpg', year: '2014–2023', rating: '7.7' },
    { id: 'tt2707408', name: 'Rick and Morty', poster: '/gdIrmf4lNaxE36LoVuKuzpFuaoD.jpg', year: '2013–', rating: '8.8' },
    { id: 'tt1796966', name: 'The Walking Dead', poster: '/xf9wuG9KzW705CilCFB2lsBfJya.jpg', year: '2010–2022', rating: '8.1' }
  ];

  const start = Math.min(parseInt(skip) || 0, series.length);
  
  // Filter by search if provided
  let filteredSeries = series;
  const searchQuery = searchParams.get('search');
  if (searchQuery) {
    filteredSeries = series.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  return {
    metas: filteredSeries.slice(start, start + 20).map(s => ({
      id: s.id,
      type: 'series',
      name: s.name,
      poster: 'https://image.tmdb.org/t/p/w500' + s.poster,
      releaseInfo: s.year,
      imdbRating: s.rating,
      behaviorHints: {
        defaultVideoId: s.id + ':1:1',
        hasScheduledVideos: false
      }
    }))
  };
}

function getAdultCatalog(skip, searchParams) {
  const titles = ['Midnight Encounter', 'Secret Desires', 'Forbidden Pleasures', 'Intimate Moments', 
                  'Passionate Nights', 'Sensual Awakening', 'Hidden Fantasies', 'Wild Temptation',
                  'Romantic Escapades', 'Desire Unleashed', 'Intimate Connections', 'Passion Play'];
  
  const baseSkip = parseInt(skip) || 0;
  const items = [];

  for (let i = 0; i < 12; i++) {
    items.push({
      id: 'adult:' + (baseSkip + i + 1),
      type: 'other',
      name: titles[(baseSkip + i) % titles.length],
      poster: 'https://picsum.photos/seed/adult' + (baseSkip + i + 1) + '/300/450',
      genres: ['Adult'],
      releaseInfo: new Date().toISOString().substring(0, 4),
      imdbRating: '4.0',
      behaviorHints: { 
        adult: true,
        defaultVideoId: 'adult:' + (baseSkip + i + 1)
      }
    });
  }

  return { metas: items };
}

async function handleMeta(type, id) {
  switch (type) {
    case 'anime': return getAnimeMeta(id);
    case 'movie': return getMovieMeta(id);
    case 'series': return getSeriesMeta(id);
    case 'other': return getAdultMeta(id);
    default: return {};
  }
}

async function getAnimeMeta(id) {
  try {
    // Extract actual ID from "anime:xxx" format
    const actualId = id.startsWith('anime:') ? id.split(':')[1] : id;
    
    const response = await fetch('https://anikotoapi.site/series/' + actualId);
    if (!response.ok) {
      return { meta: createFallbackAnimeMeta(id) };
    }
    
    const data = await response.json();
    const anime = data.data?.anime;
    const episodes = data.data?.episodes || [];

    if (!anime) {
      return { meta: createFallbackAnimeMeta(id) };
    }

    return {
      meta: {
        id: 'anime:' + anime.id,
        type: 'anime',
        name: anime.title || 'Unknown Anime',
        poster: anime.poster || 'https://via.placeholder.com/300x450?text=No+Poster',
        background: anime.banner || anime.poster || '',
        description: (anime.description || 'No description available').substring(0, 800),
        genres: anime.terms_by_type?.genre || [],
        releaseInfo: String(anime.year || new Date().getFullYear()),
        runtime: '24 min',
        imdbRating: String(parseFloat(anime.score) || 7.0),
        status: anime.status || 'Continuing',
        videos: episodes.slice(0, 50).map((ep, idx) => ({
          id: 'anime:' + anime.id + ':1:' + (idx + 1),
          title: ep.title || 'Episode ' + (idx + 1),
          season: 1,
          episode: idx + 1,
          released: new Date(ep.created_at || Date.now()).toISOString(),
          overview: ep.description || ''
        })),
        behaviorHints: {
          defaultVideoId: 'anime:' + anime.id + ':1:1'
        }
      }
    };
  } catch (e) {
    console.error('Anime meta error:', e);
    return { meta: createFallbackAnimeMeta(id) };
  }
}

function createFallbackAnimeMeta(id) {
  return {
    id: id,
    type: 'anime',
    name: 'Loading...',
    poster: 'https://via.placeholder.com/300x450?text=Loading',
    description: 'Please try again later.',
    videos: []
  };
}

function getMovieMeta(id) {
  const movieData = {
    'tt4154796': { title: 'Avengers: Endgame', year: '2019', rating: '8.4', overview: 'After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more to reverse Thanos\' actions and restore balance to the universe.', poster: '/or06FN3Dka5tukK1e9sl16pB3iy.jpg', background: '/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg', runtime: '181 min', genres: ['Action', 'Adventure', 'Drama'] },
    'tt15398776': { title: 'Oppenheimer', year: '2023', rating: '8.6', overview: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.', poster: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', background: '/n29dRbNxvHPB5mUCbVmFNiWiwiq.jpg', runtime: '180 min', genres: ['Biography', 'Drama', 'History'] },
    'tt3624082': { title: 'Top Gun: Maverick', year: '2022', rating: '8.3', overview: 'After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUN\'s elite graduates on a mission that demands the ultimate sacrifice.', poster: '/62HCnUTziyWcpDaBO2i1DX17ljH.jpg', background: '/uhCVtoPRCvpR6d8TU9PSdfqZEla.jpg', runtime: '131 min', genres: ['Action', 'Drama'] },
    'tt10872600': { title: 'Spider-Man: No Way Home', year: '2021', rating: '8.2', overview: 'With Spider-Man\'s identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear.', poster: '/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg', background: '/14Qbnp_gWKuv5v7sysGY5NYpyi.jpg', runtime: '148 min', genres: ['Action', 'Adventure', 'Fantasy'] },
    'tt1877830': { title: 'The Batman', year: '2022', rating: '7.8', overview: 'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city\'s hidden corruption.', poster: '/74xTEgt7R36Fpooo50r9T25onhq.jpg', background: '/b0PlSFdDwbyFAJlB1lBMebs4rgL.jpg', runtime: '176 min', genres: ['Action', 'Crime', 'Drama'] },
    'tt10366206': { title: 'John Wick: Chapter 4', year: '2023', rating: '7.9', overview: 'John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy.', poster: '/vZloFAK7NmvMGKE7VkF5AsaqJQ.jpg', background: '/vZloFAK7NmvMGKE7VkF5AsaqJQ.jpg', runtime: '169 min', genres: ['Action', 'Crime', 'Thriller'] },
    'tt0499549': { title: 'Avatar', year: '2009', rating: '7.6', overview: 'A paraplegic Marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home.', poster: '/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg', background: '/eGmFnXWG4Ssf5pP1I0RMT5fQLp.jpg', runtime: '162 min', genres: ['Action', 'Adventure', 'Fantasy'] },
    'tt0468569': { title: 'The Dark Knight', year: '2008', rating: '9.0', overview: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.', poster: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', background: '/nMKdUUepR0ofJryYPy4w9E5FaVc.jpg', runtime: '152 min', genres: ['Action', 'Crime', 'Drama'] },
    'tt1375666': { title: 'Inception', year: '2010', rating: '8.8', overview: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', poster: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', background: '/s2b9MwqnTM5hA8qFMA3Xqbmr0d.jpg', runtime: '148 min', genres: ['Action', 'Adventure', 'Sci-Fi'] },
    'tt0848228': { title: 'The Avengers', year: '2012', rating: '8.0', overview: 'Earth\'s mightiest heroes must come together and learn to fight as a team to stop the mischievous Loki and his alien army from enslaving humanity.', poster: '/cezWGskPY5x7GaglTTRNWsFvQax.jpg', background: '/RYzwyOlXJUzzNNXulmUHRFb4FFG.jpg', runtime: '143 min', genres: ['Action', 'Adventure', 'Sci-Fi'] },
    'tt0816692': { title: 'Interstellar', year: '2014', rating: '8.6', overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival as Earth becomes uninhabitable.', poster: '/gEU2QniE6E77NI6lCU6MxlNBVIx.jpg', background: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg', runtime: '169 min', genres: ['Adventure', 'Drama', 'Sci-Fi'] },
    'tt0109830': { title: 'Forrest Gump', year: '1994', rating: '8.8', overview: 'The presidencies of Kennedy and Johnson, the Vietnam War, and other historical events unfold from the perspective of an Alabama man with an IQ of 75.', poster: '/arw2vcBveWOVZr5pxcBN5boNzMt.jpg', background: '/3hKMwCympTSikh2SqNLiBgOVspI.jpg', runtime: '142 min', genres: ['Drama', 'Romance'] },
    'tt0266543': { title: 'Finding Nemo', year: '2003', rating: '7.8', overview: 'A clown fish embarks on a journey to find his son who was captured by a diver in the Great Barrier Reef.', poster: '/eHuGQ10r2mJhVbDGnnzjsmqjnaM.jpg', background: '/fw5FBWo-GRpDSWbIoBSlFa9sqSC.jpg', runtime: '100 min', genres: ['Animation', 'Adventure', 'Comedy'] },
    'tt3040964': { title: 'The Jungle Book', year: '2016', rating: '7.2', overview: 'Mowgli, a man-cub raised by wolves, must leave his home when tiger Shere Khan threatens his life.', poster: '/mfOMOyDvUBxaLSo3oMKGeTyk5M.jpg', background: '/qHtRQxKvq6fgcVqUKgqQLfMLbP.jpg', runtime: '106 min', genres: ['Adventure', 'Family', 'Fantasy'] },
    'tt4975722': { title: 'Lady Bird', year: '2017', rating: '7.3', overview: 'The adventures of a young woman living in Sacramento, California in 2002.', poster: '/shAExqsKmpPzTL1lJsMLp0ZZson.jpg', background: '/jkAMmMNw9vJ4d9RUh7zJ9OpFHK1.jpg', runtime: '94 min', genres: ['Comedy', 'Drama'] },
    'tt1856101': { title: 'Blade Runner 2049', year: '2017', rating: '7.6', overview: 'Young Blade Runner K\'s discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard.', poster: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg', background: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg', runtime: '164 min', genres: ['Drama', 'Mystery', 'Sci-Fi'] },
    'tt9419884': { title: 'Venom: Let There Be Carnage', year: '2021', rating: '7.0', overview: 'Eddie Brock attempts to revive his journalism career while being host to the alien symbiote Venom.', poster: '/vIgyYkXkg6NCzuKhB3HeC9zhCff.jpg', background: '/vIgyYkXkg6NCzuKhB3HeC9zhCff.jpg', runtime: '97 min', genres: ['Action', 'Adventure', 'Sci-Fi'] },
    'tt13833688': { title: 'The Whale', year: '2022', rating: '8.0', overview: 'A reclusive English teacher suffering from severe obesity attempts to reconnect with his estranged teenage daughter.', poster: '/jLHOIpwZefJzgFQDmACsGd9TOjQ.jpg', background: '/jLHOIpwZefJzgFQDmACsGd9TOjQ.jpg', runtime: '117 min', genres: ['Drama'] },
    'tt1160419': { title: 'Dune: Part One', year: '2021', rating: '8.0', overview: 'Paul Atreides must travel to the most dangerous planet in the universe to ensure the future of his family and people.', poster: '/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', background: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", runtime: '155 min', genres: ['Action', 'Adventure', 'Drama'] },
    'tt1517268': { title: 'The Shawshank Redemption', year: '1994', rating: '9.3', overview: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.', poster: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', background: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', runtime: '142 min', genres: ['Drama'] }
  };

  const m = movieData[id] || { 
    title: 'Movie Loading...', 
    year: '', 
    rating: '0', 
    overview: 'Description loading...', 
    poster: '', 
    background: '',
    runtime: '',
    genres: []
  };

  return {
    meta: {
      id: id,
      type: 'movie',
      name: m.title,
      poster: m.poster ? 'https://image.tmdb.org/t/p/w500' + m.poster : undefined,
      background: m.background ? 'https://image.tmdb.org/t/p/original' + m.background : undefined,
      description: m.overview,
      releaseInfo: m.year,
      runtime: m.runtime,
      imdbRating: m.rating,
      genres: m.genres,
      behaviorHints: {
        defaultVideoId: id
      }
    }
  };
}

function getSeriesMeta(id) {
  const seriesData = {
    'tt0944947': { 
      name: 'Game of Thrones', 
      year: '2011–2019', 
      rating: '9.2', 
      overview: 'Nine noble families wage war for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.',
      poster: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg', 
      background: '/suopoADq0k8YZr4dQXcU6pToj6s.jpg',
      genres: ['Action', 'Adventure', 'Drama'],
      status: 'Ended',
      runtime: '57 min'
    },
    'tt0903747': { 
      name: 'Breaking Bad', 
      year: '2008–2013', 
      rating: '9.5', 
      overview: 'A high school chemistry teacher diagnosed with lung cancer turns to manufacturing methamphetamine to secure his family\'s future.',
      poster: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', 
      background: '/tsRy63Mu5cu8etL4XVvmqidY38L.jpg',
      genres: ['Crime', 'Drama', 'Thriller'],
      status: 'Ended',
      runtime: '47 min'
    },
    'tt4574234': { 
      name: 'Stranger Things', 
      year: '2016–', 
      rating: '8.7', 
      overview: 'When a young boy disappears, his mother, a police chief and his friends must confront terrifying supernatural forces.',
      poster: '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg', 
      background: '/x2WOkc4sbwrlvJxAROCmXXhZ4cL.jpg',
      genres: ['Drama', 'Fantasy', 'Horror'],
      status: 'Continuing',
      runtime: '51 min'
    },
    'tt8178634': { 
      name: 'The Mandalorian', 
      year: '2019–', 
      rating: '8.7', 
      overview: 'The travels of a lone bounty hunter in the outer reaches of the galaxy, far from the authority of the New Republic.',
      poster: '/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg', 
      background: '/sh7MFgBYLazL2qXVYvFo8zkTdpJ.jpg',
      genres: ['Action', 'Adventure', 'Sci-Fi'],
      status: 'Continuing',
      runtime: '40 min'
    },
    'tt3581920': { 
      name: 'The Last of Us', 
      year: '2023–', 
      rating: '8.8', 
      overview: 'Joel and Ellie, a pair connected through the harshness of the world they live in, are forced to endure brutal circumstances.',
      poster: '/uKvVj3q4ZN4LYcPkeT1Cya14WSL.jpg', 
      background: '/uKvVj3q4ZN4LYcPkeT1Cya14WSL.jpg',
      genres: ['Action', 'Adventure', 'Drama'],
      status: 'Continuing',
      runtime: '60 min'
    },
    'tt1190634': { 
      name: 'The Boys', 
      year: '2019–', 
      rating: '8.7', 
      overview: 'A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers.',
      poster: '/mY7SeH4HFFxW1hiI6cWuwCRKptN.jpg', 
      background: '/mY7SeH4HFFxW1hiI6cWuwCRKptN.jpg',
      genres: ['Action', 'Comedy', 'Crime'],
      status: 'Continuing',
      runtime: '60 min'
    },
    'tt13457460': { 
      name: 'Wednesday', 
      year: '2022–', 
      rating: '8.5', 
      overview: 'Follows Wednesday Addams\' years as a student at Nevermore Academy where she solves mysteries.',
      poster: '/9PFonBhy4cQy7Jz20NpMygczOkv.jpg', 
      background: '/9PFonBhy4cQy7Jz20NpMygczOkv.jpg',
      genres: ['Comedy', 'Crime', 'Fantasy'],
      status: 'Continuing',
      runtime: '50 min'
    },
    'tt10554269': { 
      name: 'Squid Game', 
      year: '2021–', 
      rating: '8.0', 
      overview: 'Hundreds of cash-strapped players accept a strange invitation to compete in children\'s games for a prize.',
      poster: '/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg', 
      background: '/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg',
      genres: ['Action', 'Drama', 'Mystery'],
      status: 'Continuing',
      runtime: '55 min'
    },
    'tt11198330': { 
      name: 'House of the Dragon', 
      year: '2022–', 
      rating: '8.4', 
      overview: 'The story of the Targaryen civil war that took place about 200 years before events portrayed in Game of Thrones.',
      poster: '/z2yahl2uefxDCl0nogcRBstwruJ.jpg', 
      background: '/z2yahl2uefxDCl0nogcRBstwruJ.jpg',
      genres: ['Action', 'Adventure', 'Drama'],
      status: 'Continuing',
      runtime: '60 min'
    },
    'tt3029516': { 
      name: 'Loki', 
      year: '2021–', 
      rating: '8.3', 
      overview: 'The mercurial villain Loki resumes his role as the God of Mischief in a new series.',
      poster: '/voHUmluYmQFvH0UaPNrRdlTvjsY.jpg', 
      background: '/voHUmluYmQFvH0UaPNrRdlTvjsY.jpg',
      genres: ['Action', 'Adventure', 'Comedy'],
      status: 'Continuing',
      runtime: '45 min'
    },
    'tt7183020': { 
      name: 'The Witcher', 
      year: '2019–', 
      rating: '8.0', 
      overview: 'Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world where people often prove more wicked than beasts.',
      poster: '/7vjaCdMw15FEbXyLQTVa04URsPm.jpg', 
      background: '/7vjaCdMw15FEbXyLQTVa04URsPm.jpg',
      genres: ['Action', 'Adventure', 'Fantasy'],
      status: 'Continuing',
      runtime: '60 min'
    },
    'tt7564450': { 
      name: 'You', 
      year: '2018–', 
      rating: '8.1', 
      overview: 'A dangerously charming, intensely obsessive young man goes to extreme measures to insert himself into the lives of those he is transfixed by.',
      poster: '/doGwTWBH1pOsRbmSweGQAQAD1WL.jpg', 
      background: '/doGwTWBH1pOsRbmSweGQAQAD1WL.jpg',
      genres: ['Crime', 'Drama', 'Romance'],
      status: 'Continuing',
      runtime: '43 min'
    },
    'tt2442560': { 
      name: 'Peaky Blinders', 
      year: '2013–2022', 
      rating: '8.7', 
      overview: 'A gangster family epic set in 1900s England, centered on a gang who sew razor blades in the peaks of their caps.',
      poster: '/vUUqzWA2YT45vLHDdDceDKWYfyx.jpg', 
      background: '/vUUqzWA2YT45vLHDdDceDKWYfyx.jpg',
      genres: ['Crime', 'Drama'],
      status: 'Ended',
      runtime: '60 min'
    },
    'tt3032476': { 
      name: 'Better Call Saul', 
      year: '2015–2022', 
      rating: '8.8', 
      overview: 'The trials and tribulations of criminal lawyer Jimmy McGill before he became Saul Goodman.',
      poster: '/wFjboP0IXfejVOXFjbRL8QGGbE.jpg', 
      background: '/wFjboP0IXfejVOXFjbRL8QGGbE.jpg',
      genres: ['Crime', 'Drama'],
      status: 'Ended',
      runtime: '46 min'
    },
    'tt1474384': { 
      name: 'Sherlock', 
      year: '2010–2017', 
      rating: '8.8', 
      overview: 'A modern update finds the famous sleuth and his doctor partner solving crime in 21st century London.',
      poster: '/62FDVXEXUg1eqLvToTEuCWUUpH.jpg', 
      background: '/62FDVXEXUg1eqLvToTEuCWUUpH.jpg',
      genres: ['Crime', 'Drama', 'Mystery'],
      status: 'Ended',
      runtime: '89 min'
    },
    'tt6513056': { 
      name: 'The Crown', 
      year: '2016–2023', 
      rating: '8.6', 
      overview: 'Follows the political rivalries and romance of Queen Elizabeth II\'s reign and the events that shaped the second half of the twentieth century.',
      poster: '/BDDllpCTc1nkoFjOFO9jPY9pBDQ.jpg', 
      background: '/BDDllpCTc1nkoFjOFO9jPY9pBDQ.jpg',
      genres: ['Biography', 'Drama', 'History'],
      status: 'Ended',
      runtime: '58 min'
    },
    'tt11965092': { 
      name: 'Ted Lasso', 
      year: '2020–2023', 
      rating: '8.8', 
      overview: 'American football coach Ted Lasso heads to London to manage AFC Richmond, a struggling English Premier League soccer team.',
      poster: '/w2ejMKqbVPwTcgRz2DVpFqTzg5k.jpg', 
      background: '/w2ejMKqbVPwTcgRz2DVpFqTzg5k.jpg',
      genres: ['Comedy', 'Drama', 'Sport'],
      status: 'Ended',
      runtime: '33 min'
    },
    'tt3107288': { 
      name: 'The Flash', 
      year: '2014–2023', 
      rating: '7.7', 
      overview: 'Barry Allen wakes up from a nine-month coma to discover he has super-speed powers.',
      poster: '/W9nytwFeBvbAxFsRAIk30ULNK6l.jpg', 
      background: '/W9nytwFeBvbAxFsRAIk30ULNK6l.jpg',
      genres: ['Action', 'Adventure', 'Fantasy'],
      status: 'Ended',
      runtime: '44 min'
    },
    'tt2707408': { 
      name: 'Rick and Morty', 
      year: '2013–', 
      rating: '8.8', 
      overview: 'Follows the misadventures of an alcoholic scientist Rick and his grandson Morty across infinite realities.',
      poster: '/gdIrmf4lNaxE36LoVuKuzpFuaoD.jpg', 
      background: '/gdIrmf4lNaxE36LoVuKuzpFuaoD.jpg',
      genres: ['Animation', 'Adventure', 'Comedy'],
      status: 'Continuing',
      runtime: '23 min'
    },
    'tt1796966': { 
      name: 'The Walking Dead', 
      year: '2010–2022', 
      rating: '8.1', 
      overview: 'Sheriff\'s deputy Rick Grimes awakens from a coma to find a post-apocalyptic world dominated by flesh-eating zombies.',
      poster: '/xf9wuG9KzW705CilCFB2lsBfJya.jpg', 
      background: '/xf9wuG9KzW705CilCFB2lsBfJya.jpg',
      genres: ['Drama', 'Horror', 'Thriller'],
      status: 'Ended',
      runtime: '44 min'
    }
  };

  const s = seriesData[id] || { 
    name: 'Series Loading...', 
    year: '', 
    rating: '0', 
    overview: 'Loading...', 
    poster: '', 
    background: '',
    genres: [],
    status: 'Continuing',
    runtime: '45 min'
  };

  // Generate episodes - 10 episodes per season, 3 seasons
  const videos = [];
  for (let season = 1; season <= 3; season++) {
    for (let episode = 1; episode <= 10; episode++) {
      videos.push({
        id: id + ':' + season + ':' + episode,
        title: 'Season ' + season + ' Episode ' + episode,
        season: season,
        episode: episode,
        released: new Date(2020 + season, episode, 1).toISOString(),
        overview: s.name + ' - S' + season + 'E' + episode
      });
    }
  }

  return {
    meta: {
      id: id,
      type: 'series',
      name: s.name,
      poster: s.poster ? 'https://image.tmdb.org/t/p/w500' + s.poster : undefined,
      background: s.background ? 'https://image.tmdb.org/t/p/original' + s.background : undefined,
      description: s.overview,
      releaseInfo: s.year,
      runtime: s.runtime,
      imdbRating: s.rating,
      genres: s.genres,
      status: s.status,
      videos: videos,
      behaviorHints: {
        defaultVideoId: id + ':1:1'
      }
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
      description: 'Full HD premium content available for streaming.',
      genres: ['Adult'],
      releaseInfo: new Date().toISOString().substring(0, 4),
      behaviorHints: { 
        adult: true,
        defaultVideoId: id
      }
    }
  };
}

async function handleStream(type, id) {
  switch (type) {
    case 'anime': return getAnimeStream(id);
    case 'movie': return getMovieStream(id);
    case 'series': return getSeriesStream(id);
    case 'other': return getAdultStream(id);
    default: return { streams: [] };
  }
}

async function getAnimeStream(videoId) {
  // Parse video ID format: anime:{animeId}:{season}:{episode}
  const parts = videoId.split(':');
  const animeId = parts[1];
  const episodeNum = parts[3] || '1';

  let embedUrl = 'https://megaplay.buzz/stream/s-2/' + animeId + '/' + episodeNum;

  try {
    const response = await fetch('https://anikotoapi.site/series/' + animeId);
    if (response.ok) {
      const data = await response.json();
      const episodes = data.data?.episodes || [];
      const targetEp = episodes[parseInt(episodeNum) - 1] || episodes[0];
      
      if (targetEp?.embed_url?.sub) {
        embedUrl = targetEp.embed_url.sub;
      } else if (targetEp?.embed_url) {
        embedUrl = Object.values(targetEp.embed_url)[0];
      }
    }
  } catch (e) {
    console.error('Anime stream fetch error:', e);
  }

  return {
    streams: [{
      name: 'HyperStream Anime - SUB',
      url: embedUrl,
      behaviorHints: { 
        notWebReady: false,
        bingeGroup: 'hyperstream-anime-' + animeId
      }
    }]
  };
}

function getMovieStream(videoId) {
  // For movies, videoId should be the same as meta ID (IMDb ID)
  return {
    streams: [{
      name: 'HyperStream Movie - 1080p',
      title: 'Streaming via Videasy Player',
      url: 'https://player.videasy.net/movie/' + videoId.replace('tt', '') + '?autoplay=true',
      behaviorHints: { 
        notWebReady: false,
        iframe: true,
        bingeGroup: 'hyperstream-movie'
      }
    }]
  };
}

function getSeriesStream(videoId) {
  // Parse video ID format: {seriesId}:{season}:{episode}
  const parts = videoId.split(':');
  const seriesId = parts[0].replace('tt', ''); // Remove tt prefix for videasy
  const season = parts[1] || '1';
  const episode = parts[2] || '1';

  return {
    streams: [{
      name: 'HyperStream Series - S' + season + 'E' + episode,
      title: 'Streaming via Videasy Player',
      url: 'https://player.videasy.net/tv/' + seriesId + '/' + season + '/' + episode + '?autoplay=true&next=true',
      behaviorHints: { 
        notWebReady: false,
        iframe: true,
        bingeGroup: 'hyperstream-series-' + seriesId
      }
    }]
  };
}

function getAdultStream(id) {
  const idx = parseInt(id.split(':').pop()) || 1;
  
  return {
    streams: [{
      name: 'Source 1 - Premium',
      url: 'https://www.pornhub.com/embed/' + ((idx * 9973) % 100000000),
      behaviorHints: { 
        notWebReady: false,
        iframe: true,
        adult: true,
        bingeGroup: 'hyperstream-adult'
      }
    }]
  };
}
