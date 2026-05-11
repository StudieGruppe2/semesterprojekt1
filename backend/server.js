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
server.post("/api/party/:mood/:navn", onPostPartyForUser);
server.post("/api/party/:party_code/:navn", onJoinParty);
//server.post("/api/genre_vote/:genre_id/:party_id", onPostGenreVote);
//server.post("/api/track_vote/:track_id/:party_id", onPostTrackVote);

server.listen(port, onServerReady);

async function onGetMoodTypeByMoodId(request, response) {
  const mood_id = request.params.mood_id;
  const dbResult = await db.query(
    `
        select     mood_type mt
        from       mood m
        where      mood_id = $1`, // kun $1 fordi vi kun vælger ét mood
    [mood_id],
  );
  response.json(dbResult.rows);
}

async function onGetGenreWinnerByGenreVote(request, response) {
  const party_id = request.params.party_id;

  // Hent alle stemmer for dette party
  const dbResult = await db.query(
    `
        SELECT   genre_id, COUNT(*) AS stemmer
        FROM     genre_vote
        WHERE    party_id = $1
        GROUP BY genre_id
        ORDER BY stemmer DESC`,
    [party_id],
  );

  // Hvis ingen har stemt, vælg en tilfældig genre
  if (dbResult.rows.length === 0) {
    const genres = await db.query(
      `
            SELECT genre_id
            FROM   genre
            WHERE  mood_id = $1`,
      [party_id],
    );

    const tilfældig =
      genres.rows[Math.floor(Math.random() * genres.rows.length)];
    return response.json(tilfældig);
  }
  // hvis en genre får alle stemmerne
  if (dbResult.rows.length === 1) {
    return response.json(dbResult.rows[0]);
  }
  // Hent antal stemmer for genre 1 og genre 2
  const stemmer_genre1 = dbResult.rows[0].stemmer;
  const stemmer_genre2 = dbResult.rows[1].stemmer;

  // Hvis de to genre har lige mange stemmer, vælg en tilfældig af dem
  if (stemmer_genre1 === stemmer_genre2) {
    const uafgjort = [dbResult.rows[0], dbResult.rows[1]];
    const tilfældig = uafgjort[Math.floor(Math.random() * uafgjort.length)];
    return response.json(tilfældig);
  }

  // Ellers returner genre med flest stemmer
  return response.json(dbResult.rows[0]);
}

async function onGetPartyInformation(request, response) {
  const partyId = request.params.party_id;

  const dbResult = await db.query(
    `
    select                       t.track_id, t.title, a.artist_name AS artist, t.duration_ms,
    count (tv.track_vote_id) as  stemmer
    from                         party p
    join                         track_playlist tp
      on                         tp.playlist_id = p.playlist_id
    join                         tracks t
      on                         t.track_id = tp.track_id
    join                         artist a
      on                         a.artist_id = t.artist_id
    left join                    track_vote tv
      on                         tv.track_id = t.track_id
     and                         tv.party_id = p.party_id
    where                        p.party_id = $1
    group by                     t.track_id, t.title, a.artist_name, t.duration_ms
    order by                     stemmer DESC;
  `,
    [partyId],
  );

  response.json(dbResult.rows);
}

//CREATE PARTY AS HOST
async function onPostPartyForUser(request, response) {
  try {
    const mood = request.params.mood;
    const navn = request.params.navn;

    const moodResult = await db.query(
      `
      select mood_id FROM mood WHERE mood_type = $1
    `,
      [mood],
    );

    const mood_id = moodResult.rows[0].mood_id;

    const playlistResult = await db.query(
      `
      select playlist_id FROM playlist
      join genre USING (genre_id)
      where genre.mood_id = $1
      limit 1
    `,
      [mood_id],
    );

    const playlist_id = playlistResult.rows[0].playlist_id;

    const dbResult = await db.query(
      `
      insert into party (party_name, party_code, mood_id, playlist_id)
      values ($1, $2, $3, $4)
      returning party_code, party_name
    `,
      [navn, Math.floor(Math.random() * 9000) + 1000, mood_id, playlist_id],
    );

    response.json(dbResult.rows[0]);
  } catch (error) {
    console.log("fejl:", error.message);
    response.status(500).json({ error: error.message });
  }
}

//JOIN PARTY
async function onJoinParty(request, response) {
  const party_code = request.params.party_code;
  const navn = request.params.navn;

  // Find party ud fra party_code
  const partyResult = await db.query(
    `
        SELECT party_id, party_name FROM party
        WHERE party_code = $1
    `,
    [party_code],
  );

  if (partyResult.rows.length === 0) {
    return response.json({ error: "Party ikke fundet!" });
  }

  const party_id = partyResult.rows[0].party_id;

  // Gem brugeren i users tabellen
  const userResult = await db.query(
    `
        INSERT INTO users (user_name, is_host)
        VALUES ($1, false)
        RETURNING user_id, user_name
    `,
    [navn],
  );

  response.json({
    party_code: party_code,
    party_name: partyResult.rows[0].party_name,
    user_id: userResult.rows[0].user_id,
    user_name: userResult.rows[0].user_name,
  });
}

/*
async function onPostGenreVote(request, response) {
  console.log(request, params);
  response.sendStatus(202);
}

async function onPostTrackVote(request, response) {
  console.log(request, params);
  response.sendStatus(202);
}
*/

function onServerReady() {
  console.log("Webserver running on port", port);
}

function onEachRequest(request, response, next) {
  console.log(new Date(), request.method, request.url);
  next();
}
