// src/components/AnswersPage.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Home,
  Download,
  CheckCircle,
  Calculator,
  FileText,
} from "lucide-react";

export const AnswersPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { questions, questionSets, levelSlug, weekNumber } =
    location.state || {};

  const [expandedSets, setExpandedSets] = useState(new Set());

  useEffect(() => {
    if (!questions || !questionSets) {
      navigate("/");
    }
  }, [questions, questionSets, navigate]);

  if (!questions || !questionSets) {
    return null;
  }

  const toggleSetExpansion = (setIndex) => {
    setExpandedSets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(setIndex)) {
        newSet.delete(setIndex);
      } else {
        newSet.add(setIndex);
      }
      return newSet;
    });
  };

  const getQuestionsBySetIndex = (setIndex) => {
    return questions.filter((q) => q.setIndex === setIndex);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 ">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Player
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
              >
                <Home className="w-5 h-5" />
                Home
              </button>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">
              Answers Sheet
            </h1>
            <div className="flex items-center justify-center gap-6 text-gray-600">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                <span>Level: {levelSlug}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <span>Week: {weekNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>{questions.length} Questions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">•</span>
                <span>{questionSets.length} Sets</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sets and Answers */}
        <div className="space-y-8">
          {questionSets.map((set, setIndex) => {
            const setQuestions = getQuestionsBySetIndex(setIndex);
            const isExpanded = expandedSets.has(setIndex);

            return (
              <motion.div
                key={set.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: setIndex * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden "
              >
                {/* Set Header */}
                <div
                  className="p-6 bg-linear-to-r from-blue-50 to-blue-100 border-b border-blue-200 cursor-pointer hover:from-blue-100 hover:to-blue-200 transition-all"
                  onClick={() => toggleSetExpansion(setIndex)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-2xl font-bold text-blue-600">
                          {setIndex + 1}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                          {set.name}
                        </h2>
                        <p className="text-gray-600">
                          {set.totalQuestions} questions • {set.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-4 py-2 bg-white rounded-lg text-gray-700 font-medium shadow-sm">
                        Set {setIndex + 1} of {questionSets.length}
                      </span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ArrowLeft className="w-6 h-6 text-gray-600 transform rotate-90" />
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {setQuestions.map((question, qIndex) => (
                        <div
                          key={question.id}
                          className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <span className="font-bold text-blue-600">
                                  {qIndex + 1}
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800">
                                  Question {question.question_number}
                                </div>
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-green-600 font-mono bg-green-50 px-3 py-1 rounded-lg">
                              {question.answer}
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="text-lg font-mono bg-gray-50 p-3 rounded-lg text-center border border-gray-200">
                              {question.formatted_question} {" = "}
                              {question.answer}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 ">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-xl">
              <div className="text-blue-700 font-medium">Total Questions</div>
              <div className="text-3xl font-bold text-blue-800">
                {questions.length}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-xl">
              <div className="text-green-700 font-medium">Total Sets</div>
              <div className="text-3xl font-bold text-green-800">
                {questionSets.length}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl">
              <div className="text-purple-700 font-medium">Average Time</div>
              <div className="text-3xl font-bold text-purple-800">
                {Math.round(
                  questions.reduce((acc, q) => acc + (q.time_limit || 10), 0) /
                    questions.length,
                )}
                s
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
