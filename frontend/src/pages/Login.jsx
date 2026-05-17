import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import API from "../api/api";
import ThemeToggle from "../components/ThemeToggle";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";

const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const successMessage = location.state?.registered
    ? "Registration successful! Please login."
    : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setServerError("");
    setIsSubmitting(true);
    try {
      const res = await API.post("/auth/login", data);
      const payload = res.data?.data ?? res.data ?? {};
      const token = payload.token;
      const user = payload.user;
      const role = String(user?.role ?? "").toLowerCase();

      if (!token || !user || !role) {
        setServerError("Login response is invalid");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (role === "admin") navigate("/admin");
      else if (role === "user") navigate("/quiz");
      else setServerError(`Unknown role: ${role}`);
    } catch (err) {
      setServerError(
        err?.response?.data?.error ||
          (err?.message === "Network Error"
            ? "Cannot connect to backend. Please start backend server on port 5000."
            : err?.message) ||
          "Login failed"
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
          <CardDescription>Welcome back</CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage && (
            <div className="mb-4 p-3 rounded-lg border border-success/30 bg-success/10 text-success text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
            <Input
              placeholder="Username"
              {...register("username")}
            />
            {errors.username && (
              <p className="text-xs text-destructive min-h-[16px]">{errors.username.message}</p>
            )}

            <Input
              type="password"
              placeholder="Password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive min-h-[16px]">{errors.password.message}</p>
            )}

            {serverError && (
              <div className="my-2 p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm">
                {serverError}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="mt-2">
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            No account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
