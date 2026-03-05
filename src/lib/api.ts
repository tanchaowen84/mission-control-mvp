import { ZodTypeAny, z } from "zod";

export function parseBody<T extends ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  return schema.parse(body);
}

export function toApiError(error: unknown) {
  if (error instanceof z.ZodError) {
    return {
      status: 400,
      body: {
        error: "Validation failed",
        details: error.flatten(),
      },
    };
  }

  return {
    status: 500,
    body: {
      error: "Internal server error",
    },
  };
}
