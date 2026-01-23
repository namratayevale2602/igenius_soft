// src/components/WeekSelection.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { levelApi } from "../../services/api";
import {
  ArrowLeft,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

export const WeekSelection = () => {
  const { levelSlug } = useParams();
  const navigate = useNavigate();
  const [level, setLevel] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (levelSlug) {
      fetchWeeks();
    }
  }, [levelSlug]);

  const fetchWeeks = async () => {
    try {
      setLoading(true);
      const response = await levelApi.getWeeks(levelSlug);
      setLevel(response.data.data.level);
      setWeeks(response.data.data.weeks);
    } catch (error) {
      console.error("Error fetching weeks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWeekSelect = (weekNumber) => {
    navigate(`/levels/${levelSlug}/weeks/${weekNumber}`);
  };

  // In WeekSelection.jsx
  const handleBack = () => {
    navigate("/levels");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading weeks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-5 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Levels</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{level?.name}</h1>
              <p className="text-blue-100 opacity-90">
                Select a week to continue
              </p>
            </div>
            <div className="hidden md:block">
              <Calendar className="w-16 h-16 opacity-20" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Weeks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {weeks.map((week, index) => (
          <motion.div
            key={week.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleWeekSelect(week.week_number)}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer group"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {week.week_number}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {week.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {week.total_sets} Question Sets
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    <p>Week</p>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    <p>#{week.week_number}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Question Sets</span>
                  <span className="font-medium text-gray-800">
                    {week.total_sets}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Estimated Time</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-800">45 min</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-500">Available</span>
                </div>
                <div className="flex items-center text-blue-600 group-hover:text-blue-700 font-medium">
                  <span>Select Week</span>
                  <div className="ml-2 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-gray-100">
              <div className="h-full bg-linear-to-r from-blue-400 to-purple-500 w-0 group-hover:w-1/3 transition-all duration-500"></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {weeks.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No weeks available
          </h3>
          <p className="text-gray-500">
            This level doesn't have any weeks configured yet.
          </p>
        </motion.div>
      )}
    </div>
  );
};
