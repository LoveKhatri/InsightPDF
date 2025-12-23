import { ChatInterface } from "@/components/chat-interface";
import { getUser } from "@/lib/auth-utils";

export default async function DashboardPage() {
	// Ensure we have a user (server-side check)
	await getUser();

	return (
		<div className="h-full w-full">
			<ChatInterface />
		</div>
	);
}