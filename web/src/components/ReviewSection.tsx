import { useState, useEffect } from "react";
import { Star, MessageSquare, Loader2, User } from "lucide-react";
import { useAppSelector } from "../store";
import { api } from "../services/api";

interface Review {
  _id: string;
  user: { _id: string; name: string };
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewSectionProps {
  targetType: "Tour" | "Hotel";
  targetId: string;
}

export default function ReviewSection({ targetType, targetId }: ReviewSectionProps) {
  const auth = useAppSelector((s: any) => s.auth);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [targetId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await api.getReviews(targetType, targetId) as { data: Review[] };
      setReviews(response.data || []);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const newReview = await api.createReview({
        targetType,
        targetId,
        rating,
        comment: comment.trim()
      }) as Review;
      
      setReviews([newReview, ...reviews]);
      setComment("");
      setRating(5);
    } catch (err: any) {
      setError(err.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await api.deleteReview(reviewId);
      setReviews(reviews.filter((r) => r._id !== reviewId));
    } catch (err: any) {
      alert(err.message || "Failed to delete review");
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="w-8 h-8 text-leaf-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-6 h-6 text-leaf-700" />
        <h3 className="font-serif text-2xl text-ink-900">Reviews & Comments</h3>
      </div>

      {/* Review Form */}
      <div className="bg-sand-50 rounded-3xl p-6 md:p-8 border border-sand-200">
        {!auth.isAuthenticated ? (
          <div className="text-center py-6">
            <h4 className="font-serif text-xl mb-2 text-ink-900">Have you been here?</h4>
            <p className="text-ink-800/60 mb-6">Log in to leave a review and share your experience with others.</p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { mode: "login" } }))}
              className="px-6 py-2.5 bg-leaf-700 text-sand-50 rounded-full font-semibold hover:bg-leaf-800 transition-colors"
            >
              Log In to Review
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="font-semibold text-ink-900 mb-2">Leave a Review</h4>
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
                {error}
              </div>
            )}
            
            <div>
              <label className="text-xs uppercase tracking-widest text-ink-800/60 font-semibold block mb-2">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform focus:outline-none"
                  >
                    <Star className={`w-8 h-8 ${star <= rating ? "fill-sunset-400 text-sunset-400" : "fill-sand-200 text-sand-200"}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-ink-800/60 font-semibold block mb-2">Your Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share the details of your experience..."
                rows={4}
                className="w-full p-4 rounded-2xl bg-white border border-sand-200 focus:outline-none focus:ring-2 focus:ring-leaf-700/20 text-sm resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="px-6 py-3 bg-ink-900 text-sand-50 rounded-full font-semibold text-sm hover:bg-ink-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              {submitting ? "Submitting..." : "Post Review"}
            </button>
          </form>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-ink-800/60 text-center py-8">No reviews yet. Be the first to share your experience!</p>
        ) : (
          (reviews || []).map((r) => (
            <div key={r._id} className="p-6 bg-white rounded-3xl border border-sand-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sand-200 flex items-center justify-center text-ink-900 font-serif">
                    {r.user?.name ? r.user.name.charAt(0).toUpperCase() : <User className="w-5 h-5 text-ink-800/40" />}
                  </div>
                  <div>
                    <h5 className="font-semibold text-ink-900 text-sm">{r.user?.name || "Unknown Traveler"}</h5>
                    <div className="text-xs text-ink-800/60">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-sunset-400 text-sunset-400" : "fill-sand-200 text-sand-200"}`} />
                  ))}
                </div>
              </div>
              <p className="text-ink-800/80 text-sm leading-relaxed whitespace-pre-line">{r.comment}</p>
              {auth.isAuthenticated && auth.user && (auth.user._id === r.user?._id || auth.user.id === r.user?._id) && (
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={() => handleDelete(r._id)}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold uppercase tracking-wider"
                  >
                    Delete My Review
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

