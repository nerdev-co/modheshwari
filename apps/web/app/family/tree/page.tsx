"use client";

import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";

import FamilyTreeView from "../FamilyTreeView";

/**
 * Performs  family tree page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function FamilyTreePage() {
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
