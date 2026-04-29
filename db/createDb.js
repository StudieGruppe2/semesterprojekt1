import { connect } from "./connect.js";
import upload from "pg-upload";

const db = await connect(); // altså den skal vente med at gøre noget til forbindelsen til databasen oprettes
const timestamp = (await db.query("select now() as timestamp")).rows[0][
  "timestamp"
];
console.log(`Recreating database on ${timestamp}...`);
/* await er den der gør at koden venter på at køre til resultatet er klar.
det er i parantes så den tages først */
