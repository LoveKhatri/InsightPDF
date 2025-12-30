"use client";

import { useState, useEffect, useRef } from "react";
import { readStreamableValue } from '@ai-sdk/rsc';
import { generateChatResponse } from "@/actions/chat";
import { nanoid } from "nanoid";
import { Bot } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CustomPromptInput from "./custom-input";

export function ChatInterface() {
    const [messages, setMessages] = useState<any[]>([]);
    const [status, setStatus] = useState<"ready" | "submitted" | "streaming" | "error">("ready");

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    });

    const scrollRef = useRef<HTMLDivElement>(null);

    const onSubmit = async (message: { text: string; files: any[] }, e: any) => {
        if (!message.text.trim() && message.files.length === 0) return;

        // 1. Handle File Uploads (same as before)
        if (message.files.length > 0) {
            const formData = new FormData();
            for (const file of message.files) {
                if (file.url) {
                    const response = await fetch(file.url);
                    const blob = await response.blob();
                    formData.append("files", blob, file.filename || "attachment.pdf");
                }
            }
            await fetch("/api/upload", { method: "POST", body: formData });
            // TODO: Add success toast or error handling
        }

        // 2. Add User Message
        const userMessage = { role: 'user', content: message.text, id: nanoid() };
        setMessages(curr => [...curr, userMessage]);
        setStatus("submitted");

        try {
            // 3. Call Server Action
            const { output, sources } = await generateChatResponse(message.text, messages);

            // 4. Stream Response
            setStatus("streaming");
            let aiMessageContent = "";
            const aiMessageId = nanoid();

            // Add initial AI message placeholder with sources
            setMessages(curr => [...curr, {
                role: 'assistant',
                content: '',
                id: aiMessageId,
                sources: sources // Store sources here
            }]);

            for await (const delta of readStreamableValue(output)) {
                aiMessageContent += delta;
                setMessages(curr => curr.map(m =>
                    m.id === aiMessageId ? { ...m, content: aiMessageContent } : m
                ));
            }
            setStatus("ready");
        } catch (error) {
            console.error(error);
            setStatus("error");
            toast.error("Failed to generate response");
        }
    };

    const isLoading = status === "streaming" || status === "submitted";
    const isEmpty = messages.length === 0;

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
            {/* Messages Area */}
            <div className="flex-1 overflow-hidden relative">
                {isEmpty ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
                        <div className="rounded-full bg-primary/10 p-4">
                            <Bot className="size-12 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight">Welcome to InsightPDF</h1>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                Upload your PDF documents and ask questions to get instant, grounded answers powered by Gemini 2.0.
                            </p>
                        </div>
                    </div>
                ) : (
                    <ScrollArea className="h-full px-4 py-6">
                        <div className="space-y-6 pb-20">
                            {messages.map((m) => {
                                console.log(`Rendering message ${m.id} (${m.role}):`, m);
                                return (
                                    <div
                                        key={m.id}
                                        className={cn(
                                            "flex gap-4 w-full max-w-3xl mx-auto",
                                            m.role === "user" ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        {m.role !== "user" && (
                                            <Avatar className="size-8 mt-1 border">
                                                <AvatarFallback>AI</AvatarFallback>
                                                <AvatarImage src="/goku.svg" />
                                            </Avatar>
                                        )}

                                        <div className={cn(
                                            "flex flex-col max-w-[80%]",
                                            m.role === "user" ? "items-end" : "items-start"
                                        )}>
                                            <div
                                                className={cn(
                                                    "rounded-2xl px-4 py-2.5 text-sm",
                                                    m.role === "user"
                                                        ? "bg-primary text-primary-foreground rounded-br-none"
                                                        : "bg-muted text-foreground rounded-bl-none"
                                                )}
                                            >
                                                <div className="prose dark:prose-invert prose-sm max-w-none break-words">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            pre: ({ node, ...props }: any) => (
                                                                <div className="overflow-auto w-full my-2 bg-black/10 dark:bg-black/30 p-2 rounded-lg">
                                                                    <pre {...props} />
                                                                </div>
                                                            ),
                                                            code: ({ node, ...props }: any) => (
                                                                <code className="bg-black/10 dark:bg-black/30 rounded-md px-1 py-0.5" {...props} />
                                                            )
                                                        }}
                                                    >
                                                        {(m as any).content
                                                            ? (m as any).content
                                                            : (m.parts && m.parts.length > 0 && m.parts[0].type === "text"
                                                                ? m.parts[0].text
                                                                : "")}
                                                    </ReactMarkdown>
                                                </div>
                                                {(m as any).sources && (m as any).sources.length > 0 && (
                                                    <div className="mt-4 flex flex-wrap gap-2">
                                                        {(m as any).sources.map((source: string, idx: number) => (
                                                            <div key={idx} className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded-md text-muted-foreground flex items-center gap-1">
                                                                <span className="font-medium">Source:</span>
                                                                <span className="truncate max-w-[200px]">{source}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {m.role === "user" && (
                                            <Avatar className="size-8 mt-1 border">
                                                <AvatarFallback>ME</AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                )
                            }
                            )}
                            {isLoading && (
                                <div className="flex gap-4 w-full max-w-3xl mx-auto justify-start">
                                    <Avatar className="size-8 mt-1 border">
                                        <AvatarFallback>AI</AvatarFallback>
                                    </Avatar>
                                    <div className="flex items-center space-x-2 bg-muted rounded-2xl px-4 py-3 rounded-bl-none">
                                        <div className="size-2 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="size-2 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="size-2 bg-foreground/30 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-background">
                <div className="max-w-3xl mx-auto">
                    <CustomPromptInput
                        onSubmit={async (message) => {
                            await onSubmit(message, undefined);
                        }}
                        isLoading={isLoading}
                    />
                    <div className="text-center mt-2">
                        <p className="text-xs text-muted-foreground">
                            AI can make mistakes. Please verify important information.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
