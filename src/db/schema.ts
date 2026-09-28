import { sql } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

const isoNow = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

// TEMP: delete onec we have real schema
export const samples = sqliteTable('samples', {
  updatedAt: text('updated_at')
    .default(isoNow)
    .$onUpdate(() => new Date().toISOString())
    .notNull(),
});
