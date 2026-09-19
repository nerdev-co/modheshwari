"use client";

import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LoaderOne } from "@repo/ui/loading";
import { List, Network, Plus } from "lucide-react";
import { Button } from "@repo/ui/button";
import { MOTION_PAGE_ENTER } from "@repo/ui/motion";

import FamilyPageContent from "./FamilyPageContent";
import FamilyTreeView from "./FamilyTreeView";
import { useLocale } from "../../lib/LocaleContext";

/**
 * Performs  family page operation.
 * @returns {React.ReactElement<unknown, string | React.JSXElementConstructor<any>>} Description of return value
 */
export default function FamilyPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<"list" | "tree">("list");
  const { t } = useLocale();
  const navigate = useNavigate();

  return (
    <div className="bg-canvas min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION_PAGE_ENTER}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-display-lg font-display-bold text-ink">{t("family.title")}</h1>
              <p className="text-body text-ink-secondary mt-1">{t("family.description")}</p>
            </div>
            <Button onClick={() => navigate("/families")} size="sm" className="hidden sm:flex">
              <Plus className="w-4 h-4" />
              {t("family.addFamily")}
            </Button>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...MOTION_PAGE_ENTER, delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-2 bg-surface-raised border border-border rounded-xl p-1">
            <Button
              variant={activeTab === "list" ? "primary" : "ghost"}
              onClick={() => setActiveTab("list")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            >
              <List className="w-4 h-4" />
              {t("family.listView")}
            </Button>
            <Button
              variant={activeTab === "tree" ? "primary" : "ghost"}
              onClick={() => setActiveTab("tree")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Network className="w-4 h-4" />
              {t("family.treeView")}
            </Button>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...MOTION_PAGE_ENTER, delay: 0.2 }}
        >
          {activeTab === "list" ? (
            <Suspense fallback={<LoaderOne />}>
              <FamilyPageContent />
            </Suspense>
          ) : (
            <Suspense fallback={<LoaderOne />}>
              <FamilyTreeView />
            </Suspense>
          )}
        </motion.div>
      </div>
    </div>
  );
}