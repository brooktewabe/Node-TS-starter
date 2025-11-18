import express,{ type Express } from "express";
import authRoutes from "./routes/auth.route.ts";

import path from "path";
import { fileURLToPath } from "url";

export default function initRoutes(app: Express): void {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	app.use("/api", authRoutes);
	    // Serve logs as static files
    const LOGS_DIR = path.join(__dirname, "../logs");
	app.use("/api/access-log/logs/file", express.static(LOGS_DIR));
}
