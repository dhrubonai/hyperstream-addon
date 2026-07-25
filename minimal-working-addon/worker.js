// ═══════════════════════════════════════════════════════════════════════════════
// MINIMAL WORKING STREMIO ADDON - Cloudflare Worker
// ═══════════════════════════════════════════════════════════════════════════════
// 
// This is a PROVEN template based on analysis of working addons:
// - stremsrc (https://github.com/Snaville/stremsrc)
// - vidsrc-api-stermio (https://github.com/RageshAntony/vidsrc-api-stermio)  
// - Official Hello World (https://github.com/Stremio/addon-helloworld)
//
// KEY INSIGHT: The simplest stream object that works:
//   { title: "Name", url: "https://actual-video-url.m3u8" }
//
// NO behaviorHints needed for most streams!
// NO proxyHeaders unless CDN requires specific headers!
// NO embed page URLs - only direct video URLs!
//
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers on every response
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, POST',
      'Access-Control-Allow-Headers': '*',
      'Content-Type': 'application/json; charset=utf-8'
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    try {
      // ─── MANIFEST ───────────────────────────────────────────────────────
      if (path === '/' || path === '/manifest.json' || path === '') {
        return getManifest(headers);
      }

      // ─── CATALOG (Optional - for discoverability) ─────────────────────
      if (path.startsWith('/catalog/')) {
        return await handleCatalog(path, headers);
      }

      // ─── STREAM HANDLER ────────────────────────────────────────────────
      if (path.startsWith('/stream/')) {
        return await handleStream(path, headers);
      }

      // 404
      return new Response(JSON.stringify({ error: 'Not Found' }), { 
        status: 404, 
        headers 
      });

    } catch (error) {
      console.error('Addon error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message 
      }), { 
        status: 500, 
        headers 
      });
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MANIFEST
// ═══════════════════════════════════════════════════════════════════════════════

function getManifest(headers) {
  const manifest = {
    id: 'com.example.minimal-working',
    version: '1.0.0',
    name: '✅ Minimal Working Addon',
    description: 'Template addon with PROVEN working stream structure',
    
    // Resources we provide
    resources: ['stream', 'catalog'],
    
    // Content types
    types: ['movie', 'series'],
    
    // Catalogs for browsing (optional)
    catalogs: [
      { 
        type: 'movie', 
        id: 'test_movies', 
        name: '🎬 Test Movies (Working Streams)',
        extra: [{ name: 'search', isRequired: false }]
      }
    ],
    
    // Which IDs to accept
    idPrefixes: ['tt']
  };
  
  return new Response(JSON.stringify(manifest), { headers });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATALOG HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

async function handleCatalog(path, headers) {
  const match = path.match(/\/catalog\/(\w+)\/([\w_]+)\.json/);
  if (!match) {
    return new Response(JSON.stringify({ metas: [] }), { headers });
  }
  
  const [, type, catalogId] = match;
  
  // Return test content with known working streams
  const testMetas = [
    {
      id: 'tt1254207',
      type: 'movie',
      name: 'Big Buck Bunny (Test - MP4)',
      description: 'Public domain test video - should play instantly!',
      poster: 'https://images.metahub.space/poster/medium/tt1254207/img',
      genres: ['Animation', 'Short'],
      releaseInfo: '2008'
    },
    {
      id: 'tt0032138',
      type: 'movie', 
      name: 'The Wizard of Oz (Test - Torrent)',
      description: 'Public domain movie via torrent',
      poster: 'https://images.metahub.space/poster/medium/tt0032138/img',
      genres: ['Adventure', 'Family', 'Fantasy'],
      releaseInfo: '1939'
    },
    {
      id: 'tt0031051',
      type: 'movie',
      name: 'The Arizona Kid (Test - YouTube)',
      description: 'Public domain movie via YouTube',
      poster: 'https://images.metahub.space/poster/medium/tt0031051/img',
      genres: ['Music', 'Western'],
      releaseInfo: '1939'
    }
  ];
  
  return new Response(JSON.stringify({ metas: testMetas }), { headers });
}

// ═══════════════════════════════════════════════════════════════════════════════
// STREAM HANDLER - THE MOST IMPORTANT PART!
// ═══════════════════════════════════════════════════════════════════════════════

async function handleStream(path, headers) {
  const match = path.match(/\/stream\/(\w+)\/([\w_:]+)\.json/);
  
  if (!match) {
    return new Response(JSON.stringify({ streams: [] }), { headers });
  }
  
  const [, type, id] = match;
  console.log(`Stream request: type=${type}, id=${id}`);
  
  // Get streams based on content ID
  const streams = await getStreamsForId(id, type);
  
  console.log(`Returning ${streams.length} streams for ${id}`);
  return new Response(JSON.stringify({ streams }), { headers });
}

/**
 * MAIN STREAM GENERATOR FUNCTION
 * 
 * This demonstrates ALL the ways to return working streams.
 * Copy the pattern that matches your use case!
 */
async function getStreamsForId(id, type) {
  const streams = [];
  
  // ══════════════════════════════════════════════════════════════════════
  // EXAMPLE 1: Direct MP4 URL (Simplest - Always Works!)
  // No behaviorHints needed at all!
  // ══════════════════════════════════════════════════════════════════════
  if (id === 'tt1254207') {
    streams.push({
      // ✅ WORKING: Just title + url to actual MP4 file
      title: '🎬 Big Buck Bunny (MP4 - 1080p)',
      url: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4'
      // That's it! Nothing else needed!
    });
  }
  
  // ══════════════════════════════════════════════════════════════════════
  // EXAMPLE 2: Torrent Stream (infoHash)
  // Uses Stremio's built-in torrent streaming
  // ══════════════════════════════════════════════════════════════════════
  if (id === 'tt0032138') {
    streams.push({
      title: '🎬 Wizard of Oz (Torrent)',
      infoHash: '24c8802e2624e17d46cd555f364debd949f2c81e',
      fileIdx: 0  // Which file in torrent (0 = largest if omitted)
    });
  }
  
  // ══════════════════════════════════════════════════════════════════════
  // EXAMPLE 3: YouTube Stream (ytId)
  // Uses Stremio's built-in YouTube player
  // ══════════════════════════════════════════════════════════════════════
  if (id === 'tt0031051') {
    streams.push({
      title: '🎬 Arizona Kid (YouTube)',
      ytId: 'm3BKVSpP80s'  // YouTube video ID only
    });
  }
  
  // ══════════════════════════════════════════════════════════════════════
  // EXAMPLE 4: HLS Stream (.m3u8) - Most common for real addons!
  // This is what you'll use for movies/shows from APIs
  // ══════════════════════════════════════════════════════════════════════
  // if (id === 'someMovieId') {
  //   // After scraping/extracting from your source API:
  //   streams.push({
  //     title: '🎬 Movie Name (1080p)',
  //     url: 'https://cdn.example.com/hls/master.m3u8'  // Actual .m3u8 URL!
  //     // NO behaviorHints if CDN allows direct access!
  //   });
  // }
  
  // ══════════════════════════════════════════════════════════════════════
  // EXAMPLE 5: HLS WITH required headers (Rare - only if CDN blocks without Referer)
  // ══════════════════════════════════════════════════════════════════════
  // if (id === 'protectedMovieId') {
  //   streams.push({
  //     title: '🎬 Protected Movie (720p)',
  //     url: 'https://protected-cdn.example.com/video.m3u8',
  //     behaviorHints: {
  //       notWebReady: true,  // REQUIRED when using proxyHeaders!
  //       proxyHeaders: {
  //         request: {
  //           'Referer': 'https://allowed-origin.com/',
  //           'Origin': 'https://allowed-origin.com',
  //           'User-Agent': 'Mozilla/5.0 ...'
  //         }
  //       },
  //       bingeGroup: 'my-addon-720p'  // Optional: for auto-advancing episodes
  //     }
  //   });
  // }
  
  // ══════════════════════════════════════════════════════════════════════
  // ❌ EXAMPLES OF WHAT DOESN'T WORK (For Reference):
  // ══════════════════════════════════════════════════════════════════════
  
  // DON'T do this - Embed pages are HTML, not video:
  // streams.push({
  //   url: 'https://vidsrc.to/embed/movie/tt123',  // ← HTML PAGE!
  //   behaviorHints: { iframe: true }  // ← NOT A REAL PROPERTY!
  // });
  
  // DON'T do this - Misconfigured proxyHeaders:
  // streams.push({
  //   url: 'https://cdn.example.com/video.m3u8',
  //   behaviorHints: {
  //     notWebReady: false,  // ← MUST be true with proxyHeaders!
  //     proxyHeaders: { ... }  // ← Ignored when notWebReady is false!
  //   }
  // });

  return streams;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS FOR REAL STREAM EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Example: Extract real stream URL from VidSRC
 * This shows how to convert an embed page URL into an actual stream URL
 * 
 * Based on: https://github.com/Snaville/stremsrc/blob/main/src/extractor.ts
 */
async function extractVidsrcStream(tmdbId, type, season, episode) {
  try {
    // Step 1: Build the embed URL
    const mediaType = type === 'movie' ? 'movie' : 'tv';
    let embedUrl = `https://vidsrc.to/embed/${mediaType}/${tmdbId}`;
    if (type === 'series' && season && episode) {
      embedUrl += `/${season}/${episode}`;
    }
    
    // Step 2: Fetch the embed page
    const resp = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });
    
    if (!resp.ok) return null;
    const html = await resp.text();
    
    // Step 3: Extract data-id from the iframe
    const dataIdMatch = html.match(/data-id="([^"]+)"/);
    if (!dataIdMatch) return null;
    
    // Step 4: Get source list
    const sourcesUrl = `https://vidsrc.to/ajax/embed/episode/${dataIdMatch[1]}/sources`;
    const sourcesResp = await fetch(sourcesUrl);
    const sourcesData = await sourcesResp.json();
    
    // Step 5: For each source, get the actual stream URL
    const streams = [];
    for (const source of sourcesData.result || []) {
      const sourceResp = await fetch(`https://vidsrc.to/ajax/embed/source/${source.id}`);
      const sourceData = await sourceResp.json();
      
      if (sourceData.result?.url) {
        // Decrypt the URL (VidSRC uses encryption)
        const decryptedUrl = decryptVidsrcUrl(sourceData.result.url);
        
        if (decryptedUrl) {
          streams.push({
            title: `VidSRC - ${source.title}`,
            url: decryptedUrl  // ← REAL .m3u8 or MP4 URL!
            // No behaviorHints needed for most VidSRC CDN URLs!
          });
        }
      }
    }
    
    return streams;
  } catch (error) {
    console.error('VidSRC extraction failed:', error);
    return null;
  }
}

/**
 * VidSRC URL decryption helper
 * Note: You'll need to implement the actual decryption based on their current key
 * Check stremsrc for a complete implementation
 */
function decryptVidsrcUrl(encryptedUrl) {
  // TODO: Implement actual decryption
  // The key changes periodically, check:
  // https://github.com/Snaville/stremsrc/blob/main/src/extractor.ts
  
  // For now, return as-is (some URLs may work without decryption)
  return encryptedUrl;
}
