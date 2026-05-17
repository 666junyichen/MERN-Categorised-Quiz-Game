import mongoose from "mongoose";
import Question from "../models/Question.js";
import { sanitize } from "../utils/sanitize.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const hasField = (obj, field) =>
  Object.prototype.hasOwnProperty.call(obj ?? {}, field);

const normalizeQuestionPayload = (payload = {}) => ({
  questionText:
    typeof payload.questionText === "string"
      ? sanitize(payload.questionText)
      : payload.questionText,
  options: Array.isArray(payload.options)
    ? payload.options.map((option) =>
        typeof option === "string" ? sanitize(option) : option
      )
    : payload.options,
  correctAnswer:
    typeof payload.correctAnswer === "string"
      ? Number(payload.correctAnswer)
      : payload.correctAnswer,
  category:
    typeof payload.category === "string"
      ? sanitize(payload.category)
      : payload.category,
  isActive: payload.isActive
});

const buildQuestionKey = (payload = {}) =>
  `${String(payload.category ?? "").trim().toLowerCase()}::${String(
    payload.questionText ?? ""
  )
    .trim()
    .toLowerCase()}`;

const validateQuestionPayload = (payload, { allowPartial = false } = {}) => {
  const errors = [];

  if (!allowPartial || hasField(payload, "questionText")) {
    if (typeof payload.questionText !== "string" || payload.questionText.trim() === "") {
      errors.push("questionText is required");
    }
  }

  if (!allowPartial || hasField(payload, "options")) {
    const validOptions =
      Array.isArray(payload.options) &&
      payload.options.length === 4 &&
      payload.options.every(
        (option) => typeof option === "string" && option.trim().length > 0
      );

    if (!validOptions) {
      errors.push("options must contain exactly 4 non-empty strings");
    }
  }

  if (!allowPartial || hasField(payload, "correctAnswer")) {
    if (
      !Number.isInteger(payload.correctAnswer) ||
      payload.correctAnswer < 0 ||
      payload.correctAnswer > 3
    ) {
      errors.push("correctAnswer must be an integer between 0 and 3");
    }
  }

  if (!allowPartial || hasField(payload, "category")) {
    if (typeof payload.category !== "string" || payload.category.trim() === "") {
      errors.push("category is required");
    }
  }

  if (hasField(payload, "isActive") && typeof payload.isActive !== "boolean") {
    errors.push("isActive must be a boolean");
  }

  return errors;
};

export const getQuestions = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status === "active") {
      filter.isActive = true;
    } else if (req.query.status === "inactive") {
      filter.isActive = false;
    }

    if (typeof req.query.category === "string" && req.query.category.trim() !== "") {
      filter.category = req.query.category.trim();
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 5));
    const skip = (page - 1) * limit;

    const [questions, totalCount] = await Promise.all([
      Question.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Question.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      data: {
        questions,
        totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch questions"
    });
  }
};

export const createQuestion = async (req, res) => {
  try {
    const payload = normalizeQuestionPayload(req.body);
    const errors = validateQuestionPayload(payload);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: errors.join("; ")
      });
    }

    const question = await Question.create({
      questionText: payload.questionText,
      options: payload.options,
      correctAnswer: payload.correctAnswer,
      category: payload.category,
      isActive: typeof payload.isActive === "boolean" ? payload.isActive : true
    });

    return res.status(201).json({
      success: true,
      data: question
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Failed to create question"
    });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid question id"
      });
    }

    const payload = normalizeQuestionPayload(req.body);
    const errors = validateQuestionPayload(payload);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: errors.join("; ")
      });
    }

    const updateData = {
      questionText: payload.questionText,
      options: payload.options,
      correctAnswer: payload.correctAnswer,
      category: payload.category
    };

    if (typeof payload.isActive === "boolean") {
      updateData.isActive = payload.isActive;
    }

    const question = await Question.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        error: "Question not found"
      });
    }

    return res.json({
      success: true,
      data: question
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Failed to update question"
    });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid question id"
      });
    }

    const deleted = await Question.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "Question not found"
      });
    }

    return res.json({
      success: true,
      data: {
        id: deleted._id
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Failed to delete question"
    });
  }
};

export const toggleQuestionStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid question id"
      });
    }

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: "Question not found"
      });
    }

    question.isActive = !question.isActive;
    await question.save();

    return res.json({
      success: true,
      data: question
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Failed to toggle question status"
    });
  }
};

export const bulkImportQuestions = async (req, res) => {
  try {
    const rawQuestions = Array.isArray(req.body)
      ? req.body
      : Array.isArray(req.body?.questions)
        ? req.body.questions
        : null;

    if (!rawQuestions || rawQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "questions must be a non-empty array"
      });
    }

    const normalizedQuestions = [];
    const validationErrors = [];

    rawQuestions.forEach((item, index) => {
      const payload = normalizeQuestionPayload(item);
      const errors = validateQuestionPayload(payload);

      if (errors.length > 0) {
        validationErrors.push(`Item ${index + 1}: ${errors.join(", ")}`);
        return;
      }

      normalizedQuestions.push({
        questionText: payload.questionText,
        options: payload.options,
        correctAnswer: payload.correctAnswer,
        category: payload.category,
        isActive: typeof payload.isActive === "boolean" ? payload.isActive : true
      });
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Bulk import validation failed: ${validationErrors.join(" | ")}`
      });
    }

    const uniquePairs = Array.from(
      new Map(
        normalizedQuestions.map((question) => [
          buildQuestionKey(question),
          {
            category: question.category,
            questionText: question.questionText
          }
        ])
      ).values()
    );

    const existingQuestions = await Question.find({
      $or: uniquePairs
    }).select("category questionText");

    const seenKeys = new Set(existingQuestions.map((question) => buildQuestionKey(question)));
    const questionsToInsert = [];
    let skippedCount = 0;

    normalizedQuestions.forEach((question) => {
      const key = buildQuestionKey(question);

      if (seenKeys.has(key)) {
        skippedCount += 1;
        return;
      }

      seenKeys.add(key);
      questionsToInsert.push(question);
    });

    const inserted =
      questionsToInsert.length > 0 ? await Question.insertMany(questionsToInsert) : [];

    return res.status(inserted.length > 0 ? 201 : 200).json({
      success: true,
      data: {
        insertedCount: inserted.length,
        skippedCount,
        questions: inserted
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Failed to bulk import questions"
    });
  }
};
