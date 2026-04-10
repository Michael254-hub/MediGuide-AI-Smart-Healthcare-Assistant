const { ZodError } = require('zod');

const formatZodIssues = (error) => {
  const issues = Array.isArray(error.issues)
    ? error.issues
    : Array.isArray(error.errors)
      ? error.errors
      : [];

  return issues.map((issue) => ({
    field: Array.isArray(issue.path) && issue.path.length ? issue.path.join('.') : 'body',
    message: issue.message
  }));
};

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formatZodIssues(error)
      });
    }
    next(error);
  }
};

module.exports = validate;
