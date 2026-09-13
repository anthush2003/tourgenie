import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import authReducer from "./slices/authSlice";
import dataReducer from "./slices/dataSlice";

const PERSIST_KEY = "tourgenie_state_v1";

function loadState() {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw) as { auth: any; data: any };
  } catch {
    return undefined;
  }
}

const persistedState = loadState();

const store = configureStore({
  reducer: {
    auth: authReducer,
    data: dataReducer,
  },
  preloadedState: persistedState
    ? {
        auth: persistedState.auth,
        data: {
          tours: [],
          hotels: [],
          nearbyPOIs: [],
          weather: null,
          nearbyHotels: [],
          vehicles: [],
          bookings:             persistedState.data?.bookings            ?? [],
          activeTourId:         persistedState.data?.activeTourId        ?? null,
          activeTourProgress:   persistedState.data?.activeTourProgress  ?? 0,
          currentLocation:      persistedState.data?.currentLocation     ?? { lat: 7.8731, lng: 80.7718 },
          facilities:           persistedState.data?.facilities          ?? [],
          customTours:          persistedState.data?.customTours         ?? [],
          tourBookings:         persistedState.data?.tourBookings         ?? [],
        },
      }
    : undefined,
});

const PERSIST_INTERVAL_MS = 4000;
let lastPersistAt = 0;
let pendingPersistTimer: ReturnType<typeof setTimeout> | null = null;

function persistNow() {
  try {
    const state = store.getState();
    localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        auth: state.auth,
        data: {
          bookings:           state.data.bookings,
          activeTourId:       state.data.activeTourId,
          activeTourProgress: state.data.activeTourProgress,
          currentLocation:    state.data.currentLocation,
          facilities:         state.data.facilities,
          customTours:        state.data.customTours,
          tourBookings:       state.data.tourBookings,
        },
      })
    );
  } catch {
  }
  lastPersistAt = Date.now();
}

store.subscribe(() => {
  const now = Date.now();
  const elapsed = now - lastPersistAt;

  if (elapsed >= PERSIST_INTERVAL_MS) {
    if (pendingPersistTimer) {
      clearTimeout(pendingPersistTimer);
      pendingPersistTimer = null;
    }
    persistNow();
    return;
  }

  if (!pendingPersistTimer) {
    pendingPersistTimer = setTimeout(() => {
      pendingPersistTimer = null;
      persistNow();
    }, PERSIST_INTERVAL_MS - elapsed);
  }
});

if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      if (pendingPersistTimer) {
        clearTimeout(pendingPersistTimer);
        pendingPersistTimer = null;
      }
      persistNow();
    }
  });
  window.addEventListener("pagehide", () => persistNow());
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
