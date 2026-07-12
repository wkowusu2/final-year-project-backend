import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'
import { config } from './configs/envImplement.js';
import { closeDb, dbconnect } from './configs/db.config.js';
import authRouter from './routes/auth/auth.route.js';
import driverProfileRouter from './routes/driver/profile.route.js'
import roadsRouter from './routes/map/roads.route.js';


const port = config.port || 3000;
const API_PREFIX = '/api/v1';
async function startServer(){
    console.log(`We're in ${config.env} environmnet`);
    await dbconnect();
    const app = express();

    app.use(cors({
      origin: '*',
      methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    }));

    app.use(express.json());
    app.use(cookieParser());

    app.use(API_PREFIX+"/auth", authRouter);
    app.use(API_PREFIX+"/driver-profiles", driverProfileRouter)
    app.use(API_PREFIX+"/map", roadsRouter);

    
    app.listen(port, () => {
      console.log("Server is running on port: ", port)
    })

}

startServer().catch(async (error) => {
  console.error('Server startup failed:', error);
  await closeDb();
  process.exitCode = 1;
});

process.on("SIGINT", async () => {
  await closeDb();
  //await redis.quit();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeDb();
  //await redis.quit();
  process.exit(0);
});