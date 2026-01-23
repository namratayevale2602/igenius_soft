// src/services/api.js
import axios from "axios";

const API_BASE_URL = "https://igenius-back.demovoting.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const levelApi = {
  // Get all levels
  getAll: () => api.get("/levels"),

  // Get specific level
  getLevel: (slug) => api.get(`/levels/${slug}`),

  // Get weeks for a level
  getWeeks: (levelSlug) => api.get(`/levels/${levelSlug}/weeks`),

  // Get question sets for a week
  getQuestionSets: (levelSlug, weekNumber) =>
    api.get(`/levels/${levelSlug}/weeks/${weekNumber}/question-sets`),

  // Get questions for a question set
  getQuestions: (levelSlug, weekNumber, questionSetId) =>
    api.get(
      `/levels/${levelSlug}/weeks/${weekNumber}/question-sets/${questionSetId}/questions`,
    ),
};

export default api;
