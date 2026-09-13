import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { User, Home, Building2, MapPin, Sparkles, LogOut, Settings, X, Car, Bike, Footprints, DollarSign, Route, Navigation, Trash2, ChevronRight, Calendar, Edit2, Check, Loader2, Compass } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store";
import { logout, updateUser } from "../store/slices/authSlice";
import { api, resolveMediaUrl } from "../services/api";
import type { Booking } from "../store/slices/dataSlice";
import { deleteCustomTour, cancelBooking, cancelTourBooking, setTourBookings, clearUserData } from "../store/slices/dataSlice";

export default function ProfilePage() {
  const auth = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const tours = useAppSelector((state) => state.data.tours);

  const availableInterests = useMemo(() => {
    const tags = new Set<string>();
    tours.forEach((t) => {
      if (t.tags && Array.isArray(t.tags)) {
        t.tags.forEach((tag) => tags.add(tag.trim()));
      }
    });
    const defaultTags = ["Heritage", "Nature", "Beach", "Wildlife", "Food", "Culture", "Adventure"];
    defaultTags.forEach((t) => tags.add(t));
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [tours]);

  const [activeTab, setActiveTab] = useState<"profile" | "trips" | "places">("profile");

  const reduxBookings = useAppSelector((s) => s.data.bookings);
  const tourBookings = useAppSelector((s) => s.data.tourBookings);
  const activeTour = useAppSelector((s) => s.data.tours.find((t) => t.id === s.data.activeTourId));
  const customTours = useAppSelector((s) => s.data.customTours);
  const progress = useAppSelector((s) => s.data.activeTourProgress);

  const [apiBookings, setApiBookings] = useState<Booking[] | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  
  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: auth.user?.name || "",
    email: auth.user?.email || "",
    preferences: auth.user?.preferences || {
      interests: [],
      transportMode: "driving",
      budget: "medium"
    }
  });

  useEffect(() => {
    if (auth.user) {
      setEditForm({
        name: auth.user.name,
        email: auth.user.email,
        preferences: auth.user.preferences
      });
    }
  }, [auth.user]);

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const fetchBookings = async () => {
      try {
        const data = await api.getUserBookings();
        if (Array.isArray(data)) {
          setApiBookings(
            data.map((b: any) => ({
              id: b.id || b._id,
              hotelId: b.hotelId,
              hotelName: b.hotelName || "",
              checkInDate: b.checkInDate,
              checkOutDate: b.checkOutDate,
              roomType: b.roomType,
              totalPrice: b.totalPrice,
              status: b.status,
              dummyReference: b.dummyReference,
              createdAt: b.createdAt,
              guests: b.guests || 1,
            }))
          );
        }
      } catch (_err) {
      }
    };

    fetchBookings();
  }, [auth.isAuthenticated]);

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    api.getUserTourBookings()
      .then((data) => {
        if (Array.isArray(data)) {
          dispatch(setTourBookings(data.map((b: any) => ({
            id: b.id || b._id,
            tourId: b.tourId,
            tourTitle: b.tourTitle || "",
            vehicleId: b.vehicleId,
            vehicleName: b.vehicleName || "",
            guideId: b.guideId,
            guideName: b.guideName || "",
            travelDate: b.travelDate,
            travelers: b.travelers || 1,
            tourPrice: b.tourPrice,
            vehiclePrice: b.vehiclePrice,
            guidePrice: b.guidePrice || 0,
            totalPrice: b.totalPrice,
            status: b.status,
            dummyReference: b.dummyReference,
            createdAt: b.createdAt,
          }))));
        }
      })
      .catch(() => { });
  }, [auth.isAuthenticated, dispatch]);

  const bookings = apiBookings ?? reduxBookings;

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const handleCancelBooking = async (id: string) => {
    if (!window.confirm("Cancel this booking? This can't be undone.")) return;
    setCancellingId(id);
    try {
      await api.cancelBooking(id);
      dispatch(cancelBooking(id));
      setApiBookings((prev) =>
        prev ? prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)) : prev
      );
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleCancelTourBooking = async (id: string) => {
    if (!window.confirm("Cancel this tour booking? This can't be undone.")) return;
    setCancellingId(id);
    try {
      await api.cancelTourBooking(id);
      dispatch(cancelTourBooking(id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to cancel tour booking.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    dispatch(logout());
    dispatch(clearUserData());
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    setPasswordLoading(true);
    setPasswordMessage('');
    try {
      await (api as any).changePassword({ currentPassword, newPassword });
      setPasswordMessage('Password successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordMessage(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!auth.user) return;
    setIsSaving(true);
    try {
      const updates = {
        name: editForm.name,
        email: editForm.email,
        preferences: editForm.preferences
      };
      await api.updateUser(updates);
      dispatch(updateUser(updates));
      setIsEditing(false);
    } catch (err: any) {
      console.error("Failed to update user on backend:", err);
      window.alert(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!auth.isAuthenticated || !auth.user) {
    return (
      <div className="pt-32 pb-20 px-5 md:px-8 max-w-7xl mx-auto min-h-screen text-center">
        <h1 className="font-serif text-4xl text-ink-900 mb-4">Please log in</h1>
        <p className="text-ink-800/60 mb-8">You need to be logged in to view your profile.</p>
        <Link to="/" className="inline-flex items-center justify-center px-6 py-3 bg-leaf-700 text-sand-50 rounded-full font-semibold">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 px-5 md:px-8 max-w-7xl mx-auto min-h-screen space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] bg-linear-to-r from-ink-900 via-ink-800 to-leaf-900 p-8 md:p-12 text-sand-50"
      >
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(/images/hero-sigiriya.jpg)", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-sunset-400/30 blur-3xl" />

        <div className="relative flex flex-col md:flex-row items-start gap-6">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-sand-50 text-ink-900 flex items-center justify-center font-serif text-5xl shadow-xl">
            {auth.user!.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="text-xs tracking-[0.3em] uppercase text-sand-50/80 mb-1">TourGenie · {auth.user.role === "admin" ? "Admin" : "Explorer"}</div>
            <h1 className="font-serif text-4xl md:text-5xl mb-2 leading-tight">Welcome back, {auth.user!.name.split(" ")[0]}.</h1>
            <p className="text-sand-50/80 max-w-2xl">Your AI travel companion knows your taste for {auth.user.preferences.interests.join(", ").toLowerCase() || "exploration"} — let's find you more of it.</p>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-2 px-5 py-3 rounded-full bg-sand-50/20 text-sand-50 text-sm font-semibold hover:bg-sand-50/30 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {([
          ["profile", "Profile & Preferences", Settings],
          ["trips", "My Trips", Sparkles],
          ["places", "Saved Places", MapPin],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${activeTab === key
                ? "bg-ink-900 text-sand-50 shadow-lg shadow-ink-900/20"
                : "bg-sand-100 text-ink-800 hover:bg-sand-200 border border-sand-200"
              }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <motion.div key="p" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          
          {/* Profile Header Actions */}
          <div className="flex justify-end mb-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-leaf-700 text-sand-50 rounded-full font-semibold hover:bg-leaf-800 transition-colors shadow-md shadow-leaf-700/20"
              >
                <Edit2 className="w-4 h-4" /> Edit Profile Details
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm({
                      name: auth.user!.name,
                      email: auth.user!.email,
                      preferences: auth.user!.preferences
                    });
                  }}
                  className="px-5 py-2.5 rounded-full font-semibold text-ink-800 hover:bg-sand-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-ink-900 text-sand-50 rounded-full font-semibold hover:bg-ink-800 transition-colors shadow-md shadow-ink-900/20 disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 md:p-8 rounded-[28px] bg-sand-100 border border-sand-200 relative overflow-hidden">
              {isEditing && <div className="absolute top-0 right-0 left-0 h-1 bg-linear-to-r from-leaf-500 to-leaf-700" />}
              <h2 className="font-serif text-2xl text-ink-900 mb-6">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs tracking-widest uppercase text-ink-800/60 font-semibold block mb-1.5">Name</label>
                  <input
                    value={isEditing ? editForm.name : auth.user!.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 rounded-2xl border text-sm transition-all ${
                      isEditing 
                        ? "bg-sand-50 border-leaf-600 focus:outline-none ring-2 ring-leaf-600/20 shadow-sm" 
                        : "bg-transparent border-transparent text-ink-900 font-medium"
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs tracking-widest uppercase text-ink-800/60 font-semibold block mb-1.5">Email</label>
                  <input
                    value={isEditing ? editForm.email : auth.user!.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 rounded-2xl border text-sm transition-all ${
                      isEditing 
                        ? "bg-sand-50 border-leaf-600 focus:outline-none ring-2 ring-leaf-600/20 shadow-sm" 
                        : "bg-transparent border-transparent text-ink-900 font-medium"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 rounded-[28px] bg-sand-100 border border-sand-200 relative overflow-hidden">
              {isEditing && <div className="absolute top-0 right-0 left-0 h-1 bg-linear-to-r from-leaf-500 to-leaf-700" />}
              <h2 className="font-serif text-2xl text-ink-900 mb-6">Travel Preferences</h2>
              <div className="space-y-4">
                <div className={!isEditing ? "opacity-80 pointer-events-none" : ""}>
                  <label className="text-xs tracking-widest uppercase text-ink-800/60 font-semibold block mb-2">Interests</label>
                  <div className="flex flex-wrap gap-2">
                    {availableInterests.map((interest) => {
                      const active = isEditing 
                        ? editForm.preferences.interests.includes(interest)
                        : auth.user?.preferences.interests.includes(interest);
                        
                      return (
                        <button
                          key={interest}
                          onClick={() => {
                            if (!isEditing) return;
                            const interests = editForm.preferences.interests;
                            const next = active ? interests.filter((i) => i !== interest) : [...interests, interest];
                            setEditForm({ ...editForm, preferences: { ...editForm.preferences, interests: next } });
                          }}
                          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${active ? "bg-leaf-700 text-sand-50 shadow-sm" : "bg-sand-50 text-ink-800 border border-sand-200 hover:border-ink-900/20"
                            }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className={!isEditing ? "opacity-80 pointer-events-none" : ""}>
                  <label className="text-xs tracking-widest uppercase text-ink-800/60 font-semibold block mb-2">Transport Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([["walking", "Walk", Footprints], ["cycling", "Bike", Bike], ["driving", "Drive", Car]] as const).map(([k, l, Icon]) => {
                      const active = isEditing 
                        ? editForm.preferences.transportMode === k
                        : auth.user?.preferences.transportMode === k;
                      return (
                        <button
                          key={k}
                          onClick={() => {
                            if (!isEditing) return;
                            setEditForm({ ...editForm, preferences: { ...editForm.preferences, transportMode: k } });
                          }}
                          className={`p-3 rounded-2xl border-2 transition-all ${active
                              ? "border-leaf-700 bg-leaf-700/5 shadow-sm"
                              : "border-sand-200 bg-sand-50 hover:border-ink-900/20"
                            }`}
                        >
                          <Icon className={`w-5 h-5 mx-auto mb-1.5 ${active ? "text-leaf-700" : ""}`} />
                          <span className="text-xs font-semibold">{l}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className={!isEditing ? "opacity-80 pointer-events-none" : ""}>
                  <label className="text-xs tracking-widest uppercase text-ink-800/60 font-semibold block mb-2">Budget</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([["low", "Budget"], ["medium", "Mid-range"], ["high", "Luxury"]] as const).map(([k, l]) => {
                      const active = isEditing 
                        ? editForm.preferences.budget === k
                        : auth.user?.preferences.budget === k;
                      return (
                        <button
                          key={k}
                          onClick={() => {
                            if (!isEditing) return;
                            setEditForm({ ...editForm, preferences: { ...editForm.preferences, budget: k } });
                          }}
                          className={`p-3 rounded-2xl border-2 transition-all ${active
                              ? "border-leaf-700 bg-leaf-700/5 shadow-sm"
                              : "border-sand-200 bg-sand-50 hover:border-ink-900/20"
                            }`}
                        >
                          <DollarSign className={`w-4 h-4 mx-auto mb-1 ${active ? "text-leaf-700" : "text-ink-800/40"}`} />
                          <span className="text-xs font-semibold">{l}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 rounded-[28px] bg-sand-100 border border-sand-200 relative overflow-hidden md:col-span-2">
              <h2 className="font-serif text-2xl text-ink-900 mb-6">Security & Password</h2>
              <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                <div>
                  <label className="text-xs tracking-widest uppercase text-ink-800/60 font-semibold block mb-1.5">Current Password</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full px-4 py-3 rounded-2xl border text-sm transition-all bg-sand-50 border-sand-300 focus:outline-none focus:border-leaf-600 focus:ring-2 focus:ring-leaf-600/20" />
                </div>
                <div>
                  <label className="text-xs tracking-widest uppercase text-ink-800/60 font-semibold block mb-1.5">New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className="w-full px-4 py-3 rounded-2xl border text-sm transition-all bg-sand-50 border-sand-300 focus:outline-none focus:border-leaf-600 focus:ring-2 focus:ring-leaf-600/20" />
                </div>
                {passwordMessage && (
                  <p className="text-sm">{passwordMessage}</p>
                )}
                <button type="submit" disabled={passwordLoading} className="px-6 py-2.5 bg-ink-900 text-sand-50 rounded-full font-semibold hover:bg-ink-800 transition-colors shadow-md disabled:opacity-70 flex items-center gap-2">
                  {passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Change Password
                </button>
              </form>
            </div>

            {auth.user.role === "admin" && (
              <div className="p-6 md:p-8 rounded-[28px] bg-linear-to-br from-ink-900 to-leaf-700 text-sand-50 md:col-span-2 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full glow-sunset opacity-60" />
                <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                  <div>
                    <span className="text-xs tracking-[0.3em] uppercase text-sunset-300 mb-2 block">Elevated Access</span>
                    <h3 className="font-serif text-3xl mb-2">Admin Dashboard</h3>
                    <p className="text-sand-50/70 max-w-xl text-sm">Manage tours, hotels, POIs, and view platform analytics. Full CRUD control over the entire TourGenie experience.</p>
                  </div>
                  <Link to="/admin" className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-sand-50 text-ink-900 text-sm font-semibold hover:bg-sunset-400 transition-colors">
                    <Settings className="w-4 h-4" /> Open Admin Panel →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === "trips" && (
        <motion.div key="t" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {activeTour && (
            <div className="p-6 rounded-[28px] bg-sunset-500/10 border-2 border-sunset-500/30 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
              <div>
                <span className="text-xs text-sunset-600 font-semibold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5" /> Active Journey
                </span>
                <h3 className="font-serif text-2xl text-ink-900 mb-1">{activeTour.title}</h3>
                <p className="text-sm text-ink-800/60">Stop {progress} • Next: {activeTour.stops[progress - 1]?.stopName || 'Your journey awaits'}</p>
              </div>
              <Link to={`/tours/${activeTour.id}`} className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-sunset-500 text-sand-50 font-semibold hover:bg-sunset-600 transition-colors whitespace-nowrap">
                Resume Tour <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
          
          <h2 className="font-serif text-2xl text-ink-900 mb-4 pt-4">Your Tour Bookings</h2>
          {tourBookings.length === 0 ? (
            <div className="p-8 text-center bg-sand-100 rounded-[28px] border border-sand-200">
              <Compass className="w-12 h-12 text-ink-800/20 mx-auto mb-3" />
              <p className="text-ink-800/60 font-medium mb-4">No tour bookings yet.</p>
              <Link to="/tours" className="inline-flex items-center gap-2 text-leaf-700 font-semibold hover:underline">
                Explore Tours <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {tourBookings.map((b) => (
                <div key={b.id} className="p-5 md:p-6 bg-sand-50 rounded-3xl border border-sand-200 shadow-sm flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-leaf-700/10 text-leaf-700 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-serif text-xl text-ink-900 mb-1">{b.tourTitle}</h4>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-ink-800/60">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(b.travelDate).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {b.travelers} Travelers</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <button className="flex-1 md:flex-none px-4 py-2.5 rounded-xl font-semibold text-sm bg-leaf-700/10 text-leaf-700 hover:bg-leaf-700/20 transition-colors" onClick={() => window.alert("Downloading your PDF Voucher...")}>
                      Download Voucher
                    </button>
                    {b.status !== "cancelled" && (
                      <button
                        onClick={() => handleCancelTourBooking(b.id)}
                        disabled={cancellingId === b.id}
                        className="p-2.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 border border-red-200"
                        title="Cancel Booking"
                      >
                        {cancellingId === b.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="font-serif text-2xl text-ink-900 mb-4 pt-4">Your Custom Itineraries</h2>
          {customTours.length === 0 ? (
            <div className="p-8 text-center bg-sand-100 rounded-[28px] border border-sand-200">
              <Route className="w-12 h-12 text-ink-800/20 mx-auto mb-3" />
              <p className="text-ink-800/60 font-medium mb-4">No custom tours created yet.</p>
              <Link to="/create-tour" className="inline-flex items-center gap-2 text-leaf-700 font-semibold hover:underline">
                Design a Tour <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {customTours.map((t) => (
                <div key={t.id} className="p-5 bg-sand-50 rounded-3xl border border-sand-200 hover:border-sand-300 transition-all flex flex-col justify-between">
                  <div>
                    <h4 className="font-serif text-xl text-ink-900 mb-2 line-clamp-1">{t.title}</h4>
                    <p className="text-sm text-ink-800/60 mb-4 line-clamp-2">{t.notes || t.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                      {t.waypoints.slice(0, 2).map((wp, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-sand-100 rounded-md border border-sand-200 text-ink-800/80">
                          {wp.name || `Stop ${i + 1}`}
                        </span>
                      ))}
                      {t.waypoints.length > 2 && (
                        <span className="text-xs px-2 py-1 bg-sand-100 rounded-md border border-sand-200 text-ink-800/80">
                          +{t.waypoints.length - 2} more stops
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/tours/${t.id}`} className="flex-1 py-2 text-center rounded-xl bg-leaf-700/10 text-leaf-700 font-semibold text-sm hover:bg-leaf-700/20 transition-colors">
                      View Itinerary
                    </Link>
                    <button
                      onClick={() => dispatch(deleteCustomTour(t.id))}
                      className="p-2 rounded-xl text-ink-800/40 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="font-serif text-2xl text-ink-900 mb-4 pt-4">Your Hotel Bookings</h2>
          {bookings.length === 0 ? (
            <div className="p-8 text-center bg-sand-100 rounded-[28px] border border-sand-200">
              <Building2 className="w-12 h-12 text-ink-800/20 mx-auto mb-3" />
              <p className="text-ink-800/60 font-medium mb-4">No hotel bookings yet.</p>
              <Link to="/hotels" className="inline-flex items-center gap-2 text-leaf-700 font-semibold hover:underline">
                Find a Hotel <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {(bookings || []).map((b) => (
                <div key={b.id} className="p-5 md:p-6 bg-sand-50 rounded-3xl border border-sand-200 shadow-sm flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-leaf-700/10 text-leaf-700 flex items-center justify-center shrink-0">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-serif text-xl text-ink-900 mb-1">{b.hotelName}</h4>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-ink-800/60">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(b.checkInDate).toLocaleDateString()} - {new Date(b.checkOutDate).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {b.guests} Guests</span>
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sand-200/50">{b.roomType}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <div className="flex-1 md:flex-none text-right">
                      <div className="text-sm text-ink-800/60">Total</div>
                      <div className="font-serif text-xl text-ink-900">LKR {b.totalPrice.toLocaleString()}</div>
                    </div>
                    {b.status !== "cancelled" && (
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        disabled={cancellingId === b.id}
                        className="p-2.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 border border-red-200"
                        title="Cancel Booking"
                      >
                        {cancellingId === b.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                      </button>
                    )}
                    {b.status === "cancelled" && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">Cancelled</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === "places" && (
        <motion.div key="pl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {(!auth.user?.savedTours?.length && !auth.user?.savedHotels?.length) ? (
            <div className="p-8 text-center bg-sand-100 rounded-[28px] border border-sand-200">
              <MapPin className="w-12 h-12 text-ink-800/20 mx-auto mb-3" />
              <h3 className="font-serif text-xl text-ink-900 mb-2">No Saved Places Yet</h3>
              <p className="text-ink-800/60 max-w-md mx-auto">Places you bookmark during your tours will appear here for easy access later.</p>
            </div>
          ) : (
            <>
              {auth.user?.savedTours?.length > 0 && (
                <div>
                  <h3 className="font-serif text-2xl text-ink-900 mb-4 flex items-center gap-2">
                    <Compass className="w-5 h-5 text-sunset-500" /> Saved Tours
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {auth.user.savedTours.map((t: any) => (
                      <div key={t.id || t._id} className="group relative bg-sand-50 rounded-3xl border border-sand-200 overflow-hidden flex items-center gap-4 p-3 pr-5 hover:border-sand-300 transition-all">
                        <img src={resolveMediaUrl(t.coverImage || t.photos?.[0])} alt={t.title} className="w-20 h-20 rounded-2xl object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif text-lg text-ink-900 mb-1 truncate">{t.title}</h4>
                          <p className="text-xs text-ink-800/60 truncate">{t.location?.city || "Sri Lanka"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link to={`/tours/${t.id || t._id}`} className="p-2 rounded-full bg-leaf-700/10 text-leaf-700 hover:bg-leaf-700/20">
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={async () => {
                              try {
                                const res = await api.toggleSavedPlace('tour', t.id || t._id);
                                dispatch(updateUser({ savedTours: res.user.savedTours as any[] }));
                              } catch (err) {}
                            }}
                            className="p-2 rounded-full text-red-600/60 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {auth.user?.savedHotels?.length > 0 && (
                <div>
                  <h3 className="font-serif text-2xl text-ink-900 mb-4 mt-6 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-sunset-500" /> Saved Hotels
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {auth.user.savedHotels.map((h: any) => (
                      <div key={h.id || h._id} className="group relative bg-sand-50 rounded-3xl border border-sand-200 overflow-hidden flex items-center gap-4 p-3 pr-5 hover:border-sand-300 transition-all">
                        <img src={resolveMediaUrl(h.coverImage || h.photos?.[0])} alt={h.name} className="w-20 h-20 rounded-2xl object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif text-lg text-ink-900 mb-1 truncate">{h.name}</h4>
                          <p className="text-xs text-ink-800/60 truncate">{h.location?.address || h.location?.city}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link to={`/hotels/${h.id || h._id}`} className="p-2 rounded-full bg-leaf-700/10 text-leaf-700 hover:bg-leaf-700/20">
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={async () => {
                              try {
                                const res = await api.toggleSavedPlace('hotel', h.id || h._id);
                                dispatch(updateUser({ savedHotels: res.user.savedHotels as any[] }));
                              } catch (err) {}
                            }}
                            className="p-2 rounded-full text-red-600/60 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}

