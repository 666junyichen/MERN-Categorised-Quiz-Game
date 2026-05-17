import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QuizProvider, useQuiz } from "../context/QuizContext";
import ThemeToggle from "../components/ThemeToggle";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Select } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Toaster, toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  RefreshCw,
  Trophy,
  AlertCircle,
  Loader2,
} from "lucide-react";

const answerLabels = ["A", "B", "C", "D"];
const quizCountOptions = [6, 7, 8, 9, 10];
const leaderboardModes = [
  { id: "best", label: "Best Score" },
  { id: "all", label: "All Attempts" },
];

function StatusNotice({ title, message, tone = "info", actionLabel, onAction }) {
  const toneStyles = {
    error: "border-destructive/30 bg-destructive/10 text-destructive",
    warning: "border-warning/30 bg-warning/10 text-warning",
    info: "border-border bg-secondary/30 text-foreground",
  };

  return (
    <div
      className={`flex justify-between items-start gap-3 rounded-xl p-3.5 mb-3.5 text-left border ${toneStyles[tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <div className="flex flex-col gap-1">
        <p className="m-0 font-bold text-sm">{title}</p>
        <p className="m-0 text-sm opacity-80 leading-relaxed">{message}</p>
      </div>
      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className="shrink-0"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

function LoadingState({ title, message, lines = 3 }) {
  return (
    <div className="w-full max-w-[520px] mx-auto flex flex-col gap-3.5 text-left" role="status">
      <div className="w-[52px] h-[52px] rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
      <div>
        <p className="text-xl font-bold m-0">{title}</p>
        <p className="text-muted-foreground mt-1.5">{message}</p>
      </div>
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="border rounded-xl p-3.5 bg-secondary/30">
            <Skeleton className={`h-3 rounded-full mb-2.5 ${i % 2 === 0 ? "w-[78%]" : "w-[54%]"}`} />
            <Skeleton className="h-3 rounded-full w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizContent() {
  const navigate = useNavigate();
  const { state, dispatch, fetchQuiz, loadCategories, submitQuiz, loadAttempts, loadLeaderboard } =
    useQuiz();

  const {
    activeMenu,
    count,
    category,
    categories,
    categoriesLoading,
    categoriesError,
    quizStarted,
    questions,
    currentIndex,
    selectedAnswers,
    quizLoading,
    quizError,
    submitting,
    result,
    submitError,
    attempts,
    attemptsLoading,
    attemptsError,
    openAttemptId,
    leaderboard,
    leaderboardLoading,
    leaderboardMode,
    leaderboardError,
  } = state;

  const currentQuestion = questions[currentIndex] ?? null;
  const isLastQuestion = currentIndex === questions.length - 1;
  const selectedAnswer =
    currentQuestion && Object.prototype.hasOwnProperty.call(selectedAnswers, currentQuestion._id)
      ? selectedAnswers[currentQuestion._id]
      : null;
  const hasInProgressQuiz = quizStarted && questions.length > 0 && !result;
  const historyGuardRef = useRef(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const questionCountSelectId = useId();
  const categorySelectId = useId();
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === "undefined" ? 1280 : window.innerWidth
  );

  const isMobile = viewportWidth <= 720;
  const isCompact = viewportWidth <= 560;

  const progressText = useMemo(
    () => `${Math.min(currentIndex + 1, questions.length)} / ${questions.length || 0}`,
    [currentIndex, questions.length]
  );

  const configErrorMessage = quizError || (!quizStarted ? submitError : "");
  const categoryHelperText = categoriesLoading
    ? "Loading available categories..."
    : categoriesError
      ? `${categoriesError} You can still start a quiz using all active questions.`
      : categories.length === 0
        ? "No category list is available right now. You can still start a quiz using all active questions."
        : "Choose a category to focus the quiz, or leave it on All Categories.";

  const confirmQuizLeave = (message, onConfirm) => {
    if (!hasInProgressQuiz) { onConfirm(); return; }
    setConfirmDialog({ title: "Leave Quiz?", message, onConfirm });
  };

  useEffect(() => {
    loadAttempts();
    loadCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (activeMenu === "leaderboard") loadLeaderboard(leaderboardMode);
  }, [activeMenu, leaderboardMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (result) {
      toast.success(`Quiz completed! Score: ${result.score} / ${result.totalQuestions}`);
    }
  }, [result]);

  useEffect(() => {
    if (!hasInProgressQuiz) return;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const handlePopState = () => {
      if (historyGuardRef.current) {
        historyGuardRef.current = false;
        return;
      }
      if (!window.confirm("Leave this quiz and discard your current progress? Your answers have not been submitted yet.")) {
        historyGuardRef.current = true;
        window.history.go(1);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasInProgressQuiz]);

  const handleStartQuiz = async () => {
    dispatch({ type: "START_QUIZ" });
    const success = await fetchQuiz();
    if (success && state.questions.length === 0) {
      // fetchQuiz will dispatch error if no questions
    }
    // Re-read questions from closure — the dispatch updated state asynchronously
  };

  const handleNextQuestion = async () => {
    if (!currentQuestion || selectedAnswer === null) return;
    if (isLastQuestion) {
      await submitQuiz();
      await loadAttempts();
      return;
    }
    dispatch({ type: "NEXT_QUESTION" });
  };

  const handlePreviousQuestion = () => dispatch({ type: "PREV_QUESTION" });

  const handleMenuChange = (menu) => {
    if (menu === activeMenu) return;
    if (activeMenu === "quiz" && menu !== "quiz") {
      confirmQuizLeave(
        "Leave this quiz for now? Your progress is not submitted yet, but you can return and continue later.",
        () => dispatch({ type: "SET_ACTIVE_MENU", menu })
      );
      return;
    }
    dispatch({ type: "SET_ACTIVE_MENU", menu });
  };

  const handleLogout = () => {
    confirmQuizLeave("Log out and discard your current quiz progress? Your answers will be lost.", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    });
  };

  const handleResetQuiz = () => {
    confirmQuizLeave("Leave this quiz and discard your current progress? Your answers will be lost.", () => {
      dispatch({ type: "RESET_QUIZ" });
    });
  };

  const renderAttemptReview = (attempt, reviewId) => (
    <div id={reviewId} className="flex flex-col gap-2 p-2.5">
      {(attempt.answers ?? []).map((answer, index) => {
        const question = answer.questionId;
        const selectedIndex = answer.selectedAnswer;
        const correctIndex =
          typeof answer.correctAnswer === "number" ? answer.correctAnswer : question?.correctAnswer;
        const selectedText = question?.options?.[selectedIndex] ?? "-";
        const correctText = question?.options?.[correctIndex] ?? "-";
        return (
          <article key={`${attempt._id}-${index}`} className="border rounded-lg p-2.5 bg-secondary/20">
            <p className="font-semibold m-0 mb-1.5">
              {index + 1}. {question?.questionText ?? "Question unavailable"}
            </p>
            <p className={`m-0 mb-1 ${answer.isCorrect ? "text-success" : "text-destructive"}`}>
              Your answer: {answerLabels[selectedIndex] ?? selectedIndex}. {selectedText}
            </p>
            {!answer.isCorrect && (
              <p className="m-0 text-muted-foreground">
                Correct answer: {answerLabels[correctIndex] ?? correctIndex}. {correctText}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );

  const renderCurrentQuizReview = () => {
    if (!result?.answers || !Array.isArray(result.answers) || result.answers.length === 0) return null;
    const questionMap = new Map(questions.map((q) => [String(q._id), q]));
    return (
      <div className="my-3.5 text-left">
        <h2 className="text-xl font-bold mb-2">Quiz Review</h2>
        <div className="flex flex-col gap-2">
          {result.answers.map((answer, index) => {
            const question = questionMap.get(String(answer.questionId));
            const selectedIndex = answer.selectedAnswer;
            const correctIndex = answer.correctAnswer;
            const selectedText = question?.options?.[selectedIndex] ?? "-";
            const correctText = question?.options?.[correctIndex] ?? "-";
            return (
              <article key={`${answer.questionId}-${index}`} className="border rounded-lg p-2.5 bg-secondary/20">
                <p className="font-semibold m-0 mb-1.5">
                  {index + 1}. {question?.questionText ?? "Question unavailable"}
                </p>
                <p className={`m-0 mb-1 ${answer.isCorrect ? "text-success" : "text-destructive"}`}>
                  Your answer: {answerLabels[selectedIndex] ?? selectedIndex}. {selectedText}
                </p>
                <p className="m-0 text-muted-foreground">
                  Correct answer: {answerLabels[correctIndex] ?? correctIndex}. {correctText}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    );
  };

  if (quizLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="absolute top-5 right-5">
          <ThemeToggle variant="inline" />
        </div>
        <Card className="text-center min-h-[420px] flex flex-col items-center justify-center p-8">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <h1 className="text-2xl font-bold mb-2">Preparing your quiz...</h1>
          <p className="text-muted-foreground">Fetching active questions for your selected quiz settings.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isCompact ? "p-4" : ""}`}>
      <Toaster position="top-right" richColors />

      <div className="flex items-center justify-end gap-2.5 mb-4 flex-wrap">
        <ThemeToggle variant="inline" />
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-1" /> Logout
        </Button>
      </div>

      <Tabs value={activeMenu} onValueChange={handleMenuChange} className="w-full">
        <TabsList className={`mb-4 ${isMobile ? "w-full" : ""}`}>
          <TabsTrigger value="quiz" className={isMobile ? "flex-1" : ""}>
            Answer Quiz
          </TabsTrigger>
          <TabsTrigger value="history" className={isMobile ? "flex-1" : ""}>
            View Quiz History
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className={isMobile ? "flex-1" : ""}>
            Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* QUIZ TAB */}
        <TabsContent value="quiz">
          <Card className="text-center min-h-[420px]">
            <CardContent className="pt-6">
              {result ? (
                <>
                  <h1 className="text-2xl font-bold mb-2">Quiz Complete</h1>
                  <p className="text-muted-foreground mb-4">
                    Your score: <strong className="text-primary text-lg">{result.score}</strong> / {result.totalQuestions}
                  </p>
                  {renderCurrentQuizReview()}
                  <Button onClick={handleResetQuiz}>Configure New Quiz</Button>
                </>
              ) : !quizStarted ? (
                <div className="min-h-[320px] flex flex-col justify-center items-center gap-2.5">
                  {categoriesLoading && categories.length === 0 && !categoriesError ? (
                    <LoadingState
                      title="Loading quiz setup"
                      message="Preparing your configuration options and available categories."
                      lines={2}
                    />
                  ) : (
                    <>
                      <h2 className="text-xl font-bold mb-2">Configure Quiz</h2>
                      {configErrorMessage && (
                        <StatusNotice
                          title={category ? "Unable to start selected quiz" : "Unable to start quiz"}
                          message={category && quizError
                            ? `${quizError} Try a different category or switch back to All Categories.`
                            : configErrorMessage}
                          tone="error"
                        />
                      )}
                      {categoriesLoading && (
                        <StatusNotice
                          title="Refreshing categories"
                          message="Updating the available quiz categories."
                        />
                      )}
                      <div className={`flex justify-center items-end gap-2.5 flex-wrap mb-3.5 ${isMobile ? "flex-col items-stretch w-full" : ""}`}>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor={questionCountSelectId} className="text-muted-foreground">
                            Question Count
                          </Label>
                          <Select
                            id={questionCountSelectId}
                            value={count}
                            onChange={(e) => dispatch({ type: "SET_COUNT", count: Number(e.target.value) })}
                          >
                            {quizCountOptions.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor={categorySelectId} className="text-muted-foreground">
                            Category
                          </Label>
                          <Select
                            id={categorySelectId}
                            value={category}
                            onChange={(e) => dispatch({ type: "SET_CATEGORY", category: e.target.value })}
                            disabled={categoriesLoading}
                          >
                            <option value="">
                              {categoriesLoading ? "Loading categories..." : "All Categories"}
                            </option>
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </Select>
                        </div>
                        <Button
                          onClick={handleStartQuiz}
                          disabled={quizLoading || submitting}
                          className={isMobile ? "w-full" : ""}
                        >
                          {quizLoading ? "Starting Quiz..." : "Start Quiz"}
                        </Button>
                      </div>
                      <p className={`max-w-[560px] text-sm leading-relaxed ${categoriesError ? "text-destructive" : "text-muted-foreground"}`}>
                        {categoryHelperText}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetQuiz}
                      disabled={submitting}
                    >
                      {submitting ? "Submitting Quiz..." : "Back to Configuration"}
                    </Button>
                  </div>
                  <p className="text-muted-foreground font-semibold mb-2">
                    Question {progressText}
                  </p>
                  {submitError && (
                    <StatusNotice
                      title="Could not submit quiz"
                      message={`${submitError} Your selected answers are still saved on this page, so you can try again.`}
                      tone="error"
                    />
                  )}
                  {currentQuestion ? (
                    <>
                      <h1 className={`font-bold mb-4 leading-relaxed ${isMobile ? "text-2xl" : "text-3xl"}`}>
                        {currentQuestion.questionText}
                      </h1>
                      <div className={`flex mb-2.5 ${isMobile ? "justify-start" : "justify-end"}`}>
                        <Badge variant="secondary" className="text-xs">
                          {currentQuestion.category || "Uncategorized"}
                        </Badge>
                      </div>
                      <div className={`flex flex-col gap-2.5 mb-4 text-left`}>
                        {currentQuestion.options.map((option, index) => {
                          const isSelected = selectedAnswer === index;
                          return (
                            <Button
                              key={`${currentQuestion._id}-${index}`}
                              variant={isSelected ? "default" : "outline"}
                              onClick={() =>
                                dispatch({
                                  type: "SELECT_ANSWER",
                                  questionId: currentQuestion._id,
                                  selectedAnswer: index,
                                })
                              }
                              disabled={submitting}
                              className={`justify-start h-auto py-3 px-3.5 font-normal ${
                                isSelected ? "ring-2 ring-ring ring-offset-2" : ""
                              } ${submitting ? "opacity-60" : ""}`}
                            >
                              <span className="font-bold mr-2 text-lg">{answerLabels[index]}.</span>
                              {option}
                            </Button>
                          );
                        })}
                      </div>
                      <div className={`flex justify-between gap-2.5 ${isMobile ? "flex-col" : ""}`}>
                        <Button
                          variant="outline"
                          onClick={handlePreviousQuestion}
                          disabled={currentIndex === 0 || submitting}
                          className={isMobile ? "w-full" : ""}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          {currentIndex === 0 ? "First Question" : "Previous Question"}
                        </Button>
                        <Button
                          onClick={handleNextQuestion}
                          disabled={selectedAnswer === null || submitting}
                          className={isMobile ? "w-full" : ""}
                        >
                          {isLastQuestion ? "Finish Quiz" : "Next Question"}
                          {!isLastQuestion && <ChevronRight className="h-4 w-4 ml-1" />}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <StatusNotice
                      title="Question unavailable"
                      message="This quiz did not load a valid question. Return to the quiz setup and try again."
                      tone="warning"
                      actionLabel="Back to Configuration"
                      onAction={() => dispatch({ type: "RESET_QUIZ" })}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history">
          <Card className="text-left">
            <CardHeader>
              <div className={`flex justify-between items-center gap-2.5 flex-wrap ${isMobile ? "flex-col items-stretch" : ""}`}>
                <CardTitle>Quiz History</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAttempts}
                  disabled={attemptsLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${attemptsLoading ? "animate-spin" : ""}`} />
                  {attemptsLoading ? "Refreshing..." : "Refresh History"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {attemptsLoading && attempts.length === 0 && (
                <LoadingState
                  title="Loading quiz history"
                  message="Fetching your previous attempts, scores, and answer reviews."
                />
              )}
              {attemptsLoading && attempts.length > 0 && (
                <StatusNotice title="Refreshing quiz history" message="Checking for your latest quiz attempts." />
              )}
              {attemptsError && (
                <StatusNotice
                  title="Could not load quiz history"
                  message={attemptsError}
                  tone="error"
                  actionLabel="Retry"
                  onAction={loadAttempts}
                />
              )}
              {!attemptsLoading && !attemptsError && attempts.length === 0 && (
                <StatusNotice
                  title="No quiz history yet"
                  message="You have not completed a quiz yet. Finish one to review your answers here."
                />
              )}

              <div className="flex flex-col gap-2.5">
                {attempts.map((attempt) => {
                  const isOpen = openAttemptId === attempt._id;
                  const reviewPanelId = `attempt-review-${attempt._id}`;
                  return (
                    <div key={attempt._id} className="border rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "TOGGLE_ATTEMPT", attemptId: attempt._id })}
                        className={`w-full flex justify-between items-center gap-2.5 p-3 bg-secondary/30 hover:bg-secondary/50 transition-colors ${isMobile ? "flex-col items-start" : ""}`}
                        aria-expanded={isOpen}
                        aria-controls={reviewPanelId}
                      >
                        <span className="leading-relaxed break-words">
                          {new Date(attempt.createdAt).toLocaleString()} - Score {attempt.score}/
                          {(attempt.answers ?? []).length}
                        </span>
                        <span className="font-bold text-primary shrink-0">
                          {isOpen ? "Hide" : "View"}
                        </span>
                      </button>
                      {isOpen && renderAttemptReview(attempt, reviewPanelId)}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LEADERBOARD TAB */}
        <TabsContent value="leaderboard">
          <Card className="text-left">
            <CardHeader>
              <div className={`flex justify-between items-center gap-2.5 flex-wrap ${isMobile ? "flex-col items-stretch" : ""}`}>
                <CardTitle>Leaderboard</CardTitle>
                <div className={`flex gap-1.5 ${isMobile ? "flex-wrap w-full" : ""}`}>
                  {leaderboardModes.map((mode) => (
                    <Button
                      key={mode.id}
                      variant={leaderboardMode === mode.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => dispatch({ type: "SET_LEADERBOARD_MODE", mode: mode.id })}
                      className={isMobile ? "flex-1" : ""}
                    >
                      {mode.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {leaderboardLoading && (
                <p className="text-muted-foreground text-center py-4">Loading leaderboard results...</p>
              )}
              {leaderboardError && (
                <StatusNotice
                  title="Could not load leaderboard"
                  message={`${leaderboardError} Please try again.`}
                  tone="error"
                  actionLabel="Retry"
                  onAction={() => loadLeaderboard(leaderboardMode)}
                />
              )}
              {!leaderboardLoading && !leaderboardError && leaderboard.length === 0 && (
                <StatusNotice
                  title="Leaderboard is empty"
                  message={
                    leaderboardMode === "all"
                      ? "No quiz attempts have been recorded yet. Complete a quiz to populate this list."
                      : "No best scores are available yet. Complete a quiz to join the leaderboard."
                  }
                />
              )}
              {leaderboard.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse" aria-label="Quiz leaderboard">
                    <thead>
                      <tr>
                        <th className={`text-left p-2.5 border-b-2 border-border text-xs font-semibold text-muted-foreground ${isCompact ? "p-2" : ""}`}>
                          Rank
                        </th>
                        <th className={`text-left p-2.5 border-b-2 border-border text-xs font-semibold text-muted-foreground ${isCompact ? "p-2" : ""}`}>
                          Player
                        </th>
                        <th className={`text-left p-2.5 border-b-2 border-border text-xs font-semibold text-muted-foreground ${isCompact ? "p-2" : ""}`}>
                          Score
                        </th>
                        <th className={`text-left p-2.5 border-b-2 border-border text-xs font-semibold text-muted-foreground ${isCompact ? "p-2" : ""}`}>
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((entry, index) => (
                        <tr key={`${entry.userId}-${index}`} className="border-b border-border">
                          <td className={`p-2.5 text-sm ${isCompact ? "p-2 text-xs" : ""}`}>
                            {index + 1}
                          </td>
                          <td className={`p-2.5 text-sm ${isCompact ? "p-2 text-xs" : ""}`}>
                            {entry.username ?? "Unknown"}
                          </td>
                          <td className={`p-2.5 text-sm font-bold ${isCompact ? "p-2 text-xs" : ""}`}>
                            {entry.score}
                          </td>
                          <td className={`p-2.5 text-sm ${isCompact ? "p-2 text-xs" : ""}`}>
                            {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        {confirmDialog && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmDialog.title}</DialogTitle>
              <DialogDescription>{confirmDialog.message}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancel</Button>
              <Button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}>
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

export default function Quiz() {
  return (
    <QuizProvider>
      <QuizContent />
    </QuizProvider>
  );
}
