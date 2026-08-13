import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'
import { config } from './configs/envImplement.js';
import { closeDb, dbconnect } from './configs/db.config.js';
import authRouter from './routes/auth/auth.route.js';
import driverProfileRouter from './routes/driver/profile.route.js'
import roadsRouter from './routes/map/roads.route.js';
import trackingRouter from './routes/tracking/tracking.route.js';
import incidentsRouter from './routes/incidents/incidents.route.js';
import adminRouter from './routes/admin/dashboard.route.js';
import routeIntelligenceRouter from './routes/routes/routeIntelligence.route.js';
import { requestLogger } from './service/logger/requestLogger.js';


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

    app.use(requestLogger);

    app.use(API_PREFIX+"/auth", authRouter);
    app.use(API_PREFIX+"/driver-profiles", driverProfileRouter)
    app.use(API_PREFIX+"/map", roadsRouter);
    app.use(API_PREFIX+"/tracking", trackingRouter);
    app.use(API_PREFIX+"/incidents", incidentsRouter);
    app.use(API_PREFIX+"/admin", adminRouter);
    app.use(API_PREFIX+"/routes", routeIntelligenceRouter);

    
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
