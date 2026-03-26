/**
 * Error handling utilities for consistent error logging and user feedback
 */

/**
 * Log levels
 */
export const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
}

/**
 * Logs an error with context
 * @param {Error|string} error - The error to log
 * @param {string} context - Context where the error occurred
 * @param {Object} additionalData - Additional data to log
 */
export function logError(error, context = '', additionalData = {}) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  console.error(`[${context}] ${errorMessage}`, {
    error: errorMessage,
    stack: errorStack,
    context,
    timestamp: new Date().toISOString(),
    ...additionalData
  })

  // In production, you could send this to an error tracking service
  // like Sentry, LogRocket, etc.
  if (import.meta.env.PROD) {
    // sendToErrorTrackingService({ error, context, additionalData })
  }
}

/**
 * Logs a warning with context
 * @param {string} message - Warning message
 * @param {string} context - Context where the warning occurred
 * @param {Object} additionalData - Additional data to log
 */
export function logWarning(message, context = '', additionalData = {}) {
  console.warn(`[${context}] ${message}`, {
    message,
    context,
    timestamp: new Date().toISOString(),
    ...additionalData
  })
}

/**
 * Logs info for debugging
 * @param {string} message - Info message
 * @param {string} context - Context
 * @param {Object} additionalData - Additional data to log
 */
export function logInfo(message, context = '', additionalData = {}) {
  if (import.meta.env.DEV) {
    console.info(`[${context}] ${message}`, {
      message,
      context,
      timestamp: new Date().toISOString(),
      ...additionalData
    })
  }
}

/**
 * Gets a user-friendly error message from an error object
 * @param {Error|string} error - The error
 * @param {string} defaultMessage - Default message if error is not user-friendly
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyErrorMessage(error, defaultMessage = 'An unexpected error occurred') {
  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error) {
    // Firebase auth errors
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          return 'No account found with this email address'
        case 'auth/wrong-password':
          return 'Incorrect password'
        case 'auth/email-already-in-use':
          return 'An account with this email already exists'
        case 'auth/weak-password':
          return 'Password should be at least 6 characters'
        case 'auth/invalid-email':
          return 'Invalid email address'
        case 'auth/too-many-requests':
          return 'Too many attempts. Please try again later'
        case 'permission-denied':
          return 'You do not have permission to perform this action'
        case 'unavailable':
          return 'Service temporarily unavailable. Please try again'
        default:
          return error.message || defaultMessage
      }
    }

    return error.message || defaultMessage
  }

  return defaultMessage
}

/**
 * Handles async errors and provides user feedback
 * @param {Function} asyncFn - Async function to execute
 * @param {Object} options - Options
 * @param {string} options.context - Context for logging
 * @param {Function} options.onError - Callback when error occurs
 * @param {Function} options.onSuccess - Callback when successful
 * @param {string} options.defaultErrorMessage - Default error message
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export async function handleAsync(asyncFn, options = {}) {
  const {
    context = 'Unknown',
    onError = null,
    onSuccess = null,
    defaultErrorMessage = 'An error occurred'
  } = options

  try {
    const result = await asyncFn()
    if (onSuccess) {
      onSuccess(result)
    }
    return { success: true, data: result, error: null }
  } catch (error) {
    const userMessage = getUserFriendlyErrorMessage(error, defaultErrorMessage)
    logError(error, context)

    if (onError) {
      onError(userMessage, error)
    }

    return { success: false, data: null, error: userMessage }
  }
}
