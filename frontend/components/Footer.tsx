import React from "react";
import Link from "next/link";
import { FileText, Shield, Zap, Lock, Sparkles, CheckCircle2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t-2 border-[#1a1a1a] bg-[#0c0c0c] mt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-14">
          {/* Col 1 */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-card">
                <FileText className="w-4 h-4 text-black font-bold" />
              </div>
              <span className="font-extrabold text-lg uppercase tracking-tight text-white">
                pdf<span className="text-accent">inity</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-normal">
              High-performance, secure PDF engine and document transformation platform with asynchronous task execution.
            </p>
            <div className="flex flex-col gap-2 pt-1 font-mono text-[11px]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#161616] text-accent border border-[#262626]">
                <Shield className="w-3 h-3 text-accent" /> 24H Auto Cleanup
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#161616] text-neutral-300 border border-[#262626]">
                <Zap className="w-3 h-3 text-accent" /> Celery Async Queue
              </span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-300 mb-4 font-mono">
              Core Operations
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400 font-medium">
              <li>
                <Link href="/tools/merge" className="hover:text-accent transition-colors">
                  Merge PDF
                </Link>
              </li>
              <li>
                <Link href="/tools/split" className="hover:text-accent transition-colors">
                  Split PDF
                </Link>
              </li>
              <li>
                <Link href="/tools/compress" className="hover:text-accent transition-colors">
                  Compress PDF
                </Link>
              </li>
              <li>
                <Link href="/tools/organize" className="hover:text-accent transition-colors">
                  Organize Pages
                </Link>
              </li>
              <li>
                <Link href="/tools/rotate" className="hover:text-accent transition-colors">
                  Rotate PDF
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-300 mb-4 font-mono">
              Enhance & AI
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400 font-medium">
              <li>
                <Link href="/tools/summarize" className="hover:text-accent transition-colors flex items-center gap-1.5 text-accent">
                  <Sparkles className="w-3.5 h-3.5" /> AI Summarize
                </Link>
              </li>
              <li>
                <Link href="/tools/ocr" className="hover:text-accent transition-colors">
                  OCR Text Extraction
                </Link>
              </li>
              <li>
                <Link href="/tools/watermark" className="hover:text-accent transition-colors">
                  Text Watermark
                </Link>
              </li>
              <li>
                <Link href="/tools/page-numbers" className="hover:text-accent transition-colors">
                  Page Numbering
                </Link>
              </li>
              <li>
                <Link href="/tools/pdf-to-images" className="hover:text-accent transition-colors">
                  PDF to Images
                </Link>
              </li>
              <li>
                <Link href="/tools/images-to-pdf" className="hover:text-accent transition-colors">
                  Images to PDF
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-300 mb-4 font-mono">
              Account & Privacy
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400 font-medium">
              <li>
                <Link href="/auth/login" className="hover:text-accent transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-accent transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-accent transition-colors">
                  Task Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#1f1f1f] pt-8 flex items-center justify-between text-xs font-mono text-neutral-500">
          <p>© {new Date().getFullYear()} pdfinity. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
