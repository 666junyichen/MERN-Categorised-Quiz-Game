import assert from "node:assert/strict";
import Question from "../models/Question.js";
import { getQuizQuestions } from "../controllers/quiz.controller.js";

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
const originalDistinct = Question.distinct;

{
  const req = {
    query: { count: "five" }
  };
  const res = createRes();

  await getQuizQuestions(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    success: false,
    error: "Question count must be a whole number between 6 and 10."
  });
}

{
  const req = {
    query: { count: "4" }
  };
  const res = createRes();

  await getQuizQuestions(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    success: false,
    error: "Question count must be between 6 and 10."
  });
}

{
  Question.distinct = async () => ["React", "Node"];

  const req = {
    query: { category: "MongoDB" }
  };
  const res = createRes();

  await getQuizQuestions(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    success: false,
    error:
      'Category "MongoDB" is not available for quizzes right now. Please choose one of the available categories.'
  });
}

{
  Question.distinct = async () => ["React"];
  Question.find = async () => [
    {
      _id: "q1",
      questionText: "Question 1",
      options: ["A", "B", "C", "D"],
      category: "React"
    },
    {
      _id: "q2",
      questionText: "Question 2",
      options: ["A", "B", "C", "D"],
      category: "React"
    }
  ];

  const req = {
    query: { category: "React" }
  };
  const res = createRes();

  await getQuizQuestions(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    success: false,
    error:
      'Category "React" does not have enough active questions to start a quiz. At least 6 active questions are required.'
  });
}

Question.find = originalFind;
Question.distinct = originalDistinct;

console.log("Quiz controller validation tests passed");
