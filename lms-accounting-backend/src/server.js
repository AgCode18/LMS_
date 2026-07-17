import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT ?? 4000;

app.listen(PORT, () => {
  console.log(`LMS Accounting Engine API listening on http://localhost:${PORT}`);
});


// typescript code 👇

// import 'dotenv/config';
// import app from './app.js';

// const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

// app.listen(PORT, () => {
//   console.log(`LMS Accounting Engine API listening on http://localhost:${PORT}`);
// });