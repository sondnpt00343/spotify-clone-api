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
    pool: {
        min: 2,
        max: 10,
        afterCreate: (conn, cb) => {
            conn.run("PRAGMA foreign_keys = ON", cb);
        },
    },
};

async function migrateDatabase() {
    const db = knex(config);

    try {
        console.log("🔄 Running migrations only (preserving existing data)...");
        await db.migrate.latest();
        console.log("✅ Migrations completed");

        console.log("🎉 Database migration complete!");

        // Verify tables were created/updated
        const tables = await db.raw(
            "SELECT name FROM sqlite_master WHERE type='table'"
        );
        console.log(
            "📋 Database tables:",
            tables.map((t) => t.name).join(", ")
        );
    } catch (error) {
        console.error("❌ Database migration failed:", error);
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

migrateDatabase();
