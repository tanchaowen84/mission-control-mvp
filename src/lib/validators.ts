import { projectStatuses, taskStatuses } from "@/lib/constants";
import { z } from "zod";

export const missionSchema = z.object({
  statement: z.string().min(3).max(500),
});

export const taskSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(taskStatuses).optional(),
  assigneeId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const projectSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(projectStatuses).optional(),
});

export const memorySchema = z.object({
  title: z.string().min(2).max(140),
  content: z.string().min(3).max(4000),
  tags: z.array(z.string().min(1).max(40)).default([]),
  occurredAt: z.string().datetime().optional(),
});

export const documentSchema = z.object({
  title: z.string().min(2).max(140),
  fileName: z.string().min(1).max(200),
  contentType: z.string().min(1).max(80),
  description: z.string().max(1000).optional().nullable(),
  textContent: z.string().max(10000).optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
});

export const agentSchema = z.object({
  name: z.string().min(2).max(120),
  role: z.string().min(2).max(80),
  device: z.string().min(2).max(80),
  mission: z.string().min(3).max(500),
  parentId: z.string().optional().nullable(),
});

export const jobSchema = z.object({
  name: z.string().min(2).max(140),
  cronExpression: z.string().min(4).max(120),
  nextRun: z.string().datetime(),
  enabled: z.boolean().optional(),
});

export const deskSchema = z.object({
  agentId: z.string().optional().nullable(),
  x: z.number().int().min(0).max(24),
  y: z.number().int().min(0).max(24),
  label: z.string().min(1).max(40),
});

const chatHistoryMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(4000),
});

export const chatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().min(1).max(200).optional(),
  history: z.array(chatHistoryMessageSchema).max(40).optional().default([]),
});
