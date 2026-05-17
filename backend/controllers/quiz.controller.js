import mongoose from "mongoose";
import Question from "../models/Question.js";
import Score from "../models/Score.js";
import User from "../models/User.js";
import {
  buildLeaderboardEntry,
  buildLeaderboardPayload,
  buildQuizQuestionsPayload,
  buildQuizSubmissionPayload,
  normalizeQuizCategories
} from "../utils/quizResponse.js";

const MIN_QUESTIONS = 6;
const MAX_QUESTIONS = 10;
const DEFAULT_LEADERBOARD_LIMIT = 20;
const MAX_LEADERBOARD_LIMIT = 100;

const shuffleArray = (items) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const parseQuestionCount = (rawCount) => {
  if (rawCount === undefined || rawCount === null || rawCount === "") {
    return {
      count: MIN_QUESTIONS,
      error: null
    };
  }

  const parsed = Number(rawCount);
  if (!Number.isInteger(parsed)) {
    return {
      count: null,
      error: `Question count must be a whole number between ${MIN_QUESTIONS} and ${MAX_QUESTIONS}.`
    };
  }

  if (parsed < MIN_QUESTIONS || parsed > MAX_QUESTIONS) {
    return {
      count: null,
      error: `Question count must be between ${MIN_QUESTIONS} and ${MAX_QUESTIONS}.`
    };
  }

  return {
    count: parsed,
    error: null
  };
};

const parseCategory = (rawCategory) =>
  typeof rawCategory === "string" && rawCategory.trim() !== "" ? rawCategory.trim() : null;

export const getQuizQuestions = async (req, res) => {
  try {
    const { count, error: countError } = parseQuestionCount(req.query.count);
    const category = parseCategory(req.query.category);

    if (countError) {
      return res.status(400).json({
        success: false,
        error: countError
      });
    }

    let activeCategories = [];
    if (category) {
      activeCategories = normalizeQuizCategories(
        await Question.distinct("category", { isActive: true })
      );

      if (!activeCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          error: `Category "${category}" is not available for quizzes right now. Please choose one of the available categories.`
        });
      }
    }

    const filter = { isActive: true };
    if (category) {
      filter.category = category;
    }

    const activeQuestions = await Question.find(filter);

    if (activeQuestions.length < MIN_QUESTIONS) {
      return res.status(400).json({
        success: false,
        error: category
          ? `Category "${category}" does not have enough active questions to start a quiz. At least ${MIN_QUESTIONS} active questions are required.`
          : `Not enough active questions to start quiz. At least ${MIN_QUESTIONS} active questions are required.`
      });
    }

    const selectedQuestions = shuffleArray(activeQuestions).slice(0, count);

    return res.json({
      success: true,
      data: buildQuizQuestionsPayload(selectedQuestions)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch quiz questions"
    });
  }
};

export const getQuizCategories = async (req, res) => {
  try {
    const categories = await Question.distinct("category", { isActive: true });

    return res.json({
      success: true,
      data: normalizeQuizCategories(categories)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch quiz categories"
    });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body ?? {};

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        error: "answers must be a non-empty array"
      });
    }

    if (answers.length < MIN_QUESTIONS || answers.length > MAX_QUESTIONS) {
      return res.status(400).json({
        success: false,
        error: "answers must contain between 6 and 10 items"
      });
    }

    const invalidAnswer = answers.find((answer) => {
      const validQuestionId = mongoose.Types.ObjectId.isValid(answer?.questionId);
      const validSelectedAnswer =
        Number.isInteger(answer?.selectedAnswer) &&
        answer.selectedAnswer >= 0 &&
        answer.selectedAnswer <= 3;
      return !validQuestionId || !validSelectedAnswer;
    });

    if (invalidAnswer) {
      return res.status(400).json({
        success: false,
        error: "Each answer must include valid questionId and selectedAnswer (0-3)"
      });
    }

    const questionIds = [...new Set(answers.map((answer) => String(answer.questionId)))];

    if (questionIds.length !== answers.length) {
      return res.status(400).json({
        success: false,
        error: "Duplicate question answers are not allowed"
      });
    }

    const questions = await Question.find({
      _id: { $in: questionIds },
      isActive: true
    }).select("_id correctAnswer");

    if (questions.length !== questionIds.length) {
      return res.status(400).json({
        success: false,
        error: "Some submitted questions are invalid or inactive"
      });
    }

    const correctAnswerMap = new Map(
      questions.map((question) => [String(question._id), question.correctAnswer])
    );

    const scoredAnswers = answers.map((answer) => {
      const questionId = String(answer.questionId);
      const correctAnswer = correctAnswerMap.get(questionId);
      const isCorrect = correctAnswer === answer.selectedAnswer;

      return {
        questionId,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer,
        isCorrect
      };
    });

    const score = scoredAnswers.reduce(
      (total, answer) => total + (answer.isCorrect ? 1 : 0),
      0
    );

    const attempt = await Score.create({
      user: req.user.userId,
      score,
      answers: scoredAnswers
    });

    return res.status(201).json({
      success: true,
      data: buildQuizSubmissionPayload(attempt._id, score, scoredAnswers)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Failed to submit quiz"
    });
  }
};

export const getMyAttempts = async (req, res) => {
  try {
    const attempts = await Score.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .populate("answers.questionId", "questionText options category correctAnswer");

    return res.json({
      success: true,
      data: attempts
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch user attempts"
    });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const mode = req.query.mode === "all" ? "all" : "best";
    const rawLimit = Number(req.query.limit);
    const limit = Number.isInteger(rawLimit)
      ? Math.max(1, Math.min(MAX_LEADERBOARD_LIMIT, rawLimit))
      : DEFAULT_LEADERBOARD_LIMIT;

    if (mode === "all") {
      const attempts = await Score.find({})
        .sort({ score: -1, createdAt: -1 })
        .limit(limit)
        .populate("user", "username");

      const leaderboard = attempts.map((attempt) =>
        buildLeaderboardEntry({
          userId: attempt.user?._id,
          username: attempt.user?.username,
          score: attempt.score,
          createdAt: attempt.createdAt
        })
      );

      return res.json({
        success: true,
        data: buildLeaderboardPayload(mode, leaderboard)
      });
    }

    const bestAttempts = await Score.aggregate([
      {
        $group: {
          _id: "$user",
          score: { $max: "$score" },
          createdAt: { $max: "$createdAt" }
        }
      },
      { $sort: { score: -1, createdAt: -1 } },
      { $limit: limit }
    ]);

    const userIds = bestAttempts.map((attempt) => attempt._id);
    const users = await User.find({ _id: { $in: userIds } }).select("_id username");
    const usernameMap = new Map(users.map((user) => [String(user._id), user.username]));

    const leaderboard = bestAttempts.map((attempt) =>
      buildLeaderboardEntry({
        userId: attempt._id,
        username: usernameMap.get(String(attempt._id)),
        score: attempt.score,
        createdAt: attempt.createdAt
      })
    );

    return res.json({
      success: true,
      data: buildLeaderboardPayload(mode, leaderboard)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch leaderboard"
    });
  }
};
