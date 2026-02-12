import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { badRequest } from "../lib/http-errors.js";

/**
 * Converts camelCase field names to user-friendly labels
 * e.g., "firstName" -> "First name", "email" -> "Email"
 */
function formatFieldName(fieldName: string): string {
  // Handle common field name patterns
  const fieldMap: Record<string, string> = {
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    password: "Password",
    currentPassword: "Current password",
    newPassword: "New password",
    phoneNumber: "Phone number",
    stateOfPractice: "State of practice",
    whoYouAre: "Profession",
    token: "Token"
  };

  if (fieldMap[fieldName]) {
    return fieldMap[fieldName];
  }

  // Convert camelCase to "Title Case"
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Formats Zod error messages to be user-friendly
 */
function formatZodError(err: z.ZodError): string {
  if (err.issues.length === 0) {
    return "Please check your input and try again.";
  }

  // Format each issue into a user-friendly message
  const formattedErrors = err.issues.map((issue) => {
    if (!issue) {
      return "Invalid input";
    }
    
    const fieldName = issue.path.length > 0 ? formatFieldName(issue.path[0] as string) : "This field";
    
    // Use Zod's built-in message but format the field name
    // Replace common technical terms with user-friendly ones
    const message = issue.message;
    
    // Improve common error messages
    if (message.includes("Required")) {
      return `${fieldName} is required.`;
    }
    if (message.toLowerCase().includes("invalid email") || message.toLowerCase().includes("email")) {
      return "Please enter a valid email address.";
    }
    
    // Password-specific messages (use custom message from schema if available)
    if (fieldName.toLowerCase().includes("password")) {
      // If the message already contains "Password", use it as-is (from custom schema message)
      if (message.toLowerCase().includes("password")) {
        return message;
      }
      // Otherwise format it
      if (message.includes("too_small") || message.includes("too small") || message.includes("at least")) {
        const minMatch = message.match(/(\d+)/);
        if (minMatch) {
          return `Password must be at least ${minMatch[1]} characters long.`;
        }
        return "Password is too short. Please use at least 8 characters.";
      }
      if (message.includes("too_big") || message.includes("too big") || message.includes("no more than")) {
        const maxMatch = message.match(/(\d+)/);
        if (maxMatch) {
          return `Password must be no more than ${maxMatch[1]} characters long.`;
        }
        return "Password is too long. Please use no more than 100 characters.";
      }
    }
    
    if (message.includes("too_small") || message.includes("too small")) {
      // Extract minimum if mentioned in message
      const minMatch = message.match(/(\d+)/);
      if (minMatch) {
        return `${fieldName} must be at least ${minMatch[1]} characters.`;
      }
      return `${fieldName} is too short.`;
    }
    if (message.includes("too_big") || message.includes("too big")) {
      // Extract maximum if mentioned in message
      const maxMatch = message.match(/(\d+)/);
      if (maxMatch) {
        return `${fieldName} must be no more than ${maxMatch[1]} characters.`;
      }
      return `${fieldName} is too long.`;
    }
    
    // Default: format with field name, but use message as-is if it's already user-friendly
    // (custom messages from schemas will be used directly)
    if (message.includes("must be") || message.includes("is required") || message.includes("Please")) {
      return message;
    }
    return `${fieldName}: ${message}`;
  });

  if (formattedErrors.length === 1) {
    return formattedErrors[0] || "Please check your input and try again.";
  }

  return `Please fix the following errors: ${formattedErrors.join(" ")}`;
}

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const userFriendlyMessage = formatZodError(err);
        throw badRequest(userFriendlyMessage);
      }
      next(err);
    }
  };
}

export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      // Don't try to reassign req.query - just validate it
      // The parsed query is validated, proceed to next middleware
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const userFriendlyMessage = formatZodError(err);
        throw badRequest(userFriendlyMessage);
      }
      next(err);
    }
  };
}
