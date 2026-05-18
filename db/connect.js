import pg from 'pg'; // gør at node kan oprette forbindelse til databasen
import dotenv from 'dotenv';


dotenv.config();
const env = {
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT),
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    ssl: { rejectUnauthorized: false }, //krypteret forbindelse til databasen
};


export async function connect() { //en enkelt forbindelse
    const client = new pg.Client(env);
    await client.connect();
    return client;
}
  
export function pool() { // en pool af forbindelser/mange forbindelser. Bruges til at genbruge eksisterende forbindelser
    return new pg.Pool(env);
}