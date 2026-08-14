"use client";

import React, { useState } from "react";
import { Hash, ArrowRight } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import JobStatusCard from "@/components/JobStatusCard";
import { executeTool, pollJob, JobResponse } from "@/lib/api";

export default function PageNumbersPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [position, setPosition] = useState("bottom-center");
  const [fontSize, setFontSize] = useState(12);
  const [startNumber, setStartNumber] = useState(1);
  const [job, setJob] = useState<JobResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const positions = [
    { label: "BOTTOM CENTER", value: "bottom-center" },
    { label: "BOTTOM RIGHT", value: "bottom-right" },
    { label: "BOTTOM LEFT", value: "bottom-left" },
    { label: "TOP CENTER", value: "top-center" },
    { label: "TOP RIGHT", value: "top-right" },
    { label: "TOP LEFT", value: "top-left" },
  ];

  const handlePageNumbers = async () => {
    if (files.length === 0) {
      setError("Please select a PDF file to add page numbers.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const initialJob = await executeTool("page-numbers", files, {
        position,
        font_size: fontSize,
        start_number: startNumber,
      });
      setJob(initialJob);

      const completedJob = await pollJob(initialJob.id, (updated) => setJob(updated));
      setJob(completedJob);
    } catch (err: any) {
      setError(err.message || "Failed to add page numbers.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setPosition("bottom-center");
    setFontSize(12);
    setStartNumber(1);
    setJob(null);
    setIsLoading(false);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#141414] border border-[#2a2a2a] shadow-card text-accent mb-2">
          <Hash className="w-7 h-7" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
          Add Page Numbers
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto font-normal">
          Insert customizable page numbers across your entire PDF document.
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
            description="Select a PDF to number its pages"
          />

          {files.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                    Font Size ({fontSize}pt)
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="28"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full accent-accent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                    Start Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={startNumber}
                    onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0d0d0d] border border-[#262626] text-white text-sm font-mono focus:outline-none focus:border-accent shadow-recessed transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                  Position Alignment
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {positions.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPosition(p.value)}
                      className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all ${
                        position === p.value
                          ? "bg-[#181818] border-2 border-accent text-accent shadow-card"
                          : "bg-[#0e0e0e] border border-[#222] text-neutral-300 shadow-recessed hover:bg-[#141414]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
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
            onClick={handlePageNumbers}
            className="w-full btn-accent text-xs py-4 justify-center"
          >
            <span>Insert Page Numbers</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <JobStatusCard job={job} isLoading={isLoading} onReset={handleReset} />
      )}
    </div>
  );
}
