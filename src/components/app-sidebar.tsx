"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, MessageSquare, PanelLeft, Settings, History } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserProfile } from "@/components/user-profile";
import { siteConfig } from "@/config/site.config";
import { useSession } from "@/lib/auth-client";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function AppSidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [collapsed, setCollapsed] = React.useState(false);

    return (
        <div
            className={cn(
                "group flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
                collapsed ? "w-16" : "w-[260px]",
                className
            )}
        >
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-3 border-b border-sidebar-border">
                {!collapsed && (
                    <Link href="/" className="flex items-center gap-2 font-semibold truncate">
                        <span className="text-lg font-heading tracking-tight">{siteConfig.name}</span>
                    </Link>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto size-8 text-sidebar-foreground"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <PanelLeft className="size-4" />
                </Button>
            </div>

            {/* New Chat Button */}
            <div className="p-3">
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start gap-2 bg-sidebar-accent/50 text-sidebar-foreground hover:bg-sidebar-accent shadow-none border-dashed border-sidebar-border",
                        collapsed && "px-2 justify-center"
                    )}
                    asChild
                >
                    <Link href="/dashboard">
                        <Plus className="size-4" />
                        {!collapsed && <span>New Chat</span>}
                    </Link>
                </Button>
            </div>

            {/* History (Mock) */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {!collapsed && (
                    <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        History
                    </div>
                )}
                <ScrollArea className="flex-1 px-3">
                    <div className="space-y-1 p-1">
                        {/* Mock items */}
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Button
                                key={i}
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start gap-2 h-9 font-normal text-sidebar-foreground hover:bg-sidebar-accent/50",
                                    collapsed && "px-2 justify-center"
                                )}
                            >
                                <MessageSquare className="size-4 shrink-0" />
                                {!collapsed && <span className="truncate">Previous Chat {i + 1}</span>}
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* User / Footer */}
            <div className="border-t border-sidebar-border p-3 space-y-2">
                {!collapsed && session && (
                    <div className="flex items-center gap-3 px-2 py-1.5 rounded-md bg-sidebar-accent/30 mb-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{session.user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                        </div>
                    </div>
                )}

                <div className={cn("flex items-center gap-2", collapsed ? "flex-col" : "justify-between")}>
                    <UserProfile className={cn("size-9", !collapsed && "mr-auto")} />

                    {!collapsed && (
                        <Button variant="ghost" size="icon" className="size-9 text-sidebar-foreground/70">
                            <Settings className="size-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
