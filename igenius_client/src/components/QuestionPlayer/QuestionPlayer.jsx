// src/components/QuestionPlayer.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume,
  Volume2,
  VolumeX,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Plus,
  Minus,
  X as MultiplyIcon,
  Divide,
  AlertCircle,
  Loader2,
  Timer,
  SkipForward,
  SkipBack,
  ArrowLeft,
  Home,
  List,
  Eye,
  EyeOff,
  Layers,
} from "lucide-react";
import { levelApi } from "../../services/api";

export const QuestionPlayer = () => {
  const { levelSlug, weekNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const questionSetIds = queryParams.get("sets")
    ? queryParams.get("sets").split(",")
    : [];
  const isMultiSet = questionSetIds.length > 1;

  const [questions, setQuestions] = useState([]);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [questionSets, setQuestionSets] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [visibleOperators, setVisibleOperators] = useState([]);
  const [visibleDigits, setVisibleDigits] = useState([]);
  const [isSetTransition, setIsSetTransition] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");

  const speechRef = useRef(null);
  const questionTimerRef = useRef(null);
  const stepTimerRef = useRef(null);
  const setTransitionTimerRef = useRef(null);
  const currentSequenceRef = useRef([]);

  useEffect(() => {
    if (levelSlug && weekNumber) {
      if (isMultiSet && questionSetIds.length > 0) {
        fetchMultipleQuestionSets();
      } else {
        // Single question set mode
        const singleSetId = location.pathname.split("/").pop();
        if (singleSetId && singleSetId !== "multiple") {
          fetchQuestions(singleSetId);
        }
      }
    } else {
      setError("Invalid parameters");
      setIsLoading(false);
    }

    return () => cleanupTimers();
  }, [levelSlug, weekNumber, location]);

  const cleanupTimers = () => {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    if (setTransitionTimerRef.current)
      clearTimeout(setTransitionTimerRef.current);
    if (speechRef.current) {
      speechSynthesis.cancel();
    }
  };

  const fetchMultipleQuestionSets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const allQuestions = [];
      const allQuestionSets = [];

      for (const setId of questionSetIds) {
        const response = await levelApi.getQuestions(
          levelSlug,
          weekNumber,
          setId
        );

        const data = response.data.data;
        allQuestionSets.push({
          id: data.question_set.id,
          name: data.question_set.name,
          totalQuestions: data.questions.length,
          type: data.question_set.question_type.name,
        });

        // Add set identifier to each question
        const questionsWithSet = data.questions.map((q, index) => ({
          ...q,
          setId: data.question_set.id,
          setIndex: allQuestionSets.length - 1,
          globalIndex: allQuestions.length + index,
        }));

        allQuestions.push(...questionsWithSet);
      }

      setQuestionSets(allQuestionSets);
      setQuestions(allQuestions);

      if (allQuestions.length > 0) {
        setTimeout(() => {
          setIsPlaying(true);
          setIsAutoPlaying(true);
        }, 500);
      }
    } catch (error) {
      console.error("Error fetching multiple question sets:", error);
      setError("Failed to load question sets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuestions = async (setId) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await levelApi.getQuestions(
        levelSlug,
        weekNumber,
        setId
      );

      const data = response.data.data;
      setQuestionSets([
        {
          id: data.question_set.id,
          name: data.question_set.name,
          totalQuestions: data.questions.length,
          type: data.question_set.question_type.name,
        },
      ]);

      const questionsWithSet = data.questions.map((q, index) => ({
        ...q,
        setId: data.question_set.id,
        setIndex: 0,
        globalIndex: index,
      }));

      setQuestions(questionsWithSet);

      if (data.questions.length > 0) {
        setTimeout(() => {
          setIsPlaying(true);
          setIsAutoPlaying(true);
        }, 500);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      setError("Failed to load questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentQuestionSet = questionSets[currentSetIndex];

  useEffect(() => {
    if (currentQuestion) {
      const sequence = currentQuestion.display_sequence || [];
      currentSequenceRef.current = sequence;
      setCurrentStep(0);
      setVisibleOperators([]);
      setVisibleDigits([]);
      setTimeRemaining(currentQuestion.time_limit || 10);

      // Update current set index based on current question
      if (isMultiSet) {
        const newSetIndex = currentQuestion.setIndex || 0;
        if (newSetIndex !== currentSetIndex) {
          setCurrentSetIndex(newSetIndex);
          setIsSetTransition(true);

          // Announce set transition with voice
          if (!isMuted) {
            const setAnnouncement = `Starting question set ${
              newSetIndex + 1
            } of ${questionSets.length}: ${
              questionSets[newSetIndex]?.name
            }. Ready for next question.`;
            speakAnnouncement(setAnnouncement);
          }

          // Clear transition flag after announcement
          setTimeout(() => {
            setIsSetTransition(false);
          }, 2000);
        }
      }
    }
  }, [currentQuestion]);

  // New function for announcements
  const speakAnnouncement = (text) => {
    if ("speechSynthesis" in window && !isMuted) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const speech = new SpeechSynthesisUtterance(text);
      speech.rate = playbackSpeed;
      speech.pitch = 1;
      speech.volume = 1;
      speech.lang = "en-US";

      // Set different voice characteristics for announcements
      const voices = speechSynthesis.getVoices();
      const announcementVoice = voices.find(
        (voice) =>
          voice.name.includes("Google") ||
          voice.name.includes("Samantha") ||
          voice.name.includes("Microsoft")
      );

      if (announcementVoice) {
        speech.voice = announcementVoice;
      }

      speechSynthesis.speak(speech);
    }
  };

  useEffect(() => {
    if (isPlaying && currentSequenceRef.current.length > 0) {
      startDisplaySequence();
    } else {
      cleanupTimers();
    }

    return () => cleanupTimers();
  }, [isPlaying, currentQuestionIndex]);

  const startDisplaySequence = () => {
    const sequence = currentSequenceRef.current;
    if (!sequence || sequence.length === 0) return;

    setCurrentStep(0);
    setVisibleOperators([]);
    setVisibleDigits([]);
    setTimeRemaining(currentQuestion.time_limit || 10);
    cleanupTimers();

    // Announce "Get ready" before starting the question
    if (!isMuted && isAutoPlaying) {
      const questionNum = currentQuestionIndex + 1;
      const announcement = `Get ready. Question ${questionNum} starting in 2 seconds.`;
      speakAnnouncement(announcement);
    }

    // Start after 2-second announcement
    setTimeout(() => {
      const timePerStep =
        ((currentQuestion.time_limit || 10) * 1000) / sequence.length;

      let step = 0;

      questionTimerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(questionTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const processNextStep = () => {
        if (step < sequence.length) {
          setCurrentStep(step);
          const currentItem = sequence[step];

          // Add to visible arrays based on type
          if (currentItem.type === "digit") {
            setVisibleDigits((prev) => [...prev, currentItem]);
          } else if (currentItem.type === "operator") {
            setVisibleOperators((prev) => [...prev, currentItem]);
          }

          if (!isMuted) speakItem(currentItem);
          step++;

          if (step < sequence.length) {
            stepTimerRef.current = setTimeout(processNextStep, timePerStep);
          } else {
            clearInterval(questionTimerRef.current);
            setTimeout(handleNextQuestion, 2000);
          }
        }
      };

      stepTimerRef.current = setTimeout(processNextStep, timePerStep);
    }, 2000);
  };

  // Update speakItem for better pronunciation
  const speakItem = (item) => {
    if ("speechSynthesis" in window && !isMuted) {
      speechSynthesis.cancel();

      let text = "";
      if (item.type === "digit") {
        text = item.value.toString();
      } else if (item.type === "operator") {
        text = getOperatorWord(item.value);
      } else if (item.type === "equals") {
        text = "equals";
      }

      const speech = new SpeechSynthesisUtterance(text);
      speech.rate = playbackSpeed;
      speech.pitch = 1;
      speech.volume = 1;
      speech.lang = "en-US";

      speechSynthesis.speak(speech);
    }
  };

  const getOperatorWord = (operator) => {
    switch (operator) {
      case "+":
        return "add";
      case "-":
        return "less";
      case "*":
        return "into";
      case "/":
        return "divided by";
      default:
        return operator;
    }
  };

  const getOperatorIcon = (operator) => {
    switch (operator) {
      case "+":
        return <Plus className="w-8 h-8 text-blue-600" />;
      case "-":
        return <Minus className="w-8 h-8 text-red-600" />;
      case "*":
        return <MultiplyIcon className="w-8 h-8 text-purple-600" />;
      case "/":
        return <Divide className="w-8 h-8 text-orange-600" />;
      default:
        return operator;
    }
  };

  const getOperatorSymbol = (operator) => {
    switch (operator) {
      case "+":
        return "+";
      case "-":
        return "-";
      case "*":
        return "×";
      case "/":
        return "÷";
      default:
        return operator;
    }
  };

  const handlePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      setIsAutoPlaying(true);
    } else {
      setIsPlaying(false);
      setIsAutoPlaying(false);
      cleanupTimers();
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextQuestionIndex = currentQuestionIndex + 1;

      // Speak "Next question" announcement
      if (!isMuted && isAutoPlaying) {
        const questionNumber = nextQuestionIndex + 1;
        const totalQuestions = questions.length;
        let announcement = `Question ${questionNumber} of ${totalQuestions}`;

        // Check if we're moving to a new set
        const currentSet = currentQuestion.setIndex || 0;
        const nextSet = questions[nextQuestionIndex].setIndex || 0;

        if (isMultiSet && nextSet !== currentSet) {
          const nextSetName = questionSets[nextSet]?.name || "new set";
          announcement = `Moving to ${nextSetName}. Question ${questionNumber} of ${totalQuestions}`;
        } else {
          announcement = `Next question. Question ${questionNumber} of ${totalQuestions}`;
        }

        speakAnnouncement(announcement);
      }

      // Wait for announcement to finish (approx 2 seconds)
      setTimeout(() => {
        setCurrentQuestionIndex(nextQuestionIndex);
        setIsPlaying(true);
        setIsAutoPlaying(true);
        cleanupTimers();
      }, 2000);
    } else {
      // End of all questions - announce completion
      if (!isMuted) {
        speakAnnouncement("All questions completed. Well done!");
      }
      setIsPlaying(false);
      setIsAutoPlaying(false);
      cleanupTimers();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      cleanupTimers();
      setIsPlaying(false);
      setIsAutoPlaying(false);
    }
  };

  const handleRestartSession = () => {
    setCurrentQuestionIndex(0);
    setCurrentSetIndex(0);
    setCurrentStep(0);
    setVisibleOperators([]);
    setVisibleDigits([]);
    setIsPlaying(false);
    setIsAutoPlaying(false);
    setIsSetTransition(false);
    cleanupTimers();
  };

  const handleGoHome = () => navigate("/");

  const formatTime = (seconds) => {
    const secs = Math.max(0, Math.floor(seconds));
    return `00:${secs.toString().padStart(2, "0")}`;
  };

  // Render Question Display
  const renderQuestionDisplay = () => {
    if (!currentQuestion) return null;

    const currentSequence = currentQuestion.display_sequence || [];
    const currentItem = currentSequence[currentStep];

    return (
      <div className="h-full flex flex-col">
        {/* Question Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h2 className="text-xl font-bold text-gray-800">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </h2>
                {isMultiSet && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-blue-50 px-4 py-1.5 rounded-full border border-blue-200">
                    <span className="text-blue-700 font-medium">
                      Set {currentSetIndex + 1}/{questionSets.length}:{" "}
                      {currentQuestionSet?.name}
                    </span>
                  </div>
                )}
                {/* Voice Status Indicator */}
                <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                  <Volume className="w-4 h-4 text-green-700" />
                  <span className="text-green-700 text-sm font-medium">
                    Voice: {isMuted ? "Muted" : "On"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-600 text-sm">
                <p>{currentQuestionSet?.name || "Practice Session"}</p>
                <span className="text-gray-400">•</span>
                <span>{currentQuestionSet?.type || "Mixed Operations"}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                <Timer className="w-5 h-5 text-blue-600" />
                <span className="font-mono font-bold text-blue-700">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isMuted
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
                {isMuted ? "Unmute" : "Mute"}
              </button>
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {showAnswers ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
                {showAnswers ? "Hide Answers" : "Show Answers"}
              </button>
            </div>
          </div>

          {/* Announcement Indicator */}
          {announcementText && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-lg p-3"
            >
              <div className="flex items-center gap-2">
                <Volume className="w-4 h-4 text-purple-600" />
                <span className="text-purple-700 text-sm">
                  <span className="font-medium">Announcement:</span>{" "}
                  {announcementText}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Main Display Area */}
        <div className="flex-1 p-8">
          <div className="h-full bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
            <div className="flex h-full">
              {/* Left Side - Current Item */}
              <div className="flex-1 flex flex-col items-center justify-center border-r border-gray-300 pr-8">
                {currentItem ? (
                  <motion.div
                    key={`${currentItem.type}-${currentItem.position}-${currentStep}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                  >
                    {currentItem.type === "digit" && (
                      <>
                        <div className="text-9xl font-bold text-gray-900 mb-6">
                          {currentItem.display || currentItem.value}
                        </div>
                        <div className="text-xl text-gray-600">
                          Number {visibleDigits.length + 1}
                        </div>
                      </>
                    )}
                    {currentItem.type === "operator" && (
                      <>
                        <div className="text-9xl text-blue-600 mb-6">
                          {getOperatorIcon(currentItem.value)}
                        </div>
                        <div className="text-xl text-gray-600">
                          {getOperatorWord(currentItem.value)}
                        </div>
                      </>
                    )}
                    {currentItem.type === "equals" && (
                      <>
                        <div className="text-9xl font-bold text-green-600 mb-6">
                          =
                        </div>
                        <div className="text-2xl font-bold text-gray-800">
                          Time to Calculate!
                        </div>
                        <div className="text-lg text-gray-600 mt-2">
                          {visibleDigits.length} numbers to process
                        </div>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="text-7xl mb-6">👋</div>
                    <div className="text-2xl">Ready to Start</div>
                  </div>
                )}
              </div>

              {/* Right Side - Traditional Arithmetic Layout */}
              <div className="flex-1 pl-8">
                <div className="h-full flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      Traditional Format
                    </h3>
                    <p className="text-gray-600">
                      Step {currentStep + 1} of {currentSequence.length}
                    </p>
                  </div>

                  <div className="flex-1">
                    <div className="h-full flex flex-col justify-center">
                      <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-300">
                        {/* Main arithmetic layout */}
                        <div className="space-y-8">
                          {/* First number */}
                          {visibleDigits.length > 0 && (
                            <div className="flex justify-end">
                              <div className="text-right">
                                <div className="text-5xl font-bold text-gray-800 font-mono tracking-wider">
                                  {visibleDigits[0].display ||
                                    visibleDigits[0].value}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  First number
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Second number with operator */}
                          {visibleDigits.length > 1 && (
                            <div className="flex items-center">
                              <div className="mr-6">
                                {visibleOperators[0] && (
                                  <div className="text-5xl font-bold text-gray-800">
                                    {getOperatorSymbol(
                                      visibleOperators[0].value
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 text-right">
                                <div className="text-5xl font-bold text-gray-800 font-mono tracking-wider border-t-2 border-gray-400 pt-2">
                                  {visibleDigits[1].display ||
                                    visibleDigits[1].value}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  Second number
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Third number with operator */}
                          {visibleDigits.length > 2 && (
                            <div className="flex items-center">
                              <div className="mr-6">
                                {visibleOperators[1] && (
                                  <div className="text-5xl font-bold text-gray-800">
                                    {getOperatorSymbol(
                                      visibleOperators[1].value
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 text-right">
                                <div className="text-5xl font-bold text-gray-800 font-mono tracking-wider border-t-2 border-gray-400 pt-2">
                                  {visibleDigits[2].display ||
                                    visibleDigits[2].value}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  Third number
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Fourth number with operator */}
                          {visibleDigits.length > 3 && (
                            <div className="flex items-center">
                              <div className="mr-6">
                                {visibleOperators[2] && (
                                  <div className="text-5xl font-bold text-gray-800">
                                    {getOperatorSymbol(
                                      visibleOperators[2].value
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 text-right">
                                <div className="text-5xl font-bold text-gray-800 font-mono tracking-wider border-t-2 border-gray-400 pt-2">
                                  {visibleDigits[3].display ||
                                    visibleDigits[3].value}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  Fourth number
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Horizontal line */}
                          {visibleDigits.length >= 2 && (
                            <div className="border-t-4 border-gray-800 my-4"></div>
                          )}

                          {/* Answer */}
                          {currentStep === currentSequence.length - 1 &&
                            currentSequence[currentStep].type === "equals" && (
                              <div className="flex justify-end">
                                <div className="text-right">
                                  <div className="text-5xl font-bold text-green-800 font-mono tracking-wider">
                                    {currentQuestion.answer}
                                  </div>
                                  <div className="text-sm text-green-600 mt-1">
                                    Answer
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>

                        {visibleDigits.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <div className="text-5xl mb-4">🧮</div>
                            <div className="text-xl">
                              Numbers will appear here
                            </div>
                            <div className="text-sm mt-2">
                              In traditional arithmetic format
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Summary section */}
                      <div className="mt-8 grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
                          <div className="text-sm text-blue-600">Numbers</div>
                          <div className="text-2xl font-bold text-blue-800">
                            {visibleDigits.length}
                          </div>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-200">
                          <div className="text-sm text-purple-600">
                            Operators
                          </div>
                          <div className="text-2xl font-bold text-purple-800">
                            {visibleOperators.length}
                          </div>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
                          <div className="text-sm text-green-600">
                            Time Left
                          </div>
                          <div className="text-xl font-bold text-green-800 font-mono">
                            {formatTime(timeRemaining)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add announcement text updates
  useEffect(() => {
    if (isSetTransition && currentQuestionSet) {
      const text = `Starting question set ${currentSetIndex + 1} of ${
        questionSets.length
      }: ${currentQuestionSet.name}`;
      setAnnouncementText(text);

      // Clear announcement after 3 seconds
      const timer = setTimeout(() => {
        setAnnouncementText("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSetTransition, currentSetIndex, currentQuestionSet]);

  // Render Control Panel
  const renderControlPanel = () => {
    const totalSteps = currentQuestion?.display_sequence?.length || 0;
    const stepProgress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
    const questionProgress =
      questions.length > 0
        ? ((currentQuestionIndex + 1) / questions.length) * 100
        : 0;

    return (
      <div className="h-full bg-white border-t border-gray-200">
        <div className="h-full flex flex-col">
          {/* Top Controls */}
          <div className="flex-1 flex items-center justify-center gap-8 px-8">
            {/* Previous Question */}
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-3 px-6 py-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
            >
              <SkipBack className="w-5 h-5" />
              <span className="font-medium">Previous Question</span>
            </button>

            {/* Play/Pause */}
            <button
              onClick={handlePlay}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-white transition-all shadow-md ${
                isPlaying && isAutoPlaying
                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              }`}
            >
              {isPlaying && isAutoPlaying ? (
                <>
                  <Pause className="w-6 h-6" />
                  <span className="text-lg">Pause Auto-play</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6" />
                  <span className="text-lg">Start Auto-play</span>
                </>
              )}
            </button>

            {/* Next Question */}
            <button
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
              className="flex items-center gap-3 px-6 py-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
            >
              <span className="font-medium">Next Question</span>
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between px-8 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center gap-6">
              {/* Speed Control */}
              <div className="flex items-center gap-3">
                <label className="text-gray-700 font-medium">
                  Voice Speed:
                </label>
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="0.75">0.75x Slower</option>
                  <option value="1">1x Normal</option>
                  <option value="1.25">1.25x Faster</option>
                  <option value="1.5">1.5x Fastest</option>
                </select>
              </div>

              {/* Voice Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isMuted
                      ? "bg-red-100 border-red-300 text-red-600 hover:bg-red-200"
                      : "bg-green-100 border-green-300 text-green-700 hover:bg-green-200"
                  } border`}
                  title={isMuted ? "Turn voice on" : "Turn voice off"}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  <span className="font-medium">
                    {isMuted ? "Voice Off" : "Voice On"}
                  </span>
                </button>

                {/* Test Announcement Button */}
                <button
                  onClick={() => {
                    if (!isMuted) {
                      speakAnnouncement(
                        "Testing voice announcement. Voice is working correctly."
                      );
                      setAnnouncementText("Testing voice announcement...");
                      setTimeout(() => setAnnouncementText(""), 2000);
                    }
                  }}
                  disabled={isMuted}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    isMuted
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200"
                  }`}
                  title="Test voice"
                >
                  <Volume className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Info */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Step</div>
                  <div className="font-bold text-lg">
                    {currentStep + 1}/
                    {currentQuestion?.display_sequence?.length || 0}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Question</div>
                  <div className="font-bold text-lg">
                    {currentQuestionIndex + 1}/{questions.length}
                  </div>
                </div>
                {isMultiSet && (
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Set</div>
                    <div className="font-bold text-lg">
                      {currentSetIndex + 1}/{questionSets.length}
                    </div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-sm text-gray-600">Time</div>
                  <div className="font-mono font-bold text-lg text-green-700">
                    {formatTime(timeRemaining)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Restart */}
              <button
                onClick={handleRestartSession}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 hover:from-blue-200 hover:to-blue-100 rounded-lg transition-all border border-blue-200 shadow-sm"
              >
                <RotateCcw className="w-5 h-5" />
                <span className="font-medium">Restart Session</span>
              </button>

              {/* Home */}
              <button
                onClick={handleGoHome}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 hover:from-gray-200 hover:to-gray-100 rounded-lg transition-all border border-gray-200 shadow-sm"
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">Exit Player</span>
              </button>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="px-8 py-3 bg-white border-t border-gray-200">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span className="font-medium">Overall Progress</span>
                <span>{Math.round(questionProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${questionProgress}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-sm text-gray-600">
                <span className="font-medium">Step Progress</span>
                <span>{Math.round(stepProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${stepProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Answers Sidebar
  const renderAnswersSidebar = () => {
    return (
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30 }}
        className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-2xl z-50"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-gray-800">
                Answers Sheet
              </h2>
              <button
                onClick={() => setShowAnswers(false)}
                className="p-2.5 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <p className="text-gray-600">
              Click on any question to jump directly
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {questions.length} questions
              </div>
              {isMultiSet && (
                <div className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {questionSets.length} sets
                </div>
              )}
            </div>
          </div>

          {/* Answers List */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-5">
              {questions.map((question, index) => {
                const currentSet = questionSets[question.setIndex || 0];
                return (
                  <motion.div
                    key={`${question.id}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-5 rounded-2xl cursor-pointer transition-all duration-200 ${
                      index === currentQuestionIndex
                        ? "bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 shadow-md"
                        : "bg-gray-50 border border-gray-200 hover:border-blue-200 hover:shadow-sm"
                    }`}
                    onClick={() => {
                      setCurrentQuestionIndex(index);
                      setCurrentStep(0);
                      setVisibleOperators([]);
                      setVisibleDigits([]);
                      setIsPlaying(false);
                      setIsAutoPlaying(false);
                      setShowAnswers(false);
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                            index === currentQuestionIndex
                              ? "bg-blue-500 text-white shadow-md"
                              : "bg-white text-gray-600 border border-gray-300"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800 text-lg">
                            Question {question.question_number}
                          </div>
                          {isMultiSet && currentSet && (
                            <div className="text-sm text-purple-600 mt-1">
                              Set: {currentSet.name}
                            </div>
                          )}
                          <div className="text-sm text-gray-500 mt-1">
                            {question.time_limit}s •{" "}
                            {question.display_sequence?.length || 0} steps
                          </div>
                        </div>
                      </div>
                      <div className="text-green-600 font-bold text-3xl font-mono bg-white px-4 py-2 rounded-xl border border-green-200 shadow-sm">
                        {question.answer}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-xl font-mono bg-white p-4 rounded-xl border border-gray-300 text-center shadow-sm">
                        {question.formatted_question}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          {question.display_sequence?.filter(
                            (item) => item.type === "digit"
                          ).length || 0}{" "}
                          digits
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          {question.display_sequence?.filter(
                            (item) => item.type === "operator"
                          ).length || 0}{" "}
                          operators
                        </span>
                      </div>
                      <div className="text-gray-400">
                        {index === currentQuestionIndex ? "Current" : ""}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-200 bg-gray-50">
            <div className="text-center text-gray-600">
              <div className="font-medium mb-1">Quick Navigation</div>
              <div className="text-sm text-gray-500">
                Click any question number to jump
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Render Loading
  const renderLoading = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="w-16 h-16 text-blue-500" />
      </motion.div>
      <h3 className="text-2xl font-semibold text-gray-700 mt-6">
        {isMultiSet ? "Loading Multiple Question Sets" : "Loading Questions"}
      </h3>
      <p className="text-gray-500 mt-2">Preparing your practice session...</p>
    </div>
  );

  // Render Error
  const renderError = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <AlertCircle className="w-20 h-20 text-red-500 mb-6" />
      <h2 className="text-3xl font-bold text-gray-700 mb-4">
        Unable to Load Questions
      </h2>
      <p className="text-gray-600 mb-8 text-center max-w-md">{error}</p>
      <div className="flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-md"
        >
          Try Again
        </button>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium shadow-md"
        >
          Go Back Home
        </button>
      </div>
    </div>
  );

  if (isLoading) return renderLoading();
  if (error) return renderError();
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Calculator className="w-20 h-20 text-gray-400 mb-6" />
        <h2 className="text-2xl font-bold text-gray-700 mb-3">
          No Questions Available
        </h2>
        <p className="text-gray-600 mb-8">
          {isMultiSet
            ? "The selected question sets don't have any questions yet."
            : "This question set doesn't have any questions yet."}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-md"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Layout */}
      <div className="flex flex-col h-screen">
        {/* Question Display Area (80vh) */}
        <div className="flex-1" style={{ height: "80vh" }}>
          {renderQuestionDisplay()}
        </div>

        {/* Control Panel (20vh) */}
        <div style={{ height: "20vh" }}>{renderControlPanel()}</div>
      </div>

      {/* Answers Sidebar */}
      <AnimatePresence>{showAnswers && renderAnswersSidebar()}</AnimatePresence>
    </div>
  );
};
