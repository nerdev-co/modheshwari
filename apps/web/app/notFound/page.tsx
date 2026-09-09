"use client";

import { useNavigate } from "react-router-dom";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <DreamySunsetBackground className="flex items-center justify-center min-h-screen px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-display font-bold text-jewel-900 mb-4">404</h1>
        <p className="text-lg text-jewel-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Button onClick={() => navigate("/")}>
          Go Home
        </Button>
      </div>
    </DreamySunsetBackground>
  );
}
