import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'
import { config } from './configs/envImplement.js';
import { closeDb, dbconnect } from './configs/db.config.js';

const port = config.port || 3000;
async function startServer(){
    console.log(`We're in ${config.env} environmnet`);
    await dbconnect();
    const app = express();

    app.use(cors({
      origin: '*',
      methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    }));

    app.use(express.json());
    app.use(cookieParser())
    
    app.listen(port, () => {
      console.log("Server is running on port: ", port)
    })

}

startServer();

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