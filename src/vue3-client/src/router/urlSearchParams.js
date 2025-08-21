import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export function useSearchURL(options = {}) {
  const router = useRouter();
  const route = useRoute();
  let addedState = false;
  const {
    paramName = 'q',
    debounceMs = 300,
    emitSearch = null, // Optional callback function
    initialValue = ''
  } = options

  const searchQuery = ref(initialValue)
  let searchTimeout = null

  watch(() => route.query[paramName], () => {
    if (route.query[paramName] !== searchQuery.value) {
      // Only happens when someone clicked on some menu item
      searchQuery.value = route.query[paramName] ?? "";
    }
  });

  // Get query parameter from URL
  const getQueryParam = (param) => {
    return route.query[param] || '';
  }

  // Update URL with search query
  const updateURL = (oldQuery, query) => {
    if (query === route.query[paramName]) {
      return; // No change in query, do nothing
    }
    const params = query ? { [paramName]: query } : {};
    if (addedState) {
      router.replace({ query: params });
    } else {
      addedState = true;
      router.push({ query: params });
    }
  }

  // Handle browser back/forward navigation
  const handlePopState = () => {
    const queryFromURL = getQueryParam(paramName);
    if (queryFromURL !== searchQuery.value) {
      searchQuery.value = queryFromURL
      if (emitSearch) {
        emitSearch(queryFromURL)
      }
    }
  }

  // Watch for changes to searchQuery and update URL
  watch(searchQuery, (newValue, oldValue) => {
    clearTimeout(searchTimeout)
    updateURL(oldValue, newValue)

    if (emitSearch && debounceMs > 0) {
      searchTimeout = setTimeout(() => {
        emitSearch(newValue ? newValue.trim() : '')
      }, debounceMs)
    } else if (emitSearch) {
      emitSearch(newValue ? newValue.trim() : '')
    }
  })

  // Clear search
  const clearSearch = () => {
    searchQuery.value = ''
  }

  // Set search programmatically
  const setSearch = (value) => {
    searchQuery.value = value || ''
  }

  // Initialize on mount
  onMounted(() => {
    // Restore search from URL
    const queryFromURL = getQueryParam(paramName)
    if (queryFromURL) {
      searchQuery.value = queryFromURL
      if (emitSearch) {
        emitSearch(queryFromURL)
      }
    }

    // Listen for browser navigation
    window.addEventListener('popstate', handlePopState)
  })

  onUnmounted(() => {
    window.removeEventListener('popstate', handlePopState)
    clearTimeout(searchTimeout)
  })

  return {
    searchQuery,
    clearSearch,
    setSearch,
    updateURL: (query) => updateURL(query)
  }
}
