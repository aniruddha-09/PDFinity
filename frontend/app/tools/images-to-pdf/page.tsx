"use client";

import React, { useState } from "react";
import { Images, ArrowRight } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import JobStatusCard from "@/components/JobStatusCard";
import { executeTool, pollJob, JobResponse } from "@/lib/api";

export default function ImagesToPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [job, setJob] = useState<JobResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    if (files.length === 0) {
      setError("Please select at least 1 image file.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const initialJob = await executeTool("images-to-pdf", files);
      setJob(initialJob);

      const completedJob = await pollJob(initialJob.id, (updated) => setJob(updated));
      setJob(completedJob);
    } catch (err: any) {
      setError(err.message || "Failed to convert images to PDF.");
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
          <Images className="w-7 h-7" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
          Images to PDF Converter
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto font-normal">
          Convert JPG, PNG, and WebP images into a single high-resolution PDF document.
        </p>
      </div>

      {!job ? (
        <div className="rounded-2xl bg-[#141414] border border-[#262626] p-6 sm:p-10 shadow-card space-y-6 rivets">
          <FileDropzone
            files={files}
            onFilesChange={setFiles}
            accept="image/png,image/jpeg,image/webp,image/jpg"
            multiple={true}
            maxFiles={30}
            title="DRAG & DROP IMAGE FILES"
            description="Select multiple JPG, PNG, or WebP images"
          />

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={files.length === 0 || isLoading}
            onClick={handleConvert}
            className="w-full btn-accent text-xs py-4 justify-center"
          >
            <span>Convert {files.length > 0 ? `${files.length} Images` : ""} to PDF</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <JobStatusCard job={job} isLoading={isLoading} onReset={handleReset} />
      )}
    </div>
  );
}
