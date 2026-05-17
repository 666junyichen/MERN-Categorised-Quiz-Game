import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const answerLabels = ["A", "B", "C", "D"];

const questionSchema = z.object({
  questionText: z.string().trim().min(1, "Question text is required"),
  option0: z.string().trim().min(1, "Option 1 is required"),
  option1: z.string().trim().min(1, "Option 2 is required"),
  option2: z.string().trim().min(1, "Option 3 is required"),
  option3: z.string().trim().min(1, "Option 4 is required"),
  correctAnswer: z.coerce
    .number()
    .int("Correct answer must be an integer")
    .min(0, "Correct answer must be between 0 and 3")
    .max(3, "Correct answer must be between 0 and 3"),
  category: z.string().trim().min(1, "Category is required"),
  isActive: z.boolean(),
});

const toFormValues = (initialValues) => {
  const safe = initialValues ?? {};
  return {
    questionText: safe.questionText ?? "",
    option0: safe.options?.[0] ?? "",
    option1: safe.options?.[1] ?? "",
    option2: safe.options?.[2] ?? "",
    option3: safe.options?.[3] ?? "",
    correctAnswer: typeof safe.correctAnswer === "number" ? safe.correctAnswer : 0,
    category: safe.category ?? "",
    isActive: typeof safe.isActive === "boolean" ? safe.isActive : true,
  };
};

export default function AdminQuestionForm({
  initialValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save Question",
  onCancel,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: toFormValues(initialValues),
  });

  useEffect(() => {
    reset(toFormValues(initialValues));
  }, [initialValues, reset]);

  const handleFormSubmit = async (values) => {
    const payload = {
      questionText: values.questionText.trim(),
      options: [
        values.option0.trim(),
        values.option1.trim(),
        values.option2.trim(),
        values.option3.trim(),
      ],
      correctAnswer: Number(values.correctAnswer),
      category: values.category.trim(),
      isActive: Boolean(values.isActive),
    };
    await onSubmit(payload);
  };

  const inputClassName = "w-full";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Question Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-2">
          <Label>Question</Label>
          <Textarea {...register("questionText")} rows={3} placeholder="Enter question text" />
          {errors.questionText && <p className="text-xs text-destructive">{errors.questionText.message}</p>}

          <Label>Option 1</Label>
          <Input {...register("option0")} placeholder="Option 1" className={inputClassName} />
          {errors.option0 && <p className="text-xs text-destructive">{errors.option0.message}</p>}

          <Label>Option 2</Label>
          <Input {...register("option1")} placeholder="Option 2" className={inputClassName} />
          {errors.option1 && <p className="text-xs text-destructive">{errors.option1.message}</p>}

          <Label>Option 3</Label>
          <Input {...register("option2")} placeholder="Option 3" className={inputClassName} />
          {errors.option2 && <p className="text-xs text-destructive">{errors.option2.message}</p>}

          <Label>Option 4</Label>
          <Input {...register("option3")} placeholder="Option 4" className={inputClassName} />
          {errors.option3 && <p className="text-xs text-destructive">{errors.option3.message}</p>}

          <Label>Correct Answer</Label>
          <Select {...register("correctAnswer")} className={inputClassName}>
            <option value={0}>{answerLabels[0]} - Option 1</option>
            <option value={1}>{answerLabels[1]} - Option 2</option>
            <option value={2}>{answerLabels[2]} - Option 3</option>
            <option value={3}>{answerLabels[3]} - Option 4</option>
          </Select>
          {errors.correctAnswer && <p className="text-xs text-destructive">{errors.correctAnswer.message}</p>}

          <Label>Category</Label>
          <Input {...register("category")} placeholder="e.g. Node.js" className={inputClassName} />
          {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}

          <label className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Checkbox {...register("isActive")} />
            Active
          </label>

          <div className="flex gap-2.5 mt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
