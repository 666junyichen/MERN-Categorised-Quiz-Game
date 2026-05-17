import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question"
  },
  selectedAnswer: Number,
  correctAnswer: Number,
  isCorrect: Boolean
});

const scoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  score: {
    type: Number,
    required: true
  },
  answers: [answerSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Score", scoreSchema);