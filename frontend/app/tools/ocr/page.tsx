"use client";

import React, { useState } from "react";
import { ScanText, ArrowRight, CheckCircle2 } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import JobStatusCard from "@/components/JobStatusCard";
import { executeTool, pollJob, JobResponse } from "@/lib/api";

export default function OCRPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [job, setJob] = useState<JobResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOCR = async () => {
    if (files.length === 0) {
      setError("Please select a scanned PDF file to run OCR.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const initialJob = await executeTool("ocr", files);
      setJob(initialJob);

      const completedJob = await pollJob(initialJob.id, (updated) => setJob(updated), 2000, 180);
      setJob(completedJob);
    } catch (err: any) {
      setError(err.message || "Failed to perform OCR recognition.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setJob(null);
    setIsLoading(false);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#141414] border border-[#2a2a2a] shadow-card text-accent mb-2">
          <ScanText className="w-7 h-7" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
          OCR Text Recognition
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto font-normal">
          Convert scanned pages, receipts, and invoices into searchable, selectable text PDFs.
        </p>
      </div>

      {!job ? (
        <div className="rounded-2xl bg-[#141414] border border-[#262626] p-6 sm:p-10 shadow-card space-y-6 rivets">
          <FileDropzone
            files={files}
            onFilesChange={setFiles}
            accept="application/pdf"
            multiple={false}
            title="DRAG & DROP SCANNED PDF HERE"
            description="Select a scanned document to inject a searchable text layer"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-[#0d0d0d] border border-[#222] shadow-recessed flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold uppercase tracking-wide text-white">Searchable Text</p>
                <p className="text-[11px] text-neutral-400 font-normal">Enables Ctrl+F search across all scanned pages.</p>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0d0d0d] border border-[#222] shadow-recessed flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold uppercase tracking-wide text-white">Copy & Extract</p>
                <p className="text-[11px] text-neutral-400 font-normal">Allows direct copying of text and tables from images.</p>
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
            onClick={handleOCR}
            className="w-full btn-accent text-xs py-4 justify-center"
          >
            <span>Execute OCR Engine</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <JobStatusCard job={job} isLoading={isLoading} onReset={handleReset} />
      )}
    </div>
  );
}
