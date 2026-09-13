import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface TourStop {
  id: string;
  stopName: string;
  lat: number;
  lng: number;
  triggerRadius: number;
  description: string;
  imageUrl: string;
  audioUrl?: string;
  arrivalOffsetMinutes?: number;
  durationMinutes?: number;
}

export interface TourTier {
  name: "Budget" | "Standard" | "Luxury";
  price: number;
  enabled: boolean;
  inclusions: string[];
}

export interface Tour {
  id: string;
  title: string;
  location: string;
  description: string;
  duration: string;
  rating: number;
  coverImage: string;
  tags: string[];
  stops: TourStop[];
  createdBy?: string;
  createdAt: string;
  price?: number;
  startLat?: number;
  startLng?: number;
  startName?: string;
  availableSeats?: number;
  tiers?: TourTier[];
  included?: string[];
  goodToKnow?: {
    difficulty?: string;
    startTime?: string;
    groupSize?: string;
    cancellation?: string;
    languages?: string;
  };
}

export interface Vehicle {
  id: string;
  name: string;
  type: "car" | "van" | "suv" | "minibus" | "bus" | "tuktuk" | "motorbike";
  capacity: number;
  pricePerDay: number;
  driverIncluded: boolean;
  driverName: string;
  driverPhone: string;
  acAvailable: boolean;
  photos: string[];
  description: string;
  plateNumber: string;
  isActive: boolean;
}

export interface Guide {
  id: string;
  name: string;
  languages: string[];
  pricePerDay: number;
  phone: string;
  photo: string;
  bio: string;
  yearsExperience: number;
  rating: number;
  isActive: boolean;
}

export interface TourBooking {
  id: string;
  tourId: string;
  tourTitle: string;
  vehicleId: string | Vehicle | null;
  vehicleName: string;
  guideId: string | Guide | null;
  guideName: string;
  travelDate: string;
  travelers: number;
  tourPrice: number;
  vehiclePrice: number;
  guidePrice: number;
  totalPrice: number;
  status: "confirmed" | "cancelled";
  dummyReference: string;
  tierName?: "Budget" | "Standard" | "Luxury";
  createdAt: string;
}

export interface Hotel {
  id: string;
  name: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  pricePerNight: number;
  rating: number;
  starRating: number;
  amenities: string[];
  photos: string[];
  contactInfo: { phone: string; email: string };
  totalRooms?: number;
  roomsPerType?: {
    standard: number;
    deluxe: number;
    suite: number;
  };
  roomTiers?: {
    tier: "standard" | "deluxe" | "suite";
    price: number;
    enabled: boolean;
  }[];
  facilities?: Facility[];
}

export interface Booking {
  id: string;
  hotelId: string;
  hotelName: string;
  checkInDate: string;
  checkOutDate: string;
  roomType: "standard" | "deluxe" | "suite";
  totalPrice: number;
  status: "confirmed" | "cancelled";
  dummyReference: string;
  createdAt: string;
  guests: number;
}

export interface WeatherState {
  temperature: number;
  weathercode: number;
  description: string;
  isAlert: boolean;
  windspeed: number;
  fetchedAt: string;
}

export interface NearbyPOI {
  id: number;
  lat: number;
  lon: number;
  name: string;
  category: string;
  distance: number;
}

export interface Facility {
  id: string;
  name: string;
  category: "wellness" | "dining" | "transport" | "recreation" | "business" | "general";
  icon: string;
  description: string;
  extraPrice: number;
  isActive: boolean;
}

export interface RoutePOI {
  name: string;
  category: "fuel" | "restaurant" | "cafe" | "hospital" | "atm" | "toilets" | "supermarket" | "parking" | "other";
  lat: number;
  lng: number;
  distanceFromStart: number;
}

export interface CustomTour {
  id: string;
  title: string;
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  waypoints: { name: string; lat: number; lng: number }[];
  transportMode: "driving" | "cycling" | "walking";
  routeSummary: { distanceMeters: number; durationSeconds: number };
  routePOIs: RoutePOI[];
  hotelPackage: {
    hotel: Hotel | string;
    selectedFacilities: Facility[] | string[];
    checkInDate?: string;
    checkOutDate?: string;
    roomType: "standard" | "deluxe" | "suite";
    guests: number;
  } | null;
  notes: string;
  travelDate?: string;
  status: "draft" | "planned" | "completed";
  createdAt: string;
}

interface DataState {
  tours: Tour[];
  hotels: Hotel[];
  bookings: Booking[];
  activeTourId: string | null;
  activeTourProgress: number;
  currentLocation: { lat: number; lng: number };
  nearbyHotels: Hotel[];
  weather: WeatherState | null;
  nearbyPOIs: NearbyPOI[];
  facilities: Facility[];
  customTours: CustomTour[];
  vehicles: Vehicle[];
  tourBookings: TourBooking[];
}

const initialState: DataState = {
  tours: [],
  hotels: [],
  bookings: [],
  activeTourId: null,
  activeTourProgress: 0,
  currentLocation: { lat: 7.8731, lng: 80.7718 },
  nearbyHotels: [],
  weather: null,
  nearbyPOIs: [],
  facilities: [],
  customTours: [],
  vehicles: [],
  tourBookings: [],
};

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    setTours: (state, action: PayloadAction<Tour[]>) => {
      state.tours = action.payload;
    },
    setHotels: (state, action: PayloadAction<Hotel[]>) => {
      state.hotels = action.payload;
    },
    addBooking: (state, action: PayloadAction<Booking>) => {
      state.bookings = [action.payload, ...state.bookings];
    },
    cancelBooking: (state, action: PayloadAction<string>) => {
      state.bookings = state.bookings.filter((x) => x.id !== action.payload);
    },
    setActiveTour: (state, action: PayloadAction<string | null>) => {
      state.activeTourId = action.payload;
      state.activeTourProgress = 0;
    },
    setActiveTourProgress: (state, action: PayloadAction<number>) => {
      state.activeTourProgress = action.payload;
    },
    setCurrentLocation: (state, action: PayloadAction<{ lat: number; lng: number }>) => {
      state.currentLocation = action.payload;
    },
    addTour: (state, action: PayloadAction<Tour>) => {
      state.tours = [action.payload, ...state.tours];
    },
    updateTour: (state, action: PayloadAction<Tour>) => {
      state.tours = state.tours.map((t) => (t.id === action.payload.id ? action.payload : t));
    },
    deleteTour: (state, action: PayloadAction<string>) => {
      state.tours = state.tours.filter((t) => t.id !== action.payload);
    },
    addHotel: (state, action: PayloadAction<Hotel>) => {
      state.hotels = [action.payload, ...state.hotels];
    },
    updateHotel: (state, action: PayloadAction<Hotel>) => {
      state.hotels = state.hotels.map((h) => (h.id === action.payload.id ? action.payload : h));
    },
    deleteHotel: (state, action: PayloadAction<string>) => {
      state.hotels = state.hotels.filter((h) => h.id !== action.payload);
    },
    setWeather: (state, action: PayloadAction<WeatherState>) => {
      state.weather = action.payload;
    },
    setNearbyPOIs: (state, action: PayloadAction<NearbyPOI[]>) => {
      state.nearbyPOIs = action.payload;
    },
    setFacilities: (state, action: PayloadAction<Facility[]>) => {
      state.facilities = action.payload;
    },
    addCustomTour: (state, action: PayloadAction<CustomTour>) => {
      state.customTours = [action.payload, ...state.customTours];
    },
    setCustomTours: (state, action: PayloadAction<CustomTour[]>) => {
      state.customTours = action.payload;
    },
    deleteCustomTour: (state, action: PayloadAction<string>) => {
      state.customTours = state.customTours.filter((t) => t.id !== action.payload);
    },
    setVehicles: (state, action: PayloadAction<Vehicle[]>) => {
      state.vehicles = action.payload;
    },
    addTourBooking: (state, action: PayloadAction<TourBooking>) => {
      state.tourBookings = [action.payload, ...state.tourBookings];
      const tour = state.tours.find(t => t.id === action.payload.tourId);
      if (tour && tour.availableSeats != null) {
        tour.availableSeats -= (action.payload.travelers || 1);
      }
    },
    setTourBookings: (state, action: PayloadAction<TourBooking[]>) => {
      state.tourBookings = action.payload;
    },
    cancelTourBooking: (state, action: PayloadAction<string>) => {
      const booking = state.tourBookings.find((x) => x.id === action.payload);
      if (booking) {
        const tour = state.tours.find(t => t.id === booking.tourId);
        if (tour && tour.availableSeats != null) {
          tour.availableSeats += (booking.travelers || 1);
        }
      }
      state.tourBookings = state.tourBookings.filter((x) => x.id !== action.payload);
    },
    clearUserData: (state) => {
      state.bookings = [];
      state.customTours = [];
      state.tourBookings = [];
      state.activeTourId = null;
      state.activeTourProgress = 0;
    },
  },
});

export const {
  setTours,
  setHotels,
  addBooking,
  cancelBooking,
  setActiveTour,
  setActiveTourProgress,
  setCurrentLocation,
  addTour,
  updateTour,
  deleteTour,
  addHotel,
  updateHotel,
  deleteHotel,
  setWeather,
  setNearbyPOIs,
  setFacilities,
  addCustomTour,
  setCustomTours,
  deleteCustomTour,
  setVehicles,
  addTourBooking,
  setTourBookings,
  cancelTourBooking,
  clearUserData,
} = dataSlice.actions;
export default dataSlice.reducer;
