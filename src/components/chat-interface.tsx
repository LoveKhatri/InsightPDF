"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { useRef } from "react";
import { Bot, Paperclip, Send, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    PromptInput,
    PromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { PromptInputActionAddAttachments } from "@/components/ai-elements/prompt-input";
import { InputGroupTextarea, InputGroupButton } from "@/components/ui/input-group";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ChatInterface() {
    const { messages, status, sendMessage } = useChat({
        transport: new DefaultChatTransport({ api: "/api/chat" }),
        onError: (error) => {
            toast.error("Failed to send message: " + error.message);
        },
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses
    });

    const scrollRef = useRef<HTMLDivElement>(null);

    const onSubmit = async (message: { text: string; files: any[] }, e: any) => {
        if (!message.text.trim() && message.files.length === 0) return;

        if (message.files.length > 0) {
            const formData = new FormData();

            for (const file of message.files) {
                if (file.url) {
                    const response = await fetch(file.url);
                    const blob = await response.blob();
                    formData.append("files", blob, file.filename || "attachment.pdf");
                }
            }

            const uploadPromise = fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            toast.promise(uploadPromise, {
                loading: "Uploading and processing files...",
                success: "Files processed. Generating response...",
                error: "Failed to upload files",
            });

            await uploadPromise;
        }

        await sendMessage({ text: message.text });
    };

    const isEmpty = messages.length === 0;
    const isLoading = status == "streaming" || status == "submitted"

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
                            {messages.map((m) => (
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
                                            {m.parts[0].type == "text" ? m.parts[0].text : ""}
                                        </div>
                                    </div>

                                    {m.role === "user" && (
                                        <Avatar className="size-8 mt-1 border">
                                            <AvatarFallback>ME</AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
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
                    <PromptInput
                        onSubmit={onSubmit}
                        maxFiles={3}
                        accept=".pdf"
                        className="border rounded-xl shadow-sm bg-background overflow-hidden focus-within:ring-1 focus-within:ring-ring"
                    >
                        <PromptInputAttachments className="border-b bg-muted/30 px-3 py-2">
                            {(file) => (
                                <div key={file.id} className="flex items-center gap-2 text-xs bg-background border px-2 py-1 rounded-md">
                                    <Paperclip className="size-3" />
                                    <span className="truncate max-w-[100px]">{file.filename}</span>
                                </div>
                            )}
                        </PromptInputAttachments>
                        <div className="flex items-end gap-2 p-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <InputGroupButton size="icon-sm" className="shrink-0 rounded-full">
                                        <PlusIcon className="size-4" />
                                    </InputGroupButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <PromptInputActionAddAttachments />
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <InputGroupTextarea
                                name="message"
                                placeholder="Ask a question regarding your documents..."
                                className="min-h-[44px] max-h-[200px] py-3 text-base"
                            />

                            <Button type="submit" size="icon" className="shrink-0 rounded-full size-8 mb-0.5">
                                <Send className="size-4" />
                                <span className="sr-only">Send</span>
                            </Button>
                        </div>
                    </PromptInput>
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
