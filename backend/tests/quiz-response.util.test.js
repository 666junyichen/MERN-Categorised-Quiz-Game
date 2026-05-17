import assert from "node:assert/strict";
import {
  buildLeaderboardEntry,
  buildLeaderboardPayload,
  buildQuizQuestionsPayload,
  buildQuizSubmissionPayload,
  normalizeQuizCategories
} from "../utils/quizResponse.js";

const sampleQuestion = {
  _id: "question-1",
  questionText: "Which package handles routing in React apps?",
  options: ["axios", "react-router-dom", "mongoose", "bcrypt"],
  correctAnswer: 1,
  category: "React",
  isActive: true
};

{
  const payload = buildQuizQuestionsPayload([sampleQuestion]);

  assert.deepEqual(payload, {
    count: 1,
    questions: [
      {
        _id: "question-1",
        questionText: "Which package handles routing in React apps?",
        options: ["axios", "react-router-dom", "mongoose", "bcrypt"],
        category: "React"
      }
    ]
  });
}

{
  const categories = normalizeQuizCategories([" Node ", "", "React", "  ", "Express"]);

  assert.deepEqual(categories, ["Express", "Node", "React"]);
}

{
  const answers = [
    {
      questionId: "question-1",
      selectedAnswer: 1,
      correctAnswer: 1,
      isCorrect: true
    }
  ];

  assert.deepEqual(buildQuizSubmissionPayload("attempt-1", 1, answers), {
    attemptId: "attempt-1",
    score: 1,
    totalQuestions: 1,
    answers
  });
}

{
  assert.deepEqual(
    buildLeaderboardEntry({
      score: 5,
      createdAt: "2026-05-11T07:00:00.000Z"
    }),
    {
      userId: null,
      username: "Unknown",
      score: 5,
      createdAt: "2026-05-11T07:00:00.000Z"
    }
  );
}

{
  const leaderboard = [
    {
      userId: "user-1",
      username: "player1",
      score: 8,
      createdAt: "2026-05-11T07:00:00.000Z"
    }
  ];

  assert.deepEqual(buildLeaderboardPayload("best", leaderboard), {
    mode: "best",
    leaderboard
  });
}

console.log("Quiz response helper tests passed");
