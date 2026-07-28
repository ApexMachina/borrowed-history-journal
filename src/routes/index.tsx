import { createFileRoute } from "@tanstack/react-router";
import { JournalApp } from "@/components/JournalApp";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <JournalApp />;
}
