module.exports = {
    apps: [
        {
            name: "spotify-clone-api",
            script: "dist/app.js",
            instances: 1,
            exec_mode: "cluster",
            env: {
                NODE_ENV: "production",
                PORT: 3000,
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
