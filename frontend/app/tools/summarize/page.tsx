"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, BookOpen, Brain, Zap } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import JobStatusCard from "@/components/JobStatusCard";
import { executeTool, pollJob, JobResponse } from "@/lib/api";

export default function SummarizePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [job, setJob] = useState<JobResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<{
    summary: string;
    page_count?: number;
    word_count?: number;
  } | null>(null);

  const handleSummarize = async () => {
    if (files.length === 0) {
      setError("Please select a PDF file to summarize.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const initialJob = await executeTool("summarize", files);
      setJob(initialJob);

      const completedJob = await pollJob(initialJob.id, (updated) => {
        setJob(updated);
      }, 1500, 120);

      setJob(completedJob);

      if (completedJob) {
        const res = (completedJob as any).options?.result;
        if (res) {
          setSummaryData(res);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to summarize PDF document.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setJob(null);
    setSummaryData(null);
    setIsLoading(false);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#141414] border border-[#2a2a2a] shadow-card text-accent mb-2">
          <Sparkles className="w-7 h-7" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
          AI Document Summarizer
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto font-normal">
          Extract core summaries, bullet points, and key takeaways via OpenAI pipeline.
        </p>
      </div>

      {!job ? (
        <div className="rounded-2xl bg-[#141414] border border-[#262626] p-6 sm:p-10 shadow-card space-y-6 rivets">
          <FileDropzone
            files={files}
            onFilesChange={setFiles}
            accept="application/pdf"
            multiple={false}
            title="DRAG & DROP DOCUMENT HERE"
            description="Select any report, contract, or paper for AI extraction"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-[#0d0d0d] border border-[#222] shadow-recessed flex items-start gap-3">
              <Brain className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="font-bold text-white uppercase text-[11px]">Key Takeaways</p>
                <p className="text-[10px] text-neutral-400 font-normal">Extracts bullet items & decisions.</p>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0d0d0d] border border-[#222] shadow-recessed flex items-start gap-3">
              <BookOpen className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="font-bold text-white uppercase text-[11px]">Executive Brief</p>
                <p className="text-[10px] text-neutral-400 font-normal">Clean markdown digest.</p>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0d0d0d] border border-[#222] shadow-recessed flex items-start gap-3">
              <Zap className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="font-bold text-white uppercase text-[11px]">Multi-page</p>
                <p className="text-[10px] text-neutral-400 font-normal">Chunked map-reduce pipeline.</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={files.length === 0 || isLoading}
            onClick={handleSummarize}
            className="w-full btn-accent text-xs py-4 justify-center"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Document Summary</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <JobStatusCard
          job={job}
          isLoading={isLoading}
          onReset={handleReset}
          summaryResult={summaryData}
        />
      )}
    </div>
  );
}
