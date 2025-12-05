import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  TrendingUp,
  Award,
  Calendar,
  Building2,
  User,
  ThumbsUp,
  MessageSquare,
  Clock,
  Target,
  Zap,
  Filter,
  ChevronDown,
  StarHalf,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { PharmacistOnly } from "../components/auth/RouteProtection";
import { motion } from "framer-motion";
import EmptyState from "../components/shared/EmptyState";
import OnboardingGate from "../components/onboarding/OnboardingGate";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function PharmacistReviewsContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("recent");
  const [filterRating, setFilterRating] = useState("all");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all reviews for this pharmacist
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['pharmacistReviews', user?.id],
    queryFn: async () => {
      const allReviews = await base44.entities.Review.filter(
        { pharmacist_id: user.id, is_visible: true },
        '-created_date'
      );
      return allReviews;
    },
    enabled: !!user,
  });

  // Calculate statistics
  const stats = {
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0,
    fiveStars: reviews.filter(r => r.rating === 5).length,
    fourStars: reviews.filter(r => r.rating === 4).length,
    threeStars: reviews.filter(r => r.rating === 3).length,
    twoStars: reviews.filter(r => r.rating === 2).length,
    oneStar: reviews.filter(r => r.rating === 1).length,
    wouldHireAgain: reviews.filter(r => r.would_hire_again).length,
    withComments: reviews.filter(r => r.review_text).length,
    avgProfessionalism: reviews.filter(r => r.professionalism).length > 0
      ? (reviews.filter(r => r.professionalism).reduce((sum, r) => sum + r.professionalism, 0) / reviews.filter(r => r.professionalism).length).toFixed(1)
      : 0,
    avgPunctuality: reviews.filter(r => r.punctuality).length > 0
      ? (reviews.filter(r => r.punctuality).reduce((sum, r) => sum + r.punctuality, 0) / reviews.filter(r => r.punctuality).length).toFixed(1)
      : 0,
    avgCommunication: reviews.filter(r => r.communication).length > 0
      ? (reviews.filter(r => r.communication).reduce((sum, r) => sum + r.communication, 0) / reviews.filter(r => r.communication).length).toFixed(1)
      : 0,
  };

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter(review => {
      if (filterRating === "all") return true;
      if (filterRating === "5") return review.rating === 5;
      if (filterRating === "4") return review.rating === 4;
      if (filterRating === "3") return review.rating === 3;
      if (filterRating === "2") return review.rating === 2;
      if (filterRating === "1") return review.rating === 1;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "recent") return new Date(b.created_date) - new Date(a.created_date);
      if (sortBy === "oldest") return new Date(a.created_date) - new Date(b.created_date);
      if (sortBy === "highest") return b.rating - a.rating;
      if (sortBy === "lowest") return a.rating - b.rating;
      return 0;
    });

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="w-4 h-4 fill-amber-400 text-amber-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <StarHalf key="half" className="w-4 h-4 fill-amber-400 text-amber-400" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      );
    }

    return stars;
  };

  if (loading || reviewsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="p-4 space-y-4">
          <div className="h-48 bg-white rounded-2xl animate-pulse" />
          <div className="h-32 bg-white rounded-2xl animate-pulse" />
          <div className="h-64 bg-white rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
                <p className="text-sm text-gray-500 mt-1">Your performance feedback from employers</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-3xl font-bold text-amber-500">{stats.averageRating}</p>
                  <div className="flex items-center gap-1">
                    {renderStars(parseFloat(stats.averageRating))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - Stats */}
            <div className="col-span-4 space-y-4">
              {/* Overall Stats Card */}
              <Card className="border border-gray-200">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Performance Overview</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Reviews</span>
                      <span className="font-bold text-gray-900">{stats.totalReviews}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Would Hire Again</span>
                      <span className="font-bold text-green-600">
                        {stats.totalReviews > 0 ? Math.round((stats.wouldHireAgain / stats.totalReviews) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">With Comments</span>
                      <span className="font-bold text-gray-900">{stats.withComments}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category Ratings */}
              {stats.totalReviews > 0 && (
                <Card className="border border-gray-200">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">Category Ratings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Professionalism</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{stats.avgProfessionalism}</span>
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Punctuality</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{stats.avgPunctuality}</span>
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Communication</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{stats.avgCommunication}</span>
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Rating Distribution */}
              {stats.totalReviews > 0 && (
                <Card className="border border-gray-200">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">Rating Distribution</h3>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((starCount) => {
                        const count = starCount === 5 ? stats.fiveStars :
                                      starCount === 4 ? stats.fourStars :
                                      starCount === 3 ? stats.threeStars :
                                      starCount === 2 ? stats.twoStars :
                                      stats.oneStar;
                        const percentage = (count / stats.totalReviews) * 100;
                        return (
                          <div key={starCount} className="flex items-center gap-2">
                            <span className="text-xs font-medium w-8">{starCount} ★</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                            <span className="text-xs font-medium w-6 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Main Content - Reviews */}
            <div className="col-span-8">
              {/* Filters */}
              {stats.totalReviews > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <Select value={filterRating} onValueChange={setFilterRating}>
                    <SelectTrigger className="w-40 bg-white">
                      <SelectValue placeholder="Filter by rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40 bg-white">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="highest">Highest Rated</SelectItem>
                      <SelectItem value="lowest">Lowest Rated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Reviews List */}
              {stats.totalReviews === 0 ? (
                <Card className="border-2 border-dashed border-gray-300">
                  <CardContent className="p-12 text-center">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
                    <p className="text-gray-600 mb-4">Complete shifts to start receiving reviews</p>
                    <Button onClick={() => navigate(createPageUrl("BrowseShifts"))}>
                      Browse Shifts
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <Card key={review.id} className="border border-gray-200 hover:shadow-md transition-all">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-gray-900">{review.pharmacy_name}</h4>
                            <p className="text-sm text-gray-600">{review.employer_name}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 mb-1">
                              {renderStars(review.rating)}
                            </div>
                            <p className="text-xs text-gray-500">{format(new Date(review.shift_date), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        {review.review_text && (
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 mb-3">
                            <p className="text-sm text-gray-700">"{review.review_text}"</p>
                          </div>
                        )}
                        {review.would_hire_again && (
                          <Badge className="bg-green-50 text-green-700 border-green-200">
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            Would hire again
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="md:hidden">
      {/* Hero Header with Gradient */}
      <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600 text-white pb-24 pt-6 px-4 overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -mr-32 -mt-32 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl -ml-24 -mb-24 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">My Reviews</h1>
              <p className="text-amber-100 text-sm">Your performance feedback</p>
            </div>
          </div>

          {/* Overall Rating Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-amber-100 text-sm font-medium mb-1">Overall Rating</p>
                <div className="flex items-center gap-3">
                  <p className="text-5xl font-black">{stats.averageRating}</p>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      {renderStars(parseFloat(stats.averageRating))}
                    </div>
                    <p className="text-xs text-amber-100">{stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              {stats.totalReviews > 0 && (
                <div className="text-right">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <p className="text-xs text-amber-100 font-medium">
                    {Math.round((stats.wouldHireAgain / stats.totalReviews) * 100)}% Would Hire Again
                  </p>
                </div>
              )}
            </div>

            {/* Star Distribution */}
            {stats.totalReviews > 0 && (
              <div className="space-y-2 mt-4 pt-4 border-t border-white/20">
                {[5, 4, 3, 2, 1].map((starCount) => {
                  const count = starCount === 5 ? stats.fiveStars :
                                starCount === 4 ? stats.fourStars :
                                starCount === 3 ? stats.threeStars :
                                starCount === 2 ? stats.twoStars :
                                stats.oneStar;
                  const percentage = (count / stats.totalReviews) * 100;

                  return (
                    <div key={starCount} className="flex items-center gap-2">
                      <span className="text-xs font-medium w-8">{starCount} ★</span>
                      <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Metrics Cards */}
      {stats.totalReviews > 0 && (
        <div className="px-4 -mt-16 relative z-20 mb-4">
          <div className="grid grid-cols-3 gap-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white shadow-lg">
                <CardContent className="p-4 text-center">
                  <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{stats.avgProfessionalism}</p>
                  <p className="text-xs text-gray-600">Professionalism</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white shadow-lg">
                <CardContent className="p-4 text-center">
                  <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{stats.avgPunctuality}</p>
                  <p className="text-xs text-gray-600">Punctuality</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white shadow-lg">
                <CardContent className="p-4 text-center">
                  <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{stats.avgCommunication}</p>
                  <p className="text-xs text-gray-600">Communication</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      )}

      {/* Filters and Sort */}
      {stats.totalReviews > 0 && (
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="bg-white border-gray-200">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white border-gray-200">
                  <ChevronDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="highest">Highest Rated</SelectItem>
                  <SelectItem value="lowest">Lowest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="px-4 space-y-3">
        {stats.totalReviews === 0 ? (
          <EmptyState
            icon={Award}
            title="No Reviews Yet"
            description="Complete shifts to start receiving reviews from employers. Positive reviews help you stand out and get more opportunities."
            actionLabel="Browse Available Shifts"
            onAction={() => navigate(createPageUrl("BrowseShifts"))}
            secondaryActionLabel="View My Schedule"
            onSecondaryAction={() => navigate(createPageUrl("MySchedule"))}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-gray-900">
                {filteredReviews.length} Review{filteredReviews.length !== 1 ? 's' : ''}
              </h2>
              <Badge variant="outline" className="text-xs">
                {stats.withComments} with comments
              </Badge>
            </div>

            {filteredReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-white hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <p className="font-bold text-gray-900 text-sm">{review.pharmacy_name}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <User className="w-3 h-3" />
                          <span>{review.employer_name}</span>
                          <span className="text-gray-400">•</span>
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(review.shift_date), 'MMM d, yyyy')}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-xs text-gray-500">
                          {format(new Date(review.created_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>

                    {/* Detailed Ratings */}
                    {(review.professionalism || review.punctuality || review.communication) && (
                      <div className="grid grid-cols-3 gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
                        {review.professionalism && (
                          <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Professional</p>
                            <div className="flex items-center justify-center gap-1">
                              {renderStars(review.professionalism).slice(0, 5)}
                            </div>
                          </div>
                        )}
                        {review.punctuality && (
                          <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Punctual</p>
                            <div className="flex items-center justify-center gap-1">
                              {renderStars(review.punctuality).slice(0, 5)}
                            </div>
                          </div>
                        )}
                        {review.communication && (
                          <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Communication</p>
                            <div className="flex items-center justify-center gap-1">
                              {renderStars(review.communication).slice(0, 5)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Review Text */}
                    {review.review_text && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-3 border border-blue-100">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 leading-relaxed">"{review.review_text}"</p>
                        </div>
                      </div>
                    )}

                    {/* Would Hire Again Badge */}
                    {review.would_hire_again && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          Would hire again
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </>
        )}
      </div>
      </div>
    </div>
  );
}

export default function PharmacistReviews() {
  return (
    <PharmacistOnly>
      <OnboardingGate userType="pharmacist" minimumCompletion={80}>
        <PharmacistReviewsContent />
      </OnboardingGate>
    </PharmacistOnly>
  );
}