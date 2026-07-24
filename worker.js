export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers on EVERY response
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Content-Type': 'application/json; charset=utf-8'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    try {
      // Manifest - works with or without /manifest.json
      if (path === '/' || path === '/manifest.json' || path === '') {
        return new Response(JSON.stringify({
          id: "com.dhrubonai.hyperstream",
          version: "5.0.0",
          name: "HyperStream",
          description: "Movies, Series & Anime Streaming",
          resources: ["catalog", "meta", "stream"],
          types: ["movie", "series"],
          catalogs: [
            { type: "movie", id: "movies", name: "🎬 Movies" },
            { type: "series", id: "series", name: "📺 Series" }
          ],
          behaviorHints: { configurable: true }
        }), { headers });
      }

      // Handle ALL catalog requests
      if (path.includes('/catalog/')) {
        return handleCatalog(path, headers);
      }

      // Handle ALL meta requests  
      if (path.includes('/meta/')) {
        return handleMeta(path, headers);
      }

      // Handle ALL stream requests
      if (path.includes('/stream/')) {
        return handleStream(path, headers);
      }

      // Debug: return what was requested
      return new Response(JSON.stringify({ 
        error: 'Not Found', 
        requestedPath: path,
        note: 'Use /manifest.json to get started'
      }), { status: 404, headers });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
  }
};

function handleCatalog(path, headers) {
  const movies = [
    {
      id: "tt4154796",
      type: "movie",
      name: "Avengers: Endgame",
      poster: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
      description: "The Avengers assemble to save the universe from Thanos.",
      releaseInfo: "2019",
      imdbRating: "8.4",
      genres: ["Action", "Adventure"]
    },
    {
      id: "tt15398776",
      type: "movie",
      name: "Oppenheimer",
      poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      description: "Story of J. Robert Oppenheimer and the atomic bomb.",
      releaseInfo: "2023",
      imdbRating: "8.6",
      genres: ["Biography", "Drama"]
    },
    {
      id: "tt3624082",
      type: "movie",
      name: "Top Gun: Maverick",
      poster: "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
      description: "Maverick trains top graduates for a special mission.",
      releaseInfo: "2022",
      imdbRating: "8.3",
      genres: ["Action", "Drama"]
    },
    {
      id: "tt10872600",
      type: "movie",
      name: "Spider-Man: No Way Home",
      poster: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
      description: "Peter Parker seeks help to restore his secret identity.",
      releaseInfo: "2021",
      imdbRating: "8.2",
      genres: ["Action", "Adventure"]
    },
    {
      id: "tt1877830",
      type: "movie",
      name: "The Batman",
      poster: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
      description: "Batman hunts a serial killer in Gotham City.",
      releaseInfo: "2022",
      imdbRating: "7.8",
      genres: ["Action", "Crime"]
    },
    {
      id: "tt0468569",
      type: "movie",
      name: "The Dark Knight",
      poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      description: "Batman faces the Joker who plunges Gotham into chaos.",
      releaseInfo: "2008",
      imdbRating: "9.0",
      genres: ["Action", "Crime"]
    },
    {
      id: "tt1375666",
      type: "movie",
      name: "Inception",
      poster: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
      description: "A thief plants an idea into a CEO's mind through dreams.",
      releaseInfo: "2010",
      imdbRating: "8.8",
      genres: ["Action", "Sci-Fi"]
    },
    {
      id: "tt1517268",
      type: "movie",
      name: "The Shawshank Redemption",
      poster: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      description: "Two imprisoned men find redemption through acts of decency.",
      releaseInfo: "1994",
      imdbRating: "9.3",
      genres: ["Drama"]
    }
  ];

  const series = [
    {
      id: "tt0944947",
      type: "series",
      name: "Game of Thrones",
      poster: "https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
      description: "Seven noble families fight for control of Westeros.",
      releaseInfo: "2011–2019",
      imdbRating: "9.2",
      genres: ["Action", "Adventure", "Drama"]
    },
    {
      id: "tt0903747",
      type: "series",
      name: "Breaking Bad",
      poster: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      description: "A chemistry teacher turns to making meth.",
      releaseInfo: "2008–2013",
      imdbRating: "9.5",
      genres: ["Crime", "Drama"]
    },
    {
      id: "tt4574234",
      type: "series",
      name: "Stranger Things",
      poster: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
      description: "A boy disappears in a small town with dark secrets.",
      releaseInfo: "2016–",
      imdbRating: "8.7",
      genres: ["Drama", "Fantasy", "Horror"]
    },
    {
      id: "tt3581920",
      type: "series",
      name: "The Last of Us",
      poster: "https://image.tmdb.org/t/p/w500/uKvVj3q4ZN4LYcPkeT1Cya14WSL.jpg",
      description: "Joel and Ellie navigate post-apocalyptic America.",
      releaseInfo: "2023–",
      imdbRating: "8.8",
      genres: ["Action", "Drama"]
    },
    {
      id: "tt1190634",
      type: "series",
      name: "The Boys",
      poster: "https://image.tmdb.org/t/p/w500/mY7SeH4HFFxW1hiI6cWuwCRKptN.jpg",
      description: "Vigilantes take down corrupt superheroes.",
      releaseInfo: "2019–",
      imdbRating: "8.7",
      genres: ["Action", "Comedy", "Crime"]
    },
    {
      id: "tt13457460",
      type: "series",
      name: "Wednesday",
      poster: "https://image.tmdb.org/t/p/w500/9PFonBhy4cQy7Jz20NpMygczOkv.jpg",
      description: "Wednesday Addams solves mysteries at Nevermore Academy.",
      releaseInfo: "2022–",
      imdbRating: "8.5",
      genres: ["Comedy", "Crime", "Fantasy"]
    }
  ];

  // Return movies for any movie catalog request
  if (path.includes('/movie/')) {
    return new Response(JSON.stringify({ metas: movies }), { headers });
  }

  // Return series for any series catalog request
  if (path.includes('/series/')) {
    return new Response(JSON.stringify({ metas: series }), { headers });
  }

  return new Response(JSON.stringify({ metas: [] }), { headers });
}

function handleMeta(path, headers) {
  // Extract ID from path like /meta/movie/tt4154796.json
  const parts = path.split('/');
  const type = parts[2]; // movie or series
  const id = parts[3].replace('.json', '');

  if (type === 'movie') {
    return new Response(JSON.stringify({
      meta: {
        id: id,
        type: "movie",
        name: getMovieName(id),
        poster: "https://image.tmdb.org/t/p/w500" + getMoviePoster(id),
        background: "https://image.tmdb.org/t/p/original" + getMoviePoster(id),
        description: getMovieDescription(id),
        releaseInfo: getMovieYear(id),
        runtime: getMovieRuntime(id),
        imdbRating: getMovieRating(id),
        genres: getMovieGenres(id)
      }
    }), { headers });
  }

  if (type === 'series') {
    const videos = [];
    for (let s = 1; s <= 3; s++) {
      for (let e = 1; e <= 5; e++) {
        videos.push({
          id: id + ':' + s + ':' + e,
          title: 'Season ' + s + ' Episode ' + e,
          season: s,
          episode: e
        });
      }
    }

    return new Response(JSON.stringify({
      meta: {
        id: id,
        type: "series",
        name: getSeriesName(id),
        poster: "https://image.tmdb.org/t/p/w500" + getSeriesPoster(id),
        background: "https://image.tmdb.org/t/p/original" + getSeriesPoster(id),
        description: getSeriesDescription(id),
        releaseInfo: getSeriesYear(id),
        runtime: getSeriesRuntime(id),
        imdbRating: getSeriesRating(id),
        genres: getSeriesGenres(id),
        videos: videos
      }
    }), { headers });
  }

  return new Response(JSON.stringify({ meta: {} }), { headers });
}

function handleStream(path, headers) {
  // Extract info from path like /stream/movie/tt4154796.json or /stream/series/tt0944947:1:1.json
  const parts = path.split('/');
  const type = parts[2]; // movie or series
  const id = parts[3].replace('.json', '');

  if (type === 'movie') {
    const tmdbId = id.replace('tt', '');
    return new Response(JSON.stringify({
      streams: [{
        name: "HyperStream 🎬 1080p",
        title: "Streaming via Videasy Player",
        url: "https://player.videasy.net/movie/" + tmdbId + "?autoplay=true"
      }]
    }), { headers });
  }

  if (type === 'series') {
    // Parse videoId format: tt0944947:1:1
    const [seriesId, season, episode] = id.split(':');
    const tmdbId = seriesId.replace('tt', '');
    
    return new Response(JSON.stringify({
      streams: [{
        name: "HyperStream 📺 S" + (season||1) + "E" + (episode||1),
        title: "Streaming via Videasy Player",
        url: "https://player.videasy.net/tv/" + tmdbId + "/" + (season||1) + "/" + (episode||1) + "?autoplay=true&next=true"
      }]
    }), { headers });
  }

  return new Response(JSON.stringify({ streams: [] }), { headers });
}

// Helper functions for movie data
function getMovieName(id) {
  const names = {
    "tt4154796": "Avengers: Endgame",
    "tt15398776": "Oppenheimer",
    "tt3624082": "Top Gun: Maverick",
    "tt10872600": "Spider-Man: No Way Home",
    "tt1877830": "The Batman",
    "tt0468569": "The Dark Knight",
    "tt1375666": "Inception",
    "tt1517268": "The Shawshank Redemption"
  };
  return names[id] || "Unknown Movie";
}

function getMoviePoster(id) {
  const posters = {
    "tt4154796": "/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
    "tt15398776": "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    "tt3624082": "/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
    "tt10872600": "/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
    "tt1877830": "/74xTEgt7R36Fpooo50r9T25onhq.jpg",
    "tt0468569": "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    "tt1375666": "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    "tt1517268": "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg"
  };
  return posters[id] || "";
}

function getMovieDescription(id) {
  const descs = {
    "tt4154796": "After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers must assemble once more to reverse Thanos actions and restore balance to the universe once and for all.",
    "tt15398776": "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
    "tt3624082": "After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUN's elite graduates on a mission that demands the ultimate sacrifice.",
    "tt10872600": "With Spider-Man's identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear.",
    "tt1877830": "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption.",
    "tt0468569": "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological tests of his ability to fight injustice.",
    "tt1375666": "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    "tt1517268": "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency."
  };
  return descs[id] || "No description available.";
}

function getMovieYear(id) {
  const years = {
    "tt4154796": "2019",
    "tt15398776": "2023",
    "tt3624082": "2022",
    "tt10872600": "2021",
    "tt1877830": "2022",
    "tt0468569": "2008",
    "tt1375666": "2010",
    "tt1517268": "1994"
  };
  return years[id] || "";
}

function getMovieRuntime(id) {
  const runtimes = {
    "tt4154796": "181 min",
    "tt15398776": "180 min",
    "tt3624082": "131 min",
    "tt10872600": "148 min",
    "tt1877830": "176 min",
    "tt0468569": "152 min",
    "tt1375666": "148 min",
    "tt1517268": "142 min"
  };
  return runtimes[id] || "";
}

function getMovieRating(id) {
  const ratings = {
    "tt4154796": "8.4",
    "tt15398776": "8.6",
    "tt3624082": "8.3",
    "tt10872600": "8.2",
    "tt1877830": "7.8",
    "tt0468569": "9.0",
    "tt1375666": "8.8",
    "tt1517268": "9.3"
  };
  return ratings[id] || "0";
}

function getMovieGenres(id) {
  const genres = {
    "tt4154796": ["Action", "Adventure", "Drama"],
    "tt15398776": ["Biography", "Drama", "History"],
    "tt3624082": ["Action", "Drama"],
    "tt10872600": ["Action", "Adventure", "Fantasy"],
    "tt1877830": ["Action", "Crime", "Drama"],
    "tt0468569": ["Action", "Crime", "Drama"],
    "tt1375666": ["Action", "Adventure", "Sci-Fi"],
    "tt1517268": ["Drama"]
  };
  return genres[id] || [];
}

// Helper functions for series data
function getSeriesName(id) {
  const names = {
    "tt0944947": "Game of Thrones",
    "tt0903747": "Breaking Bad",
    "tt4574234": "Stranger Things",
    "tt3581920": "The Last of Us",
    "tt1190634": "The Boys",
    "tt13457460": "Wednesday"
  };
  return names[id] || "Unknown Series";
}

function getSeriesPoster(id) {
  const posters = {
    "tt0944947": "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
    "tt0903747": "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
    "tt4574234": "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    "tt3581920": "/uKvVj3q4ZN4LYcPkeT1Cya14WSL.jpg",
    "tt1190634": "/mY7SeH4HFFxW1hiI6cWuwCRKptN.jpg",
    "tt13457460": "/9PFonBhy4cQy7Jz20NpMygczOkv.jpg"
  };
  return posters[id] || "";
}

function getSeriesDescription(id) {
  const descs = {
    "tt0944947": "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war while an ancient enemy returns after being dormant for millennia.",
    "tt0903747": "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family's financial future.",
    "tt4574234": "When a young boy disappears, his mother, a police chief, and his friends must confront terrifying supernatural forces in order to get him back.",
    "tt3581920": "Joel and Ellie, a pair connected through the harshness of the world they live in, are forced to endure brutal circumstances and ruthless killers on a trek across post-apocalyptic America.",
    "tt1190634": "A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers rather than using them for good.",
    "tt13457460": "Follows Wednesday Addons' years as a student at Nevermore Academy where she attempts to master her emerging psychic ability."
  };
  return descs[id] || "No description available.";
}

function getSeriesYear(id) {
  const years = {
    "tt0944947": "2011–2019",
    "tt0903747": "2008–2013",
    "tt4574234": "2016–",
    "tt3581920": "2023–",
    "tt1190634": "2019–",
    "tt13457460": "2022–"
  };
  return years[id] || "";
}

function getSeriesRuntime(id) {
  const runtimes = {
    "tt0944947": "57 min",
    "tt0903747": "47 min",
    "tt4574234": "51 min",
    "tt3581920": "60 min",
    "tt1190634": "60 min",
    "tt13457460": "50 min"
  };
  return runtimes[id] || "";
}

function getSeriesRating(id) {
  const ratings = {
    "tt0944947": "9.2",
    "tt0903747": "9.5",
    "tt4574234": "8.7",
    "tt3581920": "8.8",
    "tt1190634": "8.7",
    "tt13457460": "8.5"
  };
  return ratings[id] || "0";
}

function getSeriesGenres(id) {
  const genres = {
    "tt0944947": ["Action", "Adventure", "Drama"],
    "tt0903747": ["Crime", "Drama", "Thriller"],
    "tt4574234": ["Drama", "Fantasy", "Horror"],
    "tt3581920": ["Action", "Adventure", "Drama"],
    "tt1190634": ["Action", "Comedy", "Crime"],
    "tt13457460": ["Comedy", "Crime", "Fantasy"]
  };
  return genres[id] || [];
}
