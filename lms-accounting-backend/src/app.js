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
