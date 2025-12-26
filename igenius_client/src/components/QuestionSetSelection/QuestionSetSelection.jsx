// src/components/QuestionSetSelection.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  ArrowLeft,
  Plus,
  Minus,
  X,
  Divide,
  Play,
  Clock,
  BarChart,
  Check,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { levelApi } from "../../services/api";

export const QuestionSetSelection = () => {
  const { levelSlug, weekNumber } = useParams();
  const navigate = useNavigate();
  const [level, setLevel] = useState(null);
  const [week, setWeek] = useState(null);
  const [questionSets, setQuestionSets] = useState([]);
  const [selectedSets, setSelectedSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSet, setExpandedSet] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (levelSlug && weekNumber) {
      fetchQuestionSets();
    }
  }, [levelSlug, weekNumber]);

  const fetchQuestionSets = async () => {
    try {
      setLoading(true);
      const response = await levelApi.getQuestionSets(levelSlug, weekNumber);
      setLevel(response.data.data.level);
      setWeek(response.data.data.week);
      setQuestionSets(response.data.data.question_sets);
    } catch (error) {
      console.error("Error fetching question sets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/levels/${levelSlug}`);
  };

  const toggleSetSelection = (questionSet) => {
    setSelectedSets((prev) => {
      const isSelected = prev.some((s) => s.id === questionSet.id);
      if (isSelected) {
        return prev.filter((s) => s.id !== questionSet.id);
      } else {
        return [...prev, questionSet];
      }
    });
  };

  const handlePlaySingleSet = (questionSet) => {
    // Pass single question set
    navigate(`/play/${levelSlug}/${weekNumber}/${questionSet.id}`);
  };

  const handlePlaySelected = () => {
    if (selectedSets.length > 0) {
      // Create a comma-separated list of question set IDs
      const setIds = selectedSets.map((set) => set.id).join(",");
      // Navigate to play with multiple question sets
      navigate(`/play/${levelSlug}/${weekNumber}/multiple?sets=${setIds}`);
    }
  };

  const getTypeIcon = (typeSlug) => {
    switch (typeSlug) {
      case "addition-subtraction":
        return (
          <>
            <Plus className="w-4 h-4" />
            <Minus className="w-4 h-4" />
          </>
        );
      case "multiplication":
        return <X className="w-4 h-4" />;
      case "division":
        return <Divide className="w-4 h-4" />;
      default:
        return <BarChart className="w-4 h-4" />;
    }
  };

  const getTypeColor = (typeSlug) => {
    switch (typeSlug) {
      case "addition-subtraction":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "multiplication":
        return "bg-green-100 text-green-800 border-green-200";
      case "division":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return "No limit";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) return `${remainingSeconds}s`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading question sets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Weeks</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-sm">
                  {level?.name}
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-sm">
                  {week?.title}
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-2">Question Sets</h1>
              <p className="text-blue-100 opacity-90">
                Select question sets to practice
              </p>
            </div>
            <div className="hidden md:block">
              <BarChart className="w-16 h-16 opacity-20" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Selection Controls */}
      {selectedSets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-blue-800 text-lg mb-1">
                Selected {selectedSets.length} Set
                {selectedSets.length !== 1 ? "s" : ""}
              </h3>
              <p className="text-blue-600 text-sm">
                {selectedSets.map((set, idx) => (
                  <span key={set.id}>
                    {set.name} ({set.question_type?.name})
                    {idx < selectedSets.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedSets([])}
                className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
              >
                Clear All
              </button>
              <button
                onClick={handlePlaySelected}
                className="px-6 py-2 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium flex items-center gap-2 shadow-lg"
              >
                <Play className="w-4 h-4" />
                Play Selected ({selectedSets.length})
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
          <button
            onClick={() => setActiveFilter("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeFilter === "all"
                ? "bg-blue-100 text-blue-700 border border-blue-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
            }`}
          >
            <Filter className="w-4 h-4" />
            All Types
            <span className="bg-blue-100 text-blue-800 text-xs font-medium rounded-full px-2 py-1">
              {questionSets.reduce(
                (total, group) => total + group.sets.length,
                0
              )}
            </span>
          </button>

          {questionSets.map((group) => (
            <button
              key={group.type.slug}
              onClick={() => setActiveFilter(group.type.slug)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === group.type.slug
                  ? `${
                      getTypeColor(group.type.slug)
                        .replace("bg-", "bg-")
                        .replace("text-", "text-")
                        .split(" ")[0]
                    } border`
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
              }`}
            >
              <span className="flex items-center gap-1">
                {getTypeIcon(group.type.slug)}
              </span>
              {group.type.name}
              <span className="bg-gray-200 text-gray-700 text-xs font-medium rounded-full px-2 py-1">
                {group.sets.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Question Sets Grid */}
      <div className="space-y-6">
        {questionSets
          .filter(
            (group) =>
              activeFilter === "all" || group.type.slug === activeFilter
          )
          .map((group) => (
            <motion.div
              key={group.type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              {/* Type Header */}
              <div
                className={`p-6 border-b ${
                  getTypeColor(group.type.slug).split(" ")[0]
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        getTypeColor(group.type.slug)
                          .replace("text-", "bg-")
                          .split(" ")[0]
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {getTypeIcon(group.type.slug)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {group.type.name}
                      </h3>
                      <p className="text-gray-600">
                        Practice sets for {group.type.name.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Sets Available</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {group.sets.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sets List */}
              <div className="p-6 space-y-4">
                {group.sets.map((set, idx) => {
                  const isSelected = selectedSets.some((s) => s.id === set.id);
                  const isExpanded = expandedSet === set.id;

                  return (
                    <motion.div
                      key={set.id}
                      layout
                      initial={false}
                      animate={{
                        borderColor: isSelected ? "#3b82f6" : "#e5e7eb",
                        boxShadow: isSelected
                          ? "0 4px 20px rgba(59, 130, 246, 0.15)"
                          : "0 1px 3px rgba(0, 0, 0, 0.1)",
                      }}
                      className={`border-2 rounded-xl overflow-hidden transition-all ${
                        isSelected ? "ring-2 ring-blue-200" : ""
                      }`}
                    >
                      {/* Set Header */}
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() =>
                          setExpandedSet(isExpanded ? null : set.id)
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSetSelection(set);
                                }}
                                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                              />
                              {isSelected && (
                                <Check className="w-3 h-3 text-white absolute top-1 left-1 pointer-events-none" />
                              )}
                            </div>

                            <div>
                              <h4 className="font-bold text-gray-800 text-lg">
                                {set.name}
                              </h4>
                              <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                                <span className="flex items-center gap-1">
                                  <BarChart className="w-4 h-4" />
                                  {set.total_questions} questions
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formatTime(set.time_limit)}
                                </span>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                                    group.type.slug
                                  )}`}
                                >
                                  Set {set.set_number}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlaySingleSet(set);
                              }}
                              className="px-4 py-2 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Play
                            </button>

                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="text-gray-500"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  );
};
