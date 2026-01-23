// src/components/LevelSelection.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { levelApi } from "../../services/api";
import { BookOpen, ChevronRight, Star, Trophy, Users } from "lucide-react";

export const LevelSelection = () => {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const response = await levelApi.getAll();
      setLevels(response.data.data);
    } catch (error) {
      console.error("Error fetching levels:", error);
    } finally {
      setLoading(false);
    }
  };

  // In LevelSelection.jsx
  const handleLevelSelect = (levelSlug) => {
    navigate(`/levels/${levelSlug}`);
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading levels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-5 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Select Level</h1>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {levels.map((level, index) => (
          <motion.div
            key={level.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLevelSelect(level.slug)}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer group"
          >
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        level.order === 1
                          ? "bg-green-500"
                          : level.order === 2
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Level {level.order}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {level.name}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    <Star className="w-4 h-4 mr-1" />
                    {level.order}.0
                  </div>
                </div>
              </div>

              <p className="text-gray-600 mb-6">{level.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">Difficulty</span>
                  </div>
                  <div className="flex mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div
                        key={star}
                        className={`w-2 h-2 rounded-full mx-0.5 ${
                          star <= level.order ? "bg-yellow-500" : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-gray-600">Weeks</span>
                  </div>
                  <div className="text-lg font-bold text-gray-800 mt-1">
                    <p>10</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Click to select</span>
                <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                  <span className="font-medium">Start Practice</span>
                  <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            <div className="h-1 bg-linear-to-r from-blue-500 to-purple-500"></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
