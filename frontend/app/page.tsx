"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  Scissors,
  Minimize2,
  RotateCw,
  LayoutGrid,
  Stamp,
  Hash,
  Images,
  Image as ImageIcon,
  ScanText,
  Sparkles,
  Upload,
  Check,
  ArrowRight,
} from "lucide-react";
import ToolCard from "@/components/ToolCard";

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const tools = [
    {
      title: "Merge PDF",
      icon: <Layers className="w-5 h-5" />,
      href: "/tools/merge",
      badge: "POPULAR",
    },
    {
      title: "Split PDF",
      icon: <Scissors className="w-5 h-5" />,
      href: "/tools/split",
    },
    {
      title: "Compress PDF",
      icon: <Minimize2 className="w-5 h-5" />,
      href: "/tools/compress",
      badge: "SAVER",
    },
    {
      title: "AI Summarize",
      icon: <Sparkles className="w-5 h-5" />,
      href: "/tools/summarize",
      badge: "AI",
    },
    {
      title: "OCR PDF",
      icon: <ScanText className="w-5 h-5" />,
      href: "/tools/ocr",
    },
    {
      title: "Organize Pages",
      icon: <LayoutGrid className="w-5 h-5" />,
      href: "/tools/organize",
    },
    {
      title: "Rotate PDF",
      icon: <RotateCw className="w-5 h-5" />,
      href: "/tools/rotate",
    },
    {
      title: "Add Watermark",
      icon: <Stamp className="w-5 h-5" />,
      href: "/tools/watermark",
    },
    {
      title: "Page Numbers",
      icon: <Hash className="w-5 h-5" />,
      href: "/tools/page-numbers",
    },
    {
      title: "Images to PDF",
      icon: <Images className="w-5 h-5" />,
      href: "/tools/images-to-pdf",
    },
    {
      title: "PDF to Images",
      icon: <ImageIcon className="w-5 h-5" />,
      href: "/tools/pdf-to-images",
    },
  ];

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      router.push("/tools/compress");
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      router.push("/tools/compress");
    }
  };

  return (
    <div className="space-y-20 pb-16">
      {/* ─── Hero Section (FileQRkaro 2-Column Style) ───────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[500px]">
          
          {/* Left Column: Big Headline + Subtitle + Feature Badges */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-1">
              <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-[1.08]">
                TRANSFORM FILES <br />
                INSTANTLY <br />
                <span className="text-accent drop-shadow-[0_2px_12px_rgba(250,204,21,0.4)]">
                  WITH PDFINITY
                </span>
              </h1>
            </div>

            <p className="text-sm sm:text-base text-neutral-400 max-w-lg leading-relaxed font-normal">
              Merge, split, compress, OCR, and summarize PDF files instantly with zero bloat.
              No registration required, completely free with automatic 24-hour file cleanup.
            </p>

            {/* Feature Badges */}
            <div className="space-y-2.5 pt-2 font-mono text-xs">
              <div className="flex flex-wrap gap-2.5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#141414] border border-[#262626] text-neutral-300 shadow-recessed font-semibold uppercase">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>NO SIGN-UP REQUIRED</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#141414] border border-[#262626] text-neutral-300 shadow-recessed font-semibold uppercase">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SECURE & PRIVATE</span>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#141414] border border-[#262626] text-neutral-300 shadow-recessed font-semibold uppercase">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>24HR AUTO-DELETE</span>
              </div>
            </div>
          </div>

          {/* Right Column: Tactile Dropzone Box (Exact FileQRkaro Hero Layout) */}
          <div className="lg:col-span-6 flex justify-center">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full max-w-[540px] rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 rivets ${
                isDragging
                  ? "bg-[#181818] border-2 border-accent shadow-glow-yellow scale-[0.99]"
                  : "bg-[#141414] border border-[#262626] hover:border-accent/60 shadow-card hover:shadow-floating"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center space-y-5">
                {/* Upload Icon */}
                <div className="w-16 h-16 rounded-2xl bg-[#0f0f0f] border border-[#262626] shadow-recessed flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
                  <Upload className="w-8 h-8 text-accent stroke-[2.2]" />
                </div>

                {/* Main Action Text */}
                <div className="space-y-1.5">
                  <h3 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight text-white">
                    DRAG & DROP YOUR FILES HERE
                  </h3>
                  <p className="text-xs text-neutral-400">
                    or click to browse from your device
                  </p>
                </div>

                {/* Primary Yellow Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    className="btn-accent text-sm py-3.5 px-8 shadow-floating font-bold tracking-wider"
                  >
                    <Upload className="w-4 h-4 text-black" />
                    <span>SELECT FILES</span>
                  </button>
                </div>

                {/* File size notice */}
                <p className="text-[11px] font-mono text-neutral-500 pt-1">
                  Maximum file size: 100MB
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── Tools Grid (Clean & Direct) ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="border-b border-[#222] pb-4 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white">
            ALL PDF TOOLS
          </h2>
          <span className="text-xs font-mono text-neutral-500">
            {tools.length} ENGINES
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <ToolCard key={tool.href} {...tool} />
          ))}
        </div>
      </section>
    </div>
  );
}
