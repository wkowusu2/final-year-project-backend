import { Pool } from 'pg'
import { config } from './envImplement.js'
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema/index.js'

let db: NodePgDatabase<typeof schema> | null = null;
let pool: Pool | null = null;

function createPool(){
        pool = new Pool({
        connectionString:  config.db.url,
        keepAlive: true,
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 20000,
    });

    pool.on('error', (err) => {
        console.error("Pool error: ", err)
    })
    return pool;
}

export async function dbconnect() {
    try {
        if(!pool){
            pool = createPool();
        }
        await pool.query("SELECT 1");
    } catch (error: any) {
        console.log('Some error occurred when connecting to db: ', error)
        await pool?.end();
        pool = null;
    } 
}

export function getDb():NodePgDatabase<typeof schema>  {
    if(!db){
        if(!pool){
            pool = createPool();
        }

        db = drizzle(pool, { schema });
    }
    return db;
}

export async function closeDb() {
    if(!pool){
        return ;
    }
    console.log('Closing pool...')
    await pool.end();
    pool = null;
    db = null;
}