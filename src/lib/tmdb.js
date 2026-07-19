// TMDB API Client
const getApiKey = () => {
  return import.meta.env.VITE_TMDB_API_KEY || localStorage.getItem('tmdb_api_key') || ''
}

const BASE_URL = 'https://api.themoviedb.org/3'

export const isTMDBConfigured = () => {
  return !!getApiKey()
}

// Custom mock data for fallback when TMDB API is not configured
const MOCK_MOVIES = [
  {
    id: 'm1',
    title: 'Interstellar',
    type: 'movie',
    name: 'Interstellar',
    poster_path: '/gEU2QClhRL7dhvPAjV7Sq5jXvHT.jpg', // real TMDB poster path
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.',
    release_date: '2014-11-05',
    first_air_date: '2014-11-05',
    vote_average: 8.4,
    genre_ids: [18, 878, 12]
  },
  {
    id: 'm2',
    title: 'The Dark Knight',
    type: 'movie',
    name: 'The Dark Knight',
    poster_path: '/qJ2tWw2mIMIvV0m41mGaJmXhb4w.jpg',
    overview: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.',
    release_date: '2008-07-16',
    first_air_date: '2008-07-16',
    vote_average: 8.5,
    genre_ids: [28, 80, 18, 53]
  },
  {
    id: 'm3',
    title: 'Dune: Part Two',
    type: 'movie',
    name: 'Dune: Part Two',
    poster_path: '/czemb7Hm150774RCVCHw5ohCgHG.jpg',
    overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.',
    release_date: '2024-02-27',
    first_air_date: '2024-02-27',
    vote_average: 8.3,
    genre_ids: [878, 12]
  },
  {
    id: 'm4',
    title: 'Spider-Man: Across the Spider-Verse',
    type: 'movie',
    name: 'Spider-Man: Across the Spider-Verse',
    poster_path: '/8Vt1tTTjLJjQTYI6maZ34GvORJb.jpg',
    overview: 'After reuniting with Gwen Stacy, Brooklyn’s full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
    release_date: '2023-05-31',
    first_air_date: '2023-05-31',
    vote_average: 8.4,
    genre_ids: [16, 28, 12, 878]
  },
  {
    id: 'm5',
    title: 'Inception',
    type: 'movie',
    name: 'Inception',
    poster_path: '/o0OFlwCn6KrCqIQ2WJCt6R1wL7y.jpg',
    overview: 'Cobb, a skilled thief who is absolute best in the dangerous art of extraction, steals valuable secrets from deep within the subconscious during the dream state.',
    release_date: '2010-07-15',
    first_air_date: '2010-07-15',
    vote_average: 8.4,
    genre_ids: [28, 878, 12, 53]
  },
  {
    id: 'm6',
    title: 'Everything Everywhere All at Once',
    type: 'movie',
    name: 'Everything Everywhere All at Once',
    poster_path: '/w35n1BF722hpAwG076G878ehBIB.jpg',
    overview: 'An aging Chinese immigrant is swept up in an insane adventure, where she alone can save the world by exploring other universes connecting with the lives she could have led.',
    release_date: '2022-03-24',
    first_air_date: '2022-03-24',
    vote_average: 7.8,
    genre_ids: [28, 12, 878, 35]
  }
]

const MOCK_TV = [
  {
    id: 't1',
    title: 'Breaking Bad',
    type: 'tv',
    name: 'Breaking Bad',
    poster_path: '/ztkUQ85v2HTn7nJjbZ5Z248JZ6X.jpg',
    overview: 'Walter White, a New Mexico chemistry teacher, diagnosed with Stage III cancer, turns to manufacturing and selling methamphetamine with a former student, Jesse Pinkman, to secure his family\'s financial future.',
    release_date: '2008-01-20',
    first_air_date: '2008-01-20',
    vote_average: 8.9,
    genre_ids: [18, 80]
  },
  {
    id: 't2',
    title: 'Stranger Things',
    type: 'tv',
    name: 'Stranger Things',
    poster_path: '/49W4v2jHjHgcNsBsKGDV221t274.jpg',
    overview: 'When a young boy vanishes, a town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
    release_date: '2016-07-15',
    first_air_date: '2016-07-15',
    vote_average: 8.6,
    genre_ids: [18, 9648, 878]
  },
  {
    id: 't3',
    title: 'The Last of Us',
    type: 'tv',
    name: 'The Last of Us',
    poster_path: '/uKVQjEUuHSi1uXglj6AK5a7j6vC.jpg',
    overview: 'Twenty years after modern civilization has been destroyed, Joel, a hardened survivor, is hired to smuggle Ellie, a 14-year-old girl, out of an oppressive quarantine zone.',
    release_date: '2023-01-15',
    first_air_date: '2023-01-15',
    vote_average: 8.6,
    genre_ids: [18, 10759]
  },
  {
    id: 't4',
    title: 'Succession',
    type: 'tv',
    name: 'Succession',
    poster_path: '/7mK4j3tXm5e856e7e171A8v83.jpg',
    overview: 'The Roy family is known for controlling the biggest media and entertainment company in the world. However, their world changes when their father steps down.',
    release_date: '2018-06-03',
    first_air_date: '2018-06-03',
    vote_average: 8.3,
    genre_ids: [18]
  },
  {
    id: 't5',
    title: 'Chernobyl',
    type: 'tv',
    name: 'Chernobyl',
    poster_path: '/hlLR622nsRFBh5vSy36XRI35v6N.jpg',
    overview: 'The true story of one of the worst man-made catastrophes in history, the Chernobyl Nuclear Power Plant disaster, and the brave men and women who sacrificed themselves to save Europe from unimaginable disaster.',
    release_date: '2019-05-06',
    first_air_date: '2019-05-06',
    vote_average: 8.6,
    genre_ids: [18]
  }
]

export const fetchTMDB = async (endpoint, params = {}) => {
  const apiKey = getApiKey()

  if (!apiKey) {
    // If TMDB is not configured, simulate a network request and return mock data
    await new Promise(resolve => setTimeout(resolve, 500))

    if (endpoint.includes('/movie/popular')) {
      return { results: MOCK_MOVIES }
    } else if (endpoint.includes('/tv/popular')) {
      return { results: MOCK_TV }
    } else if (endpoint.includes('/search/multi') || endpoint.includes('/search/movie') || endpoint.includes('/search/tv')) {
      const query = (params.query || '').toLowerCase()
      if (!query) return { results: [...MOCK_MOVIES, ...MOCK_TV] }

      const allResults = [
        ...MOCK_MOVIES.map(m => ({ ...m, media_type: 'movie' })),
        ...MOCK_TV.map(t => ({ ...t, media_type: 'tv' }))
      ]

      const filtered = allResults.filter(item =>
        (item.title && item.title.toLowerCase().includes(query)) ||
        (item.name && item.name.toLowerCase().includes(query))
      )
      return { results: filtered }
    } else if (endpoint.includes('/genre/movie/list')) {
      return { genres: [{ id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 878, name: 'Science Fiction' }, { id: 18, name: 'Drama' }] }
    } else if (endpoint.includes('/genre/tv/list')) {
      return { genres: [{ id: 18, name: 'Drama' }, { id: 80, name: 'Crime' }, { id: 9648, name: 'Mystery' }] }
    } else if (endpoint.match(/^\/movie\/[a-zA-Z0-9]+$/)) {
      const mockMovieId = endpoint.split('/')[2]
      const found = MOCK_MOVIES.find(m => m.id === mockMovieId || m.id.toString() === mockMovieId) || MOCK_MOVIES[0]
      return {
        ...found,
        backdrop_path: found.poster_path, // fallback backdrop
        videos: { results: [{ type: 'Trailer', site: 'YouTube', key: 'dQw4w9WgXcQ' }] },
        credits: { cast: [{ id: 1, name: 'Demo Actor', profile_path: null, character: 'Hero' }] }
      }
    } else if (endpoint.match(/^\/tv\/[a-zA-Z0-9]+$/)) {
      const mockTvId = endpoint.split('/')[2]
      const found = MOCK_TV.find(t => t.id === mockTvId || t.id.toString() === mockTvId) || MOCK_TV[0]
      return {
        ...found,
        number_of_seasons: Math.floor(Math.random() * 5) + 2,
        backdrop_path: found.poster_path,
        videos: { results: [{ type: 'Trailer', site: 'YouTube', key: 'dQw4w9WgXcQ' }] },
        credits: { cast: [{ id: 1, name: 'Demo Actor', profile_path: null, character: 'Hero' }] }
      }
    } else if (endpoint.match(/^\/tv\/[a-zA-Z0-9]+\/season\/\d+$/)) {
      return {
        episodes: Array.from({ length: 8 }).map((_, i) => ({
          id: Math.random(),
          name: `Mock Episode ${i + 1}`,
          episode_number: i + 1,
          overview: "This is a placeholder description for the episode. Connect your TMDB API key in settings to see real episode details and images.",
          still_path: null
        }))
      }
    }

    return { results: [] }
  }

  // Construct URL with API key and query params
  const urlParams = new URLSearchParams({
    api_key: apiKey,
    language: 'en-US',
    ...params
  })

  try {
    const response = await fetch(`${BASE_URL}${endpoint}?${urlParams.toString()}`)
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching from TMDB:', error)
    throw error
  }
}

// Curated mock games data so that we can have search and add functionality for Games without requiring an external API key!
// This satisfies the "Games" tab requirement.
export const MOCK_GAMES = [
  {
    id: 'g1',
    title: 'The Witcher 3: Wild Hunt',
    type: 'game',
    name: 'The Witcher 3: Wild Hunt',
    poster_path: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg',
    overview: 'RPG set in a visually stunning fantasy universe full of meaningful choices and impactful consequences.',
    release_date: '2015-05-19',
    vote_average: 9.2,
    genre_ids: ['RPG']
  },
  {
    id: 'g2',
    title: 'Elden Ring',
    type: 'game',
    name: 'Elden Ring',
    poster_path: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jlb.jpg',
    overview: 'A massive action RPG developed by FromSoftware, set in the Lands Between, created in collaboration with George R. R. Martin.',
    release_date: '2022-02-25',
    vote_average: 9.5,
    genre_ids: ['Action RPG', 'Fantasy']
  },
  {
    id: 'g3',
    title: 'Grand Theft Auto V',
    type: 'game',
    name: 'Grand Theft Auto V',
    poster_path: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.jpg',
    overview: 'A young street hustler, a retired bank robber and a terrifying psychopath find themselves entangled with some of the most frightening and deranged elements of the underworld.',
    release_date: '2013-09-17',
    vote_average: 8.9,
    genre_ids: ['Action-Adventure']
  },
  {
    id: 'g4',
    title: 'The Legend of Zelda: Breath of the Wild',
    type: 'game',
    name: 'The Legend of Zelda: Breath of the Wild',
    poster_path: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3p2d.jpg',
    overview: 'Step into a world of discovery, exploration, and adventure in a boundary-breaking new game about the open-air adventure.',
    release_date: '2017-03-03',
    vote_average: 9.6,
    genre_ids: ['Adventure', 'Open World']
  },
  {
    id: 'g5',
    title: 'Cyberpunk 2077',
    type: 'game',
    name: 'Cyberpunk 2077',
    poster_path: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2m41.jpg',
    overview: 'An open-world, action-adventure story set in Night City, a megalopolis obsessed with power, glamour and body modification.',
    release_date: '2020-12-10',
    vote_average: 7.9,
    genre_ids: ['RPG', 'Sci-Fi']
  },
  {
    id: 'g6',
    title: 'Hades',
    type: 'game',
    name: 'Hades',
    poster_path: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1v91.jpg',
    overview: 'Defy the god of the dead as you hack and slash out of the Underworld in this rogue-like dungeon crawler from the creators of Bastion.',
    release_date: '2020-09-17',
    vote_average: 9.0,
    genre_ids: ['Roguelike', 'Action']
  },
  {
    id: 'g7',
    title: 'God of War Ragnarök',
    type: 'game',
    name: 'God of War Ragnarök',
    poster_path: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co58y9.jpg',
    overview: 'Kratos and Atreus must journey to each of the Nine Realms in search of answers as Asgardian forces prepare for a prophesied battle.',
    release_date: '2022-11-09',
    vote_average: 9.3,
    genre_ids: ['Action-Adventure']
  },
  {
    id: 'g8',
    title: 'Red Dead Redemption 2',
    type: 'game',
    name: 'Red Dead Redemption 2',
    poster_path: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7f.jpg',
    overview: 'America, 1899. Arthur Morgan and the Van der Linde gang are outlaws on the run. With federal agents and the best bounty hunters massing on their heels, the gang must rob, steal and fight.',
    release_date: '2018-10-26',
    vote_average: 9.7,
    genre_ids: ['Action-Adventure', 'Open World']
  }
]

export const searchGames = async (query = '') => {
  await new Promise(resolve => setTimeout(resolve, 300))
  const lowerQuery = query.toLowerCase()
  if (!lowerQuery) return MOCK_GAMES
  return MOCK_GAMES.filter(game =>
    game.title.toLowerCase().includes(lowerQuery)
  )
}
export const getPosterUrl = (posterPath, size = 'w500') => {
  if (!posterPath) return 'https://placehold.co/500x750/1e293b/ffffff?text=No+Poster'
  if (posterPath.startsWith('http')) return posterPath
  return `https://image.tmdb.org/t/p/${size}${posterPath}`
}
