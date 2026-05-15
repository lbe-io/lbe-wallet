import { configureStore } from '@reduxjs/toolkit';
import { save, load } from 'redux-localstorage-simple';
import applicationReducer from './features/applicationSlice';

const PERSISTED_KEYS: string[] = ['application'];

const store = configureStore({
  reducer: {
    application: applicationReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat([save({ states: PERSISTED_KEYS, disableWarnings: true })]),
  preloadedState: load({ states: PERSISTED_KEYS, disableWarnings: true }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
