// Wraps an async route handler so thrown errors reach errorHandler
// instead of crashing the process or hanging the request.


const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;


// typescript code  👇👇



// import { Request, Response, NextFunction } from 'express';

// type AsyncFunction<P = any, ResBody = any, ReqBody = any, ReqQuery = any> = (
//   req: Request<P, ResBody, ReqBody, ReqQuery>,
//   res: Response<ResBody>,
//   next: NextFunction
// ) => Promise<any> | any;

// // Wraps an async route handler so thrown errors reach errorHandler
// // instead of crashing the process or hanging the request.

// const asyncHandler = <P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
//   fn: AsyncFunction<P, ResBody, ReqBody, ReqQuery>
// ) => {
//   return (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction): void => {
//     Promise.resolve(fn(req, res, next)).catch(next);
//   };
// };

// export default asyncHandler;