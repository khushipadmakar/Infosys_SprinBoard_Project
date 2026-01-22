/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass them to error middleware
 * Eliminates the need for try-catch blocks in every controller
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 * 
 * @example
 * exports.getProducts = asyncHandler(async (req, res, next) => {
 *   const products = await Product.find();
 *   res.json({ success: true, data: products });
 * });
 */
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;