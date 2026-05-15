import { useLocation } from 'react-router-dom';

export function useLocationState<T>() {
  const { state } = useLocation();
  return state as T;
}
