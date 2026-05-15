import { useMemo, useState } from 'react';
import type { PopupSearchListResult } from '@/popup/types/popupUi';

type UseModalSearchListParams<T> = {
  filterList: (searchValue: string) => T[];
};

export const useModalSearchList = <T>({ filterList }: UseModalSearchListParams<T>): PopupSearchListResult<T> => {
  const [searchValue, setSearchValue] = useState('');

  const filteredList = useMemo(() => filterList(searchValue), [filterList, searchValue]);
  const isSearching = !!searchValue.trim();
  const isEmpty = isSearching && filteredList.length === 0;

  return {
    searchValue,
    setSearchValue,
    filteredList,
    isSearching,
    isEmpty,
  };
};

export default useModalSearchList;
