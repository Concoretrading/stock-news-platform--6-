import { PGlite } from '@electric-sql/pglite';
import path from 'path';

/**
 * Local Database Service (The Librarian's Archive)
 * Powered by PGlite (WASM Postgres) on the Local SSD.
 * Logic: "Stored locally, accessed instantly, $0 cloud cost."
 */
export class LocalDBService {
    private static instance: LocalDBService;
    private db: PGlite | null = null;
    private readonly dbPath = path.resolve(process.cwd(), './local_library');

    private constructor() {
        console.log('📚 LOCAL DATABASE SERVICE (PGLITE) BOOTING...');
    }

    public static getInstance(): LocalDBService {
        if (!LocalDBService.instance) {
            LocalDBService.instance = new LocalDBService();
        }
        return LocalDBService.instance;
    }

    /**
     * Initialize the local database connection
     */
    public async connect(): Promise<PGlite> {
        if (this.db) return this.db;

        try {
            this.db = new PGlite(this.dbPath);
            await this.db.waitReady;
            console.log(`✅ LOCAL LIBRARY CONNECTED AT: ${this.dbPath}`);
            return this.db;
        } catch (error) {
            console.error('❌ FAILED TO CONNECT TO LOCAL LIBRARY:', error);
            throw error;
        }
    }

    /**
     * Execute a query against the local database
     */
    public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        const db = await this.connect();
        const result = await db.query(sql, params);
        return result.rows as T[];
    }

    /**
     * Run a transaction
     */
    public async transaction(callback: (tx: any) => Promise<void>): Promise<void> {
        const db = await this.connect();
        await db.transaction(callback);
    }

    /**
     * Close the database connection
     */
    public async close(): Promise<void> {
        if (this.db) {
            await this.db.close();
            this.db = null;
            console.log('📚 LOCAL LIBRARY ARCHIVED (CLOSED)');
        }
    }
}

export const localDBService = LocalDBService.getInstance();
