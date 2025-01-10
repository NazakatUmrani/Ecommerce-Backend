import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectToMongo from './DB/db.js';
// import notesRoutes from './Routes/notes.routes.js';
import authRoutes from './Routes/auth.routes.js';
// import homeRoutes from './Routes/home.routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Connect to database
connectToMongo();

// Middleware
app.use(express.json());
app.use(cors());
app.use(cookieParser())

// Define routes
app.use('/api/auth', authRoutes);
// app.use('/api/notes', notesRoutes);
// app.use('/', homeRoutes);

// Listen on port
app.listen(port, () => {
  console.info(`Ecommerce app listening at http://localhost:${port}`)
})
