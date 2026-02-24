import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

interface Task {
  id: number;
  text: string;
  status: "open" | "done" | "dropped";
  created: string;
  closed?: string;
}

interface TaskStore {
  nextId: number;
  tasks: Task[];
}

async function loadStore(filepath: string): Promise<TaskStore> {
  try {
    const raw = await readFile(filepath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { nextId: 1, tasks: [] };
  }
}

async function saveStore(filepath: string, store: TaskStore): Promise<void> {
  await writeFile(filepath, JSON.stringify(store, null, 2), "utf-8");
}

function formatTask(t: Task): string {
  const marker = t.status === "done" ? "x" : t.status === "dropped" ? "-" : " ";
  return `[${marker}] #${t.id} ${t.text}`;
}

export function createTaskTools(memoryDir: string) {
  const filepath = join(memoryDir, "tasks.json");

  const taskList = tool(
    "task_list",
    "List open tasks (or all tasks). Lightweight action-item tracking that persists across sessions.",
    {
      all: z.boolean().optional().describe("Show all tasks including done/dropped. Default: false (open only)"),
    },
    async ({ all = false }) => {
      const store = await loadStore(filepath);
      const filtered = all ? store.tasks : store.tasks.filter((t) => t.status === "open");
      if (filtered.length === 0) {
        return { content: [{ type: "text" as const, text: all ? "No tasks." : "No open tasks." }] };
      }
      return { content: [{ type: "text" as const, text: filtered.map(formatTask).join("\n") }] };
    },
    { annotations: { readOnlyHint: true } },
  );

  const taskAdd = tool(
    "task_add",
    "Add a new task. Returns the assigned ID.",
    {
      text: z.string().describe("Task description — keep it actionable"),
    },
    async ({ text }) => {
      const store = await loadStore(filepath);
      const task: Task = { id: store.nextId++, text, status: "open", created: new Date().toISOString() };
      store.tasks.push(task);
      await saveStore(filepath, store);
      return { content: [{ type: "text" as const, text: `Added #${task.id}: ${text}` }] };
    },
  );

  const taskClose = tool(
    "task_close",
    "Mark a task as done or dropped.",
    {
      id: z.number().int().describe("Task ID"),
      status: z.enum(["done", "dropped"]).describe("New status"),
    },
    async ({ id, status }) => {
      const store = await loadStore(filepath);
      const task = store.tasks.find((t) => t.id === id);
      if (!task) return { content: [{ type: "text" as const, text: `Task #${id} not found.` }] };
      task.status = status;
      task.closed = new Date().toISOString();
      await saveStore(filepath, store);
      return { content: [{ type: "text" as const, text: `#${id} marked ${status}.` }] };
    },
  );

  return [taskList, taskAdd, taskClose];
}
