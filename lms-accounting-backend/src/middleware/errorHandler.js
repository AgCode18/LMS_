// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: err.message ?? 'Internal server error',
    ...(err.details ? { details: err.details } : {}),
  });
}


// //typescript code  👇👇

// import { Request, Response, NextFunction } from 'express';

// // Custom error interface
// interface CustomError extends Error {
//   status?: number;
//   details?: any;
//   code?: string;
//   stack?: string;
// }

// // eslint-disable-next-line no-unused-vars
// export default function errorHandler(
//   err: CustomError,
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void {
//   const status = err.status ?? 500;
  
//   // Structured logging with request context
//   const errorLog = {
//     timestamp: new Date().toISOString(),
//     status,
//     message: err.message,
//     stack: err.stack,
//     details: err.details,
//     path: req.path,
//     method: req.method,
//     ip: req.ip,
//     userId: (req as any).user?.id,
//     userAgent: req.get('user-agent'),
//     query: req.query,
//     params: req.params,
//     body: process.env.NODE_ENV === 'development' ? req.body : undefined,
//   };

//   // Log based on severity
//   if (status >= 500) {
//     console.error('Server Error:', errorLog);
//   } else if (status >= 400) {
//     console.warn('Client Error:', {
//       ...errorLog,
//       stack: undefined, // Don't log stack for client errors
//     });
//   } else {
//     console.log('Info:', errorLog);
//   }

//   // Prepare error response
//   const errorResponse: {
//     error: string;
//     details?: any;
//     stack?: string;
//     statusCode?: number;
//   } = {
//     error: err.message || 'Internal server error',
//   };

//   // Add additional fields based on environment
//   if (err.details) {
//     errorResponse.details = err.details;
//   }

//   if (process.env.NODE_ENV === 'development') {
//     errorResponse.stack = err.stack;
//     errorResponse.statusCode = status;
//   }

//   res.status(status).json(errorResponse);
// }