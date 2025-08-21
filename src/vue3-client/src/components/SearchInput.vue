<template>
  <input type="text" v-bind="$attrs" class="form-control" :placeholder="placeholder" v-model="searchQuery" />
</template>

<script>
import { useSearchURL } from '@/router/urlSearchParams';

export default {
  name: 'SearchInput',
  setup() {
    const { searchQuery, clearSearch } = useSearchURL();
    return {
      searchQuery, clearSearch
    };
  },
  props: {
    placeholder: {
      type: String,
      default: 'Search'
    }
  },
  expose: ['searchQuery', 'clearSearch'],
};
</script>