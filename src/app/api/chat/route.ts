import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseBody, toApiError } from "@/lib/api";
import { chatRequestSchema } from "@/lib/validators";
import { isOpenClawEnabled, requestOpenClaw } from "@/lib/openclaw";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object") return null;
  return value as UnknownRecord;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function extractAssistantText(payload: unknown): string | null {
  if (typeof payload === "string") {
    return payload;
  }

  const record = asRecord(payload);
  if (!record) {
    return null;
  }

  const direct = firstString(record.reply, record.message, record.content, record.text, record.output);
  if (direct) {
    return direct;
  }

  const assistant = asRecord(record.assistant);
  if (assistant) {
    const assistantContent = firstString(assistant.content, assistant.message, assistant.text);
    if (assistantContent) {
      return assistantContent;
    }
  }

  if (Array.isArray(record.choices)) {
    for (const choice of record.choices) {
      const choiceRecord = asRecord(choice);
      if (!choiceRecord) continue;

      const choiceDirect = firstString(choiceRecord.text, choiceRecord.content);
      if (choiceDirect) return choiceDirect;

      const message = asRecord(choiceRecord.message);
      if (!message) continue;

      const messageContent = firstString(message.content, message.text);
      if (messageContent) return messageContent;
    }
  }

  if (Array.isArray(record.messages)) {
    const assistantMessages = record.messages
      .map((entry) => asRecord(entry))
      .filter((entry): entry is UnknownRecord => Boolean(entry))
      .filter((entry) => entry.role === "assistant");

    const latest = assistantMessages.at(-1);
    if (latest) {
      const latestText = firstString(latest.content, latest.message, latest.text);
      if (latestText) return latestText;
    }
  }

  return null;
}

function extractConversationId(payload: unknown): string | undefined {
  const record = asRecord(payload);
  if (!record) return undefined;

  return (
    firstString(record.conversationId, record.conversation_id, record.threadId, record.thread_id) ?? undefined
  );
}

async function buildLocalReply(message: string) {
  const lowered = message.toLowerCase();

  const [taskTotal, todoCount, progressCount, reviewCount, doneCount, projectCount, memoryCount, documentCount, agentCount, jobCount] =
    await Promise.all([
      db.task.count(),
      db.task.count({ where: { status: "TODO" } }),
      db.task.count({ where: { status: "IN_PROGRESS" } }),
      db.task.count({ where: { status: "REVIEW" } }),
      db.task.count({ where: { status: "DONE" } }),
      db.project.count(),
      db.memory.count(),
      db.document.count(),
      db.agent.count(),
      db.job.count(),
    ]);

  const summary = `Current workspace snapshot: ${taskTotal} tasks (${todoCount} todo, ${progressCount} in progress, ${reviewCount} in review, ${doneCount} done), ${projectCount} projects, ${agentCount} agents, ${memoryCount} memories, ${documentCount} documents, and ${jobCount} scheduled jobs.`;

  if (lowered.includes("status") || lowered.includes("overview") || lowered.includes("summary")) {
    return `${summary} Configure OPENCLAW_API_URL for full model-backed chat.`;
  }

  const recentTasks = await db.task.findMany({
    orderBy: { updatedAt: "desc" },
    take: 3,
    select: { title: true, status: true },
  });

  if (recentTasks.length === 0) {
    return `${summary} No tasks exist yet. Create a task to start operational tracking.`;
  }

  const recentLine = recentTasks.map((task) => `${task.title} [${task.status}]`).join("; ");
  return `${summary} Recently updated tasks: ${recentLine}. Configure OPENCLAW_API_URL for full model-backed chat.`;
}

export async function POST(request: Request) {
  try {
    const body = parseBody(chatRequestSchema, await request.json());

    if (isOpenClawEnabled()) {
      const openClawPath = process.env.OPENCLAW_CHAT_PATH?.trim() || "/chat";
      const upstream = await requestOpenClaw({
        request,
        path: openClawPath,
        method: "POST",
        body: {
          conversationId: body.conversationId,
          message: body.message,
          messages: [...body.history, { role: "user", content: body.message }],
          stream: false,
        },
        forwardSearchParams: false,
      });

      if (!upstream) {
        return NextResponse.json({ error: "OpenClaw integration is not configured" }, { status: 500 });
      }

      if (upstream.status >= 400) {
        if (upstream.data && typeof upstream.data === "object") {
          return NextResponse.json(upstream.data, { status: upstream.status });
        }

        return NextResponse.json({ error: "OpenClaw chat request failed" }, { status: upstream.status });
      }

      const assistantText = extractAssistantText(upstream.data);
      if (!assistantText) {
        return NextResponse.json(
          {
            error: "OpenClaw chat response did not include assistant text",
          },
          { status: 502 },
        );
      }

      return NextResponse.json({
        id: crypto.randomUUID(),
        role: "assistant",
        content: assistantText,
        conversationId: extractConversationId(upstream.data) ?? body.conversationId,
        provider: "openclaw",
      });
    }

    const localReply = await buildLocalReply(body.message);

    return NextResponse.json({
      id: crypto.randomUUID(),
      role: "assistant",
      content: localReply,
      conversationId: body.conversationId,
      provider: "local",
    });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(apiError.body, { status: apiError.status });
  }
}
