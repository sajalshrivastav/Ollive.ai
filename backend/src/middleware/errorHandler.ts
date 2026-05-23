import { Request, Response, NextFunction } from "express";

// Global error handler — catches any error thrown in controllers
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("[Error]", err.message);
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
  });
}
