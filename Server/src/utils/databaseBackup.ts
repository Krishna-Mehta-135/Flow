import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import logger from "./logger";

export class DatabaseBackup {
    
    /**
     * Create a backup of all collections
     */
    static async createBackup() {
        try {
            if (!mongoose.connection.db) {
                throw new Error("Database connection not established");
            }

            const backupDir = path.join(process.cwd(), "backups");
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

            const db = mongoose.connection.db;
            const collections = await db.listCollections().toArray();
            
            const backup: any = {};

            for (const collection of collections) {
                const collectionName = collection.name;
                const data = await db.collection(collectionName).find({}).toArray();
                backup[collectionName] = data;
                logger.info(`Backed up collection: ${collectionName} (${data.length} documents)`);
            }

            fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
            logger.info(`Database backup created: ${backupFile}`);
            
            return backupFile;
        } catch (error) {
            logger.error("Error creating database backup:", error);
            throw error;
        }
    }

    /**
     * Restore database from backup file
     */
    static async restoreBackup(backupFilePath: string) {
        try {
            if (!mongoose.connection.db) {
                throw new Error("Database connection not established");
            }

            if (!fs.existsSync(backupFilePath)) {
                throw new Error(`Backup file not found: ${backupFilePath}`);
            }

            const backupData = JSON.parse(fs.readFileSync(backupFilePath, "utf8"));
            const db = mongoose.connection.db;

            for (const [collectionName, documents] of Object.entries(backupData)) {
                if (Array.isArray(documents) && documents.length > 0) {
                    // Drop existing collection
                    try {
                        await db.collection(collectionName).drop();
                    } catch (error) {
                        // Collection might not exist, ignore error
                    }

                    // Insert backup data
                    await db.collection(collectionName).insertMany(documents as any[]);
                    logger.info(`Restored collection: ${collectionName} (${(documents as any[]).length} documents)`);
                }
            }

            logger.info(`Database restored from: ${backupFilePath}`);
        } catch (error) {
            logger.error("Error restoring database backup:", error);
            throw error;
        }
    }

    /**
     * Clean up old backup files (keep only last N backups)
     */
    static async cleanupOldBackups(keepCount: number = 5) {
        try {
            const backupDir = path.join(process.cwd(), "backups");
            if (!fs.existsSync(backupDir)) {
                return;
            }

            const files = fs.readdirSync(backupDir)
                .filter(file => file.startsWith("backup-") && file.endsWith(".json"))
                .map(file => ({
                    name: file,
                    path: path.join(backupDir, file),
                    stat: fs.statSync(path.join(backupDir, file))
                }))
                .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());

            if (files.length > keepCount) {
                const filesToDelete = files.slice(keepCount);
                for (const file of filesToDelete) {
                    fs.unlinkSync(file.path);
                    logger.info(`Deleted old backup: ${file.name}`);
                }
            }
        } catch (error) {
            logger.error("Error cleaning up old backups:", error);
        }
    }
}
