import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="text-center max-w-sm w-full">
        <CardContent className="pt-6">
          <h1 className="text-7xl font-bold text-primary mb-2">404</h1>
          <p className="text-lg text-muted-foreground mb-6">Page Not Found</p>
          <Button onClick={() => navigate("/")} className="w-full">
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
