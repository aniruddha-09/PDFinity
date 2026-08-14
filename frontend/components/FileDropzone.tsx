"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, FileText, Image as ImageIcon, X, AlertCircle } from "lucide-react";

interface FileDropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  title?: string;
  description?: string;
}

export default function FileDropzone({
  files,
  onFilesChange,
  accept = "application/pdf",
  multiple = false,
  maxFiles = 10,
  maxSizeMB = 50,
  title = "DRAG & DROP FILES HERE",
  description = "or click to browse from your device",
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const validateAndAddFiles = (newFiles: File[]) => {
    setErrorMessage(null);

    const validSizeFiles = newFiles.filter((f) => {
      if (f.size > maxSizeMB * 1024 * 1024) {
        setErrorMessage(`File ${f.name} exceeds limit of ${maxSizeMB}MB`);
        return false;
      }
      return true;
    });

    if (multiple) {
      const combined = [...files, ...validSizeFiles].slice(0, maxFiles);
      if (combined.length === maxFiles && validSizeFiles.length + files.length > maxFiles) {
        setErrorMessage(`Maximum ${maxFiles} files allowed`);
      }
      onFilesChange(combined);
    } else {
      if (validSizeFiles.length > 0) {
        onFilesChange([validSizeFiles[0]]);
      }
    }
  };

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
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
    setErrorMessage(null);
  };

  return (
    <div className="w-full space-y-4">
      {/* Drop Zone Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 rivets ${
          isDragging
            ? "bg-[#161616] border-2 border-accent shadow-glow-yellow scale-[0.99]"
            : "bg-[#0d0d0d] border-2 border-dashed border-[#2a2a2a] hover:border-accent/70 shadow-recessed hover:bg-[#121212]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-[#2a2a2a] shadow-card flex items-center justify-center text-accent group-hover:scale-105 group-hover:bg-accent group-hover:text-black transition-all duration-200">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-white group-hover:text-accent transition-colors">
              {title}
            </h3>
            <p className="text-xs text-neutral-400 font-normal">{description}</p>
          </div>

          <div className="inline-flex items-center gap-2 text-[11px] font-mono text-neutral-400 bg-[#161616] px-3.5 py-1.5 rounded-md border border-[#262626]">
            <span>MAX: {maxSizeMB}MB</span>
            <span className="text-neutral-600">•</span>
            <span>{multiple ? `UP TO ${maxFiles} FILES` : "SINGLE FILE"}</span>
          </div>

          <div className="pt-2">
            <span className="btn-accent text-xs py-2.5 px-6 shadow-card">
              Choose Files
            </span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* File List / Preview */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-neutral-400 px-1">
            Queued Files ({files.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#141414] border border-[#2a2a2a] shadow-card group hover:border-[#383838] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1c1c1c] border border-[#2e2e2e] flex items-center justify-center flex-shrink-0 text-accent">
                    {file.type.startsWith("image/") ? (
                      <ImageIcon className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-neutral-200 truncate">
                      {file.name}
                    </p>
                    <p className="text-[10px] font-mono text-neutral-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="p-1.5 rounded-md text-neutral-400 hover:text-rose-400 hover:bg-[#222] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
