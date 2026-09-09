"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";

import FamilyTreeView from "../FamilyTreeView";
import { useUser } from "../../../lib/UserContext";

/**
 * Performs  family tree page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function FamilyTreePage() {
  const { user, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/signin");
  }, [user, loading, navigate]);

  if (loading) return <DreamySunsetBackground className="px-6 py-10 flex items-center justify-center"><p className="text-jewel-500">Loading...</p></DreamySunsetBackground>;
  if (!user) return null;

  return (
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-display font-bold text-jewel-900">Family Tree</h1>
          <p className="text-jewel-500">
            Visualize your family relationships and connections
          </p>
        </div>
        <FamilyTreeView />
      </div>
    </DreamySunsetBackground>
  );
}
