import e from "express";
import { rateLimit } from "express-rate-limit";

// Define rate limiter for `/sendMessage` with 20 requests per 10 minutes
const sendMessageLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 20, // limit to 20 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    const error = new Error(
      `Too many requests to send messages. You are allowed ${
        options.limit
      } requests per ${options.windowMs / 60000} minutes.`
    );
    error.status = 429; // Too Many Requests
    next(error); // Pass the error to the error handler
  },
});

// Define rate limiter for `/deleteMessage` with 5 requests per 10 minutes
const deleteMessageLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 5, // limit to 5 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    const error = new Error(
      `Too many requests to delete messages. You are allowed ${
        options.limit
      } requests per ${options.windowMs / 60000} minutes.`
    );
    error.status = 429; // Too Many Requests
    next(error); // Pass the error to the error handler
  },
});

export { sendMessageLimiter, deleteMessageLimiter };
