import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes input string to prevent XSS attacks.
 */
export const sanitize = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML allowed for most inputs
    ALLOWED_ATTR: [],
  });
};

/**
 * Sanitizes an object of strings.
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = { ...obj };
  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitize(sanitized[key]) as any;
    }
  }
  return sanitized;
};
