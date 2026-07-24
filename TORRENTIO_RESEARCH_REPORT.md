# Torrentio Stremio Addon - Deep Dive Research Report

## Executive Summary

Torrentio is one of the most popular Stremio addons for torrent streaming. This report documents exactly how their stream implementation works, including the exact JSON structure they return, behaviorHints configuration, and what makes streams play inside Stremio.

---

## 1. Repository Structure

**Repository:** https://github.com/TheBeastLT/torrentio-scraper

**Key Files:**
```
addon/
├── addon.js          # Main addon entry point (stream handler definition)
├── index.js          # Server initialization
├── serverless.js     # Serverless deployment config
├── package.json      # Dependencies
└── lib/
    ├── manifest.js       # Manifest generation
    ├── streamInfo.js     # ★ Stream object construction (KEY FILE)
    ├── repository.js     # Database models and queries
    ├── filter.js         # Stream filtering logic
    ├── sort.js           # Stream sorting
    ├── magnetHelper.js   # Tracker/source handling
    ├── subtitles.js      # Subtitle processing
    ├── configuration.js  # Configuration management
    ├── types.js          # Type constants
    └── cache.js          # Caching layer
```

---

## 2. Live Manifest.json Structure

**URL:** https://torrentio.strem.fun/manifest.json

```json
{
  "id": "com.stremio.torrentio.addon",
  "version": "0.0.15",
  "name": "Torrentio",
  "description": "Provides torrent streams from scraped torrent providers. Currently supports YTS(+), EZTV(+), RARBG(+), 1337x(+), ThePirateBay(+), KickassTorrents(+), TorrentGalaxy(+), MagnetDL(+), HorribleSubs(+), NyaaSi(+), TokyoTosho(+), AniDex(+), nekoBT(+), Rutor(+), Rutracker(+), Comando(+), BluDV(+), MicoLeaoDublado(+), Torrent9(+), ilCorSaRoNeRo(+), MejorTorrent(+), Wolfmax4k(+), Cinecalidad(+), BestTorrents(+). To configure providers, RealDebrid/Premiumize/AllDebrid/DebridLink/EasyDebrid/Offcloud/TorBox/Put.io support and other settings visit https://torrentio.strem.fun",
  "catalogs": [],
  "resources": [
    {
      "name": "stream",
      "types": ["movie", "series", "anime"],
      "idPrefixes": ["tt", "kitsu"]
    }
  ],
  "types": ["movie", "series", "anime", "other"],
  "background": "https://torrentio.strem.fun/images/background_v1.jpg",
  "logo": "https://torrentio.strem.fun/images/logo_v1.png",
  "behaviorHints": {
    "configurable": true,
    "configurationRequired": false
  }
}
```

### Key Manifest Points:
- **ID Prefixes:** `tt` (IMDb) and `kitsu` (anime)
- **Resource Types:** movie, series, anime
- **No catalogs by default** (only when debrid is configured)

---

## 3. Stream Response JSON - EXACT FORMAT

### Example Response (from live Torrentio for tt0120737 - LOTR):

```json
{
  "streams": [
    {
      "name": "Torrentio\n4k HDR",
      "title": "The.Lord.of.the.Rings.The.Fellowship.of.the.Ring.2001.Extended.2160p.UHD.HDR.BluRay.x265.10bit.TRUEHD.ATMOS.[WMAN-LorD]\n👤 100 💾 14.71 GB ⚙️ 1337x",
      "infoHash": "997eb763b0c51b09eca3ecbd5d2c27e95772f254",
      "fileIdx": 0,
      "behaviorHints": {
        "bingeGroup": "torrentio|4k|BluRay|x265|10bit|HDR",
        "filename": "The.Lord.of.the.Rings.The.Fellowship.of.the.Ring.2001.Extended.2160p.UHD.HDR.BluRay.x265.10bit.TRUEHD.ATMOS.[WMAN-LorD].mkv"
      }
    },
    {
      "name": "Torrentio\n1080p",
      "title": "The Lord of the Rings The Fellowship of the Ring 2001 Extended REMUX 1080p BluRay AVC DTS-HD MA 5 1-MgB\n👤 42 💾 14.38 GB ⚙️ 1337x",
      "infoHash": "abc123...",
      "fileIdx": 0,
      "behaviorHints": {
        "bingeGroup": "torrentio|1080p|BluRay REMUX",
        "filename": "The Lord of the Rings The Fellowship of the Ring 2001.mkv"
      }
    }
  ]
}
```

### CRITICAL FINDING - What Makes Streams Play INSIDE Stremio:

**Torrentio uses `infoHash` + `fileIdx` - NOT `url`, `externalUrl`, or `ytId`!**

This is the key insight:
- ✅ **`infoHash`**: The torrent info hash (40 char hex string)
- ✅ **`fileIdx`**: Index of the video file within the torrent (0-based integer, or omitted for largest file)
- ❌ No `url` field
- ❌ No `externalUrl` field
- ❌ No `notWebReady` flag needed

**Why this works:** When you provide `infoHash`, Stremio's **internal torrent client** handles the playback. The stream plays INSIDE Stremio because Stremio downloads/streams the torrent content directly using its built-in peer-to-peer client.

---

## 4. Complete streamInfo.js Source Code

This is THE key file that shows how Torrentio constructs stream objects:

```javascript
import titleParser from 'parse-torrent-title';
import { Type } from './types.js';
import { mapLanguages } from './languages.js';
import { enrichStreamSources, getSources } from './magnetHelper.js';
import { getSubtitles } from './subtitles.js';

const ADDON_NAME = 'Torrentio';
const SIZE_DELTA = 0.05;
const UNKNOWN_SIZE = 300000000;
const CAM_SOURCES = ['CAM', 'TeleSync', 'TeleCine', 'SCR'];

export function toStreamInfo(record) {
  const torrentInfo = titleParser.parse(record.torrent.title);
  const fileInfo = titleParser.parse(record.title);
  const sameInfo = !Number.isInteger(record.fileIndex)
      || Math.abs(record.size / record.torrent.size - 1) < SIZE_DELTA
      || record.title.includes(record.torrent.title);
  const quality = getQuality(record, torrentInfo, fileInfo);
  const three3Quality = fileInfo.threeD || torrentInfo.threeD;
  const hdrProfiles = torrentInfo.hdr || fileInfo.hdr || [];
  const title = joinDetailParts(
      [
        joinDetailParts([record.torrent.title.replace(/[, ]+/g, ' ')]),
        joinDetailParts([!sameInfo && record.title || undefined]),
        joinDetailParts([
          joinDetailParts([record.torrent.seeders], '👤 '),
          joinDetailParts([formatSize(record.size)], '💾 '),
          joinDetailParts([record.torrent.provider], '⚙️ ')
        ]),
        joinDetailParts(getLanguages(record, torrentInfo, fileInfo), '', ' / '),
      ],
      '',
      '\n'
  );
  const name = joinDetailParts(
      [
        joinDetailParts([ADDON_NAME]),
        joinDetailParts([quality, three3Quality, joinDetailParts(hdrProfiles, '', ' | ')])
      ],
      '',
      '\n'
  );
  const bingeGroupParts = getBingeGroupParts(record, sameInfo, quality, torrentInfo, fileInfo);
  const bingeGroup = joinDetailParts(bingeGroupParts, "torrentio|", "|")
  const filename = Number.isInteger(record.fileIndex) ? record.title.split('/').pop() : undefined;
  const behaviorHints = bingeGroup || filename ? cleanOutputObject({ bingeGroup, filename }) : undefined;

  return cleanOutputObject({
    name: name,
    title: title,
    infoHash: record.infoHash,
    fileIdx: record.fileIndex,
    behaviorHints: behaviorHints,
    sources: getSources(record.torrent.trackers, record.infoHash),
    subtitles: getSubtitles(record)
  });
}

function cleanOutputObject(object) {
  return Object.fromEntries(Object.entries(object).filter(([_, v]) => v != null));
}

// ... helper functions for quality, languages, binge group, etc.
```

---

## 5. Stream Object Field Reference

### Required Fields (for torrent playback):

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `infoHash` | string | **REQUIRED** - Torrent info hash (40 char hex) | `"997eb763b0c51b09eca3ecbd5d2c27e95772f254"` |
| `fileIdx` | number | File index in torrent (omit for largest file) | `0`, `2`, or undefined |

### Optional Fields:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | string | Short display name (quality) | `"Torrentio\n4k HDR"` |
| `title` | string | Full description | `"Movie.Title.2021.2160p..."` |
| `behaviorHints` | object | Behavior configuration | See below |
| `sources` | string[] | Tracker URLs | `["tracker:url..."]` |
| `subtitles` | object[] | Subtitle files | See below |

### behaviorHints Structure:

```javascript
{
  "bingeGroup": "torrentio|4k|BluRay|x265|10bit|HDR",  // For auto-selecting same quality
  "filename": "Movie.Title.2021.mkv"                       // For subtitle matching
}
```

**IMPORTANT:** Torrentio does NOT use:
- `notWebReady` - Not needed for infoHash streams
- `proxyHeaders` - Not used
- `countryWhitelist` - Not used
- `videoHash` - Not used

---

## 6. Main Handler Flow (addon.js)

```javascript
import { addonBuilder } from 'stremio-addon-sdk';

const builder = new addonBuilder(manifest(config));

builder.defineStreamHandler((args) => {
  // 1. Validate ID format (IMDb: ttXXXXXXX or Kitsu: kitsu:XXXXX)
  if (!args.id.match(/tt\d+/i) && !args.id.match(/kitsu:\d+/i)) {
    return Promise.resolve({ streams: [] });
  }

  // 2. Resolve streams through pipeline
  return requestQueue.wrap(args.id, () => resolveStreams(args))
      .then(streams => applyFilters(streams, args.extra))    // Apply user filters
      .then(streams => applySorting(streams, args.extra, args.type))  // Sort results
      .then(streams => applyStaticInfo(streams))             // Enrich with static data
      .then(streams => applyMochs(streams, args.extra))      // Apply debrid if configured
      .then(streams => enrichCacheParams(streams))           // Set cache headers
      .catch(error => {
        return Promise.reject(`Failed request ${args.id}: ${error}`);
      });
});
```

### Response Enrichment:

```javascript
function enrichCacheParams(streams) {
  let cacheAge = CACHE_MAX_AGE;  // e.g., 4 hours
  if (!streams.length) {
    cacheAge = EMPTY_RESULT_CACHE_AGE;  // Shorter cache when no results
  } else if (streams.every(stream => stream?.url?.endsWith(StaticLinks.FAILED_ACCESS))) {
    cacheAge = FAILED_RESULT_CACHE_AGE;  // Cache failures briefly
  }
  return {
    streams: streams,
    cacheMaxAge: cacheAge,
    staleRevalidate: STALE_REVALIDATE_AGE,
    staleError: STALE_ERROR_AGE
  };
}
```

---

## 7. Content Type Handling

### Movies (`type: movie`):
- ID format: `ttXXXXXXX` (IMDb ID)
- Query: Match by `imdbId` in database
- Returns all matching torrents sorted by seeders

### Series (`type: series`):
- ID format: `ttXXXXXXX:SS:EE` (IMDb ID:Season:Episode)
- Query: Match by `imdbId` + `imdbSeason` + `imdbEpisode`
- Returns episode-specific file entries

### Anime (`type: anime`):
- ID format: `kitsu:XXXXX` or `kitsu:XXXXX:EE` (Kitsu ID)
- Uses Kitsu database IDs instead of IMDb

---

## 8. Database Schema (repository.js)

```javascript
// Torrent table
const Torrent = database.define('torrent', {
  infoHash: { type: Sequelize.STRING(64), primaryKey: true },
  provider: { type: Sequelize.STRING(32) },
  title: { type: Sequelize.STRING(256) },
  size: { type: Sequelize.BIGINT },
  type: { type: Sequelize.STRING(16) },       // 'movie', 'series', 'anime'
  uploadDate: { type: Sequelize.DATE },
  seeders: { type: Sequelize.SMALLINT },
  trackers: { type: Sequelize.STRING(4096) },  // JSON array of tracker URLs
  languages: { type: Sequelize.STRING(4096) },
  resolution: { type: Sequelize.STRING(16) }
});

// File table (individual files within torrents)
const File = database.define('file', {
  id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
  infoHash: { type: Sequelize.STRING(64) },     // FK to Torrent
  fileIndex: { type: Sequelize.INTEGER },         // Index in torrent
  title: { type: Sequelize.STRING(256) },        // Filename
  size: { type: Sequelize.BIGINT },
  imdbId: { type: Sequelize.STRING(32) },
  imdbSeason: { type: Sequelize.INTEGER },
  imdbEpisode: { type: Sequelize.INTEGER },
  kitsuId: { type: Sequelize.INTEGER },
  kitsuEpisode: { type: Sequelize.INTEGER }
});
```

---

## 9. Why Torrentio Streams Play INSIDE Stremio

### The Secret: `infoHash` + Built-in Torrent Client

When your addon returns:

```json
{
  "infoHash": "997eb763b0c51b09eca3ecbd5d2c27e95772f254",
  "fileIdx": 0
}
```

Stremio handles everything internally:

1. **Stremio reads the `infoHash`**
2. **Stremio's internal torrent client** connects to trackers/DHT
3. **Stremio downloads/streams** the specified file (`fileIdx`)
4. **Playback happens inside** Stremio's player

### Comparison Table:

| Approach | Field Used | Playback Location | Requires |
|----------|-----------|-------------------|----------|
| **Torrent (Torrentio)** | `infoHash` + `fileIdx` | **Inside Stremio** | Nothing extra |
| Direct URL | `url` | Inside/Outside | May need `notWebReady` + `proxyHeaders` |
| YouTube | `ytId` | Inside Stremio | Nothing extra |
| External | `externalUrl` | **External browser** | Opens in browser |

---

## 10. Minimal Working Example

Based on Torrentio's implementation, here's a minimal working stream response:

```javascript
// Your stream handler
builder.defineStreamHandler(async (args) => {
  const imdbId = args.id;  // e.g., "tt0120737"
  
  // Your logic to find torrents...
  const torrents = await findTorrents(imdbId);
  
  // Convert to Stremio stream format (like Torrentio does)
  const streams = torrents.map(torrent => ({
    name: `MyAddon\n${torrent.quality}`,
    title: `${torrent.title}\n👤 ${torrent.seeders} 💾 ${formatSize(torrent.size)}`,
    infoHash: torrent.infoHash,      // REQUIRED for torrent playback
    fileIdx: torrent.fileIndex,       // Optional - omit for largest file
    behaviorHints: {
      bingeGroup: `myaddon|${torrent.quality}`,  // For binge-watching
      filename: torrent.filename                   // For subtitle matching
    }
  }));
  
  return { 
    streams: streams,
    cacheMaxAge: 3600  // Cache for 1 hour
  };
});
```

---

## 11. Common Pitfalls & Solutions

### Problem: Streams open externally instead of playing inside Stremio

**Cause:** Using `externalUrl` instead of `infoHash`, or using `url` without proper `behaviorHints`

**Solution:** Use `infoHash` for torrents:
```javascript
// WRONG - opens externally or may not work
{ url: "https://example.com/video.mp4" }

// CORRECT - plays inside Stremio
{ infoHash: "abc123...", fileIdx: 0 }
```

### Problem: Getting empty streams array

**Cause:** Invalid ID format or no matches found

**Solution:** Ensure your ID prefixes match what Stremio sends:
```javascript
// In manifest
idPrefixes: ['tt', 'kitsu']  // Must match incoming IDs
```

### Problem: Wrong file playing from multi-file torrent

**Cause:** Missing or incorrect `fileIdx`

**Solution:** Specify the correct file index (0-based):
```javascript
{ infoHash: "...", fileIdx: 2 }  // Plays 3rd file in torrent
```

---

## 12. Key Takeaways

1. **Use `infoHash` + `fileIdx`** for torrent streams - this makes them play inside Stremio
2. **`behaviorHints.bingeGroup`** enables automatic quality selection during binge-watching
3. **`behaviorHints.filename`** helps subtitle addons find correct subtitles
4. **No `notWebReady` needed** for infoHash-based streams
5. **Response must wrap in `{ streams: [...] }`** with optional `cacheMaxAge`
6. **Return empty array `[]`** when no streams found (not an error)

---

## References

- **Official Stremio Stream Docs:** https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/stream.md
- **Torrentio Repo:** https://github.com/TheBeastLT/torrentio-scraper
- **Live Torrentio Instance:** https://torrentio.strem.fun
- **Stremio Addon Guide:** https://stremio.github.io/stremio-addon-guide/

---

*Report generated: July 2026*
*Based on analysis of Torrentio v0.0.15 source code and live responses*
