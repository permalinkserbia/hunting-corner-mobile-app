import apiService from '../services/api';
import { debounce } from 'lodash-es';

let suggestionsCache = {};

export async function getTagSuggestions(query) {
  if (!query || query.length < 2) return [];

  const cacheKey = query.toLowerCase();
  if (suggestionsCache[cacheKey]) {
    return suggestionsCache[cacheKey];
  }

  try {
    const response = await apiService.get('/tags', {
      params: { suggest: query },
    });
    const suggestions = response.data.data || response.data;
    suggestionsCache[cacheKey] = suggestions;
    return suggestions;
  } catch (error) {
    console.error('Tag suggestions error:', error);
    return [];
  }
}

export const debouncedGetTagSuggestions = debounce(getTagSuggestions, 300);

