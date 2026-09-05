// Torrent Providers API client for YTS & Torrentio

const TRACKERS = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://open.stealth.si:80/announce',
  'udp://tracker.openbittorrent.com:6969/announce',
  'udp://tracker.torrent.eu.org:451/announce',
  'udp://explodie.org:6969/announce',
  'udp://open.demonii.com:1337/announce',
  'udp://p4p.arenabg.com:1337/announce'
]

export const buildMagnetUri = (hash, name = 'Torrent') => {
  if (!hash) return ''
  const dn = encodeURIComponent(name)
  const tr = TRACKERS.map(t => `&tr=${encodeURIComponent(t)}`).join('')
  return `magnet:?xt=urn:btih:${hash}&dn=${dn}${tr}`
}

/**
 * Parse human readable size into bytes for sorting
 */
export function parseSizeBytes(sizeStr) {
  if (!sizeStr || typeof sizeStr !== 'string') return 0
  const match = sizeStr.match(/([0-9.]+)\s*(TB|GB|MB|KB|B)/i)
  if (!match) return 0
  const val = parseFloat(match[1])
  const unit = match[2].toUpperCase()
  switch (unit) {
    case 'TB': return val * 1024 * 1024 * 1024 * 1024
    case 'GB': return val * 1024 * 1024 * 1024
    case 'MB': return val * 1024 * 1024
    case 'KB': return val * 1024
    case 'B': return val
    default: return val
  }
}

/**
 * Detect Rip Type (BluRay, WEB-DL, CAM, REMUX, etc.)
 */
export function extractRipType(text) {
  if (!text) return null
  if (/remux/i.test(text)) return 'REMUX'
  if (/bluray|bdrip|brrip/i.test(text)) return 'BluRay'
  if (/web-?dl|\bweb\b|webrip/i.test(text)) return 'WEB-DL'
  if (/camrip|hdcam|\bcam\b|\bts\b|telesync|\btc\b/i.test(text)) return 'CAM'
  if (/hdtv/i.test(text)) return 'HDTV'
  if (/hdrip/i.test(text)) return 'HDRip'
  if (/dvdrip|\bdvd\b/i.test(text)) return 'DVDRip'
  return null
}

/**
 * Detect Audio Languages and Dual Audio
 */
export function extractAudios(text) {
  if (!text) return ['English']
  const audios = []

  if (/dual[ -]?audio|multi[ -]?audio|\bmulti\b/i.test(text) || /Multi Audio/i.test(text)) {
    audios.push('Dual Audio')
  }
  if (/hindi|\bhin\b|bollywood|🇮🇳/i.test(text)) {
    audios.push('Hindi')
  }
  if (/english|\beng\b|🇬🇧|🇺🇸/i.test(text)) {
    audios.push('English')
  } else if (!/french|spanish|german|italian|russian|japanese|korean|tamil|telugu/i.test(text) && !audios.includes('Hindi')) {
    audios.push('English')
  }
  if (/tamil|\btam\b/i.test(text)) audios.push('Tamil')
  if (/telugu|\btel\b/i.test(text)) audios.push('Telugu')
  if (/japanese|\bjpn?\b|🇯🇵/i.test(text)) audios.push('Japanese')

  return audios.length > 0 ? Array.from(new Set(audios)) : ['English']
}

/**
 * Classify a stream as a Single Episode vs Season Batch pack
 * Uses fileIdx and release title indicators
 */
export function classifyStream(stream, isTv = false) {
  if (!isTv) {
    return {
      isBatch: false,
      isCompleteSeries: false,
      isSingleEp: false,
      type: 'Movie',
      fileIdx: stream?.fileIdx ?? 0,
      batchName: null,
      targetFile: null
    }
  }

  const lines = (stream.title || '').split('\n')
  const packTitle = lines[0] || ''
  const hasMultipleLines = lines.length > 2
  const targetFile = hasMultipleLines ? lines[1] : (stream.behaviorHints?.filename || null)

  // Title has explicit single episode format (e.g., "S01E01" or "1x01")
  const titleHasSingleEp = /s\d{1,2}e\d{1,2}|\b\d{1,2}x\d{1,2}\b/i.test(packTitle)

  // Season Batch: if lines > 2 (pack title + file name + stats), or keywords, or fileIdx > 0, or season pack pattern
  const isBatch = (!titleHasSingleEp && /s\d{1,2}\b|season\s*\d{1,2}|complete|integrale|batch|\bpack\b|s\d{1,2}-s\d{1,2}/i.test(packTitle)) ||
    hasMultipleLines ||
    (stream.fileIdx !== undefined && stream.fileIdx > 0)

  const isCompleteSeries = /complete\s*(?:series|collection|boxset|pack)?|s\d{1,2}\s*-\s*s?\d{1,2}|season\s*\d{1,2}\s*-\s*\d{1,2}|all\s*seasons|entire\s*series|full\s*series/i.test(packTitle)

  return {
    isBatch,
    isCompleteSeries,
    isSingleEp: !isBatch,
    type: isCompleteSeries ? 'Complete Series' : isBatch ? 'Season Batch' : 'Single Episode',
    fileIdx: stream.fileIdx ?? 0,
    batchName: isBatch ? packTitle : null,
    targetFile: isBatch ? targetFile : null
  }
}

export function checkBatch(s, isTv = false) {
  return classifyStream(s, isTv)
}

const YTS_MIRRORS = [
  'https://yts.lt/api/v2',
  'https://yts.mx/api/v2',
  'https://yts.am/api/v2',
  'https://yts.bz/api/v2'
]

/**
 * Fetch torrents from YTS API
 * @param {string} query - IMDb ID (e.g. tt10366206) or movie title
 */
export async function fetchYtsTorrents(query) {
  if (!query) return { success: false, torrents: [], error: 'No query provided' }

  let lastError = null
  for (const base of YTS_MIRRORS) {
    try {
      const url = `${base}/list_movies.json?query_term=${encodeURIComponent(query)}&limit=1`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 6000)

      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!res.ok) continue
      const data = await res.json()

      if (data.status === 'ok' && data.data?.movies?.[0]?.torrents?.length > 0) {
        const movie = data.data.movies[0]
        const torrents = movie.torrents.map(t => {
          const ripType = t.type === 'bluray' ? 'BluRay' : 'WEB-DL'
          return {
            provider: 'YTS',
            title: `${movie.title_long || movie.title} [${t.quality}] [${t.type?.toUpperCase()}]`,
            rawTitle: movie.title_long || movie.title,
            quality: t.quality === '2160p' ? '4K' : t.quality,
            resolution: t.quality,
            type: t.type,
            ripType,
            audios: ['English'],
            isBatch: false,
            codec: t.video_codec,
            bitDepth: t.bit_depth ? `${t.bit_depth}-bit` : null,
            audio: t.audio_channels,
            size: t.size,
            sizeBytes: t.size_bytes || parseSizeBytes(t.size),
            seeds: t.seeds || 0,
            peers: t.peers || 0,
            hash: t.hash,
            torrentUrl: t.url,
            magnetUrl: buildMagnetUri(t.hash, `${movie.title_long || movie.title} [${t.quality}] [YTS]`),
            dateUploaded: t.date_uploaded
          }
        })

        // Sort default by seeds descending
        torrents.sort((a, b) => (b.seeds || 0) - (a.seeds || 0))

        return {
          success: true,
          provider: 'YTS',
          movieTitle: movie.title_long || movie.title,
          torrents,
          error: null
        }
      } else {
        return {
          success: true,
          provider: 'YTS',
          torrents: [],
          error: 'No torrents found on YTS'
        }
      }
    } catch (err) {
      lastError = err.message
    }
  }

  return {
    success: false,
    provider: 'YTS',
    torrents: [],
    error: lastError || 'Failed to connect to YTS'
  }
}

/**
 * Fetch torrents from Torrentio API
 * @param {object} params - { type: 'movie'|'tv', imdbId: string, season: number, episode: number, title: string }
 */
export async function fetchTorrentioTorrents({ type = 'movie', imdbId, season, episode, title = '' }) {
  if (!imdbId) {
    return { success: false, torrents: [], error: 'IMDb ID required for Torrentio' }
  }

  const isTv = type === 'tv' || type === 'series'
  let idParam = imdbId
  if (isTv && season && episode) {
    idParam = `${imdbId}:${season}:${episode}`
  }
  const typeParam = isTv ? 'series' : 'movie'
  const url = `https://torrentio.strem.fun/stream/${typeParam}/${idParam}.json`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!res.ok) {
      return { success: false, torrents: [], error: `Torrentio returned HTTP ${res.status}` }
    }

    const data = await res.json()
    const streams = data.streams || []

    if (streams.length === 0) {
      return {
        success: true,
        provider: 'Torrentio',
        torrents: [],
        error: `No streams found on Torrentio for ${isTv ? `S${season} E${episode}` : 'this movie'}`
      }
    }

    const torrents = streams.map(s => {
      // Parse resolution from s.name (e.g. "Torrentio\n4k DV | HDR" or "Torrentio\n1080p")
      const nameLines = (s.name || '').split('\n')
      const qualityRaw = nameLines[1] || nameLines[0] || 'HD'

      let quality = '1080p'
      if (/4k|2160p/i.test(qualityRaw) || /4k|2160p/i.test(s.title || '')) {
        quality = '4K'
      } else if (/1080p/i.test(qualityRaw) || /1080p/i.test(s.title || '')) {
        quality = '1080p'
      } else if (/720p/i.test(qualityRaw) || /720p/i.test(s.title || '')) {
        quality = '720p'
      } else if (/480p|sd/i.test(qualityRaw) || /480p|sd/i.test(s.title || '')) {
        quality = 'SD'
      }

      // Parse metadata from s.title
      const titleLines = (s.title || '').split('\n')
      // titleLines[0] is the REAL torrent release name
      const releaseName = titleLines[0] || s.behaviorHints?.filename || title || 'Torrent'
      const fullText = `${s.name || ''} ${s.title || ''} ${releaseName} ${s.behaviorHints?.filename || ''}`

      // Extract seeders
      const seedMatch = (s.title || '').match(/(?:👤|👥)\s*(\d+)/u)
      const seeds = seedMatch ? parseInt(seedMatch[1], 10) : 0

      // Extract file size
      const sizeMatch = (s.title || '').match(/💾\s*([0-9.]+\s*(?:GB|MB|TB|KB))/iu)
      const size = sizeMatch ? sizeMatch[1].trim() : 'Unknown'
      const sizeBytes = parseSizeBytes(size)

      // Extract source tracker/indexer
      const sourceMatch = (s.title || '').match(/⚙(?:️)?\s*([^\n\r]+)/u)
      const source = sourceMatch ? sourceMatch[1].trim() : 'Torrentio'

      // Detect Rip Type (BluRay, WEB-DL, CAM, REMUX, etc.)
      const ripType = extractRipType(fullText)

      // Detect Audio Languages
      const audios = extractAudios(fullText)

      // Detect Season / Series Batch vs Single Episode
      const { isBatch, isCompleteSeries, isSingleEp, batchName, targetFile } = classifyStream(s, isTv)

      // Extra tags (HDR, DV, Remux, etc.)
      const tags = []
      if (/hdr/i.test(s.title || '') || /hdr/i.test(s.name || '')) tags.push('HDR')
      if (/dv|dolby\s*vision/i.test(s.title || '') || /dv/i.test(s.name || '')) tags.push('DV')
      if (/atmos/i.test(s.title || '')) tags.push('Atmos')
      if (/hevc|x265|h\.?265/i.test(s.title || '')) tags.push('x265')

      const magnet = buildMagnetUri(s.infoHash, releaseName)

      return {
        provider: 'Torrentio',
        title: releaseName,
        rawTitle: releaseName,
        quality,
        qualityDetail: qualityRaw.trim(),
        ripType,
        audios,
        isBatch,
        isCompleteSeries,
        isSingleEp,
        batchName,
        targetFile,
        tags,
        size,
        sizeBytes,
        seeds,
        source,
        hash: s.infoHash,
        magnetUrl: magnet,
        fileIdx: s.fileIdx
      }
    })

    // Default sort by seeds descending
    torrents.sort((a, b) => (b.seeds || 0) - (a.seeds || 0))

    return {
      success: true,
      provider: 'Torrentio',
      torrents,
      error: null
    }
  } catch (err) {
    return {
      success: false,
      provider: 'Torrentio',
      torrents: [],
      error: err.message || 'Failed to connect to Torrentio'
    }
  }
}
