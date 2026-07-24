# Definitive Guide to Stremio Addon Streams Implementation

> Based on Official Stremio SDK Documentation, Examples, and Protocol Specification
> 
> Sources: https://github.com/Stremio/stremio-addon-sdk | https://stremio.github.io/stremio-addon-guide/

---

## Table of Contents

1. [Stream Object Specification](#1-stream-object-specification)
2. [Required vs Optional Fields](#2-required-vs-optional-fields)
3. [Stream Source Types](#3-stream-source-types)
4. [behaviorHints Deep Dive](#4-behaviorhints-deep-dive)
5. [Working Code Examples](#5-working-code-examples)
6. [Common Pitfalls & Solutions](#6-common-pitfalls--solutions)
7. [Embed/iframe Approach](#7-embediframe-approach)
8. [Quick Reference Card](#8-quick-reference-card)

---

## 1. Stream Object Specification

The Stream object is used as a response for `defineStreamHandler`. Here is the **complete** official specification:

### Core Source Fields (ONE REQUIRED)

You must provide **exactly one** of these fields to identify the stream source:

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | Direct HTTP(S)/FTP(S)/RTMP link to a video stream |
| `ytId` | string | YouTube video ID (uses built-in YouTube player) |
| `infoHash` | string | Torrent info hash (with optional `fileIdx`) |
| `externalUrl` | string | External URL to open in browser (e.g., Netflix link) |
| `nzbUrl` | string | HTTP(S) link to NZB (Usenet) file |
| `rarUrls` | array | List of Source Objects for RAR files |
| `zipUrls` | array | List of Source Objects for ZIP files |
| `7zipUrls` | array | List of Source Objects for 7z files |
| `tgzUrls` | array | List of Source Objects for TGZ files |
| `tarUrls` | array | List of Source Objects for TAR files |

### Additional Properties (All Optional)

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Name of the stream (usually quality) |
| `title` | string | Description (**DEPRECATED** - use `description`) |
| `description` | string | Description of the stream |
| `subtitles` | array | Array of Subtitle objects |
| `sources` | array | Torrent tracker URLs/DHT nodes (for `infoHash`) |
| `fileIdx` | number | File index in torrent/archive |
| `fileMustInclude` | string | Regex to match file in archives |
| `servers` | array | NNTP server connections (for NZB) |
| `behaviorHints` | object | Behavior configuration (see below) |

---

## 2. Required vs Optional Fields

### MINIMAL Working Stream Object

```javascript
// HTTP Stream - Absolute Minimum
{ "url": "http://example.com/video.mp4" }

// Torrent Stream - Absolute Minimum  
{ "infoHash": "24c8802e2624e17d46cd555f364debd949f2c81e" }

// YouTube Stream - Absolute Minimum
{ "ytId": "aqz-KE-bpKQ" }

// External URL (opens in browser)
{ "externalUrl": "https://www.netflix.com/watch/12345" }
```

### RECOMMENDED Stream Object

```javascript
{
    // Source (one required)
    "url": "http://example.com/video.mp4",
    
    // Display info (recommended)
    "name": "1080p",
    "description": "English, WEB-DL",
    
    // Behavior hints (important for playback)
    "behaviorHints": {
        "notWebReady": false,
        "filename": "movie.mp4"
    }
}
```

---

## 3. Stream Source Types

### 3.1 HTTP/HTTPS Streams (Direct URLs)

**Most common type for simple addons**

```javascript
// Basic HTTP stream
{
    "url": "http://jell.yfish.us/media/jellyfish-3-mbps-hd-h264.mkv",
    "name": "HD 3Mbps"
}

// HTTPS stream (preferred)
{
    "url": "https://example.com/videos/movie.mp4",
    "name": "1080p",
    "behaviorHints": {
        "filename": "movie.mp4"  // Recommended for subtitle matching
    }
}
```

**Key Points:**
- MP4 files work best with web player
- MKV works but may have compatibility issues
- For non-MP4 or non-HTTPS URLs, set `notWebReady: true`

### 3.2 Torrent Streams

```javascript
// Simple torrent (selects largest file automatically)
{
    "infoHash": "24c8802e2624e17d46cd555f364debd949f2c81e",
    "name": "1080p"
}

// Torrent with specific file
{
    "infoHash": "dca926c0328bb54d209d82dc8a2f391617b47d7a",
    "fileIdx": 1,  // Index of file in torrent
    "name": "Episode 1"
}

// Torrent with trackers and DHT
{
    "infoHash": "A7CFBB7840A8B67FD735AC73A373302D14A7CDC9",
    "sources": [
        "tracker:udp://tracker.example.com:1337/announce",
        "tracker:udp://tracker.openbittorrent.com:80/announce",
        "dht:A7CFBB7840A8B67FD735AC73A373302D14A7CDC9"
    ],
    "name": "1080p REMUX"
}
```

### 3.3 YouTube Streams

```javascript
// YouTube by video ID
{
    "ytId": "m3BKVSpP80s",
    "name": "YouTube"
}
```

**Note:** Uses Stremio's built-in YouTube player - no behaviorHints needed.

### 3.4 External URLs (Browser Redirect)

```javascript
// Opens in user's default browser
{
    "externalUrl": "https://www.netflix.com/watch/26004747",
    "name": "Netflix"
}
```

**Use cases:** Netflix, Amazon Prime, Disney+, etc.

---

## 4. behaviorHints Deep Dive

The `behaviorHints` object controls how Stremio handles your stream. All properties are **optional**.

### 4.1 Complete behaviorHints Reference

```typescript
interface BehaviorHints {
    // Country restriction
    countryWhitelist?: string[];  // ISO 3166-1 alpha-3 codes in LOWERCASE
    
    // Web player compatibility
    notWebReady?: boolean;       // CRITICAL - see section below
    
    // Binge watching automation
    bingeGroup?: string;         // Group ID for auto-selecting next episode
    
    // Proxy headers (requires notWebReady: true)
    proxyHeaders?: {
        request?: Record<string, string>;   // Headers to send with request
        response?: Record<string, string>;  // Headers from response
    };
    
    // Subtitle identification (passed to subtitle addons)
    videoHash?: string;          // OpenSubtitles hash
    videoSize?: number;          // File size in bytes
    filename?: string;           // Video filename (STRONGLY RECOMMENDED)
}
```

### 4.2 notWebReady - CRITICAL FIELD

**When to use `notWebReady`:**

| Scenario | Value | Reason |
|----------|-------|--------|
| HTTPS + MP4 | `false` or omit | Works in web player |
| HTTP only (no SSL) | `true` | Web player requires HTTPS |
| Non-MP4 container (MKV, AVI) | `true` | May not work in browser |
| Need proxyHeaders | `true` (REQUIRED) | Proxy only works with this flag |
| Direct download servers | `true` | Server may block web requests |

**Example - HTTP stream that needs proxy:**
```javascript
{
    "url": "http://insecure-server.com/video.mp4",
    "behaviorHints": {
        "notWebReady": true,  // Required for HTTP and proxyHeaders
        "proxyHeaders": {
            "request": {
                "User-Agent": "Stremio",
                "Referer": "http://insecure-server.com"
            }
        },
        "filename": "video.mp4"
    }
}
```

### 4.3 proxyHeaders - Authentication & Custom Headers

**IMPORTANT:** `proxyHeaders` ONLY works when `notWebReady` is `true`.

```javascript
{
    "url": "https://protected-server.com/stream.mp4",
    "behaviorHints": {
        "notWebReady": true,  // REQUIRED!
        "proxyHeaders": {
            "request": {
                // Custom headers sent with the stream request
                "User-Agent": "Mozilla/5.0...",
                "Cookie": "session=abc123",
                "Authorization": "Bearer token123",
                "Referer": "https://source-site.com",
                "X-Custom-Header": "value"
            }
        },
        "filename": "stream.mp4"
    }
}
```

**Common use cases:**
- Streaming services requiring cookies
- DRM-protected content with tokens
- Servers checking User-Agent/Referer
- Authenticated API endpoints

### 4.4 bingeGroup - Auto-Select Next Episode

**Format:** `{addonName}-{quality}` or any consistent identifier

```javascript
// Episode 1
{
    "infoHash": "abc123...",
    "name": "720p",
    "behaviorHints": {
        "bingeGroup": "myAddon-720p"  // Same group for same quality
    }
}

// Episode 2 - Same bingeGroup means auto-selection
{
    "infoHash": "def456...",
    "name": "720p", 
    "behaviorHints": {
        "bingeGroup": "myAddon-720p"  // MUST match!
    }
}
```

**How it works:**
1. User selects a stream from "myAddon-720p" for Episode 1
2. When Episode 1 ends, Stremio looks for Episode 2
3. If Episode 2 has a stream with SAME bingeGroup, it auto-selects it
4. Seamless binge-watching experience!

### 4.5 filename - Subtitle Matching

**Highly recommended** when using `stream.url`:

```javascript
{
    "url": "https://example.com/downloads/12345",
    "behaviorHints": {
        "filename": "Movie.Name.2024.1080p.mp4"  // Helps subtitle addons
    }
}
```

**Why it matters:**
- Subtitle addons use filename to find matching subtitles
- Without it, subtitle matching may fail
- SDK shows warning if omitted with `url` streams

---

## 5. Working Code Examples

### 5.1 Complete Hello World Addon (Official Example)

```javascript
const { addonBuilder } = require("stremio-addon-sdk");

const manifest = { 
    "id": "org.stremio.helloworld",
    "version": "1.0.0",
    "name": "Hello World Addon",
    "description": "Sample addon providing public domain movies",
    "resources": ["catalog", "stream"],
    "types": ["movie", "series"],
    "catalogs": [
        { type: 'movie', id: 'helloworldmovies' },
        { type: 'series', id: 'helloworldseries' }
    ],
    "idPrefixes": ["tt"]
};

// Dataset with different stream types
const dataset = {
    // Torrent streams
    "tt0032138": { 
        name: "The Wizard of Oz", 
        type: "movie", 
        infoHash: "24c8802e2624e17d46cd555f364debd949f2c81e", 
        fileIdx: 0 
    },
    
    // HTTP stream
    "tt1254207": { 
        name: "Big Buck Bunny", 
        type: "movie", 
        url: "http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4" 
    },
    
    // YouTube stream
    "tt0031051": { 
        name: "The Arizona Kid", 
        type: "movie", 
        ytId: "m3BKVSpP80s" 
    },
    
    // External URL (Netflix redirect)
    "tt0137523": { 
        name: "Fight Club", 
        type: "movie", 
        externalUrl: "https://www.netflix.com/watch/26004747" 
    },
    
    // Series episode (torrent)
    "tt1748166:1:1": { 
        name: "Pioneer One S01E01", 
        type: "series", 
        infoHash: "07a9de9750158471c3302e4e95edb1107f980fa6" 
    }
};

const builder = new addonBuilder(manifest);

// STREAM HANDLER - The core implementation
builder.defineStreamHandler(function(args) {
    if (dataset[args.id]) {
        return Promise.resolve({ streams: [dataset[args.id]] });
    } else {
        // IMPORTANT: Always return empty array if no streams!
        return Promise.resolve({ streams: [] });
    }
})

module.exports = builder.getInterface()
```

### 5.2 Advanced Stream Handler with Quality Options

```javascript
builder.defineStreamHandler(async function(args) {
    const { type, id } = args;
    
    switch(type) {
        case 'movie':
            return await getMovieStreams(id);
        case 'series':
            return await getSeriesStreams(id);
        default:
            return Promise.resolve({ streams: [] });
    }
});

async function getMovieStreams(imdbId) {
    // Fetch available streams from your source
    const sources = await fetchStreamsFromAPI(imdbId);
    
    // Map to Stremio stream objects
    const streams = sources.map(source => ({
        name: `${source.quality} ${source.source}`,
        description: `${source.size} • ${source.seeders} seeders`,
        
        // Choose appropriate source type
        ...(source.url ? { url: source.url } : {}),
        ...(source.infoHash ? { infoHash: source.infoHash } : {}),
        
        // Add behavior hints
        behaviorHints: {
            // Use bingeGroup for consistent quality selection
            bingeGroup: `myAddon-${source.quality}`,
            
            // Add filename for subtitle matching
            filename: source.filename || `${imdbId}.mp4`,
            
            // Set notWebReady if needed
            ...(source.needsProxy ? { 
                notWebReady: true,
                proxyHeaders: {
                    request: {
                        "User-Agent": "Stremio",
                        "Cookie": source.cookie || "",
                        "Referer": source.referer || ""
                    }
                }
            } : {})
        }
    }));
    
    return { streams };
}
```

### 5.3 Static Addon (Host on GitHub Pages!)

From official protocol docs - can be entirely static:

**manifest.json:**
```json
{
    "id": "org.example.static",
    "version": "1.0.0",
    "name": "Simple Big Buck Bunny Example",
    "types": ["movie"],
    "catalogs": [{ "type": "movie", "id": "bbbcatalog" }],
    "resources": [
        "catalog",
        { "name": "stream", "types": ["movie"], "idPrefixes": ["tt"] }
    ]
}
```

**/catalog/movie/bbbcatalog.json:**
```json
{
    "metas": [{
        "id": "tt1254207",
        "type": "movie",
        "name": "Big Buck Bunny",
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/uVEFQVFMMsg4e6yb03xOfVsDz4o.jpg"
    }]
}
```

**/stream/movie/tt1254207.json:**
```json
{
    "streams": [{
        "name": "HD 1080p",
        "url": "http://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_normal.mp4",
        "behaviorHints": {
            "filename": "bbb_sunflower_1080p_30fps_normal.mp4"
        }
    }]
}
```

---

## 6. Common Pitfalls & Solutions

### 6.1 "No Streams Found" Error

**Causes:**
1. Not returning empty array when no streams available
2. Wrong ID format (prefix mismatch)
3. Resource not declared in manifest

**Solution:**
```javascript
// ALWAYS return this structure:
builder.defineStreamHandler(function(args) {
    // Your logic here...
    return Promise.resolve({ 
        streams: foundStreams || []  // NEVER return undefined/null!
    });
})
```

**Check your manifest:**
```json
{
    "resources": [
        {
            "name": "stream",
            "types": ["movie", "series"],
            "idPrefixes": ["tt", "custom_"]  // Must match your IDs!
        }
    ]
}
```

### 6.2 Black Screen / Video Won't Play

**Causes:**
1. URL requires authentication headers (use `proxyHeaders`)
2. Non-MP4 format without `notWebReady: true`
3. CORS issues on streaming server
4. Server blocking requests from unknown origins

**Solutions:**

For authenticated streams:
```javascript
{
    "url": "https://protected.com/video.mp4",
    "behaviorHints": {
        "notWebReady": true,
        "proxyHeaders": {
            "request": {
                "Cookie": "auth_token=xxx",
                "Referer": "https://protected.com"
            }
        }
    }
}
```

For non-standard formats:
```javascript
{
    "url": "http://server.com/video.mkv",  // MKV may not work in browser
    "behaviorHints": {
        "notWebReady": true  // Tells Stremio to use external player
    }
}
```

### 6.3 Stuck on Cover Art / Loading Forever

**Causes:**
1. Stream handler promise never resolves
2. Network timeout fetching stream data
3. Exception in stream handler code

**Solution:**
```javascript
builder.defineStreamHandler(async function(args) {
    try {
        // Add timeout protection
        const streams = await Promise.race([
            fetchStreams(args.id),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 10000)
            )
        ]);
        
        return { streams: streams || [] };
    } catch (error) {
        console.error('Stream handler error:', error);
        return { streams: [] };  // Always return valid structure!
    }
});
```

### 6.4 CORS Issues

**Problem:** Browser blocks cross-origin requests to your stream URLs

**Solutions:**
1. Use `notWebReady: true` to route through Stremio's proxy
2. Ensure your server sends proper CORS headers:
   ```
   Access-Control-Allow-Origin: *
   ```
3. For third-party servers you don't control, use proxyHeaders

### 6.5 Subtitles Not Matching

**Cause:** Missing `filename` in behaviorHints

**Fix:**
```javascript
{
    "url": "https://server.com/download?id=12345",
    "behaviorHints": {
        "filename": "Movie.Name.2024.1080p.BluRay.x264.mp4"
    }
}
```

---

## 7. Embed/iframe Approach

### 7.1 Understanding externalUrl

The `externalUrl` field is designed to open links in an **external browser**, NOT in an embedded iframe player:

```javascript
// This opens Netflix in the user's browser
{
    "externalUrl": "https://www.netflix.com/watch/12345",
    "name": "Watch on Netflix"
}
```

### 7.2 Can You Embed Players?

**Short Answer:** The official SDK does NOT support embedding external players via iframe within Stremio's interface.

**What actually happens with `externalUrl`:**
1. User clicks the stream
2. Stremio opens the URL in system's default browser
3. User watches on the external site (Netflix, YouTube, etc.)

### 7.3 Workarounds for Embedded Content

**Option 1: Use YouTube Integration**
```javascript
// Native YouTube support - plays inside Stremio
{
    "ytId": "dQw4w9WgXcQ",
    "name": "YouTube Video"
}
```

**Option 2: Extract Direct Stream URLs**
If you're trying to embed content from a site that uses embeds:
1. Scrape/extract the actual video URL from the embed page
2. Return that direct URL as `stream.url`
3. Set appropriate `behaviorHints`

```javascript
// Instead of embedding, extract the real stream URL
async function getEmbedStream(embedPageUrl) {
    // Parse the embed page to find actual video source
    const response = await fetch(embedPageUrl);
    const html = await response.text();
    
    // Extract video URL (implementation varies by source)
    const videoUrl = extractVideoUrl(html);
    
    return {
        url: videoUrl,
        behaviorHints: {
            notWebReady: true,
            proxyHeaders: {
                request: { "Referer": embedPageUrl }
            }
        }
    };
}
```

**Option 3: Use Server-Side Proxy**
Create your own server that:
1. Receives requests from Stremio
2. Fetches from the embed source with proper headers
3. Proxies the video data back

---

## 8. Quick Reference Card

### Minimal Stream Templates

```javascript
// HTTP/HTTPS MP4 (web player compatible)
{ url: "https://...", name: "Quality" }

// Torrent
{ infoHash: "...", name: "Quality" }

// YouTube
{ ytId: "VIDEO_ID" }

// External service
{ externalUrl: "https://..." }

// With auth headers
{ 
    url: "https://...",
    behaviorHints: {
        notWebReady: true,
        proxyHeaders: {
            request: { "Authorization": "Bearer ..." }
        }
    }
}
```

### behaviorHints Cheat Sheet

| Property | Type | When to Use |
|----------|------|-------------|
| `notWebReady` | boolean | HTTP (non-SSL), non-MP4, needs proxyHeaders |
| `proxyHeaders` | object | Auth required, custom headers needed |
| `bingeGroup` | string | Series episodes, maintain quality across eps |
| `filename` | string | Always include for better subtitle matching |
| `countryWhitelist` | string[] | Geo-restricted content |
| `videoSize` | number | Large files, helps subtitle addons |
| `videoHash` | string | Pre-calculated OpenSubtitles hash |

### Response Format (Required)

```javascript
// Success with streams
Promise.resolve({ 
    streams: [streamObj1, streamObj2] 
})

// No streams available (NOT an error!)
Promise.resolve({ 
    streams: [] 
})

// ERROR: Never return these!
// undefined, null, { streams: null }, throw Error()
```

---

## Summary Checklist

Before deploying your addon, verify:

- [ ] Stream handler returns `{ streams: [...] }` or `{ streams: [] }`
- [ ] Each stream has exactly ONE source (url/ytId/infoHash/externalUrl)
- [ ] `notWebReady: true` set for HTTP/non-MP4/proxied streams
- [ ] `proxyHeaders` only used WITH `notWebReady: true`
- [ ] `filename` included for URL-based streams
- [ ] `bingeGroup` consistent across series episodes
- [ ] Manifest declares `stream` resource with correct `idPrefixes`
- [ ] CORS headers enabled on your addon endpoint

---

## Official Resources

- **SDK Repository:** https://github.com/Stremio/stremio-addon-sdk
- **Protocol Docs:** https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/protocol.md
- **Stream Spec:** https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/stream.md
- **Guide:** https://stremio.github.io/stremio-addon-guide/
- **Hello World Example:** https://github.com/Stremio/addon-helloworld
- **Static Addon Example:** https://github.com/Stremio/stremio-static-addon-example

---

*Document compiled from official Stremio documentation and examples*
*Last updated: Research conducted from official sources*
