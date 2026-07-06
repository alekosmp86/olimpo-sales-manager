import { useState, useMemo } from "react";

export function useFilter<T>(
  items: T[],
  searchFn: (item: T, query: string) => boolean
) {
  const [filter, setFilter] = useState("");

  const filteredItems = useMemo(() => {
    if (!filter.trim()) return items;
    return items.filter((item) => searchFn(item, filter));
  }, [items, filter, searchFn]);

  return {
    filter,
    setFilter,
    filteredItems,
  };
}
