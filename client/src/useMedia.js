import { useEffect, useState } from 'react';

export function useMedia(queries, values, defaultValue) {
  const mediaQueryLists = queries.map(q => window.matchMedia(q));

  const getValue = () => {
    const index = mediaQueryLists.findIndex(mql => mql.matches);
    return typeof values[index] !== 'undefined' ? values[index] : defaultValue;
  };

  const [value, setValue] = useState(getValue);

  useEffect(
    () => {
      const handler = () => setValue(getValue);
      mediaQueryLists.forEach(mql => mql.addListener(handler));
      return () => mediaQueryLists.forEach(mql => mql.removeListener(handler));
    },
    // Only run on mount and unmount.  The event listener added above will
    // keep the returned value updated.
    //
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return value;
}

export function useMediaGrouping(
  queries,
  values,
  defaultValue,
  itemsToGroup,
) {
  const perGroup = useMedia(queries, values, defaultValue);
  const groupedItems = [];
  for (let i = 0; i < itemsToGroup.length; i = i + perGroup) {
    const group = itemsToGroup.slice(i, i + perGroup);
    groupedItems.push(group);
  }
  return { groupedItems, perGroup };
}

export default useMedia;
