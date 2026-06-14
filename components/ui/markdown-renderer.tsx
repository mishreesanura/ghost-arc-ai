"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Simple block parser for markdown
  const parseMarkdown = (text: string) => {
    const lines = text.split(/\r?\n/);
    const elements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];
    let insideCodeBlock = false;
    let codeBlockLanguage = "";
    let codeBlockLines: string[] = [];

    // Helper to format inline elements: **bold**, `code`, etc.
    const formatInline = (lineText: string, keyPrefix: string) => {
      // Escape HTML entities to prevent XSS
      let formatted = lineText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      // Replace bold text (**text** or __text__)
      formatted = formatted.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
      );
      formatted = formatted.replace(
        /__ (.*?)__/g,
        "<strong>$1</strong>"
      );

      // Replace inline code (`code`)
      formatted = formatted.replace(
        /`(.*?)`/g,
        '<code class="px-1.5 py-0.5 rounded bg-subtle text-accent-ai font-mono text-[11px] border border-border-default">$1</code>'
      );

      return (
        <span
          key={keyPrefix}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Handle Code Block start/end
      if (trimmedLine.startsWith("```")) {
        if (insideCodeBlock) {
          // End of code block
          elements.push(
            <pre
              key={`code-${index}`}
              className="p-4 rounded-xl bg-subtle border border-border-default overflow-x-auto my-3 font-mono text-[11px] text-text-primary"
            >
              <code className={codeBlockLanguage ? `language-${codeBlockLanguage}` : ""}>
                {codeBlockLines.join("\n")}
              </code>
            </pre>
          );
          codeBlockLines = [];
          insideCodeBlock = false;
        } else {
          // Start of code block
          insideCodeBlock = true;
          codeBlockLanguage = trimmedLine.slice(3).trim();
        }
        return;
      }

      if (insideCodeBlock) {
        codeBlockLines.push(line);
        return;
      }

      // Handle empty lines (flush any active lists)
      if (trimmedLine === "") {
        if (currentList.length > 0) {
          elements.push(
            <ul key={`ul-${index}`} className="list-disc pl-6 my-2.5 space-y-1 text-text-primary text-xs">
              {currentList}
            </ul>
          );
          currentList = [];
        }
        return;
      }

      // Handle Headers
      if (trimmedLine.startsWith("# ")) {
        if (currentList.length > 0) {
          elements.push(<ul key={`ul-${index}`} className="list-disc pl-6 my-2.5 space-y-1 text-text-primary text-xs">{currentList}</ul>);
          currentList = [];
        }
        elements.push(
          <h1 key={`h1-${index}`} className="text-xl font-bold text-text-primary mt-6 mb-3 border-b border-border-default pb-1">
            {formatInline(trimmedLine.slice(2), `h1-val-${index}`)}
          </h1>
        );
      } else if (trimmedLine.startsWith("## ")) {
        if (currentList.length > 0) {
          elements.push(<ul key={`ul-${index}`} className="list-disc pl-6 my-2.5 space-y-1 text-text-primary text-xs">{currentList}</ul>);
          currentList = [];
        }
        elements.push(
          <h2 key={`h2-${index}`} className="text-lg font-bold text-text-primary mt-5 mb-2.5">
            {formatInline(trimmedLine.slice(3), `h2-val-${index}`)}
          </h2>
        );
      } else if (trimmedLine.startsWith("### ")) {
        if (currentList.length > 0) {
          elements.push(<ul key={`ul-${index}`} className="list-disc pl-6 my-2.5 space-y-1 text-text-primary text-xs">{currentList}</ul>);
          currentList = [];
        }
        elements.push(
          <h3 key={`h3-${index}`} className="text-sm font-semibold text-text-primary mt-4 mb-2">
            {formatInline(trimmedLine.slice(4), `h3-val-${index}`)}
          </h3>
        );
      } else if (trimmedLine.startsWith("#### ")) {
        if (currentList.length > 0) {
          elements.push(<ul key={`ul-${index}`} className="list-disc pl-6 my-2.5 space-y-1 text-text-primary text-xs">{currentList}</ul>);
          currentList = [];
        }
        elements.push(
          <h4 key={`h4-${index}`} className="text-xs font-semibold text-text-primary mt-3 mb-1.5 uppercase tracking-wider">
            {formatInline(trimmedLine.slice(5), `h4-val-${index}`)}
          </h4>
        );
      }
      // Handle List Items
      else if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
        currentList.push(
          <li key={`li-${index}`} className="leading-relaxed">
            {formatInline(trimmedLine.slice(2), `li-val-${index}`)}
          </li>
        );
      } else if (/^\d+\.\s/.test(trimmedLine)) {
        // Numbered list item
        const match = trimmedLine.match(/^(\d+)\.\s(.*)/);
        const number = match ? match[1] : "1";
        const content = match ? match[2] : trimmedLine;
        currentList.push(
          <li key={`li-${index}`} className="list-decimal leading-relaxed">
            {formatInline(content, `li-val-${index}`)}
          </li>
        );
      }
      // Handle standard paragraphs
      else {
        if (currentList.length > 0) {
          elements.push(<ul key={`ul-${index}`} className="list-disc pl-6 my-2.5 space-y-1 text-text-primary text-xs">{currentList}</ul>);
          currentList = [];
        }
        elements.push(
          <p key={`p-${index}`} className="text-xs leading-relaxed text-text-muted my-2">
            {formatInline(line, `p-val-${index}`)}
          </p>
        );
      }
    });

    // Flush any leftover list elements
    if (currentList.length > 0) {
      elements.push(
        <ul key="ul-final" className="list-disc pl-6 my-2.5 space-y-1 text-text-primary text-xs">
          {currentList}
        </ul>
      );
    }

    return elements;
  };

  return (
    <div className={cn("space-y-1 font-sans text-xs break-words", className)}>
      {parseMarkdown(content)}
    </div>
  );
}
