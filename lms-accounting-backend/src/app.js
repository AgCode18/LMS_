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


// import express, { Express, Request, Response, NextFunction } from 'express';
// import cors from 'cors';
// import routes from './routes/index.js';
// import errorHandler from './middleware/errorHandler.js';

// const app: Express = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // API routes
// app.use('/api', routes);

// // 404 handler for unmatched routes
// app.use((req: Request, res: Response) => {
//   res.status(404).json({ 
//     error: `No route for ${req.method} ${req.originalUrl}` 
//   });
// });

// // Global error handler
// app.use(errorHandler);

// export default app;