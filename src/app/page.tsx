"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { type Doc } from "../../convex/_generated/dataModel";

export default function Home() {
  const tasks = useQuery(api.tasks.get);
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {tasks?.map((task: Doc<"tasks">) => (
        <div key={task._id}>{task.text}</div>
      ))}
    </main>
  );
}
