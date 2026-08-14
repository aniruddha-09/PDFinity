"use client";

import React, { useState } from "react";
import { Minimize2, ArrowRight } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import JobStatusCard from "@/components/JobStatusCard";
import { executeTool, pollJob, JobResponse } from "@/lib/api";

export default function CompressPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState("recommended");
  const [job, setJob] = useState<JobResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    {
      id: "low",
      title: "Extreme Compression",
      desc: "Lowest file size (~72 DPI screen resolution)",
      badge: "MAX SAVER",
    },
    {
      id: "recommended",
      title: "Balanced",
      desc: "Optimal balance of clarity and size (~150 DPI)",
      badge: "RECOMMENDED",
    },
    {
      id: "high",
      title: "High Quality",
      desc: "Crisp vector text with moderate size (~300 DPI)",
      badge: "PRINT READY",
    },
  ];

  const handleCompress = async () => {
    if (files.length === 0) {
      setError("Please select a PDF file to compress.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const initialJob = await executeTool("compress", files, { quality });
      setJob(initialJob);

      const completedJob = await pollJob(initialJob.id, (updated) => setJob(updated));
      setJob(completedJob);
    } catch (err: any) {
      setError(err.message || "Failed to compress PDF.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setQuality("recommended");
    setJob(null);
    setIsLoading(false);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#141414] border border-[#2a2a2a] shadow-card text-accent mb-2">
          <Minimize2 className="w-7 h-7" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
          Compress PDF
        </h1>
      </div>

      {!job ? (
        <div className="rounded-2xl bg-[#141414] border border-[#262626] p-6 sm:p-10 shadow-card space-y-6 rivets">
          <FileDropzone
            files={files}
            onFilesChange={setFiles}
            accept="application/pdf"
            multiple={false}
            title="DRAG & DROP PDF HERE"
            description="Select a PDF to reduce its storage footprint"
          />

          {files.length > 0 && (
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                Compression Preset
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setQuality(p.id)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      quality === p.id
                        ? "bg-[#181818] border-2 border-accent shadow-card"
                        : "bg-[#0e0e0e] border border-[#222] hover:bg-[#141414] shadow-recessed"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-tight text-white">{p.title}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#1f1f1f] text-accent border border-[#333]">
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-snug">{p.desc}</p>
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
            onClick={handleCompress}
            className="w-full btn-accent text-xs py-4 justify-center"
          >
            <span>Compress PDF</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <JobStatusCard job={job} isLoading={isLoading} onReset={handleReset} />
      )}
    </div>
  );
}
