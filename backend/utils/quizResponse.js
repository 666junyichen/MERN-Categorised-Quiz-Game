export const toSafeQuestion = (question) => ({
  _id: question._id,
  questionText: question.questionText,
  options: question.options,
  category: question.category
});

export const buildQuizQuestionsPayload = (questions) => {
  const safeQuestions = questions.map(toSafeQuestion);

  return {
    count: safeQuestions.length,
    questions: safeQuestions
  };
};

export const normalizeQuizCategories = (categories) =>
  categories
    .filter((category) => typeof category === "string" && category.trim() !== "")
    .map((category) => category.trim())
    .sort((a, b) => a.localeCompare(b));

export const buildQuizSubmissionPayload = (attemptId, score, answers) => ({
  attemptId,
  score,
  totalQuestions: answers.length,
  answers
});

export const buildLeaderboardEntry = ({ userId, username, score, createdAt }) => ({
  userId: userId ?? null,
  username: username ?? "Unknown",
  score,
  createdAt
});

export const buildLeaderboardPayload = (mode, leaderboard) => ({
  mode,
  leaderboard
});
