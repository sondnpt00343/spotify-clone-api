const knex = require("knex");
const path = require("path");

const config = {
    client: "sqlite3",
    connection: {
        filename: process.env.DATAAPP_URL || "./database.sqlite",
    },
    useNullAsDefault: true,
    migrations: {
        directory: "./dist/migrations",
        extension: "js",
        loadExtensions: [".js"],
    },
    seeds: {
        directory: "./dist/seeds",
        extension: "js",
        loadExtensions: [".js"],
    },
    pool: {
        min: 2,
        max: 10,
        afterCreate: (conn, cb) => {
            conn.run("PRAGMA foreign_keys = ON", cb);
        },
    },
};

async function setupDatabase() {
    const db = knex(config);

    try {
        console.log("🔄 Running migrations...");
        await db.migrate.latest();
        console.log("✅ Migrations completed");

        console.log("🔄 Running seeds...");
        await db.seed.run();
        console.log("✅ Seeds completed");

        console.log("🎉 Database setup complete!");

        // Verify tables were created
        const tables = await db.raw(
            "SELECT name FROM sqlite_master WHERE type='table'"
        );
        console.log("📋 Created tables:", tables.map((t) => t.name).join(", "));
    } catch (error) {
        console.error("❌ Database setup failed:", error);
        console.error("Error details:", error.message);
        process.exit(1);
    } finally {
        await db.destroy();
    }
}

// Check if dist/migrations exists
const fs = require("fs");
if (!fs.existsSync("./dist/migrations")) {
    console.error("❌ Error: dist/migrations folder not found!");
    console.log(
        '💡 Please run "npm run build" first to compile TypeScript files'
    );
    process.exit(1);
}

setupDatabase();
