"use client";

import { Suspense, useState } from "react";
import { LoaderOne } from "@repo/ui/loading";
import { List, Network } from "lucide-react";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";

import FamilyPageContent from "./FamilyPageContent";
import FamilyTreeView from "./FamilyTreeView";
import { useLocale } from "../../lib/LocaleContext";

export default function FamilyPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<"list" | "tree">("list");
  const { t } = useLocale();

  return (
    <DreamySunsetBackground className="px-6 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold text-jewel-900 tracking-tight">{t("family.title")}</h1>
        <p className="text-jewel-500 mt-2">{t("family.description")}</p>
      </div>

      <div className="mb-6">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === "list"
                ? "bg-jewel-gold/10 text-jewel-gold border border-jewel-gold/25"
                : "text-jewel-500 hover:text-jewel-gold border border-transparent"
            }`}
          >
            <List className="w-4 h-4" />
            {t("family.listView")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setActiveTab("tree")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === "tree"
                ? "bg-jewel-gold/10 text-jewel-gold border border-jewel-gold/25"
                : "text-jewel-500 hover:text-jewel-gold border border-transparent"
            }`}
          >
            <Network className="w-4 h-4" />
            {t("family.treeView")}
          </Button>
        </div>
      </div>

      {activeTab === "list" ? (
        <Suspense fallback={<LoaderOne />}>
          <FamilyPageContent />
        </Suspense>
      ) : (
        <Suspense fallback={<LoaderOne />}>
          <FamilyTreeView />
        </Suspense>
      )}
    </DreamySunsetBackground>
  );
}
