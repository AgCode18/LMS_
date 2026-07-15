import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT ?? 4000;

app.listen(PORT, () => {
  console.log(`LMS Accounting Engine API listening on http://localhost:${PORT}`);
});


// typescript code 👇



// import 'dotenv/config';
// import app from './app.js';
// import { Server } from 'http';

// // ============================================================================
// // Type Definitions
// // ============================================================================

// interface ServerConfig {
//   port: number;
//   host?: string;
//   environment?: string;
// }

// // ============================================================================
// // Server Configuration
// // ============================================================================

// /**
//  * Server port configuration
//  * Falls back to port 4000 if not specified in environment variables
//  */
// const PORT: number = Number(process.env.PORT) || 4000;
// const HOST: string = process.env.HOST || 'localhost';
// const NODE_ENV: string = process.env.NODE_ENV || 'development';

// // ============================================================================
// // Server Startup
// // ============================================================================

// /**
//  * Start the Express server
//  */
// const server: Server = app.listen(PORT, () => {
//   console.log(`🚀 LMS Accounting Engine API listening on http://${HOST}:${PORT}`);
//   console.log(`📦 Environment: ${NODE_ENV}`);
//   console.log(`📝 API Documentation: http://${HOST}:${PORT}/api/health`);
// });

// // ============================================================================
// // Graceful Shutdown
// // ============================================================================

// /**
//  * Gracefully shutdown the server
//  * Handles SIGTERM and SIGINT signals
//  */
// const gracefulShutdown = (signal: string): void => {
//   console.log(`\n⚠️  Received ${signal}. Shutting down gracefully...`);
  
//   server.close(() => {
//     console.log('✅ HTTP server closed.');
    
//     // Close database connections if needed
//     // await prisma.$disconnect();
    
//     console.log('👋 Shutdown complete.');
//     process.exit(0);
//   });

//   // Force shutdown after timeout
//   setTimeout(() => {
//     console.error('❌ Could not close connections in time, forcefully shutting down');
//     process.exit(1);
//   }, 10000);
// };

// // Handle shutdown signals
// process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
// process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// // ============================================================================
// // Optional: Handle Uncaught Exceptions
// // ============================================================================

// /**
//  * Handle uncaught exceptions
//  */
// process.on('uncaughtException', (error: Error) => {
//   console.error('💥 Uncaught Exception:', error);
//   // In production, you might want to log this and exit gracefully
//   if (NODE_ENV === 'production') {
//     process.exit(1);
//   }
// });

// /**
//  * Handle unhandled promise rejections
//  */
// process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
//   console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
//   // In production, you might want to log this and exit gracefully
//   if (NODE_ENV === 'production') {
//     process.exit(1);
//   }
// });

// // ============================================================================
// // Export for Testing
// // ============================================================================

// export { server, PORT, HOST, NODE_ENV };

// // ============================================================================
// // Default Export (Optional)
// // ============================================================================

// export default server;