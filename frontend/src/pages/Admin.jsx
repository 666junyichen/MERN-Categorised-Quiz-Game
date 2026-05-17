import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import AdminQuestionForm from "../components/AdminQuestionForm";
import AdminQuestionTable from "../components/AdminQuestionTable";
import AdminBulkImport from "../components/AdminBulkImport";
import ThemeToggle from "../components/ThemeToggle";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Toaster, toast } from "sonner";
import { RefreshCw, LogOut } from "lucide-react";

const PAGE_SIZE = 5;

const getErrorMessage = (err, fallback = "Request failed") =>
  err?.response?.data?.error || err?.message || fallback;

export default function Admin() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [activeActionId, setActiveActionId] = useState(null);

  const loadQuestions = useCallback(async (page = 1) => {
    setIsLoadingQuestions(true);
    try {
      const res = await API.get("/admin/questions", { params: { page, limit: PAGE_SIZE } });
      const data = res.data?.data;
      const list = Array.isArray(data?.questions) ? data.questions : [];
      setQuestions(list);
      setCurrentPage(data?.page ?? page);
      setTotalPages(data?.totalPages ?? 1);
      setTotalCount(data?.totalCount ?? list.length);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load questions"));
    } finally {
      setIsLoadingQuestions(false);
    }
  }, []);

  const loadFirstPage = useCallback(() => loadQuestions(1), [loadQuestions]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadQuestions(1), 0);
    return () => window.clearTimeout(timer);
  }, [loadQuestions]);

  const summary = useMemo(() => {
    const activeCount = questions.filter((item) => item.isActive).length;
    return {
      total: totalCount,
      active: activeCount,
      inactive: totalCount - activeCount,
      pageActive: activeCount,
      pageInactive: questions.length - activeCount,
    };
  }, [questions, totalCount]);

  const handleFormSubmit = async (payload) => {
    setIsSavingForm(true);
    try {
      if (editingQuestion?._id) {
        await API.put(`/admin/questions/${editingQuestion._id}`, payload);
    toast.success("Question updated successfully");
      } else {
        await API.post("/admin/questions", payload);
        toast.success("Question created successfully");
      }
      setEditingQuestion(null);
      if (editingQuestion?._id) await loadQuestions(currentPage);
      else await loadQuestions(1);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save question"));
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleDelete = async (question) => {
    if (!question?._id) return;
    if (!window.confirm("Delete this question?")) return;
    setActiveActionId(question._id);
    try {
      await API.delete(`/admin/questions/${question._id}`);
      if (editingQuestion?._id === question._id) setEditingQuestion(null);
      toast.success("Question deleted successfully");
      await loadQuestions(1);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete question"));
    } finally {
      setActiveActionId(null);
    }
  };

  const handleToggle = async (question) => {
    if (!question?._id) return;
    setActiveActionId(question._id);
    try {
      await API.patch(`/admin/questions/${question._id}/toggle`);
      toast.success("Question status updated");
      await loadQuestions(currentPage);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to toggle question status"));
    } finally {
      setActiveActionId(null);
    }
  };

  const handleBulkImport = async (payload) => {
    setIsBulkImporting(true);
    try {
      const res = await API.post("/admin/questions/bulk-import", payload);
      const insertedCount = res.data?.data?.insertedCount;
      const skippedCount = res.data?.data?.skippedCount;
      toast.success(
        typeof insertedCount === "number" && typeof skippedCount === "number"
          ? `Bulk import completed (${insertedCount} inserted, ${skippedCount} skipped)`
          : "Bulk import completed"
      );
      await loadQuestions(1);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to bulk import questions"));
    } finally {
      setIsBulkImporting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen p-6">
      <header className="flex justify-between items-start gap-3 flex-wrap mb-5">
        <div>
          <h1 className="text-3xl font-bold m-0">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1.5">Manage quiz questions and categories</p>
        </div>
        <div className="flex gap-2">
          <ThemeToggle variant="inline" />
          <Button variant="outline" size="sm" onClick={() => loadQuestions(currentPage)}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout} className="border-destructive text-destructive hover:bg-destructive/10">
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2.5 mb-4">
        <Card>
          <CardContent className="p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Total</span>
            <strong className="text-2xl">{summary.total}</strong>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Active</span>
            <strong className="text-2xl text-success">{summary.active}</strong>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Inactive</span>
            <strong className="text-2xl text-warning">{summary.inactive}</strong>
          </CardContent>
        </Card>
      </div>

      <Toaster position="top-right" richColors />
      <div className="grid grid-cols-[minmax(340px,1fr)_minmax(360px,1.2fr)] gap-3.5">
        <div className="flex flex-col gap-3.5">
          <AdminQuestionForm
            initialValues={editingQuestion}
            onSubmit={handleFormSubmit}
            isSubmitting={isSavingForm}
            submitLabel={editingQuestion ? "Update Question" : "Create Question"}
            onCancel={editingQuestion ? () => setEditingQuestion(null) : undefined}
          />
          <AdminBulkImport onSubmit={handleBulkImport} isSubmitting={isBulkImporting} />
        </div>

        <AdminQuestionTable
          questions={questions}
          isLoading={isLoadingQuestions}
          activeActionId={activeActionId}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => loadQuestions(page)}
          onEdit={(question) => {
            setEditingQuestion(question);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onDelete={handleDelete}
          onToggle={handleToggle}
        />
      </div>
    </div>
  );
}
