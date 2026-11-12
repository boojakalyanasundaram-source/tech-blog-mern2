import { useEffect, useState } from 'react';
import { api } from '../api';

export function useFetch(path) {
  const [state, setState] = useState({ data: null, loading: !!path, error: null });

  useEffect(() => {
    if (!path) return undefined;
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .get(path, { signal: controller.signal })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ data: null, loading: false, error });
      });
    return () => controller.abort();
  }, [path]);

  return state;
}

let categoryCache = null;
export function useCategories() {
  const [categories, setCategories] = useState(categoryCache || []);
  useEffect(() => {
    if (categoryCache) return;
    api.get('/categories').then((data) => {
      categoryCache = data;
      setCategories(data);
    }).catch(() => {});
  }, []);
  return categories;
}
