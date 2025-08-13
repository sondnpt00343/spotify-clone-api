// Load environment variables from .env file
require("dotenv").config();

module.exports = {
    apps: [
        {
            name: "spotify-clone-api",
            script: "dist/app.js",
            instances: 1,
            exec_mode: "cluster",
            cwd: process.cwd(), // Ensure working directory is project root
            env: {
                NODE_ENV: "production",
                PORT: process.env.PORT || 3000,
                // Explicitly pass .env variables to PM2
                DATAAPP_URL: process.env.DATAAPP_URL,
                JWT_SECRET: process.env.JWT_SECRET,
                JWT_EXPIRE: process.env.JWT_EXPIRE,
                REFRESH_TOKEN_EXPIRE: process.env.REFRESH_TOKEN_EXPIRE,
                UPLOAD_PATH: process.env.UPLOAD_PATH,
                MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
                CORS_ORIGIN: process.env.CORS_ORIGIN,
                RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
                RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
                RATE_LIMIT_AUTH_MAX: process.env.RATE_LIMIT_AUTH_MAX,
                LOG_LEVEL: process.env.LOG_LEVEL,
            },
            error_file: "./logs/err.log",
            out_file: "./logs/out.log",
            log_file: "./logs/combined.log",
            time: true,
            max_memory_restart: "1G",
            max_restarts: 10,
            min_uptime: "10s",
            restart_delay: 4000,
            watch: false,
            ignore_watch: ["node_modules", "logs", "uploads"],
        },
    ],
};
