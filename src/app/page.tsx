
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { ArrowRight, Bot, Cpu, FileText, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
    const { data: session, isPending } = useSession();

    return (
        <div className="flex min-h-screen flex-col bg-[#050505] text-white overflow-hidden relative selection:bg-primary/30">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary opacity-20 blur-[100px]"></div>

            {/* Header */}
            <header className="flex items-center justify-between px-6 py-6 relative z-10 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                        <Bot className="size-5 text-primary" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">InsightPDF</span>
                </div>

                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
                    {/* Add nav items here if needed later */}
                </nav>

                <div className="flex items-center gap-4">
                    {/* Placeholder for theme toggle or other header items */}
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 -mt-20">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1 text-sm text-zinc-400 mb-8 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                    Input: PDF • Output: Intelligence
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mb-6 bg-gradient-to-b from-white via-white/90 to-white/70 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                    Unlock the knowledge within your documents
                </h1>

                <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    InsightPDF is the intelligent engine that powers your document workflow.
                    Upload, analyze, and chat with your PDFs in one unified interface.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                    {isPending ? (
                        <Button disabled className="h-12 px-8 rounded-full bg-white/10 text-zinc-400 border border-white/5">
                            Loading...
                        </Button>
                    ) : session ? (
                        <Link href="/dashboard">
                            <Button size="lg" className="h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-lg shadow-primary/20 transition-all hover:scale-105">
                                Go to Dashboard <LayoutDashboard className="ml-2 size-4" />
                            </Button>
                        </Link>
                    ) : (
                        <Link href="/login">
                            <Button size="lg" className="h-12 px-8 rounded-full bg-white text-black hover:bg-zinc-200 border-0 transition-all hover:scale-105">
                                Get Started
                            </Button>
                        </Link>
                    )}

                    {!session && (
                        <Link href="/dashboard">
                            <Button variant="outline" size="lg" className="h-12 px-8 rounded-full bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white hover:border-white/20">
                                View Demo
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Project Info / Tech Stack */}
                <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left max-w-4xl w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                        <FileText className="size-8 text-blue-400 mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">PDF Analysis</h3>
                        <p className="text-zinc-400 text-sm">Upload multiple documents and extract insights instantly using advanced parsing.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                        <Cpu className="size-8 text-purple-400 mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">AI Powered</h3>
                        <p className="text-zinc-400 text-sm">Leverage Gemini 2.0 to understand context, summarize content, and answer queries.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                        <Bot className="size-8 text-teal-400 mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">Interactive Chat</h3>
                        <p className="text-zinc-400 text-sm">Chat naturally with your documents as if you're talking to an expert.</p>
                    </div>
                </div>
            </main>

            <footer className="py-8 text-center text-zinc-600 text-sm relative z-10 border-t border-white/5">
                <p>© {new Date().getFullYear()} InsightPDF. All rights reserved.</p>
            </footer>
        </div>
    );
}
