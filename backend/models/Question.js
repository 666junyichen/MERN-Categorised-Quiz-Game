import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) =>
        Array.isArray(arr) &&
        arr.length === 4 &&
        arr.every((option) => typeof option === "string" && option.trim().length > 0),
      message: "Question must have exactly 4 non-empty options"
    }
  },
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    max: 3,
    validate: {
      validator: Number.isInteger,
      message: "Correct answer must be an integer option index"
    }
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model("Question", questionSchema);
