import express from "express";
import { pool } from "../db/connect.js";

const db = pool();
const port = 3005;
const server = express();

server.use(express.static("frontend"));
server.use(onEachRequest);

// Routes - her definerer vi alle de forskellige endpoints vores server skal kunne håndtere med vores route handlers og vores HTTP metoder
server.get("/api/mood/:mood_id/mood_type", onGetMoodTypeByMoodId);
server.get("/api/party/:party_id/genre_winner", onGetGenreWinnerByGenreVote);
server.get("/api/party/:party_id/playlist", onGetPartyInformation);
server.get("/api/party/:party_code/members", onGetPartyMembers);
server.get("/api/genre_vote/:party_id", onGetGenreVotes);
server.post("/api/party/create/:mood/:navn", onPostPartyForUser);
server.post("/api/party/join/:party_code/:navn", onPostJoinParty);
server.post("/api/genre_vote/:genre_id/:party_id/:user_id", onPostGenreVote);
server.post("/api/track_vote/:track_id/:party_id/:user_id", onPostTrackVote);

server.listen(port, onServerReady);

// Route handler til at hente mood_type baseret på mood_id
async function onGetMoodTypeByMoodId(request, response) {
  const mood_id = request.params.mood_id;

  const dbResult = await db.query(
    `
    SELECT mood_type --DML kommandoer
    FROM mood
    WHERE mood_id = $1
    `,
    [mood_id],
  );

  response.json(dbResult.rows); // svare i et array med et objekt inden i med key:value pair -- metodekald
  
}

// Hent genre-vinder baseret på genre-stemmer for et party
async function onGetGenreWinnerByGenreVote(request, response) {
  const party_id = request.params.party_id;

  const dbResult = await db.query(
    `
    SELECT genre_id, COUNT(*)::int AS stemmer -- :: betyder at det skal være et heltal
    FROM genre_vote
    WHERE party_id = $1
    GROUP BY genre_id -- den sørger for den ved hvad den skal COUNT. Uden denne ville den count alle stemmer til et tal, men denne sørger for de tælles pr genre
    ORDER BY stemmer DESC
    `,
    [party_id],
  );

  if (dbResult.rows.length === 0) {
    return response.json({ message: "no votes yet" });
  }

  if (dbResult.rows.length === 1) {
    return response.json(dbResult.rows[0]);
  }

  // de to variabler henter bare de to genre med flest stemmer
  const stemmer_genre1 = dbResult.rows[0].stemmer;
  const stemmer_genre2 = dbResult.rows[1].stemmer;

  if (stemmer_genre1 === stemmer_genre2) {
    const uafgjort = [dbResult.rows[0], dbResult.rows[1]]; // laver nyt array med de uafgjorte genres. I arrayet er de hvert deres objekt. Gøres fordi det er disse to der skal vælges imellem
    const tilfældig = uafgjort[Math.floor(Math.random() * uafgjort.length)]; // math random giver et tal mellem 0 og 1, som gange med 2, fordi det er længden på "uafgjort", mat.floor, runder det ned
    return response.json(tilfældig);
  }

  response.json(dbResult.rows[0]); // svare i JSON format for at frontend og javascript kan forstå
}

// Hent playlist-information for et party baseret på party_id
async function onGetPartyInformation(request, response) {
  const party_id = request.params.party_id;

  const dbResult = await db.query(
    `
    SELECT 
      t.track_id,
      t.title,
      a.artist_name AS artist,
      t.duration_ms,
      COUNT(tv.track_vote_id)::int AS stemmer
    FROM party p
    JOIN track_playlist tp 
      ON tp.playlist_id = p.playlist_id
    JOIN tracks t 
      ON t.track_id = tp.track_id
    JOIN artist a 
      ON a.artist_id = t.artist_id
    LEFT JOIN track_vote tv -- sørger for at tage tracks uden stemmer med også, da de jo stadig er en del af playlisten
      ON tv.track_id = t.track_id 
      AND tv.party_id = p.party_id
    WHERE p.party_id = $1
    GROUP BY t.track_id, t.title, a.artist_name, t.duration_ms
    ORDER BY stemmer DESC
    `,
    [party_id],
  );

  response.json(dbResult.rows);
}

// Hent partymedlemmer baseret på party_code
async function onGetPartyMembers(request, response) {
  const party_code = request.params.party_code;

  const result = await db.query(
    `
    SELECT u.user_name
    FROM partymember pm
    JOIN users u ON u.user_id = pm.user_id
    JOIN party p ON p.party_id = pm.party_id
    WHERE p.party_code = $1
    ORDER BY pm.partymember_id
    `,
    [party_code],
  );

  response.json(result.rows);
}

// Hent genre-stemmer for et party
async function onGetGenreVotes(request, response) {
  const party_id = request.params.party_id;

  const result = await db.query(
    `
    SELECT genre_id, COUNT(*)::int AS votes
    FROM genre_vote
    WHERE party_id = $1
    GROUP BY genre_id
    `,
    [party_id],
  );

  response.json(result.rows);
}


// Opret party og host user
async function onPostPartyForUser(request, response) {
  // bruges til at se om koden virker. Gør den ikke det går man til catch, og giver en error message til clienten
  try { // smart at have med her fordi der er meget der kan gå galt
    const mood = request.params.mood;
    const navn = request.params.navn;

    const moodResult = await db.query(
      `
      SELECT mood_id
      FROM mood
      WHERE mood_type = $1
      `,
      [mood],
    );

    const mood_id = moodResult.rows[0].mood_id; // finder databse resultater relateret til mood_id - altså hvilke genre der skal præsenteres

    const playlistResult = await db.query(
      `
      SELECT playlist_id
      FROM playlist
      JOIN genre USING (genre_id)
      WHERE genre.mood_id = $1 -- det skal være genre der passer til mood typen
      LIMIT 1 - tag kun en playlist
      `,
      [mood_id],
    );

    const playlist_id = playlistResult.rows[0].playlist_id; // sørger for at playlist id bliver sat til det databasen returnere

    const userResult = await db.query( // database resultater udfra user og navn - der oprettes en ny user
      `
      INSERT INTO users (user_name, is_host) -- insert fordi det er en POST metode 
      VALUES ($1, true)
      RETURNING user_id, user_name -- giv mig de nye user med user_id og user name tilbage
      `,
      [navn],
    );

    const user_id = userResult.rows[0].user_id; // gemmer user_id

    const partyResult = await db.query( // opretter party
      `
      INSERT INTO party (party_name, party_code, mood_id, playlist_id, user_id)
      VALUES ($1, $2, $3, $4, $5) -- navn, random party_code, mood_id, playlist_id & user_id
      RETURNING party_id, party_code, party_name
      `,
      [
        navn,
        Math.floor(Math.random() * 9000) + 1000, // laver en kode til party mellem tallene 1000 og 9999
        mood_id,
        playlist_id,
        user_id,
      ],
    );

    const party_id = partyResult.rows[0].party_id; // gemmer det party id der er på det nye oprettede party

    await db.query( // tilføjer host som partymember
      `
      INSERT INTO partymember (party_id, user_id)
      VALUES ($1, $2)
      `,
      [party_id, user_id],
    );

    response.json({ // send alt dette retur som response
      party_id: party_id,
      party_code: partyResult.rows[0].party_code,
      party_name: partyResult.rows[0].party_name,
      user_name: userResult.rows[0].user_name,
      mood_type: mood,
      user_id: user_id,
    });
  } catch (error) {
    // hvis der er sket fejl i koden ender det her
    console.log("CREATE PARTY ERROR:", error.message); // viser fejl i terminalen
    response.status(500).json({ error: error.message }); // giver besked i frontend
  }
}

// Join party handler
async function onPostJoinParty(request, response) {
  try {
    const party_code = request.params.party_code;
    const navn = request.params.navn;

    const partyResult = await db.query(
      `
      SELECT 
        p.party_id,
        p.party_code,
        p.party_name,
        m.mood_type
      FROM party p
      JOIN mood m ON m.mood_id = p.mood_id
      WHERE p.party_code = $1
      `,
      [party_code],
    );

    if (partyResult.rows.length === 0) {
      return response.status(404).json({ error: "Party not found" });
    }

    const party = partyResult.rows[0];

    const userResult = await db.query(
      `
      INSERT INTO users (user_name, is_host)
      VALUES ($1, false)
      RETURNING user_id, user_name
      `,
      [navn],
    );

    const user_id = userResult.rows[0].user_id;

    await db.query(
      `
      INSERT INTO partymember (party_id, user_id)
      VALUES ($1, $2)
      `,
      [party.party_id, user_id],
    );

    response.json({ // de data frontend skal bruge
      party_id: party.party_id,
      party_code: party.party_code,
      party_name: party.party_name,
      user_id: user_id,
      user_name: userResult.rows[0].user_name,
      mood_type: party.mood_type,
    });
  } catch (error) {
    console.log("JOIN PARTY ERROR:", error.message);
    response.status(500).json({ error: error.message });
  }
}

// Genre-stemme handler
async function onPostGenreVote(request, response) {
  try {
    const genre_id = request.params.genre_id;
    const party_id = request.params.party_id;
    const user_id = request.params.user_id;

    await db.query(
      `
      INSERT INTO genre_vote (genre_id, party_id, user_id)
      VALUES ($1, $2, $3)
    `,
      [genre_id, party_id, user_id],
    );

    response.json({ message: "Genre vote registered!" });
  } catch (error) {
    console.log("GENRE VOTE ERROR:", error.message);
    response.status(500).json({ error: error.message });
  }
}


// Track-stemme handler
async function onPostTrackVote(request, response) {
  const track_id = request.params.track_id;
  const party_id = request.params.party_id;
  const user_id = request.params.user_id;

  // Sletter gammel stemme hvis den findes
  await db.query(
    `
    DELETE FROM track_vote
    WHERE party_id = $1
    AND user_id = $2
  `,
    [party_id, user_id],
  );

  // Gemmer den nye stemme
  await db.query(
    `
    INSERT INTO track_vote (track_id, party_id, user_id)
    VALUES ($1, $2, $3)
  `,
    [track_id, party_id, user_id],
  );

  response.json({ message: "vote registered" });
}


function onServerReady() {
  console.log("Webserver running on port", port);
}

function onEachRequest(request, response, next) {
  console.log(new Date(), request.method, request.url);
  next();
}
