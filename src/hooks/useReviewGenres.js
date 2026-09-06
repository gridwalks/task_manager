import { useCallback } from 'react'
import { useConfig } from './useConfig'

export const DEFAULT_REVIEW_GENRES = [
  'Romance', 'Dark Romance', 'Romantasy', 'Fantasy', 'Science Fiction',
  'Young Adult', 'Mystery / Thriller', 'Horror', 'Contemporary Fiction',
  'Historical Fiction', 'Nonfiction', 'Memoir / Biography', 'Self-Help', 'Other',
]

export function useReviewGenres() {
  const { config, saveConfig } = useConfig()

  const reviewGenres = config.reviewGenres || DEFAULT_REVIEW_GENRES

  const saveReviewGenres = useCallback(async (genres) => {
    await saveConfig({ reviewGenres: genres })
  }, [saveConfig])

  return { reviewGenres, saveReviewGenres }
}
