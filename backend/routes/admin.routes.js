import express from "express";
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  toggleQuestionStatus,
  bulkImportQuestions
} from "../controllers/admin.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

router.get("/questions", protect, requireAdmin, getQuestions);
router.post("/questions", protect, requireAdmin, createQuestion);
router.put("/questions/:id", protect, requireAdmin, updateQuestion);
router.delete("/questions/:id", protect, requireAdmin, deleteQuestion);
router.patch("/questions/:id/toggle", protect, requireAdmin, toggleQuestionStatus);
router.post("/questions/bulk-import", protect, requireAdmin, bulkImportQuestions);

export default router;
