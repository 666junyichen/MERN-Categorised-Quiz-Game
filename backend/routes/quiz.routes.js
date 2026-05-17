import express from "express";
import rateLimit from "express-rate-limit";
import {
  getQuizQuestions,
  getQuizCategories,
  submitQuiz,
  getMyAttempts,
  getLeaderboard
} from "../controllers/quiz.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many quiz submissions, please try again later" }
});

router.get("/questions", protect, getQuizQuestions);
router.get("/categories", protect, getQuizCategories);
router.post("/submit", protect, submitLimiter, submitQuiz);
router.get("/attempts", protect, getMyAttempts);
router.get("/leaderboard", protect, getLeaderboard);

export default router;
