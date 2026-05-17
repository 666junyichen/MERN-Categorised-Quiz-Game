import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

const questionItemSchema = z.object({
  questionText: z.string().trim().min(1, "questionText is required"),
  options: z
    .array(z.string().trim().min(1, "Each option must be non-empty"))
    .length(4, "Each question must have exactly 4 options"),
  correctAnswer: z
    .number()
    .int("correctAnswer must be an integer")
    .min(0, "correctAnswer must be between 0 and 3")
    .max(3, "correctAnswer must be between 0 and 3"),
  category: z.string().trim().min(1, "category is required"),
  isActive: z.boolean().optional(),
});

const parsedPayloadSchema = z.union([
  z.array(questionItemSchema).min(1, "At least one question is required"),
  z.object({
    questions: z.array(questionItemSchema).min(1, "At least one question is required"),
  }),
]);

const importSchema = z.object({
  rawJson: z.string().trim().min(1, "JSON content is required"),
}).superRefine((value, context) => {
  try {
    const parsed = JSON.parse(value.rawJson);
    const result = parsedPayloadSchema.safeParse(parsed);
    if (!result.success) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.error.issues[0]?.message || "Invalid bulk import payload",
        path: ["rawJson"],
      });
    }
  } catch {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid JSON format",
      path: ["rawJson"],
    });
  }
});

const examplePayload = `{
  "questions": [
    {
      "questionText": "Which environment variable is commonly used to store the server port in Node.js?",
      "options": ["PORT", "SERVER_NAME", "NODE_ENV", "APP_SECRET"],
      "correctAnswer": 0,
      "category": "Node.js",
      "isActive": true
    },
    {
      "questionText": "Which Express feature is commonly used to organise API endpoints?",
      "options": ["Schema", "Router", "Collection", "Hook"],
      "correctAnswer": 1,
      "category": "Express",
      "isActive": true
    },
    {
      "questionText": "MongoDB is best described as which type of database?",
      "options": ["Relational", "NoSQL document", "Graph", "Spreadsheet"],
      "correctAnswer": 1,
      "category": "MongoDB",
      "isActive": true
    }
  ]
}`;

export default function AdminBulkImport({ onSubmit, isSubmitting = false }) {
  const {
    register,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(importSchema),
    defaultValues: { rawJson: "" },
  });

  const handleImport = async (values) => {
    const parsed = JSON.parse(values.rawJson);
    const payload = Array.isArray(parsed) ? { questions: parsed } : parsed;
    await onSubmit(payload);
    reset({ rawJson: "" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Import Questions</CardTitle>
        <CardDescription>Paste JSON and import multiple questions at once.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleImport)} className="flex flex-col gap-2">
          <Textarea
            {...register("rawJson")}
            rows={12}
            placeholder='Use {"questions":[...]} or [...] format'
            className="font-mono text-xs leading-relaxed"
          />
          {errors.rawJson && <p className="text-xs text-destructive">{errors.rawJson.message}</p>}

          <div className="flex gap-2 flex-wrap">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Importing..." : "Import JSON"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setValue("rawJson", examplePayload, { shouldValidate: true })}
            >
              Fill Example
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => reset({ rawJson: "" })}
            >
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
