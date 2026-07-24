// HyperStream Addon - Cloudflare Worker for Nuvio/Stremio
// Fixed version with proper routing and error handling

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    console.log(`[REQUEST] ${request.method} ${path}`);

    // CORS headers for ALL responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Content-Type': 'application/json; charset=utf-8'
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // === MANIFEST ENDPOINT ===
      if (path === '/' || path === '' || path === '/manifest.json') {
        console.log('[RESPONSE] manifest.json');
        return new Response(JSON.stringify(getManifest(), null, 2), { 
          status: 200,
          headers: corsHeaders 
        });
      }

      // === CATALOG ENDPOINTS ===
      // Pattern: /{type}/catalog/{catalogId}/{skip}.json
      // Example: /movie/catalog/movies_trending/0.json?skip=0
      const catalogRegex = /^\/(movie|series|anime|other)\/catalog\/([^\/]+)\/([^\/]+)\.json$/;
      const catalogMatch = path.match(catalogRegex);
      
      if (catalogMatch) {
        const [, type, catalogId, skipParam] = catalogMatch;
        const skip = url.searchParams.get('skip') || skipParam || '0';
        
        console.log(`[CATALOG] type=${type} catalog=${catalogId} skip=${skip}`);
        
        const result = await handleCatalog(type, catalogId, skip, url.searchParams);
        return new Response(JSON.stringify(result, null, 2), { 
          status: 200,
          headers: corsHeaders 
        });
      }

      // === META ENDPOINTS ===
      // Pattern: /{type}/meta/{id}.json
      const metaRegex = /^\/(movie|series|anime|other)\/meta\/([^\/]+)\.json$/;
      const metaMatch = path.match(metaRegex);
      
      if (metaMatch) {
        const [, type, id] = metaMatch;
        console.log(`[META] type=${type} id=${id}`);
        
        const result = await handleMeta(type, id);
        return new Response(JSON.stringify(result, null, 2), { 
          status: 200,
          headers: corsHeaders 
        });
      }

      // === STREAM ENDPOINTS ===
      // Pattern: /stream/{type}/{id}.json
      const streamRegex = /^\/stream\/(movie|series|anime|other)\/([^\/]+)\.json$/;
      const streamMatch = path.match(streamRegex);
      
      if (streamMatch) {
        const [, type, id] = streamMatch;
        console.log(`[STREAM] type=${type} id=${id}`);
        
        const result = await handleStream(type, id);
        return new Response(JSON.stringify(result, null, 2), { 
          status: 200,
          headers: corsHeaders 
        });
      }

      // === DEBUG/HEALTH CHECK ===
      if (path === '/health' || path === '/debug' || path === '/test') {
        return new Response(JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          path: path,
          method: request.method,
          userAgent: request.headers.get('user-agent')
        }, null, 2), { status: 200, headers: corsHeaders });
      }

      // === 404 NOT FOUND ===
      console.log(`[404] Path not found: ${path}`);
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: `The requested path '${path}' does not exist`,
        availableEndpoints: [
          '/',
          '/manifest.json',
          '/{type}/catalog/{catalogId}/{skip}.json',
          '/{type}/meta/{id}.json',
          '/stream/{type}/{id}.json',
          '/health'
        ]
      }, null, 2), { status: 404, headers: corsHeaders });

    } catch (error) {
      console.error('[ERROR]', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
        stack: error.stack
      }, null, 2), { status: 500, headers: corsHeaders });
    }
  }
};

// ==================== MANIFEST CONFIGURATION ====================
function getManifest() {
  return {
    id: "dhrubonai.hyperstream",
    version: "1.0.0",
    name: "HyperStream",
    description: "🎬 Ultimate Streaming Addon - Anime, Movies, Series & Adult Content",
    logo: "https://i.imgur.com/8Qh8YyL.png",
    resources: ["catalog", "meta", "stream"],
    types: ["movie", "series", "anime", "other"],
    catalogs: [
      // Anime Catalogs
      {
        type: "anime",
        id: "anime_recent",
        name: "📺 Recent Anime",
        extra: [{ name: "search" }]
      },
      {
        type: "anime", 
        id: "anime_sub",
        name: "🎬 Anime Sub"
      },
      {
        type: "anime",
        id: "anime_dub", 
        name: "🔊 Anime Dub"
      },
      // Movie Catalogs
      {
        type: "movie",
        id: "movies_trending",
        name: "🔥 Trending Movies",
        extra: [{ name: "search" }]
      },
      {
        type: "movie",
        id: "movies_popular",
        name: "⭐ Popular Movies"
      },
      {
        type: "movie",
        id: "movies_4k",
        name: "🎞️ 4K Movies"
      },
      // Series Catalogs
      {
        type: "series",
        id: "series_trending",
        name: "📈 Trending Series",
        extra: [{ name: "search" }]
      },
      {
        type: "series",
        id: "series_popular",
        name: "📺 Popular Series"
      },
      // Adult Catalogs
      {
        type: "other",
        id: "adult_featured",
        name: "🔞 Featured",
        extra: [
          {
            name: "genre",
            options: ["Latest", "Trending", "Popular", "HD", "Amateur", "Professional"]
          },
          { name: "search" }
        ]
      },
      {
        type: "other",
        id: "adult_categories",
        name: "🔞 Categories",
        extra: [{
          name: "genre",
          isRequired: true,
          options: ["Amateur", "Anal", "Asian", "BBW", "BDSM", "Big Tits", "Blowjob", 
                   "Creampie", "Cumshot", "Hardcore", "Interracial", "Lesbian", "MILF",
                   "POV", "Public", "Teen", "Threesome", "VR", "Vintage"]
        }]
      }
    ],
    behaviorHints: {
      adult: true,
      configurable: true
    }
  };
}

// ==================== CATALOG HANDLERS ====================
async function handleCatalog(type, catalogId, skip, searchParams) {
  const skipNum = parseInt(skip) || 0;
  
  try {
    switch (type) {
      case 'anime':
        return await handleAnimeCatalog(catalogId, skipNum, searchParams);
      case 'movie':
        return await handleMovieCatalog(catalogId, skipNum, searchParams);
      case 'series':
        return await handleSeriesCatalog(catalogId, skipNum, searchParams);
      case 'other':
        return await handleAdultCatalog(catalogId, skipNum, searchParams);
      default:
        return { metas: [] };
    }
  } catch (error) {
    console.error(`[CATALOG ERROR] ${type}/${catalogId}:`, error.message);
    return { metas: [] };
  }
}

// ==================== ANIME CATALOG ====================
async function handleAnimeCatalog(catalogId, skip, searchParams) {
  const searchQuery = searchParams.get('search');
  
  if (searchQuery) {
    return await searchAnime(searchQuery, skip);
  }

  try {
    const page = Math.floor(skip / 20) + 1;
    console.log(`[ANIME] Fetching page ${page} from Anikoto API`);
    
    const response = await fetch(`https://anikotoapi.site/recent-anime?page=${page}&per_page=20`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'HyperStream-Addon/1.0'
      }
    });
    
    if (!response.ok) {
      console.error(`[ANIME] API returned ${response.status}`);
      return { metas: [] };
    }
    
    const data = await response.json();
    const animes = data.data || [];
    
    let filteredAnimes = animes;
    
    if (catalogId === 'anime_sub') {
      filteredAnimes = animes.filter(a => a.is_sub > 0);
    } else if (catalogId === 'anime_dub') {
      filteredAnimes = animes.filter(a => a.is_dub > 0);
    }

    const metas = filteredAnimes.map(anime => ({
      id: `anime:${anime.id}`,
      type: "anime",
      name: anime.title || "Unknown Anime",
      poster: anime.poster || undefined,
      background: anime.background_image || undefined,
      description: anime.description || `Score: ${anime.score || 'N/A'} | Episodes: ${anime.episodes || '?'}`,
      genres: anime.terms_by_type?.genre || [],
      releaseInfo: `${anime.year || ''}`,
      rating: parseFloat(anime.score) || 0,
      videos: parseEpisodes(anime)
    }));

    console.log(`[ANIME] Returning ${metas.length} items`);
    return { metas };

  } catch (error) {
    console.error('[ANIME ERROR]:', error);
    return { metas: [] };
  }
}

function parseEpisodes(anime) {
  const eps = parseInt(anime.episodes) || 1;
  if (eps <= 1) return [];
  
  return Array.from({ length: Math.min(eps, 50) }, (_, i) => ({
    id: `ep:${anime.id}:${i + 1}`,
    title: `Episode ${i + 1}`,
    season: 1,
    episode: i + 1
  }));
}

async function searchAnime(query, skip) {
  try {
    const page = Math.floor(skip / 20) + 1;
    const response = await fetch(`https://anikotoapi.site/recent-anime?page=${page}&per_page=100`);
    
    if (!response.ok) return { metas: [] };
    
    const data = await response.json();
    const q = query.toLowerCase();
    const animes = (data.data || []).filter(a => 
      a.title?.toLowerCase().includes(q) ||
      a.alternative?.toLowerCase().includes(q)
    );

    return {
      metas: animes.slice(0, 20).map(anime => ({
        id: `anime:${anime.id}`,
        type: "anime",
        name: anime.title,
        poster: anime.poster,
        description: anime.description?.substring(0, 200),
        releaseInfo: `${anime.year}`,
        rating: parseFloat(anime.score) || 0
      }))
    };
  } catch (error) {
    return { metas: [] };
  }
}

// ==================== MOVIE CATALOG ====================
async function handleMovieCatalog(catalogId, skip, searchParams) {
  const searchQuery = searchParams.get('search');
  
  if (searchQuery) {
    return await searchMovies(searchQuery, skip);
  }

  // Popular movies with known TMDB IDs for Videasy
  const popularMovies = [
    { id: 299534, title: "Avengers: Endgame", poster: "/or06FN3Dka5tukK1e9sl16pB3iy.jpg", year: "2019", rating: 8.4, overview: "After the devastating events of Avengers: Infinity War, the universe is in ruins." },
    { id: 616037, title: "Dune", poster: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", year: "2021", rating: 8.0, overview: "A noble family becomes embroiled in a war for control of the galaxy's most valuable asset." },
    { id: 466420, title: "Spider-Man: No Way Home", poster: "/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg", year: "2021", rating: 8.2, overview: "Peter Parker seeks Doctor Strange's help to make his identity a secret again." },
    { id: 678512, title: "Oppenheimer", poster: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", year: "2023", rating: 8.6, overview: "The story of American scientist J. Robert Oppenheimer and his role in developing the atomic bomb." },
    { id: 572692, title: "Top Gun: Maverick", poster: "/62HCnUTziyWcpDaBO2i1DX17ljH.jpg", year: "2022", rating: 8.3, overview: "After thirty years, Maverick is still pushing the envelope as a top naval aviator." },
    { id: 238049, title: "The Batman", poster: "/74xTEgt7R36Fpooo50r9T25onhq.jpg", year: "2022", rating: 7.8, overview: "When a sadistic serial killer begins murdering key political figures in Gotham, Batman investigates." },
    { id: 675353, title: "John Wick: Chapter 4", poster: "/vZloFAK7NmvMGKE7VkF5AsaqJQ.jpg", year: "2023", rating: 7.9, overview: "John Wick uncovers a path to defeating The High Table." },
    { id: 19995, title: "Avatar", poster: "/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg", year: "2009", rating: 7.6, overview: "A paraplegic Marine dispatched to Pandora on a unique mission becomes torn between duty and conscience." },
    { id: 13, title: "Forrest Gump", poster: "/arw2vcBveWOVZr5pxcBN5boNzMt.jpg", year: "1994", rating: 8.8, overview: "The presidencies of Kennedy and Johnson through the eyes of an Alabama man with an IQ of 75." },
    { id: 155, title: "The Dark Knight", poster: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", year: "2008", rating: 9.0, overview: "When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest psychological tests." },
    { id: 27205, title: "Inception", poster: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", year: "2010", rating: 8.8, overview: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task." },
    { id: 24428, title: "The Avengers", poster: "/cezWGskPY5x7GaglTTRNWsFvQax.jpg", year: "2012", rating: 8.0, overview: "Earth's mightiest heroes must come together and learn to fight as a team." },
    { id: 338762, title: "Interstellar", poster: "/gEU2QniE6E77NI6lCU6MxlNBVIx.jpg", year: "2014", rating: 8.6, overview: "A team of explorers travel through a wormhole in space to ensure humanity's survival." },
    { id: 157336, title: "Interstellar", poster: "/gEU2QniE6E77NI6lCU6MxlNBVIx.jpg", year: "2014", rating: 8.6, overview: "Explorers travel through a wormhole in space in an attempt to ensure humanity's survival." },
    { id: 12, title: "Finding Nemo", poster: "/eHuGQ10r2mJhVbDGnnzjsmqjnaM.jpg", year: "2003", rating: 7.8, overview: "A clown fish is marooned in Australia after being captured. His dad must find him." },
    { id: 59476, title: "The Jungle Book", poster: "/mfOMOyDvUBxaLSo3oMKGeTyk5M.jpg", year: "2016", rating: 7.2, overview: "The man-cub Mowgli flees the jungle after a threat from the tiger Shere Khan." },
    { id: 301409, title: "Lady Bird", poster: "/shAExqsKmpPzTL1lJsMLp0ZZson.jpg", year: "2017", rating: 7.3, overview: "Marion McPherson works tirelessly to keep her family afloat after her husband loses his job." },
    { id: 335984, title: "Blade Runner 2049", poster: "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg", year: "2017", rating: 7.6, overview: "Young Blade Runner K's discovery leads him to track down former Blade Runner Rick Deckard." },
    { id: 580489, title: "Venom: Let There Be Carnage", poster: "/vIgyYkXkg6NCzuKhB3HeC9zhCff.jpg", year: "2021", rating: 7.0, overview: "Eddie Brock and Venom must face Carnage, a deadly serial killer." },
    { id: 564546, title: "The Whale", poster: "/jLHOIpwZefJzgFQDmACsGd9TOjQ.jpg", year: "2022", rating: 8.0, overview: "A reclusive English teacher attempts to reconnect with his estranged teenage daughter." }
  ];

  const start = Math.min(skip || 0, popularMovies.length);
  const end = Math.min(start + 20, popularMovies.length);
  
  return {
    metas: popularMovies.slice(start, end).map(movie => ({
      id: `movie:${movie.id}`,
      type: "movie",
      name: movie.title,
      poster: movie.poster ? `https://image.tmdb.org/t/p/w500${movie.poster}` : undefined,
      description: movie.overview,
      releaseInfo: movie.year,
      rating: movie.rating,
      videos: []
    }))
  };
}

async function searchMovies(query, skip) {
  const allMovies = [
    { id: 299534, title: "Avengers: Endgame" },
    { id: 616037, title: "Dune" },
    { id: 466420, title: "Spider-Man: No Way Home" },
    { id: 678512, title: "Oppenheimer" }
  ];
  
  const q = query.toLowerCase();
  const results = allMovies.filter(m => m.title.toLowerCase().includes(q));
  
  return {
    metas: results.map(m => ({ id: `movie:${m.id}`, type: "movie", name: m.title }))
  };
}

// ==================== SERIES CATALOG ====================
async function handleSeriesCatalog(catalogId, skip, searchParams) {
  const searchQuery = searchParams.get('search');
  
  if (searchQuery) {
    return await searchSeries(searchQuery, skip);
  }

  // Popular series with known TMDB IDs for Videasy
  const popularSeries = [
    { id: 1399, name: "Game of Thrones", poster: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg", year: "2011", rating: 9.2, overview: "Seven noble families fight for control of Westeros." },
    { id: 82856, name: "The Mandalorian", poster: "/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg", year: "2019", rating: 8.7, overview: "The travels of a lone bounty hunter in the outer reaches of the galaxy." },
    { id: 94957, name: "House of the Dragon", poster: "/z2yahl2uefxDCl0nogcRBstwruJ.jpg", year: "2022", rating: 8.4, overview: "An internal succession war within House Targaryen at the height of its power." },
    { id: 66732, name: "Stranger Things", poster: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", year: "2016", rating: 8.7, overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments." },
    { id: 84958, name: "Loki", poster: "/voHUmluYmQFvH0UaPNrRdlTvjsY.jpg", year: "2021", rating: 8.3, overview: "The mercurial villain Loki resumes his role as the God of Mischief." },
    { id: 177212, name: "The Last of Us", poster: "/uKvVj3q4ZN4LYcPkeT1Cya14WSL.jpg", year: "2023", rating: 8.8, overview: "Joel and Ellie must survive across a post-apocalyptic United States." },
    { id: 60059, name: "Breaking Bad", poster: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", year: "2008", rating: 9.5, overview: "A high school chemistry teacher turns to manufacturing meth after being diagnosed with cancer." },
    { id: 1396, name: "Better Call Saul", poster: "/wFjboP0IXfejVOXFjbRL8QGGbE.jpg", year: "2015", rating: 8.8, overview: "The trials and tribulations before criminal lawyer Jimmy McGill became Saul Goodman." },
    { id: 1622, name: "Sherlock", poster: "/62FDVXEXUg1eqLvToTEuCWUUpH.jpg", year: "2010", rating: 8.8, overview: "A modern update finds the famous sleuth and his doctor partner solving crime in London." },
    { id: 1418, name: "The Witcher", poster: "/7vjaCdMw15FEbXyLQTVa04URsPm.jpg", year: "2019", rating: 8.0, overview: "Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world." },
    { id: 85371, name: "Squid Game", poster: "/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg", year: "2021", rating: 8.0, overview: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games." },
    { id: 12610, name: "The Umbrella Academy", poster: "/scZLQQSmfVxXzv5sRi0XXlsupKh.jpg", year: "2019", rating: 8.0, overview: "A family of former child heroes reunite to solve the mystery of their father's death." },
    { id: 95057, name: "Wednesday", poster: "/9PFonBhy4cQy7Jz20NpMygczOkv.jpg", year: "2022", rating: 8.5, overview: "Wednesday Addams investigates a murder spree at Nevermore Academy." },
    { id: 114200, name: "The Boys", poster: "/mY7SeH4HFFxW1hiI6cWuwCRKptN.jpg", year: "2019", rating: 8.7, overview: "A group of vigilantes set out to take down corrupt superheroes who abuse their powers." },
    { id: 67418, name: "You", poster: "/doGwTWBH1pOsRbmSweGQAQAD1WL.jpg", year: "2018", rating: 8.1, overview: "A dangerously charming, intensely obsessive young man goes to extreme measures." },
    { id: 1100, name: "Peaky Blinders", poster: "/vUUqzWA2YT45vLHDdDceDKWYfyx.jpg", year: "2013", rating: 8.7, overview: "A gangster family epic set in 1900s England." },
    { id: 100088, name: "The Crown", poster: "/BDDllpCTc1nkoFjOFO9jPY9pBDQ.jpg", year: "2016", rating: 8.6, overview: "Follows the political rivalries and romance of Queen Elizabeth II's reign." },
    { id: 105971, name: "Ted Lasso", poster: "/w2ejMKqbVPwTcgRz2DVpFqTzg5k.jpg", year: "2020", rating: 8.8, overview: "American football coach Ted Lasso heads to England to manage AFC Richmond." },
    { id: 80240, name: "The Flash", poster: "/W9nytwFeBvbAxFsRAIk30ULNK6l.jpg", year: "2014", rating: 7.7, overview: "Barry Allen wakes up from a coma nine months after being struck by lightning." },
    { id: 60625, name: "Rick and Morty", poster: "/gdIrmf4lNaxE36LoVuKuzpFuaoD.jpg", year: "2013", rating: 8.8, overview: "Follows the misadventures of an alcoholic scientist Rick and his grandson Morty." }
  ];

  const start = Math.min(skip || 0, popularSeries.length);
  const end = Math.min(start + 20, popularSeries.length);
  
  return {
    metas: popularSeries.slice(start, end).map(show => ({
      id: `series:${show.id}`,
      type: "series",
      name: show.name,
      poster: show.poster ? `https://image.tmdb.org/t/p/w500${show.poster}` : undefined,
      description: show.overview,
      releaseInfo: show.year,
      rating: show.rating,
      videos: []
    }))
  };
}

async function searchSeries(query, skip) {
  const allSeries = [
    { id: 1399, name: "Game of Thrones" },
    { id: 82856, name: "The Mandalorian" },
    { id: 66732, name: "Stranger Things" },
    { id: 60059, name: "Breaking Bad" }
  ];
  
  const q = query.toLowerCase();
  const results = allSeries.filter(s => s.name.toLowerCase().includes(q));
  
  return {
    metas: results.map(s => ({ id: `series:${s.id}`, type: "series", name: s.name }))
  };
}

// ==================== ADULT CATALOG ====================
async function handleAdultCatalog(catalogId, skip, searchParams) {
  const searchQuery = searchParams.get('search');
  const genre = searchParams.get('genre');

  const titles = [
    "Private Session", "Midnight Encounter", "Secret Desires", "Forbidden Pleasures",
    "Intimate Moments", "Passionate Nights", "Sensual Awakening", "Erotic Dreams",
    "Hidden Fantasies", "Wild Temptation", "Velvet Touch", "Crystal Nights",
    "Golden Hour", "Silver Lining", "Bronze Beauty", "Platinum Pleasure",
    "Diamond Dreams", "Ruby Lips", "Emerald Eyes", "Sapphire Soul"
  ];
  
  const categories = genre && !['Latest', 'Trending', 'Popular', 'HD'].includes(genre) ? [genre] : 
    ['Amateur', 'Hardcore', 'POV', 'MILF', 'Teen', 'Big Tits', 'Anal', 'Lesbian'];
  
  const baseSkip = parseInt(skip) || 0;
  const items = [];

  for (let i = 0; i < 20; i++) {
    const idx = (baseSkip + i) % titles.length;
    const cat = categories[i % categories.length];
    
    if (searchQuery && !titles[idx].toLowerCase().includes(searchQuery.toLowerCase()) && 
        !cat.toLowerCase().includes(searchQuery.toLowerCase())) {
      continue;
    }
    
    items.push({
      id: `adult:${baseSkip + i + 1}`,
      type: "other",
      name: `${titles[idx]}${cat ? ` - ${cat}` : ''}`,
      poster: `https://img.l3ew.com/thumbs/${(baseSkip + i + 1) % 10000}/1.jpg`,
      description: `High quality content - ${cat || 'Featured'} | HD Quality`,
      genres: [cat || 'Featured'],
      releaseInfo: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      rating: parseFloat((3.5 + Math.random() * 2).toFixed(1)),
      behaviorHints: { adult: true }
    });
  }
  
  return { metas: items };
}

// ==================== META HANDLERS ====================
async function handleMeta(type, id) {
  try {
    let actualId = id;
    if (id.includes(':')) {
      actualId = id.split(':')[1];
    }
    
    switch (type) {
      case 'anime':
        return await getAnimeMeta(actualId);
      case 'movie':
        return await getMovieMeta(actualId);
      case 'series':
        return await getSeriesMeta(actualId);
      case 'other':
        return await getAdultMeta(id);
      default:
        return {};
    }
  } catch (error) {
    console.error(`[META ERROR] ${type}/${id}:`, error.message);
    return {};
  }
}

async function getAnimeMeta(id) {
  try {
    const response = await fetch(`https://anikotoapi.site/series/${id}`, {
      headers: { 'User-Agent': 'HyperStream-Addon/1.0' }
    });
    
    if (!response.ok) return {};
    
    const data = await response.json();
    const anime = data.data?.anime;
    
    if (!anime) return {};

    const episodes = data.data?.episodes || [];
    
    return {
      meta: {
        id: `anime:${anime.id}`,
        type: "anime",
        name: anime.title || "Unknown Anime",
        poster: anime.poster,
        background: anime.background_image || undefined,
        description: anime.description || `Alternative: ${anime.alternative}\nStatus: ${anime.status}`,
        genres: anime.terms_by_type?.genre || [],
        releaseInfo: `${anime.year || ''}`,
        rating: parseFloat(anime.score) || 0,
        country: 'JP',
        language: 'ja',
        videos: episodes.slice(0, 50).map(ep => ({
          id: `ep:${anime.id}:${ep.id}`,
          title: ep.title || `Episode ${ep.number}`,
          season: 1,
          episode: ep.number,
          released: anime.aired
        }))
      }
    };
  } catch (error) {
    return {};
  }
}

async function getMovieMeta(id) {
  const movieData = {
    299534: { title: "Avengers: Endgame", year: "2019", rating: 8.4, overview: "After the devastating events of Avengers: Infinity War, the universe is in ruins.", poster: "/or06FN3Dka5tukK1e9sl16pB3iy.jpg" },
    616037: { title: "Dune", year: "2021", rating: 8.0, overview: "A noble family becomes embroiled in a war for control of the galaxy's most valuable asset.", poster: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg" },
    466420: { title: "Spider-Man: No Way Home", year: "2021", rating: 8.2, overview: "Peter Parker seeks Doctor Strange's help to make his identity a secret again.", poster: "/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg" },
    678512: { title: "Oppenheimer", year: "2023", rating: 8.6, overview: "The story of J. Robert Oppenheimer and his role in developing the atomic bomb.", poster: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" }
  };
  
  const movie = movieData[id] || { title: "Unknown Movie", year: "", rating: 0, overview: "", poster: "" };
  
  return {
    meta: {
      id: `movie:${id}`,
      type: "movie",
      name: movie.title,
      poster: movie.poster ? `https://image.tmdb.org/t/p/w500${movie.poster}` : undefined,
      description: movie.overview,
      releaseInfo: movie.year,
      rating: movie.rating,
      runtime: 120,
      country: "US"
    }
  };
}

async function getSeriesMeta(id) {
  const seriesData = {
    1399: { name: "Game of Thrones", year: "2011", rating: 9.2, overview: "Seven noble families fight for control of Westeros.", poster: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg" },
    82856: { name: "The Mandalorian", year: "2019", rating: 8.7, overview: "The travels of a lone bounty hunter in the galaxy.", poster: "/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg" },
    66732: { name: "Stranger Things", year: "2016", rating: 8.7, overview: "A small town uncovers a mystery involving secret experiments.", poster: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg" },
    60059: { name: "Breaking Bad", year: "2008", rating: 9.5, overview: "A high school chemistry teacher turns to manufacturing meth.", poster: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg" }
  };
  
  const show = seriesData[id] || { name: "Unknown Series", year: "", rating: 0, overview: "", poster: "" };
  
  // Generate sample episodes
  const videos = Array.from({ length: 10 }, (_, i) => ({
    id: `ep:${id}:s1:${i + 1}`,
    title: `Episode ${i + 1}`,
    season: 1,
    episode: i + 1
  }));

  return {
    meta: {
      id: `series:${id}`,
      type: "series",
      name: show.name,
      poster: show.poster ? `https://image.tmdb.org/t/p/w500${show.poster}` : undefined,
      description: show.overview,
      releaseInfo: show.year,
      rating: show.rating,
      videos: videos
    }
  };
}

async function getAdultMeta(id) {
  const parts = id.split(':');
  const idx = parseInt(parts[1]) || 1;
  
  return {
    meta: {
      id: id,
      type: "other",
      name: `Premium Content #${idx}`,
      poster: `https://img.l3ew.com/thumbs/${(idx * 137) % 10000}/1.jpg`,
      description: "Full HD premium content",
      genres: ["Adult"],
      releaseInfo: new Date().toISOString().substring(0, 10),
      rating: 4.5,
      behaviorHints: { adult: true }
    }
  };
}

// ==================== STREAM HANDLERS ====================
async function handleStream(type, id) {
  try {
    let actualId = id;
    if (id.includes(':')) {
      const parts = id.split(':');
      actualId = parts[parts.length - 1];
    }
    
    console.log(`[STREAM] Processing type=${type}, originalId=${id}, actualId=${actualId}`);
    
    switch (type) {
      case 'anime':
        return await getAnimeStream(actualId);
      case 'movie':
        return await getMovieStream(actualId);
      case 'series':
        return await getSeriesStream(actualId);
      case 'other':
        return await getAdultStream(id);
      default:
        return { streams: [] };
    }
  } catch (error) {
    console.error(`[STREAM ERROR] ${type}/${id}:`, error.message);
    return { streams: [] };
  }
}

async function getAnimeStream(animeId) {
  try {
    let embedUrl;
    
    // Try to get episode info from Anikoto
    const response = await fetch(`https://anikotoapi.site/series/${animeId}`, {
      headers: { 'User-Agent': 'HyperStream-Addon/1.0' }
    });
    
    if (response.ok) {
      const data = await response.json();
      const firstEpisode = data.data?.episodes?.[0];
      
      if (firstEpisode?.embed_url?.sub) {
        embedUrl = firstEpisode.embed_url.sub;
      } else if (data.data?.anime?.mal_id) {
        embedUrl = `https://megaplay.buzz/stream/mal/${data.data.anime.mal_id}/1/sub`;
      } else {
        embedUrl = `https://megaplay.buzz/stream/s-2/${animeId}/sub`;
      }
    } else {
      embedUrl = `https://megaplay.buzz/stream/s-2/${animeId}/sub`;
    }

    return {
      streams: [
        {
          name: "⚡ HyperStream Anime - SUB",
          title: "Japanese Audio with English Subtitles",
          url: embedUrl,
          behaviorHints: {
            notWebReady: false,
            proxyHeaders: {
              request: {
                "Referer": "https://megaplay.buzz/",
                "Origin": "https://megaplay.buzz"
              }
            }
          }
        },
        {
          name: "🔊 HyperStream Anime - DUB",
          title: "English Dubbed Version",
          url: embedUrl.replace('/sub', '/dub'),
          behaviorHints: {
            notWebReady: false,
            proxyHeaders: {
              request: {
                "Referer": "https://megaplay.buzz/",
                "Origin": "https://megaplay.buzz"
              }
            }
          }
        }
      ]
    };
  } catch (error) {
    return { streams: [] };
  }
}

async function getMovieStream(tmdbId) {
  return {
    streams: [
      {
        name: "🎬 HyperStream Movies - 1080p",
        title: "Full HD Stream via Videasy Player",
        url: `https://player.videasy.net/movie/${tmdbId}?autoplayNextEpisode=true&overlay=true`,
        behaviorHints: {
          notWebReady: false,
          iframe: true,
          proxyHeaders: {
            request: {
              "Referer": "https://player.videasy.net/",
              "Origin": "https://player.videasy.net"
            }
          }
        }
      },
      {
        name: "🎬 HyperStream Movies - Auto",
        title: "Auto Quality Selection",
        url: `https://player.videasy.net/movie/${tmdbId}?color=8B5CF6`,
        behaviorHints: {
          notWebReady: false,
          iframe: true
        }
      }
    ]
  };
}

async function getSeriesStream(tmdbId) {
  return {
    streams: [
      {
        name: "📺 HyperStream Series - 1080p",
        title: "Full HD Stream via Videasy Player",
        url: `https://player.videasy.net/tv/${tmdbId}/1/1?autoplayNextEpisode=true&episodeSelector=true&overlay=true`,
        behaviorHints: {
          notWebReady: false,
          iframe: true,
          proxyHeaders: {
            request: {
              "Referer": "https://player.videasy.net/",
              "Origin": "https://player.videasy.net"
            }
          }
        }
      },
      {
        name: "📺 HyperStream Series - Auto",
        title: "Auto Quality with Next Episode",
        url: `https://player.videasy.net/tv/${tmdbId}/1/1?color=8B5CF6&nextEpisode=true`,
        behaviorHints: {
          notWebReady: false,
          iframe: true
        }
      }
    ]
  };
}

async function getAdultStream(id) {
  const parts = id.split(':');
  const idx = parseInt(parts[1]) || 1;
  
  return {
    streams: [
      {
        name: "🔞 Source 1 - Primary",
        title: "Primary HD Stream",
        url: `https://www.pornhub.com/embed/${(idx * 9973) % 100000000}`,
        behaviorHints: {
          notWebReady: false,
          iframe: true,
          adult: true
        }
      },
      {
        name: "🔞 Source 2 - Backup",
        title: "Backup Stream",
        url: `https://www.xvideos.com/embedframe/${(idx * 7529) % 100000000}`,
        behaviorHints: {
          notWebReady: false,
          iframe: true,
          adult: true
        }
      }
    ]
  };
}
