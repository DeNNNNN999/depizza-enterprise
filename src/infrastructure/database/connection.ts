import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

declare global {
  var __db: ReturnType<typeof drizzle> | undefined;
}

let db: ReturnType<typeof drizzle>;

if (process.env.NODE_ENV === 'production') {
  const client = postgres(process.env.DATABASE_URL!, {
    prepare: false,
  });
  db = drizzle(client, { schema });
} else {
  if (!global.__db) {
    const client = postgres(
      process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/depizza',
      {
        prepare: false,
      }
    );
    global.__db = drizzle(client, { schema });
  }
  db = global.__db;
}

export { db };