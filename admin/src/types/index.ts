export interface Tour {
    _id?: string;
    id?: string;
    title: string;
    location: string;
    description: string;
    duration: string;
    rating: number;
    coverImage: string;
    photos?: string[];
    tags: string[];
    stops: TourStop[];
    price?: number;
    startLat?: number;
    startLng?: number;
    startName?: string;
    included?: string[];
    goodToKnow?: {
        difficulty?: string;
        startTime?: string;
        groupSize?: string;
        cancellation?: string;
        languages?: string;
    };
    tiers?: TourTier[];
}

export interface TourTier {
    name: "Budget" | "Standard" | "Luxury";
    price: number;
    enabled: boolean;
    inclusions: string[];
}

export interface TourStop {
    _id?: string;
    stopName: string;
    lat: number;
    lng: number;
    triggerRadius: number;
    description: string;
    imageUrl: string;
    arrivalOffsetMinutes?: number;
    durationMinutes?: number;
}

export interface Vehicle {
    _id?: string;
    id?: string;
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
    _id?: string;
    id?: string;
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
    _id?: string;
    id?: string;
    userId: { _id: string; name: string; email: string } | string;
    tourId: { _id: string; title: string; location: string } | string;
    tourTitle: string;
    vehicleId: Vehicle | string | null;
    vehicleName: string;
    guideId: Guide | string | null;
    guideName: string;
    travelDate: string;
    travelers: number;
    tourPrice: number;
    vehiclePrice: number;
    guidePrice: number;
    totalPrice: number;
    status: "confirmed" | "cancelled";
    dummyReference: string;
    createdAt: string;
}

export interface Hotel {
    _id?: string;
    id?: string;
    name: string;
    location: string;
    description: string;
    lat: number;
    lng: number;
    pricePerNight: number;
    rating: number;
    starRating: number;
    amenities: string[];
    photos: string[];
    contactInfo: { phone: string; email: string };
    facilities?: (Facility | string)[];
    roomsPerType?: { standard: number; deluxe: number; suite: number };
    roomTiers?: { tier: 'standard' | 'deluxe' | 'suite'; price: number; enabled: boolean }[];
}

export interface Facility {
    _id?: string;
    id?: string;
    name: string;
    category: "wellness" | "dining" | "transport" | "recreation" | "business" | "general";
    icon: string;
    description: string;
    extraPrice: number;
    isActive: boolean;
}

export interface Booking {
      _id: string;
      id?: string;
      userId: { _id: string; name: string; email: string } | string | undefined;
      hotelId: { _id: string; name: string; location: string } | string;
      checkInDate: string;
      checkOutDate: string;
      roomType: "standard" | "deluxe" | "suite";
      totalPrice: number;
      guests: number;
      numberOfRooms?: number;
      status: "confirmed" | "cancelled";
      dummyReference: string;
      createdAt: string;
      walkinGuestName?: string;
      walkinGuestPhone?: string;
  }

export interface User {
      _id: string;
      id?: string;
      name: string;
      email: string;
      role: "user" | "admin" | "receptionist";
      status?: "active" | "deactivated";
      createdAt: string;
      preferences?: { budget?: string; transportMode?: string; interests?: string[] };
      allocatedHotel?: string;
  }

export interface Analytics {
    totalUsers: number;
    totalTours: number;
    totalHotels: number;
    totalBookings: number;
    activeBookings: number;
    cancelledBookings: number;
    totalCustomTours?: number;
    totalRevenue: number;
    totalVehicles?: number;
    totalTourBookings?: number;
    hotelRevenue?: number;
    tourRevenue?: number;
    bookingsByMonth: { _id: { year: number; month: number }; count: number; revenue: number }[];
    topHotels: { name: string; count: number; revenue: number }[];
    roomTypeStats: { _id: string; count: number }[];
}

export interface FullReport {
    generatedAt: string;
    range: { from: string | null; to: string | null };
    totals: {
        totalUsers: number; totalTours: number; totalHotels: number;
        totalVehicles: number; activeVehicles: number;
        totalHotelBookings: number; totalTourBookings: number;
        totalIncome: number; hotelIncome: number; tourIncome: number;
        };
    vehicleAllocation: { _id: string; vehicleName: string; vehicleType: string; bookingsCount: number; revenue: number }[];
    vehicles: Vehicle[];
    hotelBookings: Booking[];
    tourBookings: TourBooking[];
}

export type PickMode = "start" | number;
