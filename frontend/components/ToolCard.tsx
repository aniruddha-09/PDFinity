import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface ToolCardProps {
  title: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

export default function ToolCard({
  title,
  icon,
  href,
  badge,
}: ToolCardProps) {
  return (
    <Link
      href={href}
      className="group relative p-5 rounded-2xl bg-[#141414] border border-[#262626] hover:border-accent shadow-card hover:shadow-floating transition-all duration-200 flex items-center justify-between overflow-hidden hover:-translate-y-0.5 rivets"
    >
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-[#1c1c1c] border border-[#2e2e2e] flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-black transition-all duration-200 shadow-recessed">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-tight text-white group-hover:text-accent transition-colors">
            {title}
          </h3>
          {badge && (
            <span className="text-[10px] font-mono font-bold uppercase text-accent">
              {badge}
            </span>
          )}
        </div>
      </div>

      <div className="w-8 h-8 rounded-lg bg-[#181818] border border-[#262626] flex items-center justify-center text-neutral-400 group-hover:text-accent group-hover:border-accent/40 transition-colors">
        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </div>
    </Link>
  );
}
