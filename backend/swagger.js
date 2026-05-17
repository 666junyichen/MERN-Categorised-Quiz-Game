import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Quiz Game API",
      version: "1.0.0",
      description: "COMP5347 Assignment 2 — Categorised Quiz Game REST API",
    },
    servers: [
      { url: "http://localhost:5000/api", description: "Local dev server" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            username: { type: "string" },
            role: { type: "string", enum: ["user", "admin"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Question: {
          type: "object",
          required: ["questionText", "options", "correctAnswer", "category"],
          properties: {
            _id: { type: "string" },
            questionText: { type: "string" },
            options: {
              type: "array",
              items: { type: "string" },
              minItems: 4,
              maxItems: 4,
            },
            correctAnswer: { type: "integer", minimum: 0, maximum: 3 },
            category: { type: "string" },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Score: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: { type: "string" },
            username: { type: "string" },
            score: { type: "integer" },
            totalQuestions: { type: "integer" },
            answers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  questionId: { type: "string" },
                  selectedAnswer: { type: "integer" },
                  correctAnswer: { type: "integer" },
                  isCorrect: { type: "boolean" },
                },
              },
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string" },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Registration and login" },
      { name: "Admin", description: "Question CRUD and bulk import (admin only)" },
      { name: "Quiz", description: "Take quiz, view history and leaderboard" },
    ],
    paths: {
      // ── Auth ──
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["username", "password"],
                  properties: {
                    username: { type: "string", minLength: 3 },
                    password: { type: "string", minLength: 6 },
                    role: { type: "string", enum: ["user", "admin"] },
                    adminSecret: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "User created" },
            400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login and get JWT token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["username", "password"],
                  properties: {
                    username: { type: "string" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Login successful — returns token and user" },
            401: { description: "Invalid credentials" },
            429: { description: "Too many attempts — rate limited" },
          },
        },
      },

      // ── Admin ──
      "/admin/questions": {
        get: {
          tags: ["Admin"],
          summary: "List all questions (paginated)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 5 } },
            { name: "status", in: "query", schema: { type: "string", enum: ["active", "inactive"] } },
            { name: "category", in: "query", schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Paginated question list" },
            401: { description: "Unauthorized" },
            403: { description: "Forbidden — admin only" },
          },
        },
        post: {
          tags: ["Admin"],
          summary: "Create a single question",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/Question" } } },
          },
          responses: {
            201: { description: "Question created" },
            400: { description: "Validation error" },
          },
        },
      },
      "/admin/questions/{id}": {
        put: {
          tags: ["Admin"],
          summary: "Update a question",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/Question" } } },
          },
          responses: {
            200: { description: "Question updated" },
            404: { description: "Not found" },
          },
        },
        delete: {
          tags: ["Admin"],
          summary: "Delete a question",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Question deleted" },
            404: { description: "Not found" },
          },
        },
      },
      "/admin/questions/{id}/toggle": {
        patch: {
          tags: ["Admin"],
          summary: "Toggle question active/inactive status",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Status toggled" },
            404: { description: "Not found" },
          },
        },
      },
      "/admin/questions/bulk-import": {
        post: {
          tags: ["Admin"],
          summary: "Bulk import questions (skips duplicates)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    { type: "object", properties: { questions: { type: "array", items: { $ref: "#/components/schemas/Question" } } } },
                    { type: "array", items: { $ref: "#/components/schemas/Question" } },
                  ],
                },
              },
            },
          },
          responses: {
            201: { description: "Questions imported — returns insertedCount and skippedCount" },
            200: { description: "All items were duplicates — none inserted" },
            400: { description: "Validation error" },
          },
        },
      },

      // ── Quiz ──
      "/quiz/questions": {
        get: {
          tags: ["Quiz"],
          summary: "Get questions for a new quiz session",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "count", in: "query", schema: { type: "integer", default: 6 } },
            { name: "category", in: "query", schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Randomized active questions" },
            400: { description: "Invalid count or category" },
          },
        },
      },
      "/quiz/categories": {
        get: {
          tags: ["Quiz"],
          summary: "List all available categories from active questions",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Array of category strings" },
          },
        },
      },
      "/quiz/submit": {
        post: {
          tags: ["Quiz"],
          summary: "Submit quiz answers for scoring",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    answers: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          questionId: { type: "string" },
                          selectedAnswer: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Quiz scored — returns score, total, and per-question results" },
            400: { description: "Validation error" },
            429: { description: "Too many submissions — rate limited" },
          },
        },
      },
      "/quiz/attempts": {
        get: {
          tags: ["Quiz"],
          summary: "Get current user's quiz attempt history",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Array of score records with per-question review data" },
          },
        },
      },
      "/quiz/leaderboard": {
        get: {
          tags: ["Quiz"],
          summary: "Get leaderboard",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "mode", in: "query", schema: { type: "string", enum: ["best", "all"], default: "best" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          ],
          responses: {
            200: { description: "Leaderboard entries" },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
