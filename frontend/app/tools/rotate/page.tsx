"use client";

import React, { useState } from "react";
import { RotateCw, ArrowRight } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import JobStatusCard from "@/components/JobStatusCard";
import { executeTool, pollJob, JobResponse } from "@/lib/api";

export default function RotatePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [angle, setAngle] = useState(90);
  const [pages, setPages] = useState("all");
  const [job, setJob] = useState<JobResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const angles = [
    { label: "90° CLOCKWISE", value: 90 },
    { label: "180° FLIP", value: 180 },
    { label: "270° COUNTER", value: 270 },
  ];

  const handleRotate = async () => {
    if (files.length === 0) {
      setError("Please select a PDF file to rotate.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const initialJob = await executeTool("rotate", files, { angle, pages });
      setJob(initialJob);

      const completedJob = await pollJob(initialJob.id, (updated) => setJob(updated));
      setJob(completedJob);
    } catch (err: any) {
      setError(err.message || "Failed to rotate PDF.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setAngle(90);
    setPages("all");
    setJob(null);
    setIsLoading(false);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#141414] border border-[#2a2a2a] shadow-card text-accent mb-2">
          <RotateCw className="w-7 h-7" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
          Rotate PDF Pages
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto font-normal">
          Change page orientation across all pages or specific page indices.
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
            description="Select a PDF to rotate its orientation"
          />

          {files.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                  Rotation Angle
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {angles.map((a) => (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => setAngle(a.value)}
                      className={`py-3 px-4 rounded-xl text-center text-xs font-mono font-bold uppercase transition-all ${
                        angle === a.value
                          ? "bg-[#181818] border-2 border-accent text-accent shadow-card"
                          : "bg-[#0e0e0e] border border-[#222] text-neutral-300 shadow-recessed hover:bg-[#141414]"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                  Target Pages
                </label>
                <input
                  type="text"
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  placeholder="e.g. all or 1, 3, 5"
                  className="w-full px-4 py-3 rounded-xl bg-[#0d0d0d] border border-[#262626] text-white text-sm font-mono focus:outline-none focus:border-accent shadow-recessed transition-colors"
                />
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
            onClick={handleRotate}
            className="w-full btn-accent text-xs py-4 justify-center"
          >
            <span>Rotate Document</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <JobStatusCard job={job} isLoading={isLoading} onReset={handleReset} />
      )}
    </div>
  );
}
