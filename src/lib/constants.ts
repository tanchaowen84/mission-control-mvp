export const taskStatuses = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;
export const projectStatuses = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED"] as const;

export const taskStatusLabels: Record<(typeof taskStatuses)[number], string> = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  DONE: "Done",
};

export const projectStatusLabels: Record<(typeof projectStatuses)[number], string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
};
