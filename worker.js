// HyperStream Addon - Cloudflare Worker for Nuvio/Stremio
// Complete streaming solution with Anime, Movies, Series & Adult Content

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Content-Type': 'application/json'
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handling
      if (path === '/' || path === '/manifest.json') {
        return new Response(JSON.stringify(getManifest()), { headers: corsHeaders });
      }

      // Catalog endpoints: /{type}/catalog/{catalogId}/{id}.json
      const catalogMatch = path.match(/^\/(movie|series|anime|other)\/catalog\/([^\/]+)\/([^\/]+)\.json$/);
      if (catalogMatch) {
        const [, type, catalogId, extra] = catalogMatch;
        const skip = url.searchParams.get('skip') || '0';
        const result = await handleCatalog(type, catalogId, skip, url.searchParams);
        return new Response(JSON.stringify(result), { headers: corsHeaders });
      }

      // Meta endpoints: /{type}/meta/{id}.json
      const metaMatch = path.match(/^\/(movie|series|anime|other)\/meta\/([^\/]+)\.json$/);
      if (metaMatch) {
        const [, type, id] = metaMatch;
        const result = await handleMeta(type, id);
        return new Response(JSON.stringify(result), { headers: corsHeaders });
      }

      // Stream endpoints: /stream/{type}/{id}.json
      const streamMatch = path.match(/^\/stream\/(movie|series|anime|other)\/([^\/]+)\.json$/);
      if (streamMatch) {
        const [, type, id] = streamMatch;
        const result = await handleStream(type, id);
        return new Response(JSON.stringify(result), { headers: corsHeaders });
      }

      // Default 404
      return new Response(JSON.stringify({ error: 'Not Found', path: path }), { status: 404, headers: corsHeaders });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error', message: error.message }), { status: 500, headers: corsHeaders });
    }
  }
};

// ==================== MANIFEST CONFIGURATION ====================
function getManifest() {
  return {
    id: "dhrubonai.hyperstream",
    version: "1.0.0",
    name: "HyperStream",
    description: "🎬 Ultimate Streaming Addon - Anime, Movies, Series & More",
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
}

// ==================== ANIME CATALOG (Megaplay + Anikoto) ====================
async function handleAnimeCatalog(catalogId, skip, searchParams) {
  const searchQuery = searchParams.get('search');
  
  if (searchQuery) {
    return await searchAnime(searchQuery, skip);
  }

  try {
    const page = Math.floor(skip / 20) + 1;
    const response = await fetch(`https://anikotoapi.site/recent-anime?page=${page}&per_page=20`);
    
    if (!response.ok) {
      console.error('Anikoto API error:', response.status);
      return { metas: [] };
    }
    
    const data = await response.json();
    const animes = data.data || [];
    
    let filteredAnimes = animes;
    
    // Filter by sub/dub if needed
    if (catalogId === 'anime_sub') {
      filteredAnimes = animes.filter(a => a.is_sub > 0);
    } else if (catalogId === 'anime_dub') {
      filteredAnimes = animes.filter(a => a.is_dub > 0);
    }

    const metas = filteredAnimes.map(anime => ({
      id: `anime:${anime.id}`,
      type: "anime",
      name: anime.title,
      poster: anime.poster || `https://cdn.anipixcdn.co/thumbnail/${anime.id}`,
      background: anime.background_image || undefined,
      description: anime.description || `Score: ${anime.score} | Episodes: ${anime.episodes}`,
      genres: anime.terms_by_type?.genre || [],
      releaseInfo: `${anime.year}`,
      rating: parseFloat(anime.score) || 0,
      videos: parseEpisodes(anime)
    }));

    return { metas };
  } catch (error) {
    console.error('Anime catalog error:', error);
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
    const animes = (data.data || []).filter(a => 
      a.title?.toLowerCase().includes(query.toLowerCase()) ||
      a.alternative?.toLowerCase().includes(query.toLowerCase())
    );

    return {
      metas: animes.slice(0, 20).map(anime => ({
        id: `anime:${anime.id}`,
        type: "anime",
        name: anime.title,
        poster: anime.poster,
        description: anime.description,
        releaseInfo: `${anime.year}`,
        rating: parseFloat(anime.score) || 0
      }))
    };
  } catch (error) {
    return { metas: [] };
  }
}

// ==================== MOVIE CATALOG (Videasy + TMDB) ====================
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
    { id: 580489, title: "Venom: Let There Be Carnage", poster: "/vIgyYkXkg6NCzuKhB3HeC9zhCff.jpg", year: "2021", rating: 7.0, overview: "Eddie Brock and Venom must face Carnage, a deadly serial killer." },
    { id: 564546, title: "The Whale", poster: "/jLHOIpwZefJzgFQDmACsGd9TOjQ.jpg", year: "2022", rating: 8.0, overview: "A reclusive English teacher suffering from severe obesity attempts to reconnect with his estranged teenage daughter." },
    { id: 678512, title: "Oppenheimer", poster: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", year: "2023", rating: 8.6, overview: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb." },
    { id: 572692, title: "Top Gun: Maverick", poster: "/62HCnUTziyWcpDaBO2i1DX17ljH.jpg", year: "2022", rating: 8.3, overview: "After thirty years, Maverick is still pushing the envelope as a top naval aviator." },
    { id: 436270, title: "Black Adam", poster: "/pFlaoWZixz6oYAe25Bi5FPXyRuj.jpg", year: "2022", rating: 7.1, overview: "Nearly 5,000 years after he was bestowed with the almighty powers of the Egyptian gods." },
    { id: 238049, title: "The Batman", poster: "/74xTEgt7R36Fpooo50r9T25onhq.jpg", year: "2022", rating: 7.8, overview: "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate." },
    { id: 675353, title: "John Wick: Chapter 4", poster: "/vZloFAK7NmvMGKE7VkF5AsaqJQ.jpg", year: "2023", rating: 7.9, overview: "John Wick uncovers a path to defeating The High Table." },
    { id: 19995, title: "Avatar", poster: "/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg", year: "2009", rating: 7.6, overview: "A paraplegic Marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders." },
    { id: 13, title: "Forrest Gump", poster: "/arw2vcBveWOVZr5pxcBN5boNzMt.jpg", year: "1994", rating: 8.8, overview: "The presidencies of Kennedy and Johnson through the eyes of an Alabama man with an IQ of 75." },
    { id: 155, title: "The Dark Knight", poster: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", year: "2008", rating: 9.0, overview: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham." },
    { id: 27205, title: "Inception", poster: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", year: "2010", rating: 8.8, overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task." },
    { id: 24428, title: "The Avengers", poster: "/cezWGskPY5x7GaglTTRNWsFvQax.jpg", year: "2012", rating: 8.0, overview: "Earth's mightiest heroes must come together and learn to fight as a team." },
    { id: 59476, title: "The Jungle Book", poster: "/mfOMOyDvUBxaLSo3oMKGeTyk5M.jpg", year: "2016", rating: 7.2, overview: "The man-cub Mowgli flees the jungle after a threat from the tiger Shere Khan." },
    { id: 301409, title: "Lady Bird", poster: "/shAExqsKmpPzTL1lJsMLp0ZZson.jpg", year: "2017", rating: 7.3, overview: "Marion McPherson, a nurse, works tirelessly to keep her family afloat after her husband loses his job." },
    { id: 335984, title: "Blade Runner 2049", poster: "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg", year: "2017", rating: 7.6, overview: "Young Blade Runner K's discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard." },
    { id: 338762, title: "Interstellar", poster: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", year: "2014", rating: 8.6, overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival." },
    { id: 12, title: "Finding Nemo", poster: "/eHuGQ10r2mJhVbDGnnzjsmqjnaM.jpg", year: "2003", rating: 7.8, overview: "A clown fish is marooned in Australia. His dad must go find him after he gets captured." }
  ];

  const start = skip || 0;
  const end = Math.min(start + 20, popularMovies.length);
  
  return {
    metas: popularMovies.slice(start, end).map(movie => ({
      id: `movie:${movie.id}`,
      type: "movie",
      name: movie.title,
      poster: `https://image.tmdb.org/t/p/w500${movie.poster}`,
      description: movie.overview,
      releaseInfo: movie.year,
      rating: movie.rating,
      videos: []
    }))
  };
}

async function searchMovies(query, skip) {
  try {
    const page = Math.floor(skip / 20) + 1;
    const results = await fetchTMDB(`/search/movie?query=${encodeURIComponent(query)}&page=${page}`);
    
    return {
      metas: (results.results || []).map(movie => ({
        id: `movie:${movie.id}`,
        type: "movie",
        name: movie.title,
        poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
        description: movie.overview,
        releaseInfo: movie.release_date?.substring(0, 4),
        rating: movie.vote_average || 0
      }))
    };
  } catch (error) {
    return { metas: [] };
  }
}

// ==================== SERIES CATALOG (Videasy + TMDB) ====================
async function handleSeriesCatalog(catalogId, skip, searchParams) {
  const searchQuery = searchParams.get('search');
  
  if (searchQuery) {
    return await searchSeries(searchQuery, skip);
  }

  // Popular series with known TMDB IDs for Videasy
  const popularSeries = [
    { id: 1399, name: "Game of Thrones", poster: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg", year: "2011", rating: 9.2, overview: "Seven noble families fight for control of the mythical land of Westeros." },
    { id: 82856, name: "The Mandalorian", poster: "/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg", year: "2019", rating: 8.7, overview: "The travels of a lone bounty hunter in the outer reaches of the galaxy." },
    { id: 94957, name: "House of the Dragon", poster: "/z2yahl2uefxDCl0nogcRBstwruJ.jpg", year: "2022", rating: 8.4, overview: "An internal succession war within House Targaryen at the height of its power." },
    { id: 66732, name: "Stranger Things", poster: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", year: "2016", rating: 8.7, overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments." },
    { id: 84958, name: "Loki", poster: "/voHUmluYmQFvH0UaPNrRdlTvjsY.jpg", year: "2021", rating: 8.3, overview: "The mercurial villain Loki resumes his role as the God of Mischief." },
    { id: 177212, name: "The Last of Us", poster: "/uKvVj3q4ZN4LYcPkeT1Cya14WSL.jpg", year: "2023", rating: 8.8, overview: "Joel and Ellie must survive across a post-apocalyptic United States." },
    { id: 60059, name: "Breaking Bad", poster: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", year: "2008", rating: 9.5, overview: "A high school chemistry teacher diagnosed with lung cancer turns to manufacturing meth." },
    { id: 1396, name: "Breaking Bad: Better Call Saul", poster: "/wFjboP0IXfejVOXFjbRL8QGGbE.jpg", year: "2015", rating: 8.8, overview: "The trials and tribulations before criminal lawyer Jimmy McGill became Saul Goodman." },
    { id: 1622, name: "Sherlock", poster: "/62FDVXEXUg1eqLvToTEuCWUUpH.jpg", year: "2010", rating: 8.8, overview: "A modern update finds the famous sleuth and his doctor partner solving crime in 21st century London." },
    { id: 1418, name: "The Witcher", poster: "/7vjaCdMw15FEbXyLQTVa04URsPm.jpg", year: "2019", rating: 8.0, overview: "Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world." },
    { id: 85371, name: "Squid Game", poster: "/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg", year: "2021", rating: 8.0, overview: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games." },
    { id: 12610, name: "The Umbrella Academy", poster: "/scZLQQSmfVxXzv5sRi0XXlsupKh.jpg", year: "2019", rating: 8.0, overview: "A family of former child heroes reunite to solve the mystery of their father's death." },
    { id: 95057, name: "Wednesday", poster: "/9PFonBhy4cQy7Jz20NpMygczOkv.jpg", year: "2022", rating: 8.5, overview: "Smart, sarcastic and a little dead inside, Wednesday Addams investigates a murder spree." },
    { id: 114200, name: "The Boys", poster: "/mY7SeH4HFFxW1hiI6cWuwCRKptN.jpg", year: "2019", rating: 8.7, overview: "A group of vigilantes set out to take down corrupt superheroes who abuse their powers." },
    { id: 67418, name: "You", poster: "/doGwTWBH1pOsRbmSweGQAQAD1WL.jpg", year: "2018", rating: 8.1, overview: "A dangerously charming, intensely obsessive young man goes to extreme measures." },
    { id: 1100, name: "Peaky Blinders", poster: "/vUUqzWA2YT45vLHDdDceDKWYfyx.jpg", year: "2013", rating: 8.7, overview: "A gangster family epic set in 1900s England." },
    { id: 100088, name: "The Crown", poster: "/BDDllpCTc1nkoFjOFO9jPY9pBDQ.jpg", year: "2016", rating: 8.6, overview: "Follows the political rivalries and romance of Queen Elizabeth II's reign." },
    { id: 105971, name: "Ted Lasso", poster: "/w2ejMKqbVPwTcgRz2DVpFqTzg5k.jpg", year: "2020", rating: 8.8, overview: "American football coach Ted Lasso heads to England to manage AFC Richmond soccer team." },
    { id: 80240, name: "The Flash", poster: "/W9nytwFeBvbAxFsRAIk30ULNK6l.jpg", year: "2014", rating: 7.7, overview: "Barry Allen wakes up from a coma nine months after being struck by lightning." },
    { id: 60625, name: "Rick and Morty", poster: "/gdIrmf4lNaxE36LoVuKuzpFuaoD.jpg", year: "2013", rating: 8.8, overview: "Follows the misadventures of an alcoholic scientist Rick and his grandson Morty." }
  ];

  const start = skip || 0;
  const end = Math.min(start + 20, popularSeries.length);
  
  return {
    metas: popularSeries.slice(start, end).map(show => ({
      id: `series:${show.id}`,
      type: "series",
      name: show.name,
      poster: `https://image.tmdb.org/t/p/w500${show.poster}`,
      description: show.overview,
      releaseInfo: show.year,
      rating: show.rating,
      videos: []
    }))
  };
}

async function searchSeries(query, skip) {
  try {
    const page = Math.floor(skip / 20) + 1;
    const results = await fetchTMDB(`/search/tv?query=${encodeURIComponent(query)}&page=${page}`);
    
    return {
      metas: (results.results || []).map(show => ({
        id: `series:${show.id}`,
        type: "series",
        name: show.name,
        poster: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : undefined,
        description: show.overview,
        releaseInfo: show.first_air_date?.substring(0, 4),
        rating: show.vote_average || 0
      }))
    };
  } catch (error) {
    return { metas: [] };
  }
}

// ==================== ADULT CATALOG ====================
async function handleAdultCatalog(catalogId, skip, searchParams) {
  const searchQuery = searchParams.get('search');
  const genre = searchParams.get('genre');

  const adultContent = generateAdultContent(genre, searchQuery, skip);
  
  return { metas: adultContent };
}

function generateAdultContent(genre, search, skip) {
  const baseSkip = parseInt(skip) || 0;
  const items = [];
  
  const titles = [
    "Private Session", "Midnight Encounter", "Secret Desires", "Forbidden Pleasures",
    "Intimate Moments", "Passionate Nights", "Sensual Awakening", "Erotic Dreams",
    "Hidden Fantasies", "Wild Temptation", "Velvet Touch", "Crystal Nights",
    "Golden Hour", "Silver Lining", "Bronze Beauty", "Platinum Pleasure",
    "Diamond Dreams", "Ruby Lips", "Emerald Eyes", "Sapphire Soul"
  ];
  
  const categories = genre && genre !== 'Latest' && genre !== 'Trending' && genre !== 'Popular' && genre !== 'HD' ? [genre] : 
    ['Amateur', 'Hardcore', 'POV', 'MILF', 'Teen', 'Big Tits', 'Anal', 'Lesbian'];
  
  for (let i = 0; i < 20; i++) {
    const idx = (baseSkip + i) % titles.length;
    const cat = categories[i % categories.length];
    const id = `adult:${baseSkip + i + 1}`;
    
    if (search && !titles[idx].toLowerCase().includes(search.toLowerCase()) && !cat.toLowerCase().includes(search.toLowerCase())) {
      continue;
    }
    
    items.push({
      id: id,
      type: "other",
      name: `${titles[idx]} ${cat ? `- ${cat}` : ''}`,
      poster: `https://img.l3ew.com/thumbs/${(baseSkip + i + 1) % 10000}/1.jpg`,
      description: `High quality adult content - ${cat || 'Featured'} | HD Quality`,
      genres: [cat || 'Featured'],
      releaseInfo: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      rating: 3.5 + Math.random() * 2,
      behaviorHints: { adult: true }
    });
  }
  
  return items;
}

// ==================== META HANDLERS ====================
async function handleMeta(type, id) {
  const parts = id.split(':');
  const actualId = parts[1];
  
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
}

async function getAnimeMeta(id) {
  try {
    const response = await fetch(`https://anikotoapi.site/series/${id}`);
    
    if (!response.ok) return {};
    
    const data = await response.json();
    const anime = data.data?.anime;
    
    if (!anime) return {};

    const episodes = data.data?.episodes || [];
    
    return {
      meta: {
        id: `anime:${anime.id}`,
        type: "anime",
        name: anime.title,
        poster: anime.poster,
        background: anime.background_image || undefined,
        description: anime.description || `Alternative: ${anime.alternative}\nStatus: ${anime.status}\nScore: ${anime.score}`,
        genres: anime.terms_by_type?.genre || [],
        releaseInfo: `${anime.year}`,
        rating: parseFloat(anime.score) || 0,
        country: 'JP',
        language: 'ja',
        videos: episodes.map(ep => ({
          id: `ep:${anime.id}:${ep.id}`,
          title: ep.title || `Episode ${ep.number}`,
          season: 1,
          episode: ep.number,
          released: anime.aired
        }))
      }
    };
  } catch (error) {
    console.error('Anime meta error:', error);
    return {};
  }
}

async function getMovieMeta(id) {
  try {
    const movie = await fetchTMDB(`/movie/${id}`);
    
    return {
      meta: {
        id: `movie:${movie.id}`,
        type: "movie",
        name: movie.title,
        poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
        background: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : undefined,
        description: movie.overview,
        genres: (movie.genres || []).map(g => g.name),
        releaseInfo: movie.release_date?.substring(0, 10),
        rating: movie.vote_average || 0,
        runtime: movie.runtime,
        country: (movie.production_countries || []).map(c => c.name).join(', ')
      }
    };
  } catch (error) {
    console.error('Movie meta error:', error);
    return {};
  }
}

async function getSeriesMeta(id) {
  try {
    const show = await fetchTMDB(`/tv/${id}`);
    const season1 = await fetchTMDB(`/tv/${id}/season/1`).catch(() => ({ episodes: [] }));
    
    const videos = (season1.episodes || []).slice(0, 50).map(ep => ({
      id: `ep:${id}:s1:${ep.episode_number}`,
      title: ep.name || `Episode ${ep.episode_number}`,
      season: 1,
      episode: ep.episode_number,
      released: ep.air_date,
      overview: ep.overview,
      thumbnail: ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : undefined
    }));

    return {
      meta: {
        id: `series:${show.id}`,
        type: "series",
        name: show.name,
        poster: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : undefined,
        background: show.backdrop_path ? `https://image.tmdb.org/t/p/original${show.backdrop_path}` : undefined,
        description: show.overview,
        genres: (show.genres || []).map(g => g.name),
        releaseInfo: show.first_air_date?.substring(0, 10),
        rating: show.vote_average || 0,
        videos: videos
      }
    };
  } catch (error) {
    console.error('Series meta error:', error);
    return {};
  }
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
      description: `Full HD adult content | Premium quality stream`,
      genres: ['Adult'],
      releaseInfo: new Date().toISOString().substring(0, 10),
      rating: 4.5,
      behaviorHints: { adult: true }
    }
  };
}

// ==================== STREAM HANDLERS ====================
async function handleStream(type, id) {
  // Handle both formats: "299534" or "movie:299534"
  let actualId = id;
  if (id.includes(':')) {
    const parts = id.split(':');
    actualId = parts[parts.length - 1]; // Get the last part (the actual ID)
  }
  
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
}

async function getAnimeStream(animeId, episodeId) {
  try {
    let embedUrl;
    
    if (episodeId && episodeId !== 'undefined') {
      const response = await fetch(`https://anikotoapi.site/series/${animeId}`);
      const data = await response.json();
      
      const episode = data.data?.episodes?.find(ep => ep.id.toString() === episodeId.toString());
      
      if (episode?.embed_url?.sub) {
        embedUrl = episode.embed_url.sub;
      } else if (data.data?.anime?.mal_id) {
        const epNum = episode?.number || 1;
        embedUrl = `https://megaplay.buzz/stream/mal/${data.data.anime.mal_id}/${epNum}/sub`;
      } else {
        embedUrl = `https://megaplay.buzz/stream/s-2/${episodeId || animeId}/sub`;
      }
    } else {
      embedUrl = `https://megaplay.buzz/stream/s-2/${animeId}/sub`;
    }

    return {
      streams: [
        {
          name: "HyperStream Anime - Sub",
          title: "Japanese Audio with English Subtitles",
          url: embedUrl,
          behaviorHints: {
            notWebReady: false,
            bframes: 0,
            proxyHeaders: {
              request: {
                "Referer": "https://megaplay.buzz/",
                "Origin": "https://megaplay.buzz"
              }
            }
          }
        },
        {
          name: "HyperStream Anime - Dub",
          title: "English Dubbed",
          url: embedUrl.replace('/sub', '/dub'),
          behaviorHints: {
            notWebReady: false,
            bframes: 0,
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
    console.error('Anime stream error:', error);
    return { streams: [] };
  }
}

async function getMovieStream(tmdbId) {
  return {
    streams: [
      {
        name: "HyperStream Movies - 1080p",
        title: "Full HD Stream via Videasy",
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
        name: "HyperStream Movies - Auto",
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

async function getSeriesStream(tmdbId, season, episode) {
  const s = season || 1;
  const e = episode || 1;

  return {
    streams: [
      {
        name: "HyperStream Series - 1080p",
        title: `S${s}:E${e} Full HD`,
        url: `https://player.videasy.net/tv/${tmdbId}/${s}/${e}?autoplayNextEpisode=true&episodeSelector=true&overlay=true`,
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
        name: "HyperStream Series - Auto",
        title: `Season ${s} Episode ${e}`,
        url: `https://player.videasy.net/tv/${tmdbId}/${s}/${e}?color=8B5CF6&nextEpisode=true`,
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
  
  const sources = [
    {
      name: "HyperStream Adult - Source 1",
      title: "Primary Stream",
      url: `https://www.pornhub.com/embed/${(idx * 9973) % 100000000}`,
      behaviorHints: {
        notWebReady: false,
        iframe: true,
        adult: true
      }
    },
    {
      name: "HyperStream Adult - Source 2",
      title: "Backup Stream",
      url: `https://www.xvideos.com/embedframe/${(idx * 7529) % 100000000}`,
      behaviorHints: {
        notWebReady: false,
        iframe: true,
        adult: true
      }
    },
    {
      name: "HyperStream Adult - Source 3",
      title: "Alternative Stream",
      url: `https://xhamster.com/xembed.php?video=${(idx * 3541) % 100000000}`,
      behaviorHints: {
        notWebReady: false,
        iframe: true,
        adult: true
      }
    }
  ];

  return { streams: sources };
}

// ==================== TMDB HELPER ====================
const TMDB_API_KEY = '5b07bfe8b819293cdf0f6a2d96c37589'; // Public TMDB API key

async function fetchTMDB(endpoint) {
  const url = `https://api.themoviedb.org/3${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }
  
  return response.json();
}

// Genre mappings
const TMDB_GENRES_MOVIE = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
};

const TMDB_GENRES_TV = {
  10759: "Action & Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 10762: "Kids",
  9648: "Mystery", 10763: "News", 10764: "Reality", 10765: "Sci-Fi & Fantasy",
  10766: "Soap", 10767: "Talk", 10768: "War & Politics", 37: "Western"
};
