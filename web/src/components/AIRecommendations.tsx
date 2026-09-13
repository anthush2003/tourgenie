import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Star, Clock, MapPin, Sparkles, ChevronRight, Zap } from "lucide-react";
import { useAppSelector } from "../store";
import { resolveMediaUrl } from "../services/api";
import type { Tour, TourBooking } from "../store/slices/dataSlice";

function scoreToursForUser(
  tours: Tour[],
  tourBookings: TourBooking[],
  interests: string[],
  currentTourId?: string,
): { tour: Tour; reason: string; score: number }[] {
  const completedIds = new Set((tourBookings || []).map((b) => b.tourId));
  const tagFreq: Record<string, number> = {};

  tourBookings.forEach(({ tourId }) => {
    const t = tours.find((x) => x.id === tourId);
    if (!t) return;
    (t.tags || []).forEach((tag) => {
      tagFreq[tag] = (tagFreq[tag] || 0) + 5; // Flat score for booking
    });
  });

  interests.forEach((i) => {
    tagFreq[i] = (tagFreq[i] || 0) + 2; // Flat score for interest
  });

  return tours
    .filter((t) => t.id !== currentTourId && !completedIds.has(t.id))
    .map((t) => {
      let score = (t.rating || 0) * 2;
      let matchedTag = "";
      let highestTagWeight = 0;

      (t.tags || []).forEach((tag) => {
        const w = tagFreq[tag] || 0;
        if (w > highestTagWeight) {
          highestTagWeight = w;
          matchedTag = tag;
        }
      });
      
      score += highestTagWeight;

      let reason = "Popular with travellers like you";
      if (matchedTag && interests.includes(matchedTag)) {
        reason = `Because you like ${matchedTag}`;
      } else if (matchedTag) {
        reason = `Recommended for ${matchedTag} lovers`;
      } else if (t.rating >= 4.8) {
        reason = "Top-rated experience";
      }

      return { tour: t, reason, score };
    })
    .sort((a, b) => b.score - a.score);
}

function RecoCard({ tour, reason, index }: { tour: Tour; reason: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
    >
      <Link
        to={`/tours/${tour.id}`}
        className="group flex gap-4 p-4 rounded-3xl bg-sand-50 border border-sand-200 hover:border-leaf-600/30 hover:shadow-lg hover:shadow-ink-900/5 transition-all duration-300"
      >
        {}
        <div className="w-24 h-20 rounded-2xl overflow-hidden shrink-0">
          <img
            src={resolveMediaUrl(tour.coverImage)}
            alt={tour.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </div>

        {}
        <div className="flex-1 min-w-0">
          {}
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3 h-3 text-sunset-500 shrink-0" />
            <span className="text-[10px] text-sunset-600 font-semibold uppercase tracking-wider truncate">
              {reason}
            </span>
          </div>

          <h4 className="font-serif text-base text-ink-900 leading-tight line-clamp-2 mb-2 group-hover:text-leaf-700 transition-colors">
            {tour.title}
          </h4>

          <div className="flex items-center gap-3 text-xs text-ink-800/50">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-sunset-400 text-sunset-400" />
              {(tour.rating || 0).toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {tour.duration || "N/A"}
            </span>
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{(tour.location || "").split("·")[0].trim()}</span>
            </span>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-ink-800/25 group-hover:text-leaf-700 transition-colors mt-1 shrink-0" />
      </Link>
    </motion.div>
  );
}

interface AIRecommendationsProps {
  excludeTourId?: string;
  limit?: number;
  className?: string;
}

export default function AIRecommendations({
  excludeTourId,
  limit = 4,
  className = "",
}: AIRecommendationsProps) {
  const auth    = useAppSelector((s) => s.auth);
  const tours   = useAppSelector((s) => s.data.tours);
  const tourBookings = useAppSelector((s) => s.data.tourBookings);

  const interests = useMemo(
    () => auth.user?.preferences?.interests ?? [],
    [auth.user],
  );

  const scored = useMemo(
    () => scoreToursForUser(tours, tourBookings, interests, excludeTourId).slice(0, limit),
    [tours, tourBookings, interests, excludeTourId, limit],
  );

  if (tours.length === 0) return null;

  const hasPersonalisation = tourBookings.length > 0 || interests.length > 0;

  return (
    <section className={className}>
      {}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sunset-400/15 text-sunset-600 flex items-center justify-center">
            <Zap className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="font-serif text-xl text-ink-900">
              {hasPersonalisation ? "Recommended for You" : "Featured Tours"}
            </h2>
            <p className="text-xs text-ink-800/50 mt-0.5">
              {hasPersonalisation
                ? "Based on your interests & activity"
                : "Discover Sri Lanka's best experiences"}
            </p>
          </div>
        </div>
        <Link
          to="/tours"
          className="text-xs text-leaf-700 font-semibold hover:text-leaf-600 transition-colors flex items-center gap-1"
        >
          See all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {}
      <div className="grid gap-3 sm:grid-cols-2">
        {(scored || []).map(({ tour, reason }, i) => (
          <RecoCard key={tour.id} tour={tour} reason={reason} index={i} />
        ))}
      </div>

      {scored.length === 0 && (
        <div className="text-center py-10 rounded-[28px] bg-sand-100 border border-sand-200">
          <Sparkles className="w-10 h-10 mx-auto text-ink-800/20 mb-3" />
          <p className="text-ink-800/50 text-sm italic">
            Complete a tour to unlock personalised recommendations.
          </p>
        </div>
      )}
    </section>
  );
}
