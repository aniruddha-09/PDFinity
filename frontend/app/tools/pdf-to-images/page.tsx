"use client";

import React, { useState } from "react";
import { Image as ImageIcon, ArrowRight } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import JobStatusCard from "@/components/JobStatusCard";
import { executeTool, pollJob, JobResponse } from "@/lib/api";

export default function PDFToImagesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState("png");
  const [job, setJob] = useState<JobResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formats = [
    { label: "PNG (LOSSLESS)", value: "png" },
    { label: "JPEG (COMPACT)", value: "jpeg" },
  ];

  const handleConvert = async () => {
    if (files.length === 0) {
      setError("Please select a PDF file to convert.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const initialJob = await executeTool("pdf-to-images", files, { format });
      setJob(initialJob);

      const completedJob = await pollJob(initialJob.id, (updated) => setJob(updated));
      setJob(completedJob);
    } catch (err: any) {
      setError(err.message || "Failed to convert PDF to images.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setFormat("png");
    setJob(null);
    setIsLoading(false);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#141414] border border-[#2a2a2a] shadow-card text-accent mb-2">
          <ImageIcon className="w-7 h-7" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
          PDF to Images Converter
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto font-normal">
          Extract every page of your PDF into crisp PNG or JPEG images bundled in a ZIP download.
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
            description="Select a PDF to extract pages as images"
          />

          {files.length > 0 && (
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                Image Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                {formats.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFormat(f.value)}
                    className={`py-3 px-4 rounded-xl text-center text-xs font-mono font-bold uppercase transition-all ${
                      format === f.value
                        ? "bg-[#181818] border-2 border-accent text-accent shadow-card"
                        : "bg-[#0e0e0e] border border-[#222] text-neutral-300 shadow-recessed hover:bg-[#141414]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
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
            onClick={handleConvert}
            className="w-full btn-accent text-xs py-4 justify-center"
          >
            <span>Convert to Images</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <JobStatusCard job={job} isLoading={isLoading} onReset={handleReset} />
      )}
    </div>
  );
}
