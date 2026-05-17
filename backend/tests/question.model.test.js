import assert from "node:assert/strict";
import Question from "../models/Question.js";

const getValidationErrors = (questionData) => {
  const question = new Question(questionData);
  return question.validateSync()?.errors ?? {};
};

const validQuestion = {
  questionText: "Which database is used in the MERN stack?",
  options: ["MySQL", "MongoDB", "PostgreSQL", "SQLite"],
  correctAnswer: 1,
  category: "MongoDB"
};

{
  const errors = getValidationErrors(validQuestion);
  assert.deepEqual(Object.keys(errors), []);
}

{
  const errors = getValidationErrors({
    ...validQuestion,
    category: ""
  });
  assert.ok(errors.category, "category should be required");
}

{
  const errors = getValidationErrors({
    ...validQuestion,
    options: ["A", "B", "C"]
  });
  assert.ok(errors.options, "options should contain exactly 4 answers");
}

{
  const errors = getValidationErrors({
    ...validQuestion,
    correctAnswer: 4
  });
  assert.ok(errors.correctAnswer, "correctAnswer should be between 0 and 3");
}

{
  const errors = getValidationErrors({
    ...validQuestion,
    correctAnswer: 1.5
  });
  assert.ok(errors.correctAnswer, "correctAnswer should be an integer index");
}

console.log("Question model validation tests passed");
