import { createContext, useCallback, useContext, useReducer } from "react";
import API from "../api/api";

const QuizContext = createContext(null);

const initialState = {
  activeMenu: "quiz",

  count: 6,
  category: "",

  categories: [],
  categoriesLoading: false,
  categoriesError: "",

  quizStarted: false,
  questions: [],
  currentIndex: 0,
  selectedAnswers: {},
  quizLoading: false,
  quizError: "",

  submitting: false,
  result: null,
  submitError: "",

  attempts: [],
  attemptsLoading: false,
  attemptsError: "",
  openAttemptId: null,

  leaderboard: [],
  leaderboardLoading: false,
  leaderboardMode: "best",
  leaderboardError: ""
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_ACTIVE_MENU":
      return { ...state, activeMenu: action.menu };

    case "SET_COUNT":
      return { ...state, count: action.count };

    case "SET_CATEGORY":
      return { ...state, category: action.category };

    case "LOAD_CATEGORIES_START":
      return { ...state, categoriesLoading: true, categoriesError: "" };
    case "LOAD_CATEGORIES_SUCCESS":
      return {
        ...state,
        categoriesLoading: false,
        categories: action.categories,
        categoriesError: ""
      };
    case "LOAD_CATEGORIES_ERROR":
      return {
        ...state,
        categoriesLoading: false,
        categoriesError: action.error
      };

    case "START_QUIZ":
      return {
        ...state,
        quizStarted: true,
        questions: [],
        currentIndex: 0,
        selectedAnswers: {},
        quizLoading: false,
        quizError: "",
        submitting: false,
        result: null,
        submitError: ""
      };

    case "FETCH_QUESTIONS_START":
      return { ...state, quizLoading: true, quizError: "" };
    case "FETCH_QUESTIONS_SUCCESS":
      return {
        ...state,
        quizLoading: false,
        questions: action.questions,
        currentIndex: 0,
        selectedAnswers: {},
        quizError: ""
      };
    case "FETCH_QUESTIONS_ERROR":
      return { ...state, quizLoading: false, quizError: action.error, quizStarted: false };

    case "SELECT_ANSWER":
      return {
        ...state,
        selectedAnswers: { ...state.selectedAnswers, [action.questionId]: action.selectedAnswer }
      };

    case "NEXT_QUESTION":
      return { ...state, currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1) };
    case "PREV_QUESTION":
      return { ...state, currentIndex: Math.max(state.currentIndex - 1, 0) };

    case "SUBMIT_START":
      return { ...state, submitting: true, submitError: "" };
    case "SUBMIT_SUCCESS":
      return { ...state, submitting: false, result: action.result };
    case "SUBMIT_ERROR":
      return { ...state, submitting: false, submitError: action.error };

    case "LOAD_ATTEMPTS_START":
      return { ...state, attemptsLoading: true, attemptsError: "" };
    case "LOAD_ATTEMPTS_SUCCESS":
      return {
        ...state,
        attemptsLoading: false,
        attempts: action.attempts,
        attemptsError: "",
        openAttemptId: null
      };
    case "LOAD_ATTEMPTS_ERROR":
      return { ...state, attemptsLoading: false, attemptsError: action.error };

    case "TOGGLE_ATTEMPT":
      return {
        ...state,
        openAttemptId: state.openAttemptId === action.attemptId ? null : action.attemptId
      };

    case "LOAD_LEADERBOARD_START":
      return { ...state, leaderboardLoading: true, leaderboardError: "" };
    case "LOAD_LEADERBOARD_SUCCESS":
      return { ...state, leaderboardLoading: false, leaderboard: action.leaderboard };
    case "LOAD_LEADERBOARD_ERROR":
      return { ...state, leaderboardLoading: false, leaderboardError: action.error };

    case "SET_LEADERBOARD_MODE":
      return { ...state, leaderboardMode: action.mode };

    case "RESET_QUIZ":
      return {
        ...state,
        quizStarted: false,
        questions: [],
        currentIndex: 0,
        selectedAnswers: {},
        quizLoading: false,
        quizError: "",
        submitting: false,
        result: null,
        submitError: ""
      };

    default:
      return state;
  }
}

export function QuizProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadCategories = useCallback(async () => {
    dispatch({ type: "LOAD_CATEGORIES_START" });
    try {
      const response = await API.get("/quiz/categories");
      const list = Array.isArray(response.data?.data) ? response.data.data : [];
      if (list.length > 0) {
        dispatch({ type: "LOAD_CATEGORIES_SUCCESS", categories: list });
        return;
      }
      const fallbackRes = await API.get("/quiz/questions", { params: { count: 10 } });
      const fallbackQuestions = Array.isArray(fallbackRes.data?.data?.questions)
        ? fallbackRes.data.data.questions
        : [];
      const derived = [...new Set(
        fallbackQuestions
          .map((q) => q?.category)
          .filter((c) => typeof c === "string" && c.trim() !== "")
          .map((c) => c.trim())
      )].sort((a, b) => a.localeCompare(b));
      dispatch({ type: "LOAD_CATEGORIES_SUCCESS", categories: derived });
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Could not load quiz categories right now.";
      dispatch({ type: "LOAD_CATEGORIES_ERROR", error: message });
    }
  }, []);

  const fetchQuiz = useCallback(async () => {
    dispatch({ type: "FETCH_QUESTIONS_START" });
    try {
      const params = { count: state.count };
      if (state.category) params.category = state.category;
      const response = await API.get("/quiz/questions", { params });
      const fetched = response.data?.data?.questions ?? [];
      if (!Array.isArray(fetched) || fetched.length === 0) {
        dispatch({
          type: "FETCH_QUESTIONS_ERROR",
          error: state.category
            ? `No active quiz questions are available in ${state.category} right now.`
            : "No quiz questions are available right now."
        });
        return false;
      }
      dispatch({ type: "FETCH_QUESTIONS_SUCCESS", questions: fetched });
      return true;
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || "Failed to load quiz questions";
      dispatch({ type: "FETCH_QUESTIONS_ERROR", error: message });
      return false;
    }
  }, [state.count, state.category]);

  const submitQuiz = useCallback(async () => {
    dispatch({ type: "SUBMIT_START" });
    try {
      const answers = state.questions.map((q) => ({
        questionId: q._id,
        selectedAnswer: state.selectedAnswers[q._id]
      }));
      const response = await API.post("/quiz/submit", { answers });
      dispatch({ type: "SUBMIT_SUCCESS", result: response.data?.data ?? null });
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || "Failed to submit quiz";
      dispatch({ type: "SUBMIT_ERROR", error: message });
    }
  }, [state.questions, state.selectedAnswers]);

  const loadAttempts = useCallback(async () => {
    dispatch({ type: "LOAD_ATTEMPTS_START" });
    try {
      const response = await API.get("/quiz/attempts");
      const list = Array.isArray(response.data?.data) ? response.data.data : [];
      dispatch({ type: "LOAD_ATTEMPTS_SUCCESS", attempts: list });
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Could not load your quiz history. Please try again.";
      dispatch({ type: "LOAD_ATTEMPTS_ERROR", error: message });
    }
  }, []);

  const loadLeaderboard = useCallback(async (mode) => {
    dispatch({ type: "LOAD_LEADERBOARD_START" });
    try {
      const response = await API.get("/quiz/leaderboard", { params: { mode, limit: 20 } });
      const list = response.data?.data?.leaderboard ?? [];
      dispatch({ type: "LOAD_LEADERBOARD_SUCCESS", leaderboard: list });
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || "Failed to load leaderboard";
      dispatch({ type: "LOAD_LEADERBOARD_ERROR", error: message });
    }
  }, []);

  const value = {
    state,
    dispatch,
    fetchQuiz,
    loadCategories,
    submitQuiz,
    loadAttempts,
    loadLeaderboard
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) {
    throw new Error("useQuiz must be used within QuizProvider");
  }
  return ctx;
}

export default QuizContext;
