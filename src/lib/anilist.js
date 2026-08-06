// AniList API Client
const ANILIST_API_URL = 'https://graphql.anilist.co'

const MEDIA_FIELDS = `
  id
  title {
    romaji
    english
    native
    userPreferred
  }
  coverImage {
    extraLarge
    large
    medium
    color
  }
  bannerImage
  description
  episodes
  season
  seasonYear
  averageScore
  genres
  format
  status
  popularity
`

async function fetchFromAnilist(query, variables = {}) {
  try {
    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err?.errors?.[0]?.message || `AniList API error: ${response.status}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error fetching from AniList:', error)
    throw error
  }
}

// Maps AniList Anime item to the schema expected by CineLog Tracker
export const mapAnilistItemToAppMedia = (media, customType) => {
  if (!media) return null
  const isMovie = media.format === 'MOVIE'
  const type = customType || (isMovie ? 'movie' : 'tv')

  return {
    id: `anilist_${media.id}`,
    tmdb_id: `anilist_${media.id}`,
    title: media.title.english || media.title.romaji || media.title.userPreferred,
    type: type,
    poster_path: media.coverImage.extraLarge || media.coverImage.large || media.coverImage.medium,
    backdrop_path: media.bannerImage || media.coverImage.extraLarge,
    release_date: media.seasonYear ? `${media.seasonYear}-01-01` : '',
    release_year: media.seasonYear ? media.seasonYear.toString() : '',
    vote_average: media.averageScore ? (media.averageScore / 10).toFixed(1) : '0.0',
    overview: media.description ? media.description.replace(/<[^>]*>/g, '') : 'No description available.',
    genres: media.genres || [],
    episodes: media.episodes || 1,
    status: 'planned',
    original_language: 'ja',
    country: 'JP'
  }
}

// Fetch lists of anime
export const fetchAnilistBrowse = async ({ sort, status, search, page = 1, perPage = 15 }) => {
  const query = `
    query ($sort: [MediaSort], $status: MediaStatus, $search: String, $page: Int, $perPage: Int) {
      Page (page: $page, perPage: $perPage) {
        pageInfo {
          total
          perPage
          currentPage
          lastPage
          hasNextPage
        }
        media (type: ANIME, sort: $sort, status: $status, search: $search) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `

  const variables = { sort, status, search, page, perPage }
  const data = await fetchFromAnilist(query, variables)
  
  return {
    items: (data?.Page?.media || []).map(m => mapAnilistItemToAppMedia(m)),
    pageInfo: data?.Page?.pageInfo || { total: 0, currentPage: 1, hasNextPage: false }
  }
}

// Fetch categories for dashboard
export const fetchAnilistDashboard = async () => {
  const query = `
    query {
      trending: Page(page: 1, perPage: 12) {
        media(type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC]) {
          ${MEDIA_FIELDS}
        }
      }
      popular: Page(page: 1, perPage: 12) {
        media(type: ANIME, sort: [POPULARITY_DESC]) {
          ${MEDIA_FIELDS}
        }
      }
      topRated: Page(page: 1, perPage: 12) {
        media(type: ANIME, sort: [SCORE_DESC]) {
          ${MEDIA_FIELDS}
        }
      }
      onAir: Page(page: 1, perPage: 12) {
        media(type: ANIME, status: RELEASING, sort: [POPULARITY_DESC]) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `

  const data = await fetchFromAnilist(query)
  return {
    trending: (data?.trending?.media || []).map(m => mapAnilistItemToAppMedia(m)),
    popular: (data?.popular?.media || []).map(m => mapAnilistItemToAppMedia(m)),
    topRated: (data?.topRated?.media || []).map(m => mapAnilistItemToAppMedia(m)),
    onAir: (data?.onAir?.media || []).map(m => mapAnilistItemToAppMedia(m))
  }
}

// Fetch full details of an anime (mapped to TMDB-like structure)
export const fetchAnilistAnimeDetails = async (id) => {
  const query = `
    query ($id: Int) {
      Media (id: $id, type: ANIME) {
        id
        title {
          romaji
          english
          native
          userPreferred
        }
        coverImage {
          extraLarge
          large
          medium
          color
        }
        bannerImage
        description
        episodes
        season
        seasonYear
        averageScore
        genres
        format
        status
        duration
        popularity
        studios(isMain: true) {
          nodes {
            id
            name
          }
        }
        trailer {
          id
          site
        }
        relations {
          edges {
            relationType
            node {
              id
              title {
                romaji
                english
                native
                userPreferred
              }
              type
              format
              coverImage {
                large
              }
            }
          }
        }
        recommendations (perPage: 12) {
          nodes {
            mediaRecommendation {
              id
              title {
                romaji
                english
                native
                userPreferred
              }
              type
              format
              coverImage {
                large
              }
            }
          }
        }
        characters (sort: [ROLE, RELEVANCE], perPage: 15) {
          edges {
            role
            node {
              id
              name {
                full
                userPreferred
              }
              image {
                large
              }
            }
            voiceActors(language: JAPANESE) {
              id
              name {
                full
              }
              image {
                large
              }
            }
          }
        }
      }
    }
  `

  const parsedId = parseInt(id.replace('anilist_', ''), 10)
  const data = await fetchFromAnilist(query, { id: parsedId })
  const media = data?.Media
  if (!media) return null

  // Map characters to cast list
  const cast = (media.characters?.edges || []).map(edge => ({
    id: edge.node.id,
    name: edge.node.name.full,
    character: edge.role === 'MAIN' ? `${edge.node.name.full} (Main)` : edge.node.name.full,
    profile_path: edge.node.image?.large || edge.node.image?.medium,
  }))

  const crew = []
  const studio = media.studios?.nodes?.[0]?.name
  if (studio) {
    crew.push({
      id: 'studio_main',
      name: studio,
      job: 'Director',
      department: 'Directing'
    })
  }

  const genres = (media.genres || []).map((g, idx) => ({
    id: idx.toString(),
    name: g
  }))

  const videos = media.trailer && media.trailer.site?.toLowerCase() === 'youtube'
    ? { results: [{ id: media.trailer.id, key: media.trailer.id, name: 'Official Trailer', site: 'YouTube', type: 'Trailer' }] }
    : { results: [] }

  const seasons = [
    {
      season_number: 1,
      episode_count: media.episodes || 12,
      name: 'Season 1',
      poster_path: media.coverImage?.large,
      air_date: media.seasonYear ? `${media.seasonYear}-01-01` : null
    }
  ]

  // Map relations & recommendations to TMDB-like recommendations / similar
  const mappedRecommendations = (media.recommendations?.nodes || [])
    .map(node => node.mediaRecommendation)
    .filter(Boolean)
    .map(m => mapAnilistItemToAppMedia(m))

  const mappedSimilar = (media.relations?.edges || [])
    .filter(edge => edge.node?.type === 'ANIME')
    .map(edge => mapAnilistItemToAppMedia(edge.node))

  return {
    id: `anilist_${media.id}`,
    tmdb_id: `anilist_${media.id}`,
    title: media.title.english || media.title.romaji || media.title.userPreferred,
    name: media.title.english || media.title.romaji || media.title.userPreferred,
    backdrop_path: media.bannerImage || media.coverImage?.extraLarge,
    poster_path: media.coverImage?.extraLarge || media.coverImage?.large,
    overview: media.description ? media.description.replace(/<[^>]*>/g, '') : 'No description available.',
    vote_average: media.averageScore ? (media.averageScore / 10) : 0,
    genres: genres,
    credits: {
      cast: cast,
      crew: crew
    },
    videos: videos,
    seasons: seasons,
    homepage: `https://anilist.co/anime/${media.id}`,
    external_ids: {
      imdb_id: null
    },
    origin_country: ['JP'],
    original_language: 'ja',
    popularity: media.popularity || 0,
    first_air_date: media.seasonYear ? `${media.seasonYear}-01-01` : null,
    release_date: media.seasonYear ? `${media.seasonYear}-01-01` : null,
    recommendations: mappedRecommendations,
    similar: mappedSimilar
  }
}
