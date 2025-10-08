// Node.js script to export all MongoDB collections to SQL INSERT statements
import 'dotenv/config';
import { MongoClient } from 'mongodb';
import fs from 'fs';

const mongoUri = process.env.MONGO_URI;
const mongoDb = process.env.MONGO_DB;
const outputDir = './mongo-sql-inserts';

async function main() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(mongoDb);
  const collections = await db.listCollections().toArray();
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  for (const coll of collections) {
    const name = coll.name;
    const docs = await db.collection(name).find({}).toArray();
    if (!docs.length) continue;
    const columns = Object.keys(docs[0]);
    const sqlTable = name; // assumes table name matches collection name
    const file = `${outputDir}/${sqlTable}_inserts.sql`;
    const lines = [];
    for (const doc of docs) {
      const cols = [];
      const vals = [];
      for (const col of columns) {
        cols.push(`[${col}]`);
        let val = doc[col];
        if (val === null || val === undefined) {
          vals.push('NULL');
        } else if (typeof val === 'string') {
          vals.push(`N'${val.replace(/'/g, "''")}'`);
        } else if (typeof val === 'object') {
          vals.push(`N'${JSON.stringify(val).replace(/'/g, "''")}'`);
        } else {
          vals.push(val);
        }
      }
      lines.push(`INSERT INTO [${sqlTable}] (${cols.join(', ')}) VALUES (${vals.join(', ')});`);
    }
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log(`Exported ${docs.length} rows from ${name} to ${file}`);
  }
  await client.close();
  console.log('All collections exported.');
}

main().catch(err => { console.error(err); process.exit(1); });
