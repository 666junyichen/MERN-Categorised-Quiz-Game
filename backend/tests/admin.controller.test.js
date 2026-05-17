import assert from "node:assert/strict";
import Question from "../models/Question.js";
import { bulkImportQuestions } from "../controllers/admin.controller.js";

const createRes = () => {
  const res = {
    statusCode: 200,
    body: null
  };

  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  res.json = (payload) => {
    res.body = payload;
    return res;
  };

  return res;
};

const originalFind = Question.find;
const originalInsertMany = Question.insertMany;

const existingQuestion = {
  _id: "existing-id",
  questionText: "Which middleware parses incoming JSON request bodies in Express?",
  options: ["cors()", "express.static()", "express.json()", "cookieParser()"],
  correctAnswer: 2,
  category: "Express",
  isActive: true
};

const duplicateQuestion = {
  questionText: "Which middleware parses incoming JSON request bodies in Express?",
  options: ["cors()", "express.static()", "express.json()", "cookieParser()"],
  correctAnswer: 2,
  category: "Express",
  isActive: true
};

const newQuestion = {
  questionText: "Which MongoDB method inserts multiple documents at once?",
  options: ["saveMany()", "insertMany()", "createAll()", "pushMany()"],
  correctAnswer: 1,
  category: "MongoDB",
  isActive: true
};

let insertedPayload = null;

Question.find = () => ({
  select: async () => [existingQuestion]
});
Question.insertMany = async (docs) => {
  insertedPayload = docs;
  return docs.map((doc, index) => ({ _id: `new-${index + 1}`, ...doc }));
};

const req = {
  body: {
    questions: [
      duplicateQuestion,
      newQuestion,
      {
        ...newQuestion
      }
    ]
  }
};

const res = createRes();

await bulkImportQuestions(req, res);

assert.equal(res.statusCode, 201);
assert.equal(insertedPayload.length, 1, "should only insert one unique question");
assert.equal(insertedPayload[0].questionText, newQuestion.questionText);
assert.deepEqual(res.body, {
  success: true,
  data: {
    insertedCount: 1,
    skippedCount: 2,
    questions: [
      {
        _id: "new-1",
        ...newQuestion
      }
    ]
  }
});

Question.find = originalFind;
Question.insertMany = originalInsertMany;

console.log("Admin controller bulk import tests passed");
