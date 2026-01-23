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
  Menu,
  Search,
  Grid,
  List,
  CheckCircle,
  AlertCircle,
  Loader,
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
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    if (levelSlug && weekNumber) {
      fetchQuestionSets();
    }

    return () => window.removeEventListener("resize", checkMobile);
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
    navigate(`/play/${levelSlug}/${weekNumber}/${questionSet.id}`);
  };

  const handlePlaySelected = () => {
    if (selectedSets.length > 0) {
      const setIds = selectedSets.map((set) => set.id).join(",");
      navigate(`/play/${levelSlug}/${weekNumber}/multiple?sets=${setIds}`);
    }
  };

  const getTypeIcon = (typeSlug) => {
    switch (typeSlug) {
      case "addition-subtraction":
        return (
          <div className="flex items-center gap-1">
            <Plus className="w-4 h-4" />
            <Minus className="w-4 h-4" />
          </div>
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
    if (remainingSeconds === 0) return `${minutes}m`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Filter question sets based on search query
  const filteredQuestionSets = questionSets.filter((group) => {
    if (activeFilter === "all" || group.type.slug === activeFilter) {
      if (searchQuery.trim() === "") return true;

      const matchesSearch = group.sets.some(
        (set) =>
          set.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group.type.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      return matchesSearch;
    }
    return false;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading question sets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-7xl">
      {/* Mobile Back Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 p-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      {/* Header */}
      <div className="mb-6 lg:mb-8">
        {/* Desktop Back Button */}
        <div className="hidden lg:block mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Weeks</span>
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-r from-blue-500 to-purple-600 rounded-xl lg:rounded-2xl p-4 lg:p-8 text-white shadow-lg"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 text-xs lg:text-sm">
                  <p>{level?.name}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 text-xs lg:text-sm">
                  <p>{week?.title}</p>
                </div>
              </div>
              <h1 className="text-xl lg:text-3xl font-bold mb-1 lg:mb-2">
                Question Sets
              </h1>
              <p className="text-blue-100 opacity-90 text-sm lg:text-base">
                Select question sets to practice
              </p>
            </div>
            <div className="hidden lg:block">
              <BarChart className="w-12 h-12 lg:w-16 lg:h-16 opacity-20" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Selection Controls */}
      <AnimatePresence>
        {selectedSets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="mb-6 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-lg overflow-hidden"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-blue-800 text-base lg:text-lg mb-1 truncate">
                  Selected {selectedSets.length} Set
                  {selectedSets.length !== 1 ? "s" : ""}
                </h3>
                <p className="text-blue-600 text-xs lg:text-sm truncate">
                  {selectedSets.map((set, idx) => (
                    <span key={set.id}>
                      {set.name} ({set.question_type?.name})
                      {idx < selectedSets.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
                <button
                  onClick={() => setSelectedSets([])}
                  className="px-3 py-2 lg:px-4 lg:py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm lg:text-base"
                >
                  Clear All
                </button>
                <button
                  onClick={handlePlaySelected}
                  className="px-4 py-2 lg:px-6 lg:py-2 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium flex items-center justify-center gap-2 shadow-lg text-sm lg:text-base"
                >
                  <Play className="w-3 h-3 lg:w-4 lg:h-4" />
                  Play Selected ({selectedSets.length})
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and View Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search sets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${viewMode === "grid" ? "bg-blue-100 text-blue-700 border border-blue-300" : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"}`}
          >
            <Grid className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${viewMode === "list" ? "bg-blue-100 text-blue-700 border border-blue-300" : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"}`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs - Mobile Scrollable */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 pb-2 min-w-max">
          <button
            onClick={() => setActiveFilter("all")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm ${
              activeFilter === "all"
                ? "bg-blue-100 text-blue-700 border border-blue-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
            }`}
          >
            <Filter className="w-3 h-3 lg:w-4 lg:h-4" />
            All Types
            <span className="bg-blue-100 text-blue-800 text-xs font-medium rounded-full px-2 py-1">
              {questionSets.reduce(
                (total, group) => total + group.sets.length,
                0,
              )}
            </span>
          </button>

          {questionSets.map((group) => (
            <button
              key={group.type.slug}
              onClick={() => setActiveFilter(group.type.slug)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm ${
                activeFilter === group.type.slug
                  ? `${getTypeColor(group.type.slug)} border`
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
              }`}
            >
              <span className="flex items-center gap-1">
                {getTypeIcon(group.type.slug)}
              </span>
              <span className="hidden sm:inline">{group.type.name}</span>
              <span className="inline sm:hidden">
                {group.type.name.substring(0, 3)}
              </span>
              <span className="bg-gray-200 text-gray-700 text-xs font-medium rounded-full px-2 py-1">
                {group.sets.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Question Sets */}
      {filteredQuestionSets.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No question sets found
          </h3>
          <p className="text-gray-600">
            Try changing your search or filter criteria
          </p>
        </div>
      ) : (
        <div className="space-y-4 lg:space-y-6">
          {filteredQuestionSets.map((group) => (
            <motion.div
              key={group.type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl lg:rounded-2xl shadow-md lg:shadow-lg border border-gray-200 overflow-hidden"
            >
              {/* Type Header */}
              <div
                className={`p-4 lg:p-6 border-b ${getTypeColor(group.type.slug)}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl flex items-center justify-center ${getTypeColor(group.type.slug).replace("text-", "bg-").split(" ")[0]}`}
                    >
                      {getTypeIcon(group.type.slug)}
                    </div>
                    <div>
                      <h3 className="text-base lg:text-xl font-bold text-gray-800">
                        {group.type.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Practice sets for {group.type.name.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Sets Available</div>
                    <div className="text-xl lg:text-2xl font-bold text-gray-800">
                      {group.sets.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sets List */}
              <div className="p-4 lg:p-6">
                <div
                  className={`grid gap-3 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
                >
                  {group.sets.map((set, idx) => {
                    const isSelected = selectedSets.some(
                      (s) => s.id === set.id,
                    );
                    // const isExpanded = expandedSet === set.id;

                    return (
                      <motion.div
                        key={set.id}
                        layout
                        initial={false}
                        animate={{
                          borderColor: isSelected ? "#3b82f6" : "#e5e7eb",
                          boxShadow: isSelected
                            ? "0 4px 15px rgba(59, 130, 246, 0.15)"
                            : "0 1px 3px rgba(0, 0, 0, 0.1)",
                        }}
                        className={`border-2 rounded-lg lg:rounded-xl overflow-hidden transition-all ${isSelected ? "ring-1 lg:ring-2 ring-blue-200" : ""}`}
                      >
                        {/* Set Header */}
                        <div
                          className="p-3 lg:p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          // onClick={() =>
                          //   setExpandedSet(isExpanded ? null : set.id)
                          // }
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="relative shrink-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    toggleSetSelection(set);
                                  }}
                                  className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                />
                                {isSelected && (
                                  <Check className="w-2 h-2 lg:w-3 lg:h-3 text-white absolute top-1 left-1 pointer-events-none" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-gray-800 text-sm lg:text-base truncate">
                                  {set.name}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 text-xs lg:text-sm text-gray-600 mt-1">
                                  <span className="flex items-center gap-1">
                                    <BarChart className="w-3 h-3 lg:w-4 lg:h-4" />
                                    {set.total_questions} questions
                                  </span>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 lg:w-4 lg:h-4" />
                                    {formatTime(set.time_limit)}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 lg:px-2 lg:py-1 rounded-full text-xs font-medium ${getTypeColor(group.type.slug)}`}
                                  >
                                    Set {set.set_number}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlaySingleSet(set);
                                }}
                                className="px-2 py-1 lg:px-4 lg:py-2 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium flex items-center gap-1 lg:gap-2 text-xs lg:text-sm whitespace-nowrap"
                              >
                                <Play className="w-3 h-3 lg:w-4 lg:h-4" />
                                <span className="hidden sm:inline">Play</span>
                              </button>

                              {/* <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-gray-500"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 lg:w-5 lg:h-5" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 lg:w-5 lg:h-5" />
                                )}
                              </motion.div> */}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {/* {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 lg:p-4 border-t border-gray-200 bg-gray-50">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                                  <div className="bg-white rounded-lg p-3">
                                    <h5 className="font-medium text-gray-700 mb-2 text-sm lg:text-base">
                                      Details
                                    </h5>
                                    <div className="space-y-1 text-xs lg:text-sm text-gray-600">
                                      <div className="flex justify-between">
                                        <span>Questions:</span>
                                        <span className="font-medium">
                                          {set.total_questions}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Time Limit:</span>
                                        <span className="font-medium">
                                          {formatTime(set.time_limit)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Difficulty:</span>
                                        <span className="font-medium">
                                          {set.difficulty || "Medium"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="bg-white rounded-lg p-3">
                                    <h5 className="font-medium text-gray-700 mb-2 text-sm lg:text-base">
                                      Description
                                    </h5>
                                    <p className="text-xs lg:text-sm text-gray-600">
                                      {set.description ||
                                        "Practice questions to improve your skills."}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )} */}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
