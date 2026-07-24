export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CRITICAL CORS headers - must be on EVERY response
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Content-Type': 'application/json; charset=utf-8'
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    try {
      // Manifest
      if (path === '/' || path === '/manifest.json') {
        return new Response(JSON.stringify(getManifest()), { headers });
      }

      // Catalog: /{type}/catalog/{id}.json or /{type}/catalog/{id}/{extra}.json
      const catalogMatch = path.match(/^\/(movie|series|other)\/catalog\/([^\/]+)(?:\/[^\/]+)?\.json$/);
      if (catalogMatch) {
        const [, type, catalogId] = catalogMatch;
        const skip = url.searchParams.get('skip') || '0';
        const search = url.searchParams.get('search');
        const result = await handleCatalog(type, catalogId, skip, search);
        return new Response(JSON.stringify(result), { headers });
      }

      // Meta: /{type}/meta/{id}.json  
      const metaMatch = path.match(/^\/(movie|series|other)\/meta\/([^\/]+)\.json$/);
      if (metaMatch) {
        const [, type, id] = metaMatch;
        const result = await handleMeta(type, id);
        return new Response(JSON.stringify(result), { headers });
      }

      // Stream: /stream/{type}/{id}.json
      const streamMatch = path.match(/^\/stream\/(movie|series|other)\/([^\/]+)\.json$/);
      if (streamMatch) {
        const [, type, id] = streamMatch;
        const result = await handleStream(type, id);
        return new Response(JSON.stringify(result), { headers });
      }

      return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers });
    } catch (error) {
      console.error('Worker error:', error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
  }
};

function getManifest() {
  return {
    id: "com.dhrubonai.hyperstream",
    version: "4.0.0", 
    name: "HyperStream",
    description: "Ultimate Streaming - Movies, Series, Anime & More",
    logo: "https://raw.githubusercontent.com/dhrubonai/hyperstream-addon/main/logo.png",
    resources: ["catalog", "meta", "stream"],
    types: ["movie", "series", "other"],
    catalogs: [
      {
        type: "movie",
        id: "movies_top",
        name: "🎬 Top Movies",
        extra: [{ "name": "search" }, { "name": "skip" }]
      },
      {
        type: "movie", 
        id: "movies_trending",
        name: "🔥 Trending Movies",
        extra: [{ "name": "search" }, { "name": "skip" }]
      },
      {
        type: "series",
        id: "series_top", 
        name: "📺 Top Series",
        extra: [{ "name": "search" }, { "name": "skip" }]
      },
      {
        type: "series",
        id: "series_trending",
        name: "🔥 Trending Series", 
        extra: [{ "name": "search" }, { "name": "skip" }]
      },
      {
        type: "other",
        id: "anime_recent",
        name: "🎌 Recent Anime",
        extra: [{ "name": "search" }, { "name": "skip" }]
      },
      {
        type: "other",
        id: "adult_content",
        name: "🔞 Adult Content",
        extra: [{ "name": "search" }, { "name": "skip" }]
      }
    ],
    behaviorHints: {
      adult: true,
      configurable: true,
      configurationRequired: false
    }
  };
}

// ==================== CATALOG HANDLERS ====================

async function handleCatalog(type, catalogId, skip, search) {
  try {
    switch (type) {
      case 'movie': return getMovieCatalog(catalogId, skip, search);
      case 'series': return getSeriesCatalog(catalogId, skip, search);
      case 'other': 
        if (catalogId === 'anime_recent') return getAnimeCatalog(skip, search);
        if (catalogId === 'adult_content') return getAdultCatalog(skip);
        return { metas: [] };
      default: return { metas: [] };
    }
  } catch (e) {
    return { metas: [] };
  }
}

function getMovieCatalog(catalogId, skip, search) {
  const allMovies = [
    {
      id: "tt4154796",
      type: "movie", 
      name: "Avengers: Endgame",
      poster: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
      description: "The Avengers assemble to undo Thanos destruction and save the universe.",
      releaseInfo: "2019",
      imdbRating: "8.4",
      genres: ["Action", "Adventure", "Drama"],
      year: "2019"
    },
    {
      id: "tt15398776",
      type: "movie",
      name: "Oppenheimer", 
      poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      description: "The story of J. Robert Oppenheimer and the creation of the atomic bomb.",
      releaseInfo: "2023",
      imdbRating: "8.6",
      genres: ["Biography", "Drama", "History"],
      year: "2023"
    },
    {
      id: "tt3624082",
      type: "movie",
      name: "Top Gun: Maverick",
      poster: "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg", 
      description: "Maverick trains top graduates for a specialized mission.",
      releaseInfo: "2022",
      imdbRating: "8.3",
      genres: ["Action", "Drama"],
      year: "2022"
    },
    {
      id: "tt10872600",
      type: "movie",
      name: "Spider-Man: No Way Home",
      poster: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
      description: "Peter Parker seeks Doctor Strange's help to restore his secret identity.",
      releaseInfo: "2021", 
      imdbRating: "8.2",
      genres: ["Action", "Adventure", "Fantasy"],
      year: "2021"
    },
    {
      id: "tt1877830",
      type: "movie",
      name: "The Batman",
      poster: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
      description: "Batman uncovers corruption in Gotham City while hunting a serial killer.",
      releaseInfo: "2022",
      imdbRating: "7.8", 
      genres: ["Action", "Crime", "Drama"],
      year: "2022"
    },
    {
      id: "tt10366206",
      type: "movie",
      name: "John Wick: Chapter 4",
      poster: "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5AsaqJQ.jpg",
      description: "John Wick finds a way to defeat the High Table.",
      releaseInfo: "2023",
      imdbRating: "7.9",
      genres: ["Action", "Crime", "Thriller"], 
      year: "2023"
    },
    {
      id: "tt0499549",
      type: "movie",
      name: "Avatar",
      poster: "https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg",
      description: "A paraplegic marine dispatched to Pandora becomes torn between orders and protecting the world.",
      releaseInfo: "2009",
      imdbRating: "7.6",
      genres: ["Action", "Adventure", "Fantasy"],
      year: "2009"
    },
    {
      id: "tt0468569", 
      type: "movie",
      name: "The Dark Knight",
      poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      description: "Batman faces the Joker who plunges Gotham into chaos.",
      releaseInfo: "2008",
      imdbRating: "9.0",
      genres: ["Action", "Crime", "Drama"],
      year: "2008"
    },
    {
      id: "tt1375666",
      type: "movie", 
      name: "Inception",
      poster: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
      description: "A thief who steals secrets through dream-sharing technology.",
      releaseInfo: "2010",
      imdbRating: "8.8",
      genres: ["Action", "Adventure", "Sci-Fi"],
      year: "2010"
    },
    {
      id: "tt0848228",
      type: "movie",
      name: "The Avengers",
      poster: "https://image.tmdb.org/t/p/w500/cezWGskPY5x7GaglTTRNWsFvQax.jpg",
      description: "Earth's mightiest heroes unite to save humanity from an alien invasion.",
      releaseInfo: "2012",
      imdbRating: "8.0",
      genres: ["Action", "Adventure", "Sci-Fi"],
      year: "2012"
    },
    {
      id: "tt0816692",
      type: "movie",
      name: "Interstellar",
      poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBVIx.jpg",
      description: "Explorers travel through a wormhole to save humanity.",
      releaseInfo: "2014",
      imdbRating: "8.6",
      genres: ["Adventure", "Drama", "Sci-Fi"],
      year: "2014"
    },
    {
      id: "tt0109830",
      type: "movie",
      name: "Forrest Gump",
      poster: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr5pxcBN5boNzMt.jpg",
      description: "The presidencies of Kennedy through Clinton from the perspective of a man with low IQ.",
      releaseInfo: "1994",
      imdbRating: "8.8",
      genres: ["Drama", "Romance"],
      year: "1994"
    },
    {
      id: "tt0266543",
      type: "movie",
      name: "Finding Nemo",
      poster: "https://image.tmdb.org/t/p/w500/eHuGQ10r2mJhVbDGnnzjsmqjnaM.jpg",
      description: "A clown fish searches for his son captured in the Great Barrier Reef.",
      releaseInfo: "2003",
      imdbRating: "7.8",
      genres: ["Animation", "Adventure", "Comedy"],
      year: "2003"
    },
    {
      id: "tt1856101",
      type: "movie",
      name: "Blade Runner 2049",
      poster: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
      description: "Young Blade Runner K discovers a secret that could plunge society into chaos.",
      releaseInfo: "2017",
      imdbRating: "7.6",
      genres: ["Drama", "Mystery", "Sci-Fi"],
      year: "2017"
    },
    {
      id: "tt1160419",
      type: "movie",
      name: "Dune: Part One",
      poster: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
      description: "Paul Atreides travels to the most dangerous planet in the universe.",
      releaseInfo: "2021",
      imdbRating: "8.0",
      genres: ["Action", "Adventure", "Drama"],
      year: "2021"
    },
    {
      id: "tt1517268",
      type: "movie",
      name: "The Shawshank Redemption",
      poster: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      description: "Two imprisoned men bond over years finding solace and redemption.",
      releaseInfo: "1994",
      imdbRating: "9.3",
      genres: ["Drama"],
      year: "1994"
    }
  ];

  let movies = allMovies;
  
  // Filter by search if provided
  if (search) {
    movies = allMovies.filter(m => 
      m.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  const start = Math.min(parseInt(skip) || 0, movies.length);
  
  return {
    metas: movies.slice(start, start + 20).map(m => ({
      ...m,
      behaviorHints: {
        defaultVideoId: m.id
      }
    }))
  };
}

function getSeriesCatalog(catalogId, skip, search) {
  const allSeries = [
    {
      id: "tt0944947",
      type: "series",
      name: "Game of Thrones",
      poster: "https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
      description: "Nine noble families fight for control of Westeros.",
      releaseInfo: "2011–2019",
      imdbRating: "9.2",
      genres: ["Action", "Adventure", "Drama"],
      status: "Ended"
    },
    {
      id: "tt0903747",
      type: "series", 
      name: "Breaking Bad",
      poster: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      description: "A chemistry teacher turns to making meth after cancer diagnosis.",
      releaseInfo: "2008–2013",
      imdbRating: "9.5",
      genres: ["Crime", "Drama", "Thriller"],
      status: "Ended"
    },
    {
      id: "tt4574234",
      type: "series",
      name: "Stranger Things",
      poster: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
      description: "When a young boy disappears, his mother and police uncover supernatural forces.",
      releaseInfo: "2016–",
      imdbRating: "8.7",
      genres: ["Drama", "Fantasy", "Horror"],
      status: "Continuing"
    },
    {
      id: "tt8178634",
      type: "series",
      name: "The Mandalorian",
      poster: "https://image.tmdb.org/t/p/w500/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg",
      description: "The travels of a lone bounty hunter in the outer reaches of the galaxy.",
      releaseInfo: "2019–",
      imdbRating: "8.7",
      genres: ["Action", "Adventure", "Sci-Fi"],
      status: "Continuing"
    },
    {
      id: "tt3581920",
      type: "series",
      name: "The Last of Us",
      poster: "https://image.tmdb.org/t/p/w500/uKvVj3q4ZN4LYcPkeT1Cya14WSL.jpg",
      description: "Joel and Ellie navigate a post-apocalyptic America.",
      releaseInfo: "2023–",
      imdbRating: "8.8",
      genres: ["Action", "Adventure", "Drama"],
      status: "Continuing"
    },
    {
      id: "tt1190634",
      type: "series",
      name: "The Boys",
      poster: "https://image.tmdb.org/t/p/w500/mY7SeH4HFFxW1hiI6cWuwCRKptN.jpg",
      description: "A group of vigilantes set out to take down corrupt superheroes.",
      releaseInfo: "2019–",
      imdbRating: "8.7",
      genres: ["Action", "Comedy", "Crime"],
      status: "Continuing"
    },
    {
      id: "tt13457460",
      type: "series",
      name: "Wednesday",
      poster: "https://image.tmdb.org/t/p/w500/9PFonBhy4cQy7Jz20NpMygczOkv.jpg",
      description: "Wednesday Addams investigates murders at Nevermore Academy.",
      releaseInfo: "2022–",
      imdbRating: "8.5",
      genres: ["Comedy", "Crime", "Fantasy"],
      status: "Continuing"
    },
    {
      id: "tt10554269",
      type: "series",
      name: "Squid Game",
      poster: "https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg",
      description: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games.",
      releaseInfo: "2021–",
      imdbRating: "8.0",
      genres: ["Action", "Drama", "Mystery"],
      status: "Continuing"
    },
    {
      id: "tt11198330",
      type: "series",
      name: "House of the Dragon",
      poster: "https://image.tmdb.org/t/p/w500/z2yahl2uefxDCl0nogcRBstwruJ.jpg",
      description: "The Targaryen civil war about 200 years before Game of Thrones.",
      releaseInfo: "2022–",
      imdbRating: "8.4",
      genres: ["Action", "Adventure", "Drama"],
      status: "Continuing"
    },
    {
      id: "tt3029516",
      type: "series",
      name: "Loki",
      poster: "https://image.tmdb.org/t/p/w500/voHUmluYmQFvH0UaPNrRdlTvjsY.jpg",
      description: "The mercurial villain Loki resumes his role as God of Mischief.",
      releaseInfo: "2021–",
      imdbRating: "8.3",
      genres: ["Action", "Adventure", "Comedy"],
      status: "Continuing"
    },
    {
      id: "tt7183020",
      type: "series",
      name: "The Witcher",
      poster: "https://image.tmdb.org/t/p/w500/7vjaCdMw15FEbXyLQTVa04URsPm.jpg",
      description: "Geralt of Rivia struggles to find his place in a world where people often prove more wicked than beasts.",
      releaseInfo: "2019–",
      imdbRating: "8.0",
      genres: ["Action", "Adventure", "Fantasy"],
      status: "Continuing"
    },
    {
      id: "tt7564450",
      type: "series",
      name: "You",
      poster: "https://image.tmdb.org/t/p/w500/doGwTWBH1pOsRbmSweGQAQAD1WL.jpg",
      description: "A dangerously charming man goes to extreme measures to insert himself into the lives of those he is transfixed by.",
      releaseInfo: "2018–",
      imdbRating: "8.1",
      genres: ["Crime", "Drama", "Romance"],
      status: "Continuing"
    },
    {
      id: "tt2442560",
      type: "series",
      name: "Peaky Blinders",
      poster: "https://image.tmdb.org/t/p/w500/vUUqzWA2YT45vLHDdDceDKWYfyx.jpg",
      description: "A gangster family epic set in 1900s England.",
      releaseInfo: "2013–2022",
      imdbRating: "8.7",
      genres: ["Crime", "Drama"],
      status: "Ended"
    },
    {
      id: "tt3032476",
      type: "series",
      name: "Better Call Saul",
      poster: "https://image.tmdb.org/t/p/w500/wFjboP0IXfejVOXFjbRL8QGGbE.jpg",
      description: "The trials and tribulations of criminal lawyer Jimmy McGill before he became Saul Goodman.",
      releaseInfo: "2015–2022",
      imdbRating: "8.8",
      genres: ["Crime", "Drama"],
      status: "Ended"
    },
    {
      id: "tt6513056",
      type: "series",
      name: "The Crown",
      poster: "https://image.tmdb.org/t/p/w500/BDDllpCTc1nkoFjOFO9jPY9pBDQ.jpg",
      description: "Follows the political rivalries and romance of Queen Elizabeth II's reign.",
      releaseInfo: "2016–2023",
      imdbRating: "8.6",
      genres: ["Biography", "Drama", "History"],
      status: "Ended"
    },
    {
      id: "tt2707408",
      type: "series",
      name: "Rick and Morty",
      poster: "https://image.tmdb.org/t/p/w500/gdIrmf4lNaxE36LoVuKuzpFuaoD.jpg",
      description: "Follows the misadventures of mad scientist Rick and his grandson Morty across infinite realities.",
      releaseInfo: "2013–",
      imdbRating: "8.8",
      genres: ["Animation", "Adventure", "Comedy"],
      status: "Continuing"
    }
  ];

  let series = allSeries;
  
  // Filter by search if provided
  if (search) {
    series = allSeries.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  const start = Math.min(parseInt(skip) || 0, series.length);

  return {
    metas: series.slice(start, start + 20).map(s => ({
      ...s,
      behaviorHints: {
        defaultVideoId: s.id + ':1:1',
        hasScheduledVideos: false
      }
    }))
  };
}

async function getAnimeCatalog(skip, search) {
  try {
    let apiUrl = 'https://anikotoapi.site/recent-anime?page=1&per_page=20';
    if (search) {
      apiUrl = 'https://anikotoapi.site/search?q=' + encodeURIComponent(search);
    }

    const response = await fetch(apiUrl);
    if (!response.ok) return { metas: [] };

    const data = await response.json();
    const animes = data.data || [];

    return {
      metas: animes.slice(0, 20).map(anime => ({
        id: 'anime_' + anime.id,
        type: 'other',  // Using 'other' type since 'anime' isn't standard
        name: anime.title || 'Unknown Anime',
        poster: anime.poster || 'https://via.placeholder.com/300x450?text=Anime',
        description: (anime.description || '').substring(0, 300),
        genres: ['Anime'].concat(anime.terms_by_type?.genre || []),
        releaseInfo: String(anime.year || new Date().getFullYear()),
        imdbRating: String(parseFloat(anime.score) || 7.0),
        behaviorHints: {
          defaultVideoId: 'anime_' + anime.id + ':1:1'
        }
      }))
    };
  } catch (e) {
    return { metas: [] };
  }
}

function getAdultCatalog(skip) {
  const titles = [
    'Midnight Encounter', 'Secret Desires', 'Forbidden Pleasures',
    'Intimate Moments', 'Passionate Nights', 'Sensual Awakening',
    'Hidden Fantasies', 'Wild Temptation', 'Romantic Escapades',
    'Desire Unleashed', 'Intimate Connections', 'Passion Play'
  ];
  
  const baseSkip = parseInt(skip) || 0;

  return {
    metas: titles.map((title, i) => ({
      id: 'adult_' + (baseSkip + i + 1),
      type: 'other',
      name: title,
      poster: 'https://picsum.photos/seed/adult' + (baseSkip + i + 1) + '/300/450',
      genres: ['Adult'],
      releaseInfo: new Date().toISOString().substring(0, 4),
      imdbRating: '4.0',
      behaviorHints: {
        adult: true,
        defaultVideoId: 'adult_' + (baseSkip + i + 1)
      }
    }))
  };
}

// ==================== META HANDLERS ====================

async function handleMeta(type, id) {
  switch (type) {
    case 'movie': return getMovieMeta(id);
    case 'series': return getSeriesMeta(id);
    case 'other':
      if (id.startsWith('anime_')) return getAnimeMeta(id);
      if (id.startsWith('adult_')) return getAdultMeta(id);
      return {};
    default: return {};
  }
}

function getMovieMeta(id) {
  const movieData = {
    "tt4154796": {
      name: "Avengers: Endgame",
      poster: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
      background: "https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
      description: "After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers must assemble once more to reverse Thanos' actions and restore balance to the universe once and for all, no matter what consequences may be in store.",
      releaseInfo: "2019",
      runtime: "181 min",
      imdbRating: "8.4",
      genres: ["Action", "Adventure", "Drama"],
      director: ["Anthony Russo", "Joe Russo"],
      cast: ["Robert Downey Jr.", "Chris Evans", "Mark Ruffalo", "Scarlett Johansson"],
      year: "2019"
    },
    "tt15398776": {
      name: "Oppenheimer",
      poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      background: "https://image.tmdb.org/t/p/original/n29dRbNxvHPB5mUCbVmFNiWiwiq.jpg",
      description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
      releaseInfo: "2023",
      runtime: "180 min",
      imdbRating: "8.6",
      genres: ["Biography", "Drama", "History"],
      director: ["Christopher Nolan"],
      cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr."],
      year: "2023"
    },
    "tt3624082": {
      name: "Top Gun: Maverick",
      poster: "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
      background: "https://image.tmdb.org/t/p/original/uhCVtoPRCvpR6d8TU9PSdfqZEla.jpg",
      description: "After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUN's elite graduates on a mission that demands the ultimate sacrifice.",
      releaseInfo: "2022",
      runtime: "131 min",
      imdbRating: "8.3",
      genres: ["Action", "Drama"],
      director: ["Joseph Kosinski"],
      cast: ["Tom Cruise", "Miles Teller", "Jennifer Connelly", "Jon Hamm"],
      year: "2022"
    },
    "tt10872600": {
      name: "Spider-Man: No Way Home",
      poster: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
      background: "https://image.tmdb.org/t/p/original/14Qbnp_gWKuv5v7sysGY5NYpyi.jpg",
      description: "With Spider-Man's identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear, forcing Peter to discover what it truly means to be Spider-Man.",
      releaseInfo: "2021",
      runtime: "148 min",
      imdbRating: "8.2",
      genres: ["Action", "Adventure", "Fantasy"],
      director: ["Jon Watts"],
      cast: ["Tom Holland", "Zendaya", "Benedict Cumberbatch", "Jacob Batalon"],
      year: "2021"
    },
    "tt1877830": {
      name: "The Batman",
      poster: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
      background: "https://image.tmdb.org/t/p/original/b0PlSFdDwbyFAJlB1lBMebs4rgL.jpg",
      description: "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
      releaseInfo: "2022",
      runtime: "176 min",
      imdbRating: "7.8",
      genres: ["Action", "Crime", "Drama"],
      director: ["Matt Reeves"],
      cast: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano", "Colin Farrell"],
      year: "2022"
    },
    "tt0468569": {
      name: "The Dark Knight",
      poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      background: "https://image.tmdb.org/t/p/original/nMKdUUepR0ofJryYPy4w9E5FaVc.jpg",
      description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
      releaseInfo: "2008",
      runtime: "152 min",
      imdbRating: "9.0",
      genres: ["Action", "Crime", "Drama"],
      director: ["Christopher Nolan"],
      cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart", "Michael Caine"],
      year: "2008"
    },
    "tt1375666": {
      name: "Inception",
      poster: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
      background: "https://image.tmdb.org/t/p/original/s2b9MwqnTM5hA8qFMA3Xqbmr0d.jpg",
      description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.",
      releaseInfo: "2010",
      runtime: "148 min",
      imdbRating: "8.8",
      genres: ["Action", "Adventure", "Sci-Fi"],
      director: ["Christopher Nolan"],
      cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Ellen Page", "Tom Hardy"],
      year: "2010"
    },
    "tt0816692": {
      name: "Interstellar",
      poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBVIx.jpg",
      background: "https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
      description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival as Earth becomes uninhabitable due to crop blights and dust storms.",
      releaseInfo: "2014",
      runtime: "169 min",
      imdbRating: "8.6",
      genres: ["Adventure", "Drama", "Sci-Fi"],
      director: ["Christopher Nolan"],
      cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
      year: "2014"
    },
    "tt1517268": {
      name: "The Shawshank Redemption",
      poster: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      background: "https://image.tmdb.org/t/p/original/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency. A story of hope, friendship, and the resilience of the human spirit.",
      releaseInfo: "1994",
      runtime: "142 min",
      imdbRating: "9.3",
      genres: ["Drama"],
      director: ["Frank Darabont"],
      cast: ["Tim Robbins", "Morgan Freeman", "Bob Gunton", "William Sadler"],
      year: "1994"
    },
    "tt0848228": {
      name: "The Avengers",
      poster: "https://image.tmdb.org/t/p/w500/cezWGskPY5x7GaglTTRNWsFvQax.jpg",
      background: "https://image.tmdb.org/t/p/original/RYzwyOlXJUzzNNXulmUHRFb4FFG.jpg",
      description: "Earth's mightiest heroes must come together and learn to fight as a team to stop the mischievous Loki and his alien army from enslaving humanity.",
      releaseInfo: "2012",
      runtime: "143 min",
      imdbRating: "8.0",
      genres: ["Action", "Adventure", "Sci-Fi"],
      director: ["Joss Whedon"],
      cast: ["Robert Downey Jr.", "Chris Evans", "Scarlett Johansson", "Jeremy Renner"],
      year: "2012"
    },
    "tt0109830": {
      name: "Forrest Gump",
      poster: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr5pxcBN5boNzMt.jpg",
      background: "https://image.tmdb.org/t/p/original/3hKMwCympTSikh2SqNLiBgOVspI.jpg",
      description: "The presidencies of Kennedy and Johnson, the Vietnam War, and other historical events unfold from the perspective of an Alabama man with an IQ of 75 whose only desire is to be reunited with his childhood sweetheart.",
      releaseInfo: "1994",
      runtime: "142 min",
      imdbRating: "8.8",
      genres: ["Drama", "Romance"],
      director: ["Robert Zemeckis"],
      cast: ["Tom Hanks", "Robin Wright", "Gary Sinise", "Sally Field"],
      year: "1994"
    },
    "tt10366206": {
      name: "John Wick: Chapter 4",
      poster: "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5AsaqJQ.jpg",
      background: "https://image.tmdb.org/t/p/original/vZloFAK7NmvMGKE7VkF5AsaqJQ.jpg",
      description: "John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe.",
      releaseInfo: "2023",
      runtime: "169 min",
      imdbRating: "7.9",
      genres: ["Action", "Crime", "Thriller"],
      director: ["Chad Stahelski"],
      cast: ["Keanu Reeves", "Donnie Yen", "Bill Skarsgård", "Laurence Fishburne"],
      year: "2023"
    },
    "tt0499549": {
      name: "Avatar",
      poster: "https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg",
      background: "https://image.tmdb.org/t/p/original/eGmFnXWG4Ssf5pP1I0RMT5fQLp.jpg",
      description: "A paraplegic Marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home.",
      releaseInfo: "2009",
      runtime: "162 min",
      imdbRating: "7.6",
      genres: ["Action", "Adventure", "Fantasy"],
      director: ["James Cameron"],
      cast: ["Sam Worthington", "Zoe Saldana", "Sigourney Weaver", "Stephen Lang"],
      year: "2009"
    },
    "tt0266543": {
      name: "Finding Nemo",
      poster: "https://image.tmdb.org/t/p/w500/eHuGQ10r2mJhVbDGnnzjsmqjnaM.jpg",
      background: "https://image.tmdb.org/t/p/original/fw5FBWo-GRpDSWbIoBSlFa9sqSC.jpg",
      description: "A clown fish embarks on a journey to find his son who was captured by a diver in the Great Barrier Reef.",
      releaseInfo: "2003",
      runtime: "100 min",
      imdbRating: "7.8",
      genres: ["Animation", "Adventure", "Comedy"],
      director: ["Andrew Stanton", "Lee Unkrich"],
      cast: ["Albert Brooks", "Ellen DeGeneres", "Alexander Gould", "Willem Dafoe"],
      year: "2003"
    },
    "tt1856101": {
      name: "Blade Runner 2049",
      poster: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
      background: "https://image.tmdb.org/t/p/original/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
      description: "Young Blade Runner K's discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who's been missing for thirty years.",
      releaseInfo: "2017",
      runtime: "164 min",
      imdbRating: "7.6",
      genres: ["Drama", "Mystery", "Sci-Fi"],
      director: ["Denis Villeneuve"],
      cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas", "Jared Leto"],
      year: "2017"
    },
    "tt1160419": {
      name: "Dune: Part One",
      poster: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
      background: "https://image.tmdb.org/t/p/original/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
      description: "Paul Atreides must travel to the most dangerous planet in the universe to ensure the future of his family and people. As malevolent forces explode into conflict, only those who can conquer their fear will survive.",
      releaseInfo: "2021",
      runtime: "155 min",
      imdbRating: "8.0",
      genres: ["Action", "Adventure", "Drama"],
      director: ["Denis Villeneuve"],
      cast: ["Timothée Chalamet", "Rebecca Ferguson", "Oscar Isaac", "Dave Bautista"],
      year: "2021"
    }
  };

  const m = movieData[id] || {
    name: "Loading...",
    poster: "",
    background: "",
    description: "Description loading...",
    releaseInfo: "",
    runtime: "",
    imdbRating: "0",
    genres: [],
    director: [],
    cast: [],
    year: ""
  };

  return {
    meta: {
      id: id,
      type: "movie",
      name: m.name,
      poster: m.poster || undefined,
      background: m.background || undefined,
      description: m.description,
      releaseInfo: m.releaseInfo,
      runtime: m.runtime,
      imdbRating: m.imdbRating,
      genres: m.genres,
      director: m.director,
      cast: m.cast,
      year: m.year,
      behaviorHints: {
        defaultVideoId: id
      }
    }
  };
}

function getSeriesMeta(id) {
  const seriesData = {
    "tt0944947": {
      name: "Game of Thrones",
      poster: "https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
      background: "https://image.tmdb.org/t/p/original/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
      description: "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war while an ancient enemy returns after being dormant for millennia.",
      releaseInfo: "2011–2019",
      runtime: "57 min",
      imdbRating: "9.2",
      genres: ["Action", "Adventure", "Drama"],
      status: "Ended",
      cast: ["Emilia Clarke", "Peter Dinklage", "Kit Harington", "Lena Headey"]
    },
    "tt0903747": {
      name: "Breaking Bad",
      poster: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      background: "https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL4XVvmqidY38L.jpg",
      description: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family's financial future.",
      releaseInfo: "2008–2013",
      runtime: "47 min",
      imdbRating: "9.5",
      genres: ["Crime", "Drama", "Thriller"],
      status: "Ended",
      cast: ["Bryan Cranston", "Aaron Paul", "Anna Gunn", "Dean Norris"]
    },
    "tt4574234": {
      name: "Stranger Things",
      poster: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
      background: "https://image.tmdb.org/t/p/original/x2WOkc4sbwrlvJxAROCmXXhZ4cL.jpg",
      description: "When a young boy disappears, his mother, a police chief, and his friends must confront terrifying supernatural forces in order to get him back.",
      releaseInfo: "2016–",
      runtime: "51 min",
      imdbRating: "8.7",
      genres: ["Drama", "Fantasy", "Horror"],
      status: "Continuing",
      cast: ["Millie Bobby Brown", "Finn Wolfhard", "Winona Ryder", "David Harbour"]
    },
    "tt3581920": {
      name: "The Last of Us",
      poster: "https://image.tmdb.org/t/p/w500/uKvVj3q4ZN4LYcPkeT1Cya14WSL.jpg",
      background: "https://image.tmdb.org/t/p/original/uKvVj3q4ZN4LYcPkeT1Cya14WSL.jpg",
      description: "Joel and Ellie, a pair connected through the harshness of the world they live in, are forced to endure brutal circumstances and ruthless killers on a trek across a post-apocalyptic America.",
      releaseInfo: "2023–",
      runtime: "60 min",
      imdbRating: "8.8",
      genres: ["Action", "Adventure", "Drama"],
      status: "Continuing",
      cast: ["Pedro Pascal", "Bella Ramsey", "Anna Torv", "Gabriel Luna"]
    },
    "tt1190634": {
      name: "The Boys",
      poster: "https://image.tmdb.org/t/p/w500/mY7SeH4HFFxW1hiI6cWuwCRKptN.jpg",
      background: "https://image.tmdb.org/t/p/original/mY7SeH4HFFxW1hiI6cWuwCRKptN.jpg",
      description: "A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers rather than using them for good.",
      releaseInfo: "2019–",
      runtime: "60 min",
      imdbRating: "8.7",
      genres: ["Action", "Comedy", "Crime"],
      status: "Continuing",
      cast: ["Karl Urban", "Jack Quaid", "Antony Starr", "Erin Moriarty"]
    },
    "tt13457460": {
      name: "Wednesday",
      poster: "https://image.tmdb.org/t/p/w500/9PFonBhy4cQy7Jz20NpMygczOkv.jpg",
      background: "https://image.tmdb.org/t/p/original/9PFonBhy4cQy7Jz20NpMygczOkv.jpg",
      description: "Follows Wednesday Addams' years as a student at Nevermore Academy where she attempts to master her emerging psychic ability, thwart a killing spree, and solve the mystery that embroiled her parents 25 years ago.",
      releaseInfo: "2022–",
      runtime: "50 min",
      imdbRating: "8.5",
      genres: ["Comedy", "Crime", "Fantasy"],
      status: "Continuing",
      cast: ["Jenna Ortega", "Gwendoline Christie", "Riki Lindhome", "Jamie McShane"]
    },
    "tt10554269": {
      name: "Squid Game",
      poster: "https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg",
      background: "https://image.tmdb.org/t/p/original/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg",
      description: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games. Inside, a tempting prize awaits — with deadly high stakes.",
      releaseInfo: "2021–",
      runtime: "55 min",
      imdbRating: "8.0",
      genres: ["Action", "Drama", "Mystery"],
      status: "Continuing",
      cast: ["Lee Jung-jae", "Park Hae-soo", "Wi Ha-joon", "HoYeon Jung"]
    },
    "tt11198330": {
      name: "House of the Dragon",
      poster: "https://image.tmdb.org/t/p/w500/z2yahl2uefxDCl0nogcRBstwruJ.jpg",
      background: "https://image.tmdb.org/t/p/original/z2yahl2uefxDCl0nogcRBstwruJ.jpg",
      description: "The story of the Targaryen civil war that took place about 200 years before events portrayed in Game of Thrones.",
      releaseInfo: "2022–",
      runtime: "60 min",
      imdbRating: "8.4",
      genres: ["Action", "Adventure", "Drama"],
      status: "Continuing",
      cast: ["Paddy Considine", "Matt Smith", "Olivia Cooke", "Emma D'Arcy"]
    },
    "tt8178634": {
      name: "The Mandalorian",
      poster: "https://image.tmdb.org/t/p/w500/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg",
      background: "https://image.tmdb.org/t/p/original/sh7MFgBYLazL2qXVYvFo8zkTdpJ.jpg",
      description: "The travels of a lone bounty hunter in the outer reaches of the galaxy, far from the authority of the New Republic.",
      releaseInfo: "2019–",
      runtime: "40 min",
      imdbRating: "8.7",
      genres: ["Action", "Adventure", "Sci-Fi"],
      status: "Continuing",
      cast: ["Pedro Pascal", "Carl Weathers", "Gina Carano", "Giancarlo Esposito"]
    },
    "tt3029516": {
      name: "Loki",
      poster: "https://image.tmdb.org/t/p/w500/voHUmluYmQFvH0UaPNrRdlTvjsY.jpg",
      background: "https://image.tmdb.org/t/p/original/voHUmluYmQFvH0UaPNrRdlTvjsY.jpg",
      description: "The mercurial villain Loki resumes his role as the God of Mischief in a new series that takes place after the events of Avengers: Endgame.",
      releaseInfo: "2021–",
      runtime: "45 min",
      imdbRating: "8.3",
      genres: ["Action", "Adventure", "Comedy"],
      status: "Continuing",
      cast: ["Tom Hiddleston", "Owen Wilson", "Sophia Di Martino", "Gugu Mbatha-Raw"]
    },
    "tt7183020": {
      name: "The Witcher",
      poster: "https://image.tmdb.org/t/p/w500/7vjaCdMw15FEbXyLQTVa04URsPm.jpg",
      background: "https://image.tmdb.org/t/p/original/7vjaCdMw15FEbXyLQTVa04URsPm.jpg",
      description: "Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world where people often prove more wicked than beasts.",
      releaseInfo: "2019–",
      runtime: "60 min",
      imdbRating: "8.0",
      genres: ["Action", "Adventure", "Fantasy"],
      status: "Continuing",
      cast: ["Henry Cavill", "Anya Chalotra", "Freya Allan", "Joey Batey"]
    },
    "tt7564450": {
      name: "You",
      poster: "https://image.tmdb.org/t/p/w500/doGwTWBH1pOsRbmSweGQAQAD1WL.jpg",
      background: "https://image.tmdb.org/t/p/original/doGwTWBH1pOsRbmSweGQAQAD1WL.jpg",
      description: "A dangerously charming, intensely obsessive young man goes to extreme measures to insert himself into the lives of those he is transfixed by.",
      releaseInfo: "2018–",
      runtime: "43 min",
      imdbRating: "8.1",
      genres: ["Crime", "Drama", "Romance"],
      status: "Continuing",
      cast: ["Penn Badgley", "Victoria Pedretti", "Elizabeth Lail", "Amber Childs"]
    },
    "tt2442560": {
      name: "Peaky Blinders",
      poster: "https://image.tmdb.org/t/p/w500/vUUqzWA2YT45vLHDdDceDKWYfyx.jpg",
      background: "https://image.tmdb.org/t/p/original/vUUqzWA2YT45vLHDdDceDKWYfyx.jpg",
      description: "A gangster family epic set in 1900s England, centered on a gang who sew razor blades in the peaks of their caps.",
      releaseInfo: "2013–2022",
      runtime: "60 min",
      imdbRating: "8.7",
      genres: ["Crime", "Drama"],
      status: "Ended",
      cast: ["Cillian Murphy", "Helen McCrory", "Paul Anderson", "Joe Cole"]
    },
    "tt3032476": {
      name: "Better Call Saul",
      poster: "https://image.tmdb.org/t/p/w500/wFjboP0IXfejVOXFjbRL8QGGbE.jpg",
      background: "https://image.tmdb.org/t/p/original/wFjboP0IXfejVOXFjbRL8QGGbE.jpg",
      description: "The trials and tribulations of criminal lawyer Jimmy McGill before he became Saul Goodman.",
      releaseInfo: "2015–2022",
      runtime: "46 min",
      imdbRating: "8.8",
      genres: ["Crime", "Drama"],
      status: "Ended",
      cast: ["Bob Odenkirk", "Jonathan Banks", "Rhea Seehorn", "Patrick Fabian"]
    },
    "tt6513056": {
      name: "The Crown",
      poster: "https://image.tmdb.org/t/p/w500/BDDllpCTc1nkoFjOFO9jPY9pBDQ.jpg",
      background: "https://image.tmdb.org/t/p/original/BDDllpCTc1nkoFjOFO9jPY9pBDQ.jpg",
      description: "Follows the political rivalries and romance of Queen Elizabeth II's reign and the events that shaped the second half of the twentieth century.",
      releaseInfo: "2016–2023",
      runtime: "58 min",
      imdbRating: "8.6",
      genres: ["Biography", "Drama", "History"],
      status: "Ended",
      cast: ["Claire Foy", "Olivia Colman", "Imelda Staunton", "Matt Smith"]
    },
    "tt2707408": {
      name: "Rick and Morty",
      poster: "https://image.tmdb.org/t/p/w500/gdIrmf4lNaxE36LoVuKuzpFuaoD.jpg",
      background: "https://image.tmdb.org/t/p/original/gdIrmf4lNaxE36LoVuKuzpFuaoD.jpg",
      description: "Follows the misadventures of mad scientist Rick Sanchez and his grandson Morty Smith across infinite realities and planets.",
      releaseInfo: "2013–",
      runtime: "23 min",
      imdbRating: "8.8",
      genres: ["Animation", "Adventure", "Comedy"],
      status: "Continuing",
      cast: ["Justin Roiland", "Chris Parnell", "Spencer Grammer", "Sarah Chalke"]
    }
  };

  const s = seriesData[id] || {
    name: "Loading...",
    poster: "",
    background: "",
    description: "Loading...",
    releaseInfo: "",
    runtime: "",
    imdbRating: "0",
    genres: [],
    status: "Continuing",
    cast: []
  };

  // Generate episodes - 8-10 episodes per season, 2-4 seasons
  const videos = [];
  const numSeasons = s.status === "Ended" ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 2;
  
  for (let season = 1; season <= numSeasons; season++) {
    const epsPerSeason = season === 1 ? 10 : 8 + Math.floor(Math.random() * 3);
    for (let episode = 1; episode <= epsPerSeason; episode++) {
      videos.push({
        id: id + ':' + season + ':' + episode,
        title: s.name + ' - Season ' + season + ' Episode ' + episode,
        season: season,
        episode: episode,
        released: new Date(2020 + season, episode, 1).toISOString(),
        overview: s.name + ' Season ' + season + ' Episode ' + episode,
        thumbnail: undefined
      });
    }
  }

  return {
    meta: {
      id: id,
      type: "series",
      name: s.name,
      poster: s.poster || undefined,
      background: s.background || undefined,
      description: s.description,
      releaseInfo: s.releaseInfo,
      runtime: s.runtime,
      imdbRating: s.imdbRating,
      genres: s.genres,
      status: s.status,
      cast: s.cast,
      videos: videos,
      behaviorHints: {
        defaultVideoId: id + ':1:1'
      }
    }
  };
}

async function getAnimeMeta(id) {
  const actualId = id.replace('anime_', '');
  
  try {
    const response = await fetch('https://anikotoapi.site/series/' + actualId);
    if (!response.ok) return { meta: createFallbackMeta(id, 'other', 'Anime Loading...') };

    const data = await response.json();
    const anime = data.data?.anime;
    const episodes = data.data?.episodes || [];

    if (!anime) return { meta: createFallbackMeta(id, 'other', 'Anime Loading...') };

    const videos = episodes.slice(0, 50).map((ep, idx) => ({
      id: id + ':1:' + (idx + 1),
      title: ep.title || 'Episode ' + (idx + 1),
      season: 1,
      episode: idx + 1,
      released: new Date().toISOString()
    }));

    return {
      meta: {
        id: id,
        type: 'other',
        name: anime.title || 'Unknown Anime',
        poster: anime.poster || 'https://via.placeholder.com/300x450?text=Anime',
        background: anime.banner || anime.poster || '',
        description: (anime.description || 'No description').substring(0, 800),
        genres: ['Anime'].concat(anime.terms_by_type?.genre || []),
        releaseInfo: String(anime.year || ''),
        runtime: '24 min',
        imdbRating: String(parseFloat(anime.score) || 7.0),
        status: anime.status || 'Continuing',
        videos: videos,
        behaviorHints: {
          defaultVideoId: id + ':1:1'
        }
      }
    };
  } catch (e) {
    return { meta: createFallbackMeta(id, 'other', 'Error loading anime') };
  }
}

function getAdultMeta(id) {
  return {
    meta: {
      id: id,
      type: 'other',
      name: 'Premium Content',
      poster: 'https://picsum.photos/seed/' + Date.now() + '/300/450',
      description: 'Full HD premium content available.',
      genres: ['Adult'],
      releaseInfo: new Date().toISOString().substring(0, 4),
      behaviorHints: {
        adult: true,
        defaultVideoId: id
      }
    }
  };
}

function createFallbackMeta(id, type, name) {
  return {
    id: id,
    type: type,
    name: name,
    poster: 'https://via.placeholder.com/300x450?text=Loading',
    description: 'Please try again later.',
    videos: []
  };
}

// ==================== STREAM HANDLERS ====================

async function handleStream(type, id) {
  switch (type) {
    case 'movie': return getMovieStream(id);
    case 'series': return getSeriesStream(id);
    case 'other':
      if (id.startsWith('anime_')) return getAnimeStream(id);
      if (id.startsWith('adult_')) return getAdultStream(id);
      return { streams: [] };
    default: return { streams: [] };
  }
}

function getMovieStream(videoId) {
  // Remove tt prefix for videasy
  const tmdbId = videoId.replace('tt', '');

  return {
    streams: [{
      name: "HyperStream 🎬 - 1080p",
      title: "Streaming via Videasy Player",
      url: "https://player.videasy.net/movie/" + tmdbId + "?autoplay=true",
      behaviorHints: {
        notWebReady: false,
        iframe: true,
        bingeGroup: "hyperstream-movie"
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
      name: "HyperStream 📺 - S" + season + "E" + episode,
      title: "Streaming via Videasy Player",
      url: "https://player.videasy.net/tv/" + seriesId + "/" + season + "/" + episode + "?autoplay=true&next=true",
      behaviorHints: {
        notWebReady: false,
        iframe: true,
        bingeGroup: "hyperstream-series-" + seriesId
      }
    }]
  };
}

async function getAnimeStream(videoId) {
  const parts = videoId.split(':');
  const animeId = parts[0].replace('anime_', '');
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
      } else if (targetEp?.embed_url && typeof targetEp.embed_url === 'object') {
        embedUrl = Object.values(targetEp.embed_url)[0];
      }
    }
  } catch (e) {}

  return {
    streams: [{
      name: "HyperStream 🎌 - SUB",
      title: "Streaming via Megaplay",
      url: embedUrl,
      behaviorHints: {
        notWebReady: false,
        bingeGroup: "hyperstream-anime-" + animeId
      }
    }]
  };
}

function getAdultStream(id) {
  const idx = parseInt(id.split('_').pop()) || 1;

  return {
    streams: [{
      name: "HyperStream 🔞 - Premium",
      title: "HD Stream Available",
      url: "https://www.pornhub.com/embed/" + ((idx * 9973) % 100000000),
      behaviorHints: {
        notWebReady: false,
        iframe: true,
        adult: true,
        bingeGroup: "hyperstream-adult"
      }
    }]
  };
}
