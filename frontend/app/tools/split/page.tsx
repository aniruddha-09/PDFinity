"use client";

import React, { useState } from "react";
import { Scissors, ArrowRight } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import JobStatusCard from "@/components/JobStatusCard";
import { executeTool, pollJob, JobResponse } from "@/lib/api";

export default function SplitPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [ranges, setRanges] = useState("");
  const [job, setJob] = useState<JobResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSplit = async () => {
    if (files.length === 0) {
      setError("Please select a PDF file to split.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const initialJob = await executeTool("split", files, { ranges });
      setJob(initialJob);

      const completedJob = await pollJob(initialJob.id, (updated) => setJob(updated));
      setJob(completedJob);
    } catch (err: any) {
      setError(err.message || "Failed to split PDF.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setRanges("");
    setJob(null);
    setIsLoading(false);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#141414] border border-[#2a2a2a] shadow-card text-accent mb-2">
          <Scissors className="w-7 h-7" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
          Split PDF Document
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto font-normal">
          Extract specific page ranges, individual pages, or split into multiple PDF files.
        </p>
      </div>

      {!job ? (
        <div className="rounded-2xl bg-[#141414] border border-[#262626] p-6 sm:p-10 shadow-card space-y-6 rivets">
          <FileDropzone
            files={files}
            onFilesChange={setFiles}
            accept="application/pdf"
            multiple={false}
            title="DRAG & DROP PDF HERE"
            description="Select a single PDF file to split"
          />

          {files.length > 0 && (
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                Page Ranges (Optional)
              </label>
              <input
                type="text"
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
                placeholder="e.g. 1-3, 5, 7-10 (Leave blank to split every page)"
                className="w-full px-4 py-3 rounded-xl bg-[#0d0d0d] border border-[#262626] text-white text-sm font-mono focus:outline-none focus:border-accent shadow-recessed transition-colors"
              />
              <p className="text-[11px] font-mono text-neutral-500">
                Multi-part extractions will automatically be delivered as a ZIP archive.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={files.length === 0 || isLoading}
            onClick={handleSplit}
            className="w-full btn-accent text-xs py-4 justify-center"
          >
            <span>Split PDF</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <JobStatusCard job={job} isLoading={isLoading} onReset={handleReset} />
      )}
    </div>
  );
}
