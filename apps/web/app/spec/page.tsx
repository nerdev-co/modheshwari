"use client";

import { useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { FileCode, Webhook, Copy, ExternalLink } from "lucide-react";
import { Button } from "@repo/ui/button";

import { apiFetch } from "../../lib/api";
import { useLocale } from "../../lib/LocaleContext";

type SpecType = "openapi" | "asyncapi";

/**
 * Performs  spec page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function SpecPage() {
  const [specType, setSpecType] = useState<SpecType>("openapi");
  const [asyncApiSpec, setAsyncApiSpec] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const { t } = useLocale();

  const handleSpecChange = async (type: SpecType) => {
    setSpecType(type);
    if (type === "asyncapi" && !asyncApiSpec) {
      try {
        const res = await apiFetch("/api/asyncapi");
        const yamlText = await res.text();
        setAsyncApiSpec(yamlText);
      } catch (err) {
        console.error("Failed to load AsyncAPI spec:", err);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(asyncApiSpec);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold tracking-tight text-ink">
            {t("spec.title")}
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            {t("spec.description")}
          </p>
        </div>

        <div className="mb-6 border-b border-border">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => handleSpecChange("openapi")}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all relative ${
                specType === "openapi"
                  ? "text-saffron border-b-2 border-saffron"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <FileCode className="w-4 h-4" />
              {t("spec.openapiTab")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleSpecChange("asyncapi")}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all relative ${
                specType === "asyncapi"
                  ? "text-saffron border-b-2 border-saffron"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Webhook className="w-4 h-4" />
              {t("spec.asyncapiTab")}
            </Button>
          </div>
        </div>

        <div>
          {specType === "openapi" ? (
            <div className="bg-surface border border-border overflow-hidden">
              <SwaggerUI
                url="/api/openapi"
                docExpansion="list"
                defaultModelsExpandDepth={1}
                persistAuthorization={true}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-surface border border-border p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-saffron/15 border border-saffron/25 flex items-center justify-center flex-shrink-0">
                    <Webhook className="w-6 h-6 text-saffron" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-display font-bold text-ink mb-2">
                      {t("spec.asyncapiTitle")}
                    </h2>
                    <p className="text-sm text-ink-muted mb-4">
                      {t("spec.asyncapiDesc")}
                    </p>
                    <a
                      href="https://studio.asyncapi.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button>
                        <ExternalLink className="w-4 h-4" />
                        {t("spec.openStudio")}
                      </Button>
                    </a>
                  </div>
                </div>
              </div>

              {asyncApiSpec ? (
                <div className="bg-surface border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-display font-bold text-ink">{t("spec.yamlTitle")}</h3>
                    <Button variant="secondary" onClick={handleCopy}>
                      <Copy className="w-4 h-4" />
                      {copied ? t("spec.copied") : t("spec.copy")}
                    </Button>
                  </div>
                  <pre className="bg-ink text-surface p-6 rounded-xl overflow-auto max-h-[70vh] text-sm font-mono border border-ink-secondary">
                    {asyncApiSpec}
                  </pre>
                </div>
              ) : (
                <div className="bg-surface border border-border p-12">
                  <div className="flex items-center justify-center">
                    <div className="text-ink-muted">{t("spec.loadingSpec")}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
