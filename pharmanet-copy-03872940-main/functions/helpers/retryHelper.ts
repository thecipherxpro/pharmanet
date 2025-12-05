/**
 * Retry Helper Utility
 * Provides exponential backoff retry logic for critical operations
 */

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Result of the function
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry = null,
    shouldRetry = (error) => true
  } = options;

  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      );
      
      // Log retry attempt
      console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms delay`);
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt, error, delay);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries failed
  throw lastError;
}

/**
 * Stripe-specific retry logic
 * Retries on network errors and rate limits
 */
export async function retryStripeOperation(fn, operationName = 'Stripe operation') {
  return retryWithBackoff(fn, {
    maxAttempts: 3,
    initialDelay: 1000,
    shouldRetry: (error) => {
      // Retry on network errors
      if (error.type === 'StripeConnectionError') return true;
      
      // Retry on rate limits
      if (error.statusCode === 429) return true;
      
      // Retry on temporary Stripe errors
      if (error.type === 'StripeAPIError' && error.statusCode >= 500) return true;
      
      // Don't retry on authentication or validation errors
      return false;
    },
    onRetry: (attempt, error, delay) => {
      console.error(`${operationName} failed (attempt ${attempt}):`, error.message);
    }
  });
}

/**
 * Email-specific retry logic
 * Retries on network errors and rate limits
 */
export async function retryEmailSending(fn, emailType = 'Email') {
  return retryWithBackoff(fn, {
    maxAttempts: 3,
    initialDelay: 2000,
    shouldRetry: (error) => {
      // Retry on network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') return true;
      
      // Retry on rate limits (429)
      if (error.response?.status === 429) return true;
      
      // Retry on server errors (5xx)
      if (error.response?.status >= 500) return true;
      
      // Don't retry on authentication or validation errors (4xx except 429)
      return false;
    },
    onRetry: (attempt, error, delay) => {
      console.error(`${emailType} sending failed (attempt ${attempt}):`, error.message);
    }
  });
}

/**
 * Generic API retry logic
 */
export async function retryApiCall(fn, apiName = 'API call') {
  return retryWithBackoff(fn, {
    maxAttempts: 3,
    initialDelay: 1000,
    shouldRetry: (error) => {
      // Retry on network errors
      if (!error.response) return true;
      
      // Retry on rate limits and server errors
      const status = error.response?.status || error.statusCode;
      return status === 429 || status >= 500;
    },
    onRetry: (attempt, error, delay) => {
      console.error(`${apiName} failed (attempt ${attempt}):`, error.message);
    }
  });
}