// OMDb API Client
const getOmdbApiKey = () => {
  return import.meta.env.VITE_OMDB_API_KEY || localStorage.getItem('omdb_api_key') || 'trilogy'
}

export const isOMDBConfigured = () => {
  return !!getOmdbApiKey()
}

/**
 * Fetch ratings & info from OMDb API
 * @param {Object} params - { imdbId, title, year, type }
 */
export const fetchOMDBData = async ({ imdbId, title, year, type }) => {
  const apiKey = getOmdbApiKey()
  if (!apiKey) return null

  try {
    let url = ''
    if (imdbId) {
      url = `https://www.omdbapi.com/?apikey=${apiKey}&i=${encodeURIComponent(imdbId)}`
    } else if (title) {
      const omdbType = type === 'tv' ? 'series' : type === 'movie' ? 'movie' : ''
      url = `https://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(title)}${year ? `&y=${year}` : ''}${omdbType ? `&type=${omdbType}` : ''}`
    } else {
      return null
    }

    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()

    if (data.Response === 'False') {
      // If search with year failed, try without year
      if (year && title) {
        return fetchOMDBData({ imdbId: null, title, year: null, type })
      }
      return null
    }

    // Extract Rotten Tomatoes rating from Ratings array
    const rtRating = data.Ratings?.find(r => r.Source === 'Rotten Tomatoes')?.Value || null
    const imdbRating = data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : null
    const imdbVotes = data.imdbVotes && data.imdbVotes !== 'N/A' ? data.imdbVotes : null
    const metascore = data.Metascore && data.Metascore !== 'N/A' ? data.Metascore : null

    const budget = data.Budget && data.Budget !== 'N/A' ? data.Budget : null

    return {
      imdbRating,
      imdbVotes,
      rottenTomatoes: rtRating,
      metascore,
      rated: data.Rated !== 'N/A' ? data.Rated : null,
      awards: data.Awards !== 'N/A' ? data.Awards : null,
      boxOffice: data.BoxOffice !== 'N/A' ? data.BoxOffice : null,
      budget,
      imdbID: data.imdbID !== 'N/A' ? data.imdbID : imdbId,
      raw: data
    }
  } catch (err) {
    console.error('Failed to fetch OMDb ratings:', err)
    return null
  }
}
