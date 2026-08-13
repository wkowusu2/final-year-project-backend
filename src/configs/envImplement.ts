import './envLoader.js';

function getSpecificEnvValue(name: string){
    const value = process.env[name]; 
    if(!value){
        throw new Error(`Missing env variable with name: ${name}`);
    }
    return value;
}

function getOptionalEnvValue(name: string, fallback?: string){
    return process.env[name] ?? fallback;
}

export const config = {
    env: process.env.NODE_ENV || "development",
    isDev: process.env.NODE_ENV === "development",
    isProd: process.env.NODE_ENV === "production",
    isLocal: process.env.NODE_ENV === "local",
    isExample: process.env.NODE_ENV === "example",
    port: Number(getOptionalEnvValue("PORT", "3000")),

    db: {
        url: getSpecificEnvValue("DATABASE_URL"),
        //the migrationUrl is important because it allows you to maintain the rds proxy as the databaseUrl whilst the migrationUrl points to the actual rds
        migrationUrl: getOptionalEnvValue("MIGRATION_DATABASE_URL"),
    },

    // redis: {
    //     host: getSpecificEnvValue("REDIS_HOST"),
    //     port: getSpecificEnvValue("REDIS_PORT"),
    //     password: getOptionalEnvValue("REDIS_PASSWORD"),
    //     username: getOptionalEnvValue("REDIS_USERNAME"),
    // },

    jwt: {
        secret: getSpecificEnvValue("JWT_SECRET")
    }, 

    arkesel: {
        apiKey: getSpecificEnvValue('ARKESEL_API_KEY'),
        baseUrl: getSpecificEnvValue('ARKESEL_BASE_URL')
    },

    // hubtel: {
    //     clientId: getSpecificEnvValue("HUBTEL_CLIENT_ID"),
    //     clientSecret: getSpecificEnvValue("HUBTEL_CLIENT_SECRET")
    // },

    cloudinary: {
        cloudName: getSpecificEnvValue('CLOUDINARY_CLOUD_NAME'),
        apiKey: getSpecificEnvValue('CLOUDINARY_API_KEY'),
        apiSecret: getSpecificEnvValue('CLOUDINARY_API_SECRET')
    },

    routing: {
        valhallaBaseUrl: getOptionalEnvValue('ROUTING_BASE_URL', 'http://localhost:8002')
    }
}
