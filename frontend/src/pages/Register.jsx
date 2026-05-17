import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import API from "../api/api";
import ThemeToggle from "../components/ThemeToggle";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";

const schema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    registerAsAdmin: z.boolean().default(false),
    adminSecret: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.registerAsAdmin && !value.adminSecret?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["adminSecret"],
        message: "Admin secret is required when registering as admin",
      });
    }
  });

export default function Register() {
  const navigate = useNavigate();
  const [showAdminSecret, setShowAdminSecret] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { registerAsAdmin: false, adminSecret: "" },
  });

  const onSubmit = async (data) => {
    setServerError("");
    setIsSubmitting(true);
    try {
      const payload = { username: data.username, password: data.password };
      if (data.registerAsAdmin) {
        payload.role = "admin";
        payload.adminSecret = data.adminSecret.trim();
      }
      await API.post("/auth/register", payload);
      navigate("/", { state: { registered: true } });
    } catch (err) {
      setServerError(
        err?.response?.data?.error ||
          (err?.message === "Network Error"
            ? "Cannot connect to backend. Please start backend server on port 5000."
            : err?.message) ||
          "Register failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="absolute top-5 right-5">
        <ThemeToggle variant="inline" />
      </div>
      <Card className="w-full max-w-sm backdrop-blur-sm bg-card/80 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Quiz Game</CardTitle>
          <CardDescription>Create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
            <Input placeholder="Username" {...register("username")} />
            {errors.username && (
              <p className="text-xs text-destructive min-h-[16px]">{errors.username.message}</p>
            )}

            <Input type="password" placeholder="Password" {...register("password")} />
            {errors.password && (
              <p className="text-xs text-destructive min-h-[16px]">{errors.password.message}</p>
            )}

            <label className="flex items-center gap-2 text-sm text-muted-foreground my-1">
              <Checkbox
                {...register("registerAsAdmin", {
                  onChange: (event) => setShowAdminSecret(event.target.checked),
                })}
              />
              Register as admin
            </label>

            {showAdminSecret && (
              <>
                <Input
                  type="password"
                  placeholder="Admin Secret"
                  {...register("adminSecret")}
                />
                {errors.adminSecret && (
                  <p className="text-xs text-destructive min-h-[16px]">{errors.adminSecret.message}</p>
                )}
              </>
            )}

            {serverError && (
              <div className="my-2 p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm">
                {serverError}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="mt-2">
              {isSubmitting ? "Registering..." : "Register"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/" className="text-primary hover:underline font-medium">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
