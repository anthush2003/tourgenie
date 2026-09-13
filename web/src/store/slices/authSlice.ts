import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Role = "guest" | "user" | "admin";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  preferences: {
    interests: string[];
    transportMode: "walking" | "cycling" | "driving";
    budget: "low" | "medium" | "high";
  };
  savedPlaces: {
    home: { lat: number; lng: number; address: string } | null;
    work: { lat: number; lng: number; address: string } | null;
  };
  savedTours: any[];
  savedHotels: any[];
  activityLog: { tourId: string; rating: number; completedAt: string }[];
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.loading = false;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
    },
    updateUser: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    logTourActivity: (
      state,
      action: PayloadAction<{ tourId: string; rating?: number }>,
    ) => {
      if (!state.user) return;

      const { tourId, rating = 4 } = action.payload;

      const filtered = state.user.activityLog.filter((a) => a.tourId !== tourId);

      state.user.activityLog = [
        { tourId, rating, completedAt: new Date().toISOString() },
        ...filtered,
      ].slice(0, 50); 
    },
  },
});

export const { loginSuccess, logout, updateUser, setLoading, logTourActivity } = authSlice.actions;
export default authSlice.reducer;