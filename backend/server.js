import express from "express";
import { pool } from "../db/connect.js";

const db = pool();
const port = 3005;
const server = express();

server.use(express.static("frontend"));
server.use(onEachRequest);

server.get("/api/mood/:mood_id/mood_type", onGetMoodTypeByMoodId);
server.get("/api/party/:party_id/genre_winner", onGetGenreWinnerByGenreVote);
server.get("/api/party/:party_id/playlist", onGetPartyInformation);
server.get("/api/party/:party_code/members", onGetPartyMembers);
server.get("/api/genre_vote/:party_id", onGetGenreVotes);
server.post("/api/party/create/:mood/:navn", onPostPartyForUser);
server.post("/api/party/join/:party_code/:navn", onJoinParty);
server.post("/api/genre_vote/:genre_id/:party_id", onPostGenreVote);

server.listen(port, onServerReady);

async function onGetMoodTypeByMoodId(request, response) {
  const mood_id = request.params.mood_id;

  const dbResult = await db.query(
    `
    SELECT mood_type
    FROM mood
    WHERE mood_id = $1
    `,
    [mood_id],
  );

  response.json(dbResult.rows);
}

async function onGetGenreWinnerByGenreVote(request, response) {
  const party_id = request.params.party_id;

  const dbResult = await db.query(
    `
    SELECT genre_id, COUNT(*)::int AS stemmer
    FROM genre_vote
    WHERE party_id = $1
    GROUP BY genre_id
    ORDER BY stemmer DESC
    `,
    [party_id],
  );

  if (dbResult.rows.length === 0) {
    return response.json({ message: "Ingen stemmer endnu" });
  }

  if (dbResult.rows.length === 1) {
    return response.json(dbResult.rows[0]);
  }

  const stemmer_genre1 = dbResult.rows[0].stemmer;
  const stemmer_genre2 = dbResult.rows[1].stemmer;

  if (stemmer_genre1 === stemmer_genre2) {
    const uafgjort = [dbResult.rows[0], dbResult.rows[1]];
    const tilfældig = uafgjort[Math.floor(Math.random() * uafgjort.length)];
    return response.json(tilfældig);
  }

  response.json(dbResult.rows[0]);
}

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
    LEFT JOIN track_vote tv 
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

// CREATE PARTY AS HOST
async function onPostPartyForUser(request, response) {
  try {
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

    const mood_id = moodResult.rows[0].mood_id;

    const playlistResult = await db.query(
      `
      SELECT playlist_id
      FROM playlist
      JOIN genre USING (genre_id)
      WHERE genre.mood_id = $1
      LIMIT 1
      `,
      [mood_id],
    );

    const playlist_id = playlistResult.rows[0].playlist_id;

    const userResult = await db.query(
      `
      INSERT INTO users (user_name, is_host)
      VALUES ($1, true)
      RETURNING user_id, user_name
      `,
      [navn],
    );

    const user_id = userResult.rows[0].user_id;

    const partyResult = await db.query(
      `
      INSERT INTO party (party_name, party_code, mood_id, playlist_id, user_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING party_id, party_code, party_name
      `,
      [
        navn,
        Math.floor(Math.random() * 9000) + 1000,
        mood_id,
        playlist_id,
        user_id,
      ],
    );

    const party_id = partyResult.rows[0].party_id;

    await db.query(
      `
      INSERT INTO partymember (party_id, user_id)
      VALUES ($1, $2)
      `,
      [party_id, user_id],
    );

    response.json({
      party_id: party_id,
      party_code: partyResult.rows[0].party_code,
      party_name: partyResult.rows[0].party_name,
      user_id: user_id,
      user_name: userResult.rows[0].user_name,
      mood_type: mood,
    });
  } catch (error) {
    console.log("CREATE PARTY FEJL:", error.message);
    response.status(500).json({ error: error.message });
  }
}

// JOIN PARTY
async function onJoinParty(request, response) {
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
      return response.status(404).json({ error: "Party ikke fundet!" });
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

    response.json({
      party_id: party.party_id,
      party_code: party.party_code,
      party_name: party.party_name,
      user_id: user_id,
      user_name: userResult.rows[0].user_name,
      mood_type: party.mood_type,
    });
  } catch (error) {
    console.log("JOIN PARTY FEJL:", error.message);
    response.status(500).json({ error: error.message });
  }
}

// STEM PÅ GENRE
async function onPostGenreVote(request, response) {
  try {
    const genre_id = request.params.genre_id;
    const party_id = request.params.party_id;

    await db.query(
      `
      INSERT INTO genre_vote (genre_id, party_id)
      VALUES ($1, $2)
      `,
      [genre_id, party_id],
    );

    response.json({ message: "Genre stemme registreret!" });
  } catch (error) {
    console.log("GENRE VOTE FEJL:", error.message);
    response.status(500).json({ error: error.message });
  }
}

// HENT GENRE-STEMMER
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

// SE PARTYMEMBERS
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

function onServerReady() {
  console.log("Webserver running on port", port);
}

function onEachRequest(request, response, next) {
  console.log(new Date(), request.method, request.url);
  next();
}
