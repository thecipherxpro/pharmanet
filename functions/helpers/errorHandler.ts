/**
 * Error Handler Utility
 * Provides consistent error handling and response formatting
 */

/**
 * Standard error response format
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Common error types
 */
export const ErrorTypes = {
  UNAUTHORIZED: (message = 'Unauthorized access') => 
    new ApiError(message, 401, 'UNAUTHORIZED'),
  
  FORBIDDEN: (message = 'Access forbidden') => 
    new ApiError(message, 403, 'FORBIDDEN'),
  
  NOT_FOUND: (message = 'Resource not found') => 
    new ApiError(message, 404, 'NOT_FOUND'),
  
  VALIDATION_ERROR: (message, details = null) => 
    new ApiError(message, 400, 'VALIDATION_ERROR', details),
  
  PAYMENT_ERROR: (message, details = null) => 
    new ApiError(message, 402, 'PAYMENT_ERROR', details),
  
  RATE_LIMIT: (message = 'Rate limit exceeded') => 
    new ApiError(message, 429, 'RATE_LIMIT'),
  
  EXTERNAL_SERVICE_ERROR: (service, message, details = null) => 
    new ApiError(`${service} error: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR', details),
  
  DATABASE_ERROR: (message, details = null) => 
    new ApiError(`Database error: ${message}`, 500, 'DATABASE_ERROR', details),
};

/**
 * Format error response
 */
export function formatErrorResponse(error) {
  // Handle ApiError instances
  if (error instanceof ApiError) {
    return Response.json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        details: error.details,
        timestamp: error.timestamp
      }
    }, { status: error.statusCode });
  }
  
  // Handle Stripe errors
  if (error.type && error.type.startsWith('Stripe')) {
    return Response.json({
      success: false,
      error: {
        message: error.message,
        code: 'STRIPE_ERROR',
        type: error.type,
        details: error.code,
        timestamp: new Date().toISOString()
      }
    }, { status: error.statusCode || 500 });
  }
  
  // Handle standard errors
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || 'An unexpected error occurred';
  
  return Response.json({
    success: false,
    error: {
      message: message,
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }
  }, { status: statusCode });
}

/**
 * Async error handler wrapper
 * Wraps async function and handles errors consistently
 */
export function asyncHandler(fn) {
  return async (req) => {
    try {
      return await fn(req);
    } catch (error) {
      console.error('Function error:', error);
      return formatErrorResponse(error);
    }
  };
}

/**
 * Validate required fields
 */
export function validateRequired(data, requiredFields) {
  const missing = [];
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    throw ErrorTypes.VALIDATION_ERROR(
      'Missing required fields',
      { missing_fields: missing }
    );
  }
}

/**
 * Log error to monitoring (extensible for future monitoring services)
 */
export function logError(error, context = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
    ...context
  };
  
  console.error('Error Log:', JSON.stringify(errorLog, null, 2));
  
  // TODO: Add external monitoring service integration here
  // e.g., Sentry, LogRocket, etc.
}