import { config } from 'dotenv';
import path from 'node:path';


const nodeEnv = process.env.NODE_ENV || "development";

const envFileMap : Record<string, string> = {
    development: ".env.development",
    production: ".env.production",
    local: ".env.local",
    example: ".env.example"
}

const selectedEnvFile = envFileMap[nodeEnv] || ".env.development"; 

config({
    path: path.resolve(process.cwd(), selectedEnvFile),
    override: true
});

export { nodeEnv, selectedEnvFile }