"use client";

import { useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { FileCode, Webhook, Copy, ExternalLink } from "lucide-react";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";

type SpecType = "openapi" | "asyncapi";

/**
 * Performs  spec page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function SpecPage() {
  const [specType, setSpecType] = useState<SpecType>("openapi");
  const [asyncApiSpec, setAsyncApiSpec] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleSpecChange = async (type: SpecType) => {
    setSpecType(type);
    if (type === "asyncapi" && !asyncApiSpec) {
      try {
        const res = await fetch("/api/asyncapi");
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
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold tracking-tight text-jewel-900">
            API Documentation
          </h1>
          <p className="text-sm text-jewel-500 mt-1">
            Browse REST and WebSocket API specifications
          </p>
        </div>

        <div className="mb-6 border-b border-jewel-400/20">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => handleSpecChange("openapi")}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all relative ${
                specType === "openapi"
                  ? "text-jewel-gold border-b-2 border-jewel-gold"
                  : "text-jewel-500 hover:text-jewel-900"
              }`}
            >
              <FileCode className="w-4 h-4" />
              OpenAPI (REST)
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleSpecChange("asyncapi")}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all relative ${
                specType === "asyncapi"
                  ? "text-jewel-gold border-b-2 border-jewel-gold"
                  : "text-jewel-500 hover:text-jewel-900"
              }`}
            >
              <Webhook className="w-4 h-4" />
              AsyncAPI (WebSocket)
            </Button>
          </div>
        </div>

        <div>
          {specType === "openapi" ? (
            <div className="bg-jewel-50/80 border border-jewel-400/20 rounded-2xl shadow-jewel overflow-hidden">
              <SwaggerUI
                url="/api/openapi"
                docExpansion="list"
                defaultModelsExpandDepth={1}
                persistAuthorization={true}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-jewel-50/80 border border-jewel-400/20 rounded-2xl p-6 shadow-jewel">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-jewel-gold/15 border border-jewel-gold/25 flex items-center justify-center flex-shrink-0">
                    <Webhook className="w-6 h-6 text-jewel-gold" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-display font-bold text-jewel-900 mb-2">
                      AsyncAPI Specification
                    </h2>
                    <p className="text-sm text-jewel-500 mb-4">
                      This specification describes the WebSocket API for real-time messaging.
                      For the best visualization experience, copy the spec and paste it into AsyncAPI Studio.
                    </p>
                    <a
                      href="https://studio.asyncapi.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button>
                        <ExternalLink className="w-4 h-4" />
                        Open AsyncAPI Studio
                      </Button>
                    </a>
                  </div>
                </div>
              </div>

              {asyncApiSpec ? (
                <div className="bg-jewel-50/80 border border-jewel-400/20 rounded-2xl p-6 shadow-jewel">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-display font-bold text-jewel-900">YAML Specification</h3>
                    <Button variant="secondary" onClick={handleCopy}>
                      <Copy className="w-4 h-4" />
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <pre className="bg-jewel-900 text-jewel-100 p-6 rounded-xl overflow-auto max-h-[70vh] text-sm font-mono border border-jewel-700">
                    {asyncApiSpec}
                  </pre>
                </div>
              ) : (
                <div className="bg-jewel-50/80 border border-jewel-400/20 rounded-2xl p-12 shadow-jewel">
                  <div className="flex items-center justify-center">
                    <div className="text-jewel-400">Loading AsyncAPI spec...</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DreamySunsetBackground>
  );
}
