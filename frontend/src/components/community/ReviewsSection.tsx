import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import type { Review, User } from '../../types/course';
import { getRelativeTime } from '../../utils/courseUtils';

interface ReviewsSectionProps {
  reviews: Review[];
  currentUser: User | null;
  isVisible: boolean;
  onCreateReview: (reviewText: string, rating: number) => Promise<void>;
  onToggleReviewHelpful: (reviewId: string) => void;
}

export default function ReviewsSection({ 
  reviews, 
  currentUser, 
  isVisible, 
  onCreateReview, 
  onToggleReviewHelpful 
}: ReviewsSectionProps) {
  const [newReview, setNewReview] = useState({ text: "", rating: 5 });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const isFormValid = newReview.text.trim().length > 0 && newReview.rating >= 1 && newReview.rating <= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !currentUser) return;

    setReviewSubmitting(true);
    try {
      await onCreateReview(newReview.text, newReview.rating);
      setNewReview({ text: "", rating: 5 }); // Reset form on success
    } catch (error) {
      // Error handling is done by parent component or onCreateReview callback
      // Component continues to function normally
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <section 
      className={`bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 transition-all duration-1000 delay-800 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`} 
      role="region" 
      aria-labelledby="reviews-heading"
    >
      <h2 id="reviews-heading" className="text-white font-semibold text-xl mb-6">
        Reviews & Ratings
      </h2>

      <div className="space-y-4 mb-8" role="feed" aria-label="Course reviews">
        {reviews.length === 0 ? (
          <div className="text-center py-8 bg-white/5 rounded-lg">
            <Star size={48} className="text-gray-600 mx-auto mb-4" aria-hidden="true" />
            <p className="text-gray-400 text-lg">No reviews yet.</p>
            <p className="text-gray-500 text-sm mt-1">Be the first to review this course!</p>
          </div>
        ) : (
          reviews.map((r, i) => (
            <article 
              key={i} 
              className="bg-white/5 p-4 rounded-lg border border-white/10 hover:bg-white/10 transition-colors duration-200" 
              role="article"
            >
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-lg">
                {/* Avatar */}
                <img
                  src={r.user.avatar}
                  alt={`${r.user.name}'s avatar`}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
                  loading="lazy"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header with name and time */}
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-white truncate">{r.user.name}</h3>
                    <time className="text-sm text-white/50 flex-shrink-0 ml-2" dateTime={r.createdAt}>
                      {getRelativeTime(r.createdAt)}
                    </time>
                  </div>

                  {/* Star Rating */}
                  <div className="flex text-yellow-400 mb-2" role="img" aria-label={`${r.rating} out of 5 stars`}>
                    {[...Array(5)].map((_, idx) => (
                      <Star 
                        key={idx} 
                        size={16} 
                        fill={idx < r.rating ? "currentColor" : "none"} 
                        className={idx < r.rating ? "text-yellow-400" : "text-gray-600"}
                        aria-hidden="true"
                      />
                    ))}
                    <span className="sr-only">{r.rating} out of 5 stars</span>
                  </div>

                  {/* Review content */}
                  <p className="text-white break-words mb-3">{r.review}</p>
                  
                  {/* Helpful voting */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => onToggleReviewHelpful(r.id)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                        r.userMarkedHelpful 
                          ? "bg-green-600/20 text-green-400 hover:bg-green-600/30 focus:ring-green-500" 
                          : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white focus:ring-gray-500"
                      }`}
                      aria-pressed={r.userMarkedHelpful}
                      aria-label={`Mark review as ${r.userMarkedHelpful ? 'not ' : ''}helpful`}
                    >
                      <span className="text-base">👍</span>
                      <span>Helpful ({r.helpfulCount})</span>
                    </button>
                    
                    <div className="text-xs text-gray-500">
                      Review #{r.id.slice(-6)}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Review Form */}
      <div className="border-t border-white/10 pt-6">
        <h3 className="text-white font-medium text-lg mb-4">Write a Review</h3>
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="review-form">
          <div>
            <label htmlFor="review-text" className="block text-white text-sm font-medium mb-2">
              Your Review
            </label>
            <textarea 
              id="review-text"
              rows={4} 
              value={newReview.text} 
              placeholder="Write your review..." 
              onChange={(e) => setNewReview({ ...newReview, text: e.target.value })} 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 resize-vertical min-h-[100px]"
              aria-describedby={!isFormValid && newReview.text.length > 0 ? "review-error" : "review-help"}
              maxLength={500}
            />
            {!isFormValid && newReview.text.length > 0 && (
              <p id="review-error" className="text-red-400 text-sm mt-1" role="alert">
                Review cannot be empty
              </p>
            )}
            <p id="review-help" className="text-gray-400 text-sm mt-1">
              {newReview.text.length}/500 characters
            </p>
          </div>

          <div>
            <label htmlFor="review-rating" className="block text-white text-sm font-medium mb-2">
              Rating
            </label>
            <select 
              id="review-rating"
              value={newReview.rating} 
              onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })} 
              className="bg-white/5 text-white border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 min-w-[120px]"
              aria-label="Select rating"
            >
              {[1, 2, 3, 4, 5].map(r => (
                <option key={r} value={r}>{"⭐".repeat(r)} {r} Star{r !== 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit"
            disabled={reviewSubmitting || !isFormValid} 
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 flex items-center gap-2 min-w-[140px]"
            aria-label="Submit review"
          >
            {reviewSubmitting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
            {reviewSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>
    </section>
  );
}