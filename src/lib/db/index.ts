import * as schema from "@/lib/db/schema";
import { env } from "@/env";
import { drizzle } from 'drizzle-orm/node-postgres';

// You can specify any property from the node-postgres connection options
const db = drizzle({
    connection: {
        connectionString: env.DATABASE_URL,
    },
    schema: schema,
});

db.execute('select 1').then(() => console.log("Connected to DB")).catch((err) => console.log(err))

export { db }