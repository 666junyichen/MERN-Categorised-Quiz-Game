import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ChevronLeft, ChevronRight, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const optionLabels = ["A", "B", "C", "D"];

export default function AdminQuestionTable({
  questions = [],
  isLoading = false,
  activeActionId = null,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onEdit,
  onDelete,
  onToggle,
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Question List</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!questions.length) {
    return (
      <Card>
        <CardHeader><CardTitle>Question List</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No questions yet. Create your first question.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Question List</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {questions.map((question, index) => {
            const id = question._id;
            const isActionLoading = activeActionId === id;

            return (
              <article key={id ?? `${question.questionText}-${index}`} className="border rounded-lg p-3 bg-secondary/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  <Badge variant={question.isActive ? "success" : "warning"}>
                    {question.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <p className="font-semibold mb-2">{question.questionText}</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Category: <strong>{question.category || "-"}</strong>
                </p>

                <ul className="ml-4 mb-2.5 flex flex-col gap-1 text-sm">
                  {(question.options ?? []).map((option, optionIndex) => (
                    <li
                      key={`${id}-${optionIndex}`}
                      className={
                        optionIndex === question.correctAnswer
                          ? "text-success font-semibold"
                          : "text-muted-foreground"
                      }
                    >
                      {optionLabels[optionIndex] ?? optionIndex}. {option}
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-muted-foreground mb-3">Created: {formatDate(question.createdAt)}</p>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit?.(question)}
                    disabled={isActionLoading}
                    className="border-primary/50 text-primary hover:bg-primary/10 h-8"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggle?.(question)}
                    disabled={isActionLoading}
                    className="border-warning/50 text-warning hover:bg-warning/10 h-8"
                  >
                    {question.isActive ? (
                      <><PowerOff className="h-3.5 w-3.5 mr-1" /> Disable</>
                    ) : (
                      <><Power className="h-3.5 w-3.5 mr-1" /> Enable</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete?.(question)}
                    disabled={isActionLoading}
                    className="border-destructive/50 text-destructive hover:bg-destructive/10 h-8"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="flex justify-center items-center gap-3 mt-4 pt-3 border-t">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
