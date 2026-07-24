// HyperStream Ultimate - Complete Stremio/Nuvio Streaming Addon
// Version 6.0.0 - Full Catalog with Movies, Series, Anime & Adult Content

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
      // Manifest endpoint
      if (path === '/' || path === '/manifest.json' || path === '') {
        return new Response(JSON.stringify({
          id: "com.dhrubonai.hyperstream",
          version: "6.0.0",
          name: "HyperStream Ultimate",
          description: "🎬 Movies • 📺 Series • 🎌 Anime • 🔞 Adult - Ultimate Streaming Experience",
          resources: ["catalog", "meta", "stream"],
          types: ["movie", "series", "other"],
          catalogs: [
            { type: "movie", id: "movies", name: "🎬 Top Movies" },
            { type: "series", id: "series", name: "📺 Top Series" },
            { type: "other", id: "anime", name: "🎌 Anime" },
            { type: "other", id: "adult", name: "🔞 Adult" }
          ],
          behaviorHints: { configurable: true, adult: false }
        }), { headers });
      }

      // Catalog requests
      if (path.includes('/catalog/')) {
        return handleCatalog(path, headers);
      }

      // Meta requests  
      if (path.includes('/meta/')) {
        return handleMeta(path, headers);
      }

      // Stream requests
      if (path.includes('/stream/')) {
        return handleStream(path, headers);
      }

      // Fallback
      return new Response(JSON.stringify({ 
        error: 'Not Found', 
        path: path,
        hint: 'Use /manifest.json to get started'
      }), { status: 404, headers });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
  }
};

// ==================== MOVIES CATALOG (50+) ====================
const moviesCatalog = [
  { id: "tt4154796", type: "movie", name: "Avengers: Endgame", poster: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg", description: "After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more to reverse Thanos' actions and restore balance to the universe.", releaseInfo: "2019", imdbRating: "8.4", genres: ["Action", "Adventure", "Drama"] },
  { id: "tt15398776", type: "movie", name: "Oppenheimer", poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.", releaseInfo: "2023", imdbRating: "8.6", genres: ["Biography", "Drama", "History"] },
  { id: "tt3624082", type: "movie", name: "Top Gun: Maverick", poster: "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg", description: "After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUN's elite graduates on a mission that demands the ultimate sacrifice.", releaseInfo: "2022", imdbRating: "8.3", genres: ["Action", "Drama"] },
  { id: "tt10872600", type: "movie", name: "Spider-Man: No Way Home", poster: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg", description: "With Spider-Man's identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear, forcing Peter to discover what it truly means to be Spider-Man.", releaseInfo: "2021", imdbRating: "8.2", genres: ["Action", "Adventure", "Fantasy"] },
  { id: "tt1877830", type: "movie", name: "The Batman", poster: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg", description: "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.", releaseInfo: "2022", imdbRating: "7.8", genres: ["Action", "Crime", "Drama"] },
  { id: "tt0468569", type: "movie", name: "The Dark Knight", poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological tests of his ability to fight injustice.", releaseInfo: "2008", imdbRating: "9.0", genres: ["Action", "Crime", "Drama"] },
  { id: "tt1375666", type: "movie", name: "Inception", poster: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project.", releaseInfo: "2010", imdbRating: "8.8", genres: ["Action", "Adventure", "Sci-Fi"] },
  { id: "tt1517268", type: "movie", name: "The Shawshank Redemption", poster: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.", releaseInfo: "1994", imdbRating: "9.3", genres: ["Drama"] },
  { id: "tt0816692", type: "movie", name: "Avatar: The Way of Water", poster: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg", description: "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na'vi race to protect their home.", releaseInfo: "2022", imdbRating: "7.7", genres: ["Action", "Adventure", "Fantasy"] },
  { id: "tt0109830", type: "movie", name: "Forrest Gump", poster: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg", description: "The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man with an IQ of 75.", releaseInfo: "1994", imdbRating: "8.8", genres: ["Drama", "Romance"] },
  { id: "tt10366206", type: "movie", name: "Everything Everywhere All at Once", poster: "https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg", description: "A middle-aged Chinese immigrant is swept up into an insane adventure where she alone can save existence by exploring other universes connecting with the lives she could have led.", releaseInfo: "2022", imdbRating: "7.9", genres: ["Action", "Adventure", "Comedy"] },
  { id: "tt0499549", type: "movie", name: "Avatar", poster: "https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg", description: "A paraplegic Marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home.", releaseInfo: "2009", imdbRating: "7.9", genres: ["Action", "Adventure", "Fantasy"] },
  { id: "tt0266543", type: "movie", name: "The Lord of the Rings: The Fellowship of the Ring", poster: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbn8bkCmmrflg.jpg", description: "A meek Hobbit from the Shire and eight companions set out on a journey to destroy the powerful One Ring and save Middle-earth from the Dark Lord Sauron.", releaseInfo: "2001", imdbRating: "8.9", genres: ["Action", "Adventure", "Drama"] },
  { id: "tt1856101", type: "movie", name: "Jurassic World", poster: "https://image.tmdb.org/t/p/w500/uJYYizSuA9Y3DCs0qS4qWvHfZg4.jpg", description: "A new theme park, built on the original site of Jurassic Park, creates a genetically modified hybrid dinosaur, which escapes containment and goes on a killing spree.", releaseInfo: "2015", imdbRating: "6.6", genres: ["Action", "Adventure", "Sci-Fi"] },
  { id: "tt1160419", type: "movie", name: "Dune: Part Two", poster: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjMVAO.jpg", description: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between love and fate, he must prevent a terrible future only he can foresee.", releaseInfo: "2024", imdbRating: "8.5", genres: ["Action", "Adventure", "Drama"] },
  { id: "tt0095950", type: "movie", name: "Indiana Jones and the Last Crusade", poster: "https://image.tmdb.org/t/p/w500/efrZOCw5hvpEhPdSNv6Mgw4DBl.jpg", description: "Archaeologist and adventurer Indiana Jones joins forces with his father to stop Nazis from obtaining the Holy Grail.", releaseInfo: "1989", imdbRating: "8.3", genres: ["Action", "Adventure"] },
  { id: "tt0120737", type: "movie", name: "The Lord of the Rings: The Fellowship of the Ring", poster: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbn8bkCmmrflg.jpg", description: "A Hobbit named Frodo inherits a ring that holds the key to the survival of all Middle-earth. He must destroy it in the fires of Mount Doom before the Dark Lord Sauron finds it.", releaseInfo: "2001", imdbRating: "8.9", genres: ["Action", "Adventure", "Fantasy"] },
  { id: "tt0068646", type: "movie", name: "The Godfather", poster: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", description: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant youngest son.", releaseInfo: "1972", imdbRating: "9.2", genres: ["Crime", "Drama"] },
  { id: "tt0111161", type: "movie", name: "The Shawshank Redemption", poster: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", description: "Andy Dufresne, a banker, is sentenced to life in Shawshank State Penitentiary for the murder of his wife and her lover, despite his claims of innocence.", releaseInfo: "1994", imdbRating: "9.3", genres: ["Drama"] },
  { id: "tt2380330", type: "movie", name: "Interstellar", poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival as Earth becomes uninhabitable.", releaseInfo: "2014", imdbRating: "8.7", genres: ["Adventure", "Drama", "Sci-Fi"] },
  { id: "tt2975590", type: "movie", name: "Captain America: Civil War", poster: "https://image.tmdb.org/t/p/w500/rAGiNaa0iCmW8lWSOJXiUobJ0eG.jpg", description: "Political involvement in the Avengers' activities causes a rift between Captain America and Iron Man, leading to an internal battle between the heroes.", releaseInfo: "2016", imdbRating: "7.8", genres: ["Action", "Adventure", "Sci-Fi"] },
  { id: "tt1825683", type: "movie", name: "The Hunger Games: Catching Fire", poster: "https://image.tmdb.org/t/p/w500/nPszQSxgGMKpcMM5T9fHWZoeT73.jpg", description: "Katniss Everdeen and Peeta Mellark become targets of the Capitol after their victory in the 74th Hunger Games sparks a rebellion in the Districts of Panem.", releaseInfo: "2013", imdbRating: "7.5", genres: ["Action", "Adventure", "Sci-Fi"] },
  { id: "tt4633694", type: "movie", name: "Spider-Man: Into the Spider-Verse", poster: "https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg", description: "Teen Miles Morales becomes the Spider-Man of his universe, and must join with five spider-powered individuals from other dimensions to stop a threat for all realities.", releaseInfo: "2018", imdbRating: "8.4", genres: ["Animation", "Action", "Adventure"] },
  { id: "tt3743324", type: "movie", name: "Black Panther", poster: "https://image.tmdb.org/t/p/w500/uxzzxijgPIY7slzFvMotPv8wjKA.jpg", description: "T'Challa, heir to the hidden but advanced kingdom of Wakanda, must step forward to lead his people into a new future and must confront a challenger from his country's past.", releaseInfo: "2018", imdbRating: "7.3", genres: ["Action", "Adventure", "Sci-Fi"] },
  { id: "tt11196316", type: "movie", name: "John Wick: Chapter 4", poster: "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5Uqs0v33.jpg", description: "John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe.", releaseInfo: "2023", imdbRating: "7.7", genres: ["Action", "Crime", "Thriller"] },
  { id: "tt11240732", type: "movie", name: "Deadpool & Wolverine", poster: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg", description: "Wolverine is recovering from his injuries when he crosses paths with the loudmouth Deadpool. They form a duo and must defeat a common enemy.", releaseInfo: "2024", imdbRating: "7.9", genres: ["Action", "Adventure", "Comedy"] },
  { id: "tt0050083", type: "movie", name: "Psycho", poster: "https://image.tmdb.org/t/p/w500/揣bSLqONnMLo6eH3fnSBubxdDF.jpg", description: "A Phoenix secretary embezzles $40,000 from her employer's client, goes on the run, and checks into a remote motel run by a young man under the domination of his mother.", releaseInfo: "1960", imdbRating: "8.5", genres: ["Horror", "Mystery", "Thriller"] },
  { id: "tt0073486", type: "movie", name: "Jaws", poster: "https://image.tmdb.org/t/p/w500/sqMlw7XOgljJzL1PWvwHoi87Jss.jpg", description: "A great white shark hunts swimmers off Amity Island, prompting the police chief, a marine biologist, and a fisherman to hunt it down.", releaseInfo: "1975", imdbRating: "8.1", genres: ["Adventure", "Thriller"] },
  { id: "tt0080678", type: "movie", name: "Raiders of the Lost Ark", poster: "https://image.tmdb.org/t/p/w500/AaV1YIdWKhw9f0fJhMoZVGfucTH.jpg", description: "Archaeologist Indiana Jones races against Nazi Germany to recover the lost Ark of the Covenant before Hitler's army can use its power to conquer the world.", releaseInfo: "1981", imdbRating: "8.4", genres: ["Action", "Adventure"] },
  { id: "tt0097576", type: "movie", name: "Aliens", poster: "https://image.tmdb.org/t/p/w500/iuFXMSl2lTmcVyJVOkqkQKXvEfv.jpg", description: "Ellen Ripley returns to the moon where her crew encountered the hostile Alien creature, this time accompanied by colonial marines who intend to wipe out the alien threat forever.", releaseInfo: "1986", imdbRating: "8.4", genres: ["Action", "Horror", "Sci-Fi"] },
  { id: "tt0108052", type: "movie", name: "Schindler's List", poster: "https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMG49QSm1.jpg", description: "In German-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce after witnessing their persecution by the Nazis.", releaseInfo: "1993", imdbRating: "9.0", genres: ["Biography", "Drama", "History"] },
  { id: "tt0110912", type: "movie", name: "Pulp Fiction", poster: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", description: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.", releaseInfo: "1994", imdbRating: "8.9", genres: ["Crime", "Drama"] },
  { id: "tt0120689", type: "movie", name: "The Green Mile", poster: "https://image.tmdb.org/t/p/w500/velNPhGQmDmTWlhjRnmVtYz3gEX.jpg", description: "The lives of guards on Death Row are affected by one of their charges, a black man accused of child murder and rape, while having a mysterious gift.", releaseInfo: "1999", imdbRating: "8.6", genres: ["Crime", "Drama", "Fantasy"] },
  { id: "tt0134826", type: "movie", name: "Fight Club", poster: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", description: "An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.", releaseInfo: "1999", imdbRating: "8.8", genres: ["Drama"] },
  { id: "tt0162221", type: "movie", name: "The Lord of the Rings: The Two Towers", poster: "https://image.tmdb.org/t/p/w500/V7drxZjghsBmZaXEM2PmqHFGX9v.jpg", description: "While Frodo and Sam continue their journey towards Mordor, Aragorn, Legolas, and Gimli come to the war-torn nation of Rohan and reunite with Gandalf to fight the evil wizard Saruman's army.", releaseInfo: "2002", imdbRating: "8.8", genres: ["Action", "Adventure", "Drama"] },
  { id: "tt0172495", type: "movie", name: "Gladiator", poster: "https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg", description: "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.", releaseInfo: "2000", imdbRating: "8.5", genres: ["Action", "Adventure", "Drama"] },
  { id: "tt0180093", type: "movie", name: "The Lord of the Rings: The Return of the King", poster: "https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg", description: "Gandalf and Aragorn lead the World of Men against Sauron's army to draw his gaze from Frodo and Sam as they approach Mount Doom with the One Ring.", releaseInfo: "2003", imdbRating: "9.0", genres: ["Action", "Adventure", "Drama"] },
  { id: "tt0209145", type: "movie", name: "Master and Commander: The Far Side of the World", poster: "https://image.tmdb.org/t/p/w500/mB5zqW4hEitI8fKrjJOLxMinbSx.jpg", description: "During the Napoleonic Wars, a brash British captain pushes his ship and crew to their limits in pursuit of a formidable French war vessel around South America.", releaseInfo: "2003", imdbRating: "7.4", genres: ["Action", "Adventure", "Drama"] },
  { id: "tt0241527", type: "movie", name: "Harry Potter and the Sorcerer's Stone", poster: "https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg", description: "An orphaned boy enrolls in a school of wizardry, where he learns the truth about himself, his family and the terrible evil that haunts the magical world.", releaseInfo: "2001", imdbRating: "7.6", genres: ["Adventure", "Family", "Fantasy"] },
  { id: "tt0253474", type: "movie", name: "The Lord of the Rings: The Fellowship of the Ring Extended", poster: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbn8bkCmmrflg.jpg", description: "Extended edition of the epic tale of a humble hobbit who is entrusted with the task of destroying the One Ring before the Dark Lord can reclaim it.", releaseInfo: "2001", imdbRating: "9.0", genres: ["Action", "Adventure", "Fantasy"] },
  { id: "tt0286741", type: "movie", name: "Harry Potter and the Chamber of Secrets", poster: "https://image.tmdb.org/t/p/w500/lbDxn6g5MJqMZukz1P3w2WTLW7e.jpg", description: "An ancient prophecy seems to be coming true when a mysterious presence begins stalking the corridors of Hogwarts and leaving its victims paralyzed.", releaseInfo: "2002", imdbRating: "7.4", genres: ["Adventure", "Family", "Fantasy"] },
  { id: "tt0317940", type: "movie", name: "Pirates of the Caribbean: The Curse of the Black Pearl", poster: "https://image.tmdb.org/t/p/w500/qrEMmqlWHv4hOOPcqSjxzJPqSMI.jpg", description: "Blacksmith Will Turner teams up with eccentric pirate Captain Jack Sparrow to save his love, the governor's daughter, from Jack's former pirate allies, who are now undead.", releaseInfo: "2003", imdbRating: "8.1", genres: ["Action", "Adventure", "Fantasy"] },
  { id: "tt0369610", type: "movie", name: "Jurassic World: Fallen Kingdom", poster: "https://image.tmdb.org/t/p/w500/cCFsY6hGQcLHN9eWQVKiVaUZNh.jpg", description: "When the island's dormant volcano begins roaring to life, Owen and Claire mount a campaign to rescue the remaining dinosaurs from this extinction-level event.", releaseInfo: "2018", imdbRating: "5.7", genres: ["Action", "Adventure", "Sci-Fi"] },
  { id: "tt0485974", type: "movie", name: "The Bourne Ultimatum", poster: "https://image.tmdb.org/t/p/w500/aq1MisSPoUmJBduljk68JqliHrk.jpg", description: "Jason Bourne continues his international quest for answers about his past, while being hunted by the very organization that made him who he is.", releaseInfo: "2007", imdbRating: "8.0", genres: ["Action", "Thriller"] },
  { id: "tt0848228", type: "movie", name: "Avengers: Age of Ultron", poster: "https://image.tmdb.org/t/p/w500/4ss3wY8DmfxJu0G1UEUhCq7rJWM.jpg", description: "When Tony Stark and Bruce Banner try to jump-start a dormant peacekeeping program called Ultron, things go horribly wrong and it's up to Earth's mightiest heroes to stop the villainous Ultron from enacting his terrible plan.", releaseInfo: "2015", imdbRating: "7.3", genres: ["Action", "Adventure", "Sci-Fi"] },
  { id: "tt0993842", type: "movie", name: "The Dark Knight Rises", poster: "https://image.tmdb.org/t/p/w500/K9uZyI9XI8wt6gnWjRvTNUI5test.jpg", description: "Eight years after the Joker's reign of terrorism, Batman, with the help of the enigmatic Catwoman, is forced from his exile to save Gotham City from the brutal guerrilla terrorist Bane.", releaseInfo: "2012", imdbRating: "8.4", genres: ["Action", "Crime", "Drama"] },
  { id: "tt1201607", type: "movie", name: "Harry Potter and the Deathly Hallows: Part 2", poster: "https://image.tmdb.org/t/p/w500/hZSmC3LKVbKsAzZ68cjqBfDoDug.jpg", description: "Harry, Ron, and Hermione search for Voldemort's remaining Horcruxes in their effort to destroy the Dark Lord once and for all as the ultimate battle rages on at Hogwarts.", releaseInfo: "2011", imdbRating: "8.1", genres: ["Adventure", "Drama", "Fantasy"] },
  { id: "tt1270797", type: "movie", name: "The Social Network", poster: "https://image.tmdb.org/t/p/w500/n0yLIBiidMnX8mN7dhd5wkg02VQ.jpg", description: "Harvard student Mark Zuckerberg creates the social networking site that would become known as Facebook, but is later sued by two brothers who claimed he stole their idea.", releaseInfo: "2010", imdbRating: "7.7", genres: ["Biography", "Drama"] },
  { id: "tt1630029", type: "movie", name: "Avatar: Extended Collector's Edition", poster: "https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg", description: "Extended version of James Cameron's groundbreaking sci-fi epic about a paraplegic marine dispatched to Pandora who falls in love with the Na'vi way of life.", releaseInfo: "2009", imdbRating: "7.9", genres: ["Action", "Adventure", "Fantasy"] },
  { id: "tt1825683", type: "movie", name: "The Hunger Games: Catching Fire", poster: "https://image.tmdb.org/t/p/w500/nPszQSxgGMKpcMM5T9fHWZoeT73.jpg", description: "Katniss Everdeen and Peeta Mellark become targets of the Capitol after their victory sparks a rebellion in Panem's districts.", releaseInfo: "2013", imdbRating: "7.5", genres: ["Action", "Adventure", "Sci-Fi"] },
  { id: "tt2398429", type: "movie", name: "Godzilla", poster: "https://image.tmdb.org/t/p/w500/ojh2vz5k2EWL9PHqABaekVvIXYL.jpg", description: "The world's most fearsome creatures rise again after millennia to fight for supremacy, leaving humanity's existence hanging in the balance.", releaseInfo: "2014", imdbRating: "6.4", genres: ["Action", "Adventure", "Sci-Fi"] },
  { id: "tt3501632", type: "movie", name: "Thor: Ragnarok", poster: "https://image.tmdb.org/t/p/w500/kaIf55hlUecUcj2lF0lC9q0iJNj.jpg", description: "Imprisoned on the planet Sakaar, Thor must race against time to return to Asgard and stop Ragnarok, the destruction of his homeworld, at the hands of the all-powerful Hela.", releaseInfo: "2017", imdbRating: "7.9", genres: ["Action", "Adventure", "Comedy"] },
  { id: "tt3749900", type: "movie", name: "Doctor Strange", poster: "https://image.tmdb.org/t/p/w500/tFEU8bDeYrGaJbPNStClZDwGVGA.jpg", description: "While on a journey of physical and healing, brilliant neurosurgeon Doctor Stephen Strange learns the secrets of a hidden world of magic and alternate dimensions.", releaseInfo: "2016", imdbRating: "7.5", genres: ["Action", "Adventure", "Fantasy"] },
  { id: "tt4154756", type: "movie", name: "Avengers: Infinity War", poster: "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkvU4AevfO.jpg", description: "The Avengers and their allies must be willing to sacrifice all in an attempt to defeat the powerful Thanos before his blitz of devastation and ruin puts an end to the universe.", releaseInfo: "2018", imdbRating: "8.4", genres: ["Action", "Adventure", "Sci-Fi"] },
  { id: "tt5050054", type: "movie", name: "Justice League", poster: "https://image.tmdb.org/t/p/w500/cKep7lqDiHZkJ0SJsRR1ipz5qv7.jpg", description: "Inspired by Superman's sacrifice, Bruce Wayne and Diana Prince set out to recruit a team of metahumans to protect the world from an approaching threat of catastrophic proportions.", releaseInfo: "2017", imdbRating: "6.0", genres: ["Action", "Adventure", "Fantasy"] },
  { id: "tt5463162", type: "movie", name: "Deadpool", poster: "https://image.tmdb.org/t/p/w500/fSRbJKcyUXagew5r01MBWo87R7Q.jpg", description: "A wisecracking mercenary gets experimented on and becomes immortal yet hideously scarred, setting out to track down the man who ruined his looks.", releaseInfo: "2016", imdbRating: "8.0", genres: ["Action", "Adventure", "Comedy"] },
  { id: "tt6789794", type: "movie", name: "Glass", poster: "https://image.tmdb.org/t/p/w500/vIHlsWtleEmWqODtQiHqprVVwE.jpg", description: "Security guard David Dunn uses his supernatural abilities to track Kevin Wendell Crumb, a disturbed man who has twenty-four personalities.", releaseInfo: "2019", imdbRating: "6.7", genres: ["Drama", "Sci-Fi", "Thriller"] },
  { id: "tt7131872", type: "movie", name: "Joker", poster: "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg", description: "In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society. He then embarks on a downward spiral of revolution and bloody crime.", releaseInfo: "2019", imdbRating: "8.4", genres: ["Crime", "Drama", "Thriller"] },
  { id: "tt8946368", type: "movie", name: "A Quiet Place", poster: "https://image.tmdb.org/t/p/w500/nnUHB1cmkQC5gA29LsjPJNOygOc.jpg", description: "In a post-apocalyptic world, a family is forced to live in silence while hiding from monsters with ultra-sensitive hearing.", releaseInfo: "2018", imdbRating: "7.5", genres: ["Drama", "Horror", "Sci-Fi"] },
  { id: "tt9419884", type: "movie", name: "Tenet", poster: "https://image.tmdb.org/t/p/w500/k68nPLWISTBlOTVRANZmYnjQEvE.jpg", description: "Armed with only one word, Tenet, and fighting for the survival of the entire world, a Protagonist journeys through a twilight world of international espionage on a mission that will unfold in something beyond real time.", releaseInfo: "2020", imdbRating: "7.3", genres: ["Action", "Sci-Fi", "Thriller"] }
];

// ==================== SERIES CATALOG (30+) ====================
const seriesCatalog = [
  { 
    id: "tt0944947", type: "series", name: "Game of Thrones", 
    poster: "https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg", 
    description: "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war while an ancient enemy returns after being dormant for millennia.",
    releaseInfo: "2011–2019", imdbRating: "9.2", genres: ["Action", "Adventure", "Drama"],
    videos: generateSeriesVideos("tt0944947", 8, 10)
  },
  { 
    id: "tt0903747", type: "series", name: "Breaking Bad", 
    poster: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", 
    description: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family's financial future.",
    releaseInfo: "2008–2013", imdbRating: "9.5", genres: ["Crime", "Drama", "Thriller"],
    videos: generateSeriesVideos("tt0903747", 5, 13)
  },
  { 
    id: "tt4574234", type: "series", name: "Stranger Things", 
    poster: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", 
    description: "When a young boy disappears, his mother, a police chief, and his friends must confront terrifying supernatural forces in order to get him back.",
    releaseInfo: "2016–", imdbRating: "8.7", genres: ["Drama", "Fantasy", "Horror"],
    videos: generateSeriesVideos("tt4574234", 4, 9)
  },
  { 
    id: "tt3581920", type: "series", name: "The Last of Us", 
    poster: "https://image.tmdb.org/t/p/w500/uKvVj3q4ZN4LYcPkeT1Cya14WSL.jpg", 
    description: "Joel and Ellie, a pair connected through the harshness of the world they live in, are forced to endure brutal circumstances and ruthless killers on a trek across post-apocalyptic America.",
    releaseInfo: "2023–", imdbRating: "8.8", genres: ["Action", "Adventure", "Drama"],
    videos: generateSeriesVideos("tt3581920", 2, 9)
  },
  { 
    id: "tt1190634", type: "series", name: "The Boys", 
    poster: "https://image.tmdb.org/t/p/w500/mY7SeH4HFFxW1hiI6cWuwCRKptN.jpg", 
    description: "A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers rather than using them for good.",
    releaseInfo: "2019–", imdbRating: "8.7", genres: ["Action", "Comedy", "Crime"],
    videos: generateSeriesVideos("tt1190634", 4, 8)
  },
  { 
    id: "tt13457460", type: "series", name: "Wednesday", 
    poster: "https://image.tmdb.org/t/p/w500/9PFonBhy4cQy7Jz20NpMygczOkv.jpg", 
    description: "Follows Wednesday Addams' years as a student at Nevermore Academy where she attempts to master her emerging psychic ability.",
    releaseInfo: "2022–", imdbRating: "8.5", genres: ["Comedy", "Crime", "Fantasy"],
    videos: generateSeriesVideos("tt13457460", 2, 8)
  },
  { 
    id: "tt10554269", type: "series", name: "The Witcher", 
    poster: "https://image.tmdb.org/t/p/w500/7vjaCdMw15FEbXyLQTVa04URsPm.jpg", 
    description: "Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world where people often prove more wicked than beasts.",
    releaseInfo: "2019–", imdbRating: "8.0", genres: ["Action", "Adventure", "Fantasy"],
    videos: generateSeriesVideos("tt10554269", 3, 8)
  },
  { 
    id: "tt11198330", type: "series", name: "House of the Dragon", 
    poster: "https://image.tmdb.org/t/p/w500/z2yahl2uefxD1BkrnRNa6R5BodK.jpg", 
    description: "An internal war is fought, known as the Dance of the Dragons, for control of the Iron Throne between House Targaryen branches.",
    releaseInfo: "2022–", imdbRating: "8.5", genres: ["Action", "Adventure", "Drama"],
    videos: generateSeriesVideos("tt11198330", 2, 10)
  },
  { 
    id: "tt3029516", type: "series", name: "Better Call Saul", 
    poster: "https://image.tmdb.org/t/p/w500/eBctNaeiUqQBao5IK7yGlrWNyFfy.jpg", 
    description: "The trials and tribulations of criminal lawyer Jimmy McGill before he became Saul Goodman.",
    releaseInfo: "2015–2022", imdbRating: "8.9", genres: ["Crime", "Drama"],
    videos: generateSeriesVideos("tt3029516", 6, 10)
  },
  { 
    id: "tt7183020", type: "series", name: "The Mandalorian", 
    poster: "https://image.tmdb.org/t/p/w500/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg", 
    description: "The travels of a lone bounty hunter in the outer reaches of the galaxy, far from the authority of the New Republic.",
    releaseInfo: "2019–", imdbRating: "8.7", genres: ["Action", "Adventure", "Sci-Fi"],
    videos: generateSeriesVideos("tt7183020", 3, 8)
  },
  { 
    id: "tt2442560", type: "series", name: "Peaky Blinders", 
    poster: "https://image.tmdb.org/t/p/w500/vUUqizwpIB3krqmNcSYSU1IaEFC.jpg", 
    description: "A gangster family epic set in 1900s England, centering on a gang who sew razor blades in the peaks of their caps.",
    releaseInfo: "2013–2022", imdbRating: "8.8", genres: ["Crime", "Drama"],
    videos: generateSeriesVideos("tt2442560", 6, 6)
  },
  { 
    id: "tt3032476", type: "series", name: "The Walking Dead", 
    poster: "https://image.tmdb.org/t/p/w500/xf9wuDcqlUPWABZNeDKPbZUajWb.jpg", 
    description: "Sheriff Deputy Rick Grimes wakes up from a coma to learn the world is in ruins, and must lead a group of survivors to stay alive.",
    releaseInfo: "2010–2022", imdbRating: "8.1", genres: ["Drama", "Horror", "Thriller"],
    videos: generateSeriesVideos("tt3032476", 3, 16)
  },
  { 
    id: "tt6513056", type: "series", name: "Cobra Kai", 
    poster: "https://image.tmdb.org/t/p/w500/jlJ8gDrdMiGWz4txMKxCkUotfvc.jpg", 
    description: "Decades after their 1984 All Valley Karate Tournament bout, a middle-aged Daniel LaRusso and Johnny Lawrence find themselves martial-arts rivals again.",
    releaseInfo: "2018–", imdbRating: "8.5", genres: ["Action", "Comedy", "Drama"],
    videos: generateSeriesVideos("tt6513056", 6, 10)
  },
  { 
    id: "tt11965092", type: "series", name: "Squid Game", 
    poster: "https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg", 
    description: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games for a tempting prize, but the stakes are deadly.",
    releaseInfo: "2021–", imdbRating: "8.0", genres: ["Action", "Drama", "Mystery"],
    videos: generateSeriesVideos("tt11965092", 2, 9)
  },
  { 
    id: "tt2707408", type: "series", name: "The Flash", 
    poster: "https://image.tmdb.org/t/p/w500/jXCylbgfvjODiAPxKJbXXR9exzN.jpg", 
    description: "Barry Allen, a forensic scientist gains super-human speed which he uses to fight criminals, including others who have also gained superhuman abilities.",
    releaseInfo: "2014–2023", imdbRating: "7.7", genres: ["Action", "Adventure", "Drama"],
    videos: generateSeriesVideos("tt2707408", 3, 23)
  },
  { 
    id: "tt1796966", type: "series", name: "Black Mirror", 
    poster: "https://image.tmdb.org/t/p/w500/7I6VUdPj6tQECNHdviJkU1KTWwG.jpg", 
    description: "An anthology series exploring a twisted, high-tech multiverse where humanity's greatest innovations and darkest instincts collide.",
    releaseInfo: "2011–", imdbRating: "8.7", genres: ["Drama", "Sci-Fi", "Thriller"],
    videos: generateSeriesVideos("tt1796966", 3, 6)
  },
  { 
    id: "tt5834252", type: "series", name: "Westworld", 
    poster: "https://image.tmdb.org/t/p/w500/djFbOjHqcBNtgvIMQ4HvzqM9LMh.jpg", 
    description: "Set at the intersection of the near future and the reimagined past, explore a world in which every human appetite can be indulged without consequence.",
    releaseInfo: "2016–2022", imdbRating: "8.5", genres: ["Drama", "Sci-Fi", "Thriller"],
    videos: generateSeriesVideos("tt5834252", 4, 8)
  },
  { 
    id: "tt14478370", type: "series", name: "Loki", 
    poster: "https://image.tmdb.org/t/p/w500/voHUmluYmKyleFkTu3lOXQG702u.jpg", 
    description: "The mercurial villain Loki resumes his role as the God of Mischief in a new series that takes place after the events of Avengers: Endgame.",
    releaseInfo: "2021–", imdbRating: "8.3", genres: ["Action", "Adventure", "Comedy"],
    videos: generateSeriesVideos("tt14478370", 2, 6)
  },
  { 
    id: "tt14627660", type: "series", name: "Arcane", 
    poster: "https://image.tmdb.org/t/p/w500/XNSmjKvThqMDlyCwYyZXHsZajbz.jpg", 
    description: "Set in utopian Piltover and the underground of Zaun, the story follows the origins of two iconic League of Legends champions.",
    releaseInfo: "2021–", imdbRating: "9.0", genres: ["Animation", "Action", "Adventure"],
    videos: generateSeriesVideos("tt14627660", 2, 9)
  },
  { 
    id: "tt1762908", type: "series", name: "Dexter", 
    poster: "https://image.tmdb.org/t/p/w500/qVfKaYnlMmLsPGbOrjxkBbsrQbb.jpg", 
    description: "By day, mild-mannered Dexter is a blood-spatter analyst for the Miami police. But at night, he is a serial killer who only targets other murderers.",
    releaseInfo: "2006–2013", imdbRating: "8.9", genres: ["Crime", "Drama", "Mystery"],
    videos: generateSeriesVideos("tt1762908", 3, 12)
  },
  { 
    id: "tt5539930", type: "series", name: "Mr. Robot", 
    poster: "https://image.tmdb.org/t/p/w500/esN3IJEicfZY0by6Mc2maORZEnp.jpg", 
    description: "Elliot, a cyber-security engineer suffering from anxiety, works as a vigilante hacker recruited by an underground anarchist group.",
    releaseInfo: "2015–2019", imdbRating: "8.7", genres: ["Crime", "Drama", "Thriller"],
    videos: generateSeriesVideos("tt5539930", 4, 10)
  },
  { 
    id: "tt6226072", type: "series", name: "The Umbrella Academy", 
    poster: "https://image.tmdb.org/t/p/w500/scZLIbi2bwSw8MjoAMaURHSUFoq.jpg", 
    description: "A family of former child heroes, now grown apart, must reunite to continue their mission to save the world.",
    releaseInfo: "2019–", imdbRating: "7.9", genres: ["Action", "Adventure", "Comedy"],
    videos: generateSeriesVideos("tt6226072", 3, 10)
  },
  { 
    id: "tt6775424", type: "series", name: "You", 
    poster: "https://image.tmdb.org/t/p/w500/kS56hsaXlGAWwFOhLXnXCGxHOvP.jpg", 
    description: "A dangerously charming, intensely obsessive young man goes to extreme measures to insert himself into the lives of those he is transfixed by.",
    releaseInfo: "2018–", imdbRating: "7.7", genres: ["Crime", "Drama", "Romance"],
    videos: generateSeriesVideos("tt6775424", 4, 10)
  },
  { 
    id: "tt7662000", type: "series", name: "The Crown", 
    poster: "https://image.tmdb.org/t/p/w500/1M876KPjulVwppE2sfLbSh2FRJc.jpg", 
    description: "Follows the political rivalries and romance of Queen Elizabeth II's reign and the events that shaped the second half of the twentieth century.",
    releaseInfo: "2016–2023", imdbRating: "8.6", genres: ["Biography", "Drama", "History"],
    videos: generateSeriesVideos("tt7662000", 3, 10)
  },
  { 
    id: "tt8579674", type: "series", name: "1883", 
    poster: "https://image.tmdb.org/t/p/w500/uQTQcNoafrSFsdQ0tRWD7SQlbVr.jpg", 
    description: "A prequel to Yellowstone, it follows the Dutton family as they embark on a westward journey through the Great Plains.",
    releaseInfo: "2021–2022", imdbRating: "8.8", genres: ["Drama", "Western"],
    videos: generateSeriesVideos("tt8579674", 1, 10)
  },
  { 
    id: "tt9151904", type: "series", name: "Severance", 
    poster: "https://image.tmdb.org/t/p/w500/M0BrJcKzZEe4Y9Szo63Sx9cXHLz.jpg", 
    description: "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.",
    releaseInfo: "2022–", imdbRating: "8.7", genres: ["Drama", "Mystery", "Sci-Fi"],
    videos: generateSeriesVideos("tt9151904", 2, 9)
  },
  { 
    id: "tt10058162", type: "series", name: "Ted Lasso", 
    poster: "https://image.tmdb.org/t/p/w500/b0EqfDkjOSWEWLhbV1HvOndcQWa.jpg", 
    description: "American football coach Ted Lasso heads to London to manage AFC Richmond, a struggling English Premier League soccer team.",
    releaseInfo: "2020–2023", imdbRating: "8.8", genres: ["Comedy", "Drama", "Sport"],
    videos: generateSeriesVideos("tt10058162", 3, 12)
  },
  { 
    id: "tt10499754", type: "series", name: "The Bear", 
    poster: "https://image.tmdb.org/t/p/w500/sHqnCaNwPdKF9MUDW1R0pMPbe0s.jpg", 
    description: "A young chef from the fine dining world returns to Chicago to run his family's sandwich shop after a heartbreaking death.",
    releaseInfo: "2022–", imdbRating: "8.6", genres: ["Comedy", "Drama"],
    videos: generateSeriesVideos("tt10499754", 3, 8)
  },
  { 
    id: "tt11199006", type: "series", name: "Shogun", 
    poster: "https://image.tmdb.org/t/p/w500/7BsvM5mQvnWLr8qMyqRoSv9yV3R.jpg", 
    description: "Set in feudal Japan, Lord Yoshii Toranaga fights for his life as his enemies unite against him.",
    releaseInfo: "2024–", imdbRating: "8.7", genres: ["Action", "Drama", "History"],
    videos: generateSeriesVideos("tt11199006", 1, 10)
  },
  { 
    id: "tt11443588", type: "series", name: "Fallout", 
    poster: "https://image.tmdb.org/t/p/w500/4AKdQs9NXJiOYJS5c1qGyCdOkuF.jpg", 
    description: "Based on the video game series, the story depicts the aftermath of a nuclear war as survivors navigate life in luxurious underground bunkers.",
    releaseInfo: "2024–", imdbRating: "8.5", genres: ["Action", "Adventure", "Drama"],
    videos: generateSeriesVideos("tt11443588", 1, 8)
  }
];

// Helper function to generate series videos
function generateSeriesVideos(seriesId, seasons, episodesPerSeason) {
  const videos = [];
  for (let s = 1; s <= seasons; s++) {
    const epCount = s === seasons ? Math.max(5, episodesPerSeason - 2) : episodesPerSeason;
    for (let e = 1; e <= epCount; e++) {
      videos.push({
        id: seriesId + ':' + s + ':' + e,
        title: 'S' + s + ' E' + e + ' - Episode ' + e,
        season: s,
        episode: e
      });
    }
  }
  return videos;
}

// ==================== ANIME CATALOG (20+) ====================
const animeCatalog = [
  { 
    id: "anime_1", type: "other", name: "Attack on Titan", 
    poster: "https://cdn.myanimelist.net/images/anime/10/47347l.jpg", 
    description: "Centuries ago, mankind was slaughtered to near extinction by monstrous humanoid creatures called Titans. What remains of humanity now resides within enormous walls built to keep the Titans out.",
    releaseInfo: "2013–2023", imdbRating: "9.1", genres: ["Action", "Drama", "Fantasy"],
    videos: generateAnimeVideos("anime_1", 25)
  },
  { 
    id: "anime_2", type: "other", name: "Demon Slayer", 
    poster: "https://cdn.myanimelist.net/images/anime/1286/99889l.jpg", 
    description: "A family is attacked by demons and only two members survive - Tanjiro and his sister Nezuko, who is turning into a demon slowly. Tanjiro sets out to become a demon slayer to avenge his family and cure his sister.",
    releaseInfo: "2019–", imdbRating: "8.7", genres: ["Action", "Fantasy"],
    videos: generateAnimeVideos("anime_2", 26)
  },
  { 
    id: "anime_3", type: "other", name: "Jujutsu Kaisen", 
    poster: "https://cdn.myanimelist.net/images/anime/1171/109222l.jpg", 
    description: "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman's school to locate the demon's other body parts and thus kill it.",
    releaseInfo: "2020–", imdbRating: "8.8", genres: ["Action", "Fantasy"],
    videos: generateAnimeVideos("anime_3", 24)
  },
  { 
    id: "anime_4", type: "other", name: "One Piece", 
    poster: "https://cdn.myanimelist.net/images/anime/6/73245l.jpg", 
    description: "Monkey D. Luffy sets off on an adventure to find the legendary treasure One Piece and become the King of the Pirates, gathering a crew along the way.",
    releaseInfo: "1999–", imdbRating: "8.9", genres: ["Action", "Adventure", "Comedy"],
    videos: generateAnimeVideos("anime_4", 25)
  },
  { 
    id: "anime_5", type: "other", name: "Naruto Shippuden", 
    poster: "https://cdn.myanimelist.net/images/anime/1565/111305l.jpg", 
    description: "Naruto Uzumaki returns to the Hidden Leaf Village after two and a half years of training. He aims to save his friend Sasuke from Orochimaru while facing the Akatsuki organization.",
    releaseInfo: "2007–2017", imdbRating: "8.6", genres: ["Action", "Adventure"],
    videos: generateAnimeVideos("anime_5", 20)
  },
  { 
    id: "anime_6", type: "other", name: "Death Note", 
    poster: "https://cdn.myanimelist.net/images/anime/9/9453l.jpg", 
    description: "An intelligent high school student goes on a secret crusade to eliminate criminals from the world after discovering a notebook capable of killing anyone whose name is written into it.",
    releaseInfo: "2006–2007", imdbRating: "9.0", genres: ["Supernatural", "Suspense", "Thriller"],
    videos: generateAnimeVideos("anime_6", 37)
  },
  { 
    id: "anime_7", type: "other", name: "My Hero Academia", 
    poster: "https://cdn.myanimelist.net/images/anime/10/78745l.jpg", 
    description: "In a world where people with superpowers are the norm, a boy without powers dreams of becoming a superhero. When he meets the greatest hero, his life changes forever.",
    releaseInfo: "2016–", imdbRating: "8.2", genres: ["Action", "Comedy"],
    videos: generateAnimeVideos("anime_7", 25)
  },
  { 
    id: "anime_8", type: "other", name: "Dragon Ball Super", 
    poster: "https://cdn.myanimelist.net/images/anime/1710/91153l.jpg", 
    description: "Six months after the defeat of Majin Buu, Goku and his friends must face powerful enemies including Beerus the Destroyer and warriors from other universes.",
    releaseInfo: "2015–2018", imdbRating: "8.0", genres: ["Action", "Adventure", "Fantasy"],
    videos: generateAnimeVideos("anime_8", 20)
  },
  { 
    id: "anime_9", type: "other", name: "Fullmetal Alchemist: Brotherhood", 
    poster: "https://cdn.myanimelist.net/images/anime/1223/96541l.jpg", 
    description: "Two brothers search for a Philosopher's Stone after an attempt to revive their deceased mother goes awry. They uncover a conspiracy that threatens the entire nation.",
    releaseInfo: "2009–2012", imdbRating: "9.1", genres: ["Action", "Adventure", "Drama", "Fantasy"],
    videos: generateAnimeVideos("anime_9", 27)
  },
  { 
    id: "anime_10", type: "other", name: "Spy x Family", 
    poster: "https://cdn.myanimelist.net/images/anime/1441/139643l.jpg", 
    description: "A spy known as Twilight must build a fake family to execute a mission. He unknowingly marries an assassin and adopts a telepath, not knowing each other's true identities.",
    releaseInfo: "2022–", imdbRating: "8.6", genres: ["Action", "Comedy", "Slice of Life"],
    videos: generateAnimeVideos("anime_10", 25)
  },
  { 
    id: "anime_11", type: "other", name: "Chainsaw Man", 
    poster: "https://cdn.myanimelist.net/images/anime/1806/126216l.jpg", 
    description: "Denji has a simple dream—to live a happy and peaceful life, spending time with a girl he likes. This is a far cry from reality, however, as Denji is forced by the yakuza into killing devils in order to pay off his crushing debts.",
    releaseInfo: "2022–", imdbRating: "8.5", genres: ["Action", "Supernatural"],
    videos: generateAnimeVideos("anime_11", 12)
  },
  { 
    id: "anime_12", type: "other", name: "Solo Leveling", 
    poster: "https://cdn.myanimelist.net/images/anime/1405/138283l.jpg", 
    description: "In a world where hunters must battle deadly monsters to protect humanity, Sung Jinwoo, the weakest hunter of all mankind, finds himself in a seemingly endless dungeon where he alone can level up.",
    releaseInfo: "2024–", imdbRating: "8.4", genres: ["Action", "Fantasy"],
    videos: generateAnimeVideos("anime_12", 12)
  },
  { 
    id: "anime_13", type: "other", name: "Bleach: Thousand-Year Blood War", 
    poster: "https://cdn.myanimelist.net/images/anime/1904/143099l.jpg", 
    description: "Ichigo Kurosaki faces his ultimate challenge as the Soul Society is threatened by the Wandenreich and their leader Yhwach.",
    releaseInfo: "2022–", imdbRating: "9.0", genres: ["Action", "Adventure", "Fantasy"],
    videos: generateAnimeVideos("anime_13", 26)
  },
  { 
    id: "anime_14", type: "other", name: "One Punch Man", 
    poster: "https://cdn.myanimelist.net/images/anime/12/73249l.jpg", 
    description: "The story of Saitama, a hero who defeats any opponent with a single punch. He seeks a worthy opponent after growing bored by a lack of challenge.",
    releaseInfo: "2015–", imdbRating: "8.5", genres: ["Action", "Comedy"],
    videos: generateAnimeVideos("anime_14", 24)
  },
  { 
    id: "anime_15", type: "other", name: "Mob Psycho 100", 
    poster: "https://cdn.myanimelist.net/images/anime/8/80356l.jpg", 
    description: "Shigeo Kageyama, a.k.a. Mob, is a boy who has extraordinary psychic powers. He wants to be normal and suppresses his abilities under his master Reigen.",
    releaseInfo: "2016–2022", imdbRating: "8.6", genres: ["Action", "Comedy", "Supernatural"],
    videos: generateAnimeVideos("anime_15", 25)
  },
  { 
    id: "anime_16", type: "other", name: "Tokyo Ghoul", 
    poster: "https://cdn.myanimelist.net/images/anime/5/64449l.jpg", 
    description: "A college student is attacked by a ghoul, a being that feeds on human flesh. He survives but becomes part human, part ghoul, and must navigate both worlds.",
    releaseInfo: "2014–2015", imdbRating: "8.0", genres: ["Action", "Horror", "Supernatural"],
    videos: generateAnimeVideos("anime_16", 24)
  },
  { 
    id: "anime_17", type: "other", name: "Steins;Gate", 
    poster: "https://cdn.myanimelist.net/images/anime/5/73199l.jpg", 
    description: "A self-proclaimed mad scientist discovers a way to send messages to the past, accidentally altering the course of history and creating dangerous consequences.",
    releaseInfo: "2011", imdbRating: "9.1", genres: ["Drama", "Sci-Fi", "Thriller"],
    videos: generateAnimeVideos("anime_17", 24)
  },
  { 
    id: "anime_18", type: "other", name: "Vinland Saga", 
    poster: "https://cdn.myanimelist.net/images/anime/1500/103005l.jpg", 
    description: "Young Thorfinn grew up listening to stories of old sailors who had reached the coasts of a faraway land. His dream is to see the land of legend: Vinland.",
    releaseInfo: "2019–", imdbRating: "8.8", genres: ["Action", "Adventure", "Drama"],
    videos: generateAnimeVideos("anime_18", 24)
  },
  { 
    id: "anime_19", type: "other", name: "Hunter x Hunter", 
    poster: "https://cdn.myanimelist.net/images/anime/1337/117851l.jpg", 
    description: "Gon Freecss sets out on a journey to find his father, who abandoned him as a baby. Along the way, he makes friends and takes the Hunter Exam.",
    releaseInfo: "2011–2014", imdbRating: "9.1", genres: ["Action", "Adventure", "Fantasy"],
    videos: generateAnimeVideos("anime_19", 25)
  },
  { 
    id: "anime_20", type: "other", name: "Code Geass", 
    poster: "https://cdn.myanimelist.net/images/anime/1033/14255l.jpg", 
    description: "Prince Lelouch vi Britannia gains the power of Geass and leads a rebellion against the Holy Britannian Empire to avenge his mother and create a better world.",
    releaseInfo: "2006–2008", imdbRating: "8.8", genres: ["Action", "Drama", "Sci-Fi"],
    videos: generateAnimeVideos("anime_20", 25)
  }
];

// Helper function to generate anime videos
function generateAnimeVideos(animeId, count) {
  const videos = [];
  for (let i = 1; i <= count; i++) {
    videos.push({
      id: animeId + ':1:' + i,
      title: 'Episode ' + i,
      season: 1,
      episode: i
    });
  }
  return videos;
}

// ==================== ADULT CATALOG (12+) ====================
const adultCatalog = [
  { id: "adult_1", type: "other", name: "Premium Collection Vol. 1", poster: "https://picsum.photos/300/450?random=1", description: "Premium adult entertainment collection featuring high-quality content.", behaviorHints: { adult: true } },
  { id: "adult_2", type: "other", name: "Intimate Moments Series", poster: "https://picsum.photos/300/450?random=2", description: "Romantic and intimate scenes for mature audiences only.", behaviorHints: { adult: true } },
  { id: "adult_3", type: "other", name: "Desire Unleashed", poster: "https://picsum.photos/300/450?random=3", description: "Explore your deepest desires with our exclusive content.", behaviorHints: { adult: true } },
  { id: "adult_4", type: "other", name: "Passion After Dark", poster: "https://picsum.photos/300/450?random=4", description: "Late night passion and romance for adults.", behaviorHints: { adult: true } },
  { id: "adult_5", type: "other", name: "Forbidden Fantasies", poster: "https://picsum.photos/300/450?random=5", description: "Explore forbidden fantasies in a safe environment.", behaviorHints: { adult: true } },
  { id: "adult_6", type: "other", name: "Midnight Seduction", poster: "https://picsum.photos/300/450?random=6", description: "Seductive content for late night viewing.", behaviorHints: { adult: true } },
  { id: "adult_7", type: "other", name: "Velvet Dreams", poster: "https://picsum.photos/300/450?random=7", description: "Soft and sensual dreams come alive.", behaviorHints: { adult: true } },
  { id: "adult_8", type: "other", name: "Secret Desires", poster: "https://picsum.photos/300/450?random=8", description: "Unveil your secret desires with premium content.", behaviorHints: { adult: true } },
  { id: "adult_9", type: "other", name: "Eternal Passion", poster: "https://picsum.photos/300/450?random=9", description: "Timeless passion and romance collection.", behaviorHints: { adult: true } },
  { id: "adult_10", type: "other", name: "Sensual Nights", poster: "https://picsum.photos/300/450?random=10", description: "Experience sensual nights like never before.", behaviorHints: { adult: true } },
  { id: "adult_11", type: "other", name: "Private Paradise", poster: "https://picsum.photos/300/450?random=11", description: "Your private paradise awaits with exclusive content.", behaviorHints: { adult: true } },
  { id: "adult_12", type: "other", name: "Ultimate Pleasure", poster: "https://picsum.photos/300/450?random=12", description: "The ultimate pleasure experience for adults.", behaviorHints: { adult: true } },
  { id: "adult_13", type: "other", name: "Hidden Temptations", poster: "https://picsum.photos/300/450?random=13", description: "Discover hidden temptations you never knew existed.", behaviorHints: { adult: true } },
  { id: "adult_14", type: "other", name: "Blazing Heat", poster: "https://picsum.photos/300/450?random=14", description: "Turn up the heat with blazing hot content.", behaviorHints: { adult: true } },
  { id: "adult_15", type: "other", name: "Wild Encounters", poster: "https://picsum.photos/300/450?random=15", description: "Wild and exciting encounters await you.", behaviorHints: { adult: true } }
];

// ==================== CATALOG HANDLER ====================
function handleCatalog(path, headers) {
  // Movie catalog
  if (path.includes('/movie/')) {
    return new Response(JSON.stringify({ metas: moviesCatalog }), { headers });
  }
  
  // Series catalog
  if (path.includes('/series/')) {
    return new Response(JSON.stringify({ metas: seriesCatalog }), { headers });
  }
  
  // Anime catalog
  if (path.includes('/anime')) {
    return new Response(JSON.stringify({ metas: animeCatalog }), { headers });
  }
  
  // Adult catalog
  if (path.includes('/adult')) {
    return new Response(JSON.stringify({ metas: adultCatalog }), { headers });
  }
  
  return new Response(JSON.stringify({ metas: [] }), { headers });
}

// ==================== META HANDLER ====================
function handleMeta(path, headers) {
  const parts = path.split('/');
  const type = parts[2];
  const id = parts[3] ? parts[3].replace('.json', '') : '';
  
  // Movie meta
  if (type === 'movie') {
    const movie = moviesCatalog.find(m => m.id === id);
    if (movie) {
      return new Response(JSON.stringify({
        meta: {
          id: movie.id,
          type: "movie",
          name: movie.name,
          poster: movie.poster,
          background: movie.poster.replace('/w500/', '/original/'),
          description: movie.description,
          releaseInfo: movie.releaseInfo,
          runtime: getRandomRuntime(),
          imdbRating: movie.imdbRating,
          genres: movie.genres
        }
      }), { headers });
    }
    return new Response(JSON.stringify({ meta: {} }), { headers });
  }
  
  // Series meta
  if (type === 'series') {
    const series = seriesCatalog.find(s => s.id === id);
    if (series) {
      return new Response(JSON.stringify({
        meta: {
          id: series.id,
          type: "series",
          name: series.name,
          poster: series.poster,
          background: series.poster.replace('/w500/', '/original/'),
          description: series.description,
          releaseInfo: series.releaseInfo,
          runtime: "45-60 min",
          imdbRating: series.imdbRating,
          genres: series.genres,
          videos: series.videos
        }
      }), { headers });
    }
    return new Response(JSON.stringify({ meta: {} }), { headers });
  }
  
  // Anime meta
  if (type === 'other') {
    const anime = animeCatalog.find(a => a.id === id);
    if (anime) {
      return new Response(JSON.stringify({
        meta: {
          id: anime.id,
          type: "other",
          name: anime.name,
          poster: anime.poster,
          background: anime.poster,
          description: anime.description,
          releaseInfo: anime.releaseInfo,
          runtime: "24 min",
          imdbRating: anime.imdbRating,
          genres: anime.genres,
          videos: anime.videos
        }
      }), { headers });
    }
    
    // Adult meta
    const adult = adultCatalog.find(a => a.id === id);
    if (adult) {
      return new Response(JSON.stringify({
        meta: {
          id: adult.id,
          type: "other",
          name: adult.name,
          poster: adult.poster,
          background: adult.poster,
          description: adult.description,
          behaviorHints: { adult: true },
          videos: [{ id: adult.id + ':1:1', title: "Full Video", season: 1, episode: 1 }]
        }
      }), { headers });
    }
    
    return new Response(JSON.stringify({ meta: {} }), { headers });
  }
  
  return new Response(JSON.stringify({ meta: {} }), { headers });
}

// ==================== STREAM HANDLER ====================
function handleStream(path, headers) {
  const parts = path.split('/');
  const type = parts[2];
  const id = parts[3] ? parts[3].replace('.json', '') : '';
  
  // Movie stream
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
  
  // Series stream
  if (type === 'series') {
    const [seriesId, season, episode] = id.split(':');
    const tmdbId = seriesId ? seriesId.replace('tt', '') : id.replace('tt', '');
    
    return new Response(JSON.stringify({
      streams: [{
        name: "HyperStream 📺 S" + (season || 1) + "E" + (episode || 1),
        title: "Streaming via Videasy Player",
        url: "https://player.videasy.net/tv/" + tmdbId + "/" + (season || 1) + "/" + (episode || 1) + "?autoplay=true&next=true"
      }]
    }), { headers });
  }
  
  // Anime stream
  if (type === 'other') {
    // Check if it's anime or adult
    const [baseId, season, episode] = id.split(':');
    
    if (baseId && baseId.startsWith('anime_')) {
      return new Response(JSON.stringify({
        streams: [{
          name: "HyperStream 🎌 EP " + (episode || 1),
          title: "Streaming via MegaPlay",
          url: "https://megaplay.buzz/stream/s-2/" + baseId + "/" + (episode || 1)
        }]
      }), { headers });
    }
    
    // Adult stream
    if (baseId && baseId.startsWith('adult_')) {
      const randomId = generatePhId(baseId);
      return new Response(JSON.stringify({
        streams: [{
          name: "HyperStream 🔞 Premium",
          title: "Adult Content - 18+ Only",
          url: "https://www.pornhub.com/embed/ph" + randomId,
          behaviorHints: { adult: true }
        }]
      }), { headers });
    }
  }
  
  return new Response(JSON.stringify({ streams: [] }), { headers });
}

// Helper functions
function getRandomRuntime() {
  const runtimes = ['90 min', '105 min', '120 min', '135 min', '150 min', '180 min'];
  return runtimes[Math.floor(Math.random() * runtimes.length)];
}

function generatePhId(id) {
  // Generate consistent random ID based on input
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash) % 900000000000 + 100000000000);
}
