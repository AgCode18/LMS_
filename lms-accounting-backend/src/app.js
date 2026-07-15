import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.use((req, res) => res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` }));
app.use(errorHandler);

export default app;


// typescript code  


// import express, { Express, Request, Response } from 'express';
// import cors from 'cors';
// import routes from './routes/index.js';
// import errorHandler from './middleware/errorHandler.js';

// // ============================================================================
// // Type Definitions
// // ============================================================================

// /**
//  * Application configuration options
//  */
// interface AppConfig {
//   /**
//    * CORS options
//    */
//   corsOptions?: cors.CorsOptions;
//   /**
//    * API base path
//    * @default '/api'
//    */
//   apiBasePath?: string;
//   /**
//    * Enable/disable JSON parsing
//    * @default true
//    */
//   enableJsonParser?: boolean;
//   /**
//    * Enable/disable logging
//    * @default true
//    */
//   enableLogging?: boolean;
// }

// // ============================================================================
// // Application Setup
// // ============================================================================

// /**
//  * Create and configure the Express application
//  */
// const app: Express = express();

// /**
//  * Enable CORS for cross-origin requests
//  * Allows any origin to access the API
//  */
// app.use(cors());

// /**
//  * Parse JSON request bodies
//  * Supports up to 100MB payloads
//  */
// app.use(express.json({ limit: '100mb' }));

// /**
//  * Parse URL-encoded request bodies
//  * Supports extended URL-encoded data
//  */
// app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// /**
//  * Mount all API routes under /api prefix
//  */
// app.use('/api', routes);

// /**
//  * 404 Not Found handler
//  * Catches any requests that don't match any route
//  */
// app.use((req: Request, res: Response): void => {
//   res.status(404).json({
//     error: `No route for ${req.method} ${req.originalUrl}`,
//     timestamp: new Date().toISOString(),
//   });
// });

// /**
//  * Global error handler
//  * Must be registered after all routes and other middleware
//  * Catches any errors thrown in the application
//  */
// app.use(errorHandler);

// export default app;

// // ============================================================================
// // Optional: Factory Function for Configuration
// // ============================================================================

// /**
//  * Create a configured Express application with options
//  * Useful for testing or custom configurations
//  * 
//  * @param config - Application configuration options
//  * @returns Configured Express application
//  * 
//  * @example
//  * ```typescript
//  * const app = createApp({
//  *   apiBasePath: '/v1',
//  *   corsOptions: { origin: 'https://example.com' }
//  * });
//  * ```
//  */
// export const createApp = (config: AppConfig = {}): Express => {
//   const {
//     corsOptions,
//     apiBasePath = '/api',
//     enableJsonParser = true,
//   } = config;

//   const appInstance: Express = express();

//   // CORS middleware
//   if (corsOptions) {
//     appInstance.use(cors(corsOptions));
//   } else {
//     appInstance.use(cors());
//   }

//   // Body parsing middleware
//   if (enableJsonParser) {
//     appInstance.use(express.json({ limit: '100mb' }));
//     appInstance.use(express.urlencoded({ extended: true, limit: '100mb' }));
//   }

//   // API routes
//   appInstance.use(apiBasePath, routes);

//   // 404 handler
//   appInstance.use((req: Request, res: Response): void => {
//     res.status(404).json({
//       error: `No route for ${req.method} ${req.originalUrl}`,
//       timestamp: new Date().toISOString(),
//     });
//   });

//   // Error handler
//   appInstance.use(errorHandler);

//   return appInstance;
// };

// // ============================================================================
// // Optional: Application Configuration with Environment Variables
// // ============================================================================

// /**
//  * Get application configuration from environment variables
//  */
// export const getAppConfig = (): AppConfig => {
//   const config: AppConfig = {
//     apiBasePath: process.env.API_BASE_PATH || '/api',
//   };

//   // CORS configuration
//   const corsOrigin = process.env.CORS_ORIGIN;
//   if (corsOrigin) {
//     const origins = corsOrigin.split(',').map((o) => o.trim());
//     config.corsOptions = {
//       origin: origins.length === 1 ? origins[0] : origins,
//       credentials: true,
//     };
//   }

//   return config;
// };

// // ============================================================================
// // Optional: Request Logger Middleware
// // ============================================================================

// /**
//  * Request logging middleware
//  * Logs all incoming requests
//  */
// export const requestLogger = (req: Request, _res: Response, next: Function): void => {
//   const timestamp = new Date().toISOString();
//   console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
//   next();
// };

// /**
//  * Create app with logging enabled
//  */
// export const createAppWithLogging = (config: AppConfig = {}): Express => {
//   const appInstance = createApp(config);
  
//   // Add request logging
//   appInstance.use(requestLogger);
  
//   return appInstance;
// };

// // ============================================================================
// // Optional: Health Check Route
// // ============================================================================

// /**
//  * Add health check route to the application
//  */
// export const addHealthCheck = (appInstance: Express): void => {
//   appInstance.get('/health', (req: Request, res: Response) => {
//     res.json({
//       status: 'ok',
//       timestamp: new Date().toISOString(),
//       uptime: process.uptime(),
//       memory: process.memoryUsage(),
//       environment: process.env.NODE_ENV || 'development',
//     });
//   });
// };

// // ============================================================================
// // Type Exports
// // ============================================================================

// export type { AppConfig };