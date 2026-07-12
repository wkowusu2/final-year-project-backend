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
        if (!pool) {
            pool = createPool();
        }
        await pool.query('SELECT 1');
        db = drizzle(pool, { schema });
    } catch (error) {
        const failedPool = pool;
        pool = null;
        db = null;
        await failedPool?.end();
        throw error;
    }
}

export function getDb(): NodePgDatabase<typeof schema> {
    if (!db) {
        throw new Error('Database has not been initialized');
    }
    return db;
}

export async function closeDb() {
    const activePool = pool;
    pool = null;
    db = null;

    if (!activePool) {
        return;
    }

    console.log('Closing pool...');
    await activePool.end();
}