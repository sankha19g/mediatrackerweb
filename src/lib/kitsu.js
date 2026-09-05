// Kitsu API Client for Anime Episode Metadata & Thumbnails
const KITSU_BASE_URL = 'https://kitsu.io/api/edge'

// In-memory caches to prevent redundant network calls across views
const animeCache = new Map() // title/key -> kitsuAnime
const episodesCache = new Map() // kitsuId -> { [epNumber]: episodeData }

/**
 * Searches Kitsu for an anime matching the given titles or year
 * @param {string} title - Primary title (romaji or english)
 * @param {number|string} [year] - Release year for disambiguation
 * @returns {Promise<Object|null>} - Kitsu anime object or null
 */
export const findKitsuAnime = async (title, year) => {
  if (!title) return null
  const cacheKey = `${title.toLowerCase().trim()}_${year || ''}`
  if (animeCache.has(cacheKey)) {
    return animeCache.get(cacheKey)
  }

  try {
    const cleanTitle = title
      .replace(/[^\w\s-]/gi, '')
      .replace(/\s+/g, ' ')
      .trim()

    const url = `${KITSU_BASE_URL}/anime?filter[text]=${encodeURIComponent(cleanTitle)}&page[limit]=5`
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      }
    })

    if (!res.ok) return null
    const data = await res.json()
    const list = data.data || []
    if (list.length === 0) return null

    // Attempt to match year if provided
    let matched = list[0]
    if (year) {
      const yearMatch = list.find(item => {
        const startDate = item.attributes?.startDate || ''
        return startDate.startsWith(`${year}`)
      })
      if (yearMatch) matched = yearMatch
    }

    const result = {
      id: matched.id,
      canonicalTitle: matched.attributes?.canonicalTitle,
      episodeCount: matched.attributes?.episodeCount,
      totalLength: matched.attributes?.totalLength,
      posterImage: matched.attributes?.posterImage?.large || matched.attributes?.posterImage?.original
    }

    animeCache.set(cacheKey, result)
    return result
  } catch (err) {
    console.warn('Failed to search Kitsu anime:', err)
    return null
  }
}

/**
 * Fetches episodes in batches of up to 20 from Kitsu
 * @param {string|number} kitsuId 
 * @param {number} offset 
 * @param {number} limit (max 20)
 * @returns {Promise<Array>}
 */
const fetchKitsuEpisodePage = async (kitsuId, offset = 0, limit = 20) => {
  try {
    const cappedLimit = Math.min(Math.max(limit, 1), 20)
    const url = `${KITSU_BASE_URL}/anime/${kitsuId}/episodes?page[limit]=${cappedLimit}&page[offset]=${offset}&sort=number`
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      }
    })

    if (!res.ok) return []
    const data = await res.json()
    return (data.data || []).map(ep => {
      const attrs = ep.attributes || {}
      return {
        id: ep.id,
        number: attrs.number,
        relativeNumber: attrs.relativeNumber,
        title: attrs.canonicalTitle || attrs.titles?.en_us || attrs.titles?.en_jp || `Episode ${attrs.number}`,
        thumbnail: attrs.thumbnail?.original || attrs.thumbnail?.medium || '',
        synopsis: attrs.synopsis || attrs.description || '',
        airdate: attrs.airdate || '',
        length: attrs.length || 24
      }
    })
  } catch (err) {
    console.warn(`Failed to fetch Kitsu episode page for ${kitsuId} at offset ${offset}:`, err)
    return []
  }
}

/**
 * Fetches a range of episodes (e.g. from startEp to endEp) for an anime
 * Uses parallel page requests of 20 items each
 * @param {string|number} kitsuId
 * @param {number} startEp - 1-based start episode number
 * @param {number} endEp - 1-based end episode number
 * @returns {Promise<Object>} Map of episode numbers to episode objects
 */
export const fetchKitsuEpisodesRange = async (kitsuId, startEp = 1, endEp = 50) => {
  if (!kitsuId) return {}

  let animeEps = episodesCache.get(kitsuId)
  if (!animeEps) {
    animeEps = {}
    episodesCache.set(kitsuId, animeEps)
  }

  // Check which episodes are missing from cache
  const missingOffsets = new Set()
  for (let ep = startEp; ep <= endEp; ep++) {
    if (!animeEps[ep]) {
      // Offset calculation for 1-based episode numbers: (ep - 1)
      // Since pages are sized 20, the page offset is Math.floor((ep - 1) / 20) * 20
      const pageOffset = Math.floor((ep - 1) / 20) * 20
      missingOffsets.add(pageOffset)
    }
  }

  if (missingOffsets.size === 0) {
    return animeEps
  }

  // Fetch missing pages in parallel (limit max concurrent to 6)
  const offsetList = Array.from(missingOffsets).slice(0, 6)
  const fetchPromises = offsetList.map(offset => fetchKitsuEpisodePage(kitsuId, offset, 20))
  const results = await Promise.all(fetchPromises)

  results.flat().forEach(ep => {
    if (ep && ep.number) {
      animeEps[ep.number] = ep
    }
  })

  return animeEps
}

/**
 * Fetches a single episode by episode number
 * @param {string|number} kitsuId
 * @param {number} epNum
 * @returns {Promise<Object|null>}
 */
export const fetchKitsuEpisodeByNumber = async (kitsuId, epNum) => {
  if (!kitsuId || !epNum) return null

  const animeEps = episodesCache.get(kitsuId)
  if (animeEps && animeEps[epNum]) {
    return animeEps[epNum]
  }

  try {
    const url = `${KITSU_BASE_URL}/anime/${kitsuId}/episodes?filter[number]=${epNum}`
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      }
    })

    if (!res.ok) return null
    const data = await res.json()
    const ep = data.data?.[0]
    if (!ep) return null

    const attrs = ep.attributes || {}
    const episodeData = {
      id: ep.id,
      number: attrs.number,
      relativeNumber: attrs.relativeNumber,
      title: attrs.canonicalTitle || attrs.titles?.en_us || attrs.titles?.en_jp || `Episode ${attrs.number}`,
      thumbnail: attrs.thumbnail?.original || attrs.thumbnail?.medium || '',
      synopsis: attrs.synopsis || attrs.description || '',
      airdate: attrs.airdate || '',
      length: attrs.length || 24
    }

    if (!episodesCache.has(kitsuId)) {
      episodesCache.set(kitsuId, {})
    }
    episodesCache.get(kitsuId)[epNum] = episodeData
    return episodeData
  } catch (err) {
    console.warn(`Failed to fetch Kitsu episode #${epNum} for ${kitsuId}:`, err)
    return null
  }
}
