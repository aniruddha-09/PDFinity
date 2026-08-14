"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { getMe, clearTokens, User } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = () => {
    clearTokens();
    setUser(null);
    window.location.href = "/";
  };

  const tools = [
    { name: "Merge PDF", href: "/tools/merge", desc: "Combine multiple PDFs in order" },
    { name: "Split PDF", href: "/tools/split", desc: "Extract ranges or separate pages" },
    { name: "Compress PDF", href: "/tools/compress", desc: "Reduce file size up to 90%" },
    { name: "Rotate PDF", href: "/tools/rotate", desc: "Orient pages 90°, 180°, 270°" },
    { name: "Organize PDF", href: "/tools/organize", desc: "Reorder & remove specific pages" },
    { name: "Watermark", href: "/tools/watermark", desc: "Stamp custom text overlays" },
    { name: "Page Numbers", href: "/tools/page-numbers", desc: "Number pages with custom alignment" },
    { name: "Images to PDF", href: "/tools/images-to-pdf", desc: "Convert JPG/PNG/WebP into PDF" },
    { name: "PDF to Images", href: "/tools/pdf-to-images", desc: "Extract pages to PNG/JPG ZIP" },
    { name: "OCR PDF", href: "/tools/ocr", desc: "Make scanned text searchable" },
    { name: "AI Summarize", href: "/tools/summarize", desc: "Instant key insight extraction" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b-2 border-[#1a1a1a] shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3.5">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-floating group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 text-black font-bold" />
            </div>
            <div className="flex items-center">
              <span className="font-extrabold text-xl tracking-tight uppercase text-white">
                pdf<span className="text-accent">inity</span>
              </span>
              <span className="ml-1 w-2 h-2 rounded-full bg-accent animate-pulse" />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/"
              className={`relative px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                pathname === "/"
                  ? "text-accent bg-[#141414] shadow-pressed font-bold"
                  : "text-neutral-400 hover:text-white hover:bg-[#141414]"
              }`}
            >
              Tools
            </Link>

            {/* Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                onBlur={() => setTimeout(() => setToolsDropdownOpen(false), 200)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-white hover:bg-[#141414] transition-all"
              >
                <span>Directory</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {toolsDropdownOpen && (
                <div className="absolute top-full -left-24 w-[480px] p-3 rounded-2xl bg-[#141414] border border-[#2a2a2a] shadow-floating grid grid-cols-2 gap-1.5 z-50">
                  {tools.map((t) => (
                    <Link
                      key={t.href}
                      href={t.href}
                      className="p-3 rounded-xl hover:bg-[#1f1f1f] border border-transparent hover:border-[#333] transition-all group"
                    >
                      <span className="text-xs font-bold uppercase tracking-wide text-neutral-200 group-hover:text-accent flex items-center gap-1.5">
                        {t.name}
                      </span>
                      <span className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">{t.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/tools/summarize"
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                pathname === "/tools/summarize"
                  ? "text-accent bg-[#141414] shadow-pressed"
                  : "text-accent hover:bg-[#141414]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>AI Summarize</span>
            </Link>

            {user && (
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  pathname === "/dashboard"
                    ? "text-accent bg-[#141414] shadow-pressed"
                    : "text-neutral-400 hover:text-white hover:bg-[#141414]"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
            )}
          </div>

          {/* Right side auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141414] border border-[#262626] text-xs font-mono text-neutral-300">
                  <UserIcon className="w-3.5 h-3.5 text-accent" />
                  <span className="truncate max-w-[140px]">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 rounded-lg bg-[#141414] border border-[#262626] text-neutral-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="btn-accent text-xs py-2 px-4 shadow-sharp"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-[#141414] border border-[#262626] text-neutral-300 hover:text-accent"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#262626] bg-[#141414] px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {tools.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-[#1a1a1a] text-xs font-semibold uppercase tracking-wide text-neutral-300 hover:text-accent"
              >
                {t.name}
              </Link>
            ))}
          </div>

          <div className="border-t border-[#262626] pt-3">
            {user ? (
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-400 truncate">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold text-rose-400 flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2.5 text-center text-xs font-bold uppercase rounded-lg bg-[#222] text-neutral-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2.5 text-center text-xs font-bold uppercase rounded-lg bg-accent text-black"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
