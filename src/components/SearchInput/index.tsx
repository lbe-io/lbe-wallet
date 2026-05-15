import React, { useCallback } from 'react';
import { Input } from 'antd';
import { debounce } from 'debounce';
import { AppIcon } from '@/assets/icon';
import './index.css';

type SearchInputProps = {
  placeholder: string;
  onSearchChange: (value: string) => void;
};

const SearchInput: React.FC<SearchInputProps> = ({ placeholder, onSearchChange }) => {
  const debouncedOnSearchChange = useCallback(
    debounce((value: string) => {
      onSearchChange(value);
    }, 300),
    [onSearchChange],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedOnSearchChange(e.target.value);
  };

  return <Input placeholder={placeholder} prefix={<AppIcon name="SearchIcon" />} className="search-input" variant="filled" onChange={handleChange} />;
};

export default SearchInput;
