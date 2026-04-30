import express from 'express';
import { pool } from '../db/connect.js';

const db = pool();

const port = 3005;
const server = express();
server.use(express.static('frontend'));
server.use(onEachRequest);
server.get('/api/mood/:mood_id/mood_type', onGetMoodTypeByMoodId);
server.get('/api/genre/:genre_id/genre_type', onGetGenreWinnerByGenreVote);
server.get('/api/party/:party_id/playlist',onGetPartyInformation);

async function onGetMoodTypeByMoodId (request, response) {
    const mood_id = request.params.mood_id;
    const dbresult = await db.query(`
        select     distinct mood_type
        from       mood m
        where      mood_id = $1`, // kun $1 fordi vi kun vælger ét mood
    [mood_id]);
    response.json(dbresult.rows);
}

async function onGetGenreWinnerByGenreVote (request, response) {
    const party_id = request.params.party_id;

    const dbresult = await db.query(`
        select      genre_id, count(*) as stemmer
        from        genre_vote
        where       party_id = $1
        group by    genre_id
        order by    stemmer desc
        limit 1`,
        [party_id]);
        
    if (dbresult.rows.length === 0){
        const genres = await db.query(`
            select   genre_id
            from     genre
            where    mood_id = $1`,
        [party_id]);
        
    const random = genres.rows[Math.floor(Math.random() * genres.rows.length)];
        return response.json(random);
    }
    response.json(dbresult.rows);
}


async function onGetPartyInformation(request, response) {
  const partyId = request.params.party_id;

  const dbresult = await db.query(`
    SELECT
      t.track_id,
      t.title,
      a.artist_name AS artist,
      t.duration,
      COUNT(tv.track_vote_id) AS stemmer
    FROM party p
    JOIN tracks_playlist tp
      ON tp.playlist_id = p.playlist_id
    JOIN tracks t
      ON t.track_id = tp.track_id
    JOIN artist a
      ON a.artist_id = t.artist_id
    LEFT JOIN track_vote tv
      ON tv.track_id = t.track_id
     AND tv.party_id = p.party_id
    WHERE p.party_id = $1
    GROUP BY t.track_id, t.title, a.artist_name, t.duration
    ORDER BY stemmer DESC;
  `, [partyId]);

  response.json(dbresult.rows);
}


function onServerReady() {
    console.log('Webserver running on port', port);
}

function onEachRequest(request, response, next) {
    console.log(new Date(), request.method, request.url);
    next();
}