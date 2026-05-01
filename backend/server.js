import express from 'express';
import { pool } from '../db/connect.js';

const db = pool();

const port = 3005;

const server = express();
server.use(express.static('frontend'));
server.use(onEachRequest);
server.get('/api/mood/:mood_id/mood_type', onGetMoodTypeByMoodId);
server.get('/api/party/:party_id/genre_winner', onGetGenreWinnerByGenreVote);
server.get('/api/party/:party_id/playlist',onGetPartyInformation);

server.listen(port, onServerReady);

async function onGetMoodTypeByMoodId (request, response) {
    const mood_id = request.params.mood_id;
    const dbResult = await db.query(`
        select     mood_type mt
        from       mood m
        where      mood_id = $1`, // kun $1 fordi vi kun vælger ét mood
    [mood_id]);
    response.json(dbResult.rows);
}

async function onGetGenreWinnerByGenreVote(request, response) {
    const party_id = request.params.party_id;

    // Hent alle stemmer for dette party
    const dbResult = await db.query(`
        SELECT   genre_id, COUNT(*) AS stemmer
        FROM     genre_vote
        WHERE    party_id = $1
        GROUP BY genre_id
        ORDER BY stemmer DESC`,
        [party_id]);

    // Hvis ingen har stemt, vælg en tilfældig genre
    if (dbResult.rows.length === 0) { 
        const genres = await db.query(`
            SELECT genre_id
            FROM   genre
            WHERE  mood_id = $1`,
            [party_id]);

        const tilfældig = genres.rows[Math.floor(Math.random() * genres.rows.length)];
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

  const dbResult = await db.query(`
    select                       t.track_id, t.title, a.artist_name AS artist, t.duration_ms,
    count (tv.track_vote_id) as  stemmer
    from                         party p
    join                         party_playlist pp
      on                         pp.playlist_id = p.playlist_id
    join                         tracks t
      on                         t.track_id = pp.track_id
    join                         artist a
      on                         a.artist_id = t.artist_id
    left join                    track_vote tv
      on                         tv.track_id = t.track_id
     and                         tv.party_id = p.party_id
    where                        p.party_id = $1
    group by                     t.track_id, t.title, a.artist_name, t.duration_ms
    order by                     stemmer DESC;
  `, [partyId]);

  response.json(dbResult.rows);
}


function onServerReady() {
    console.log('Webserver running on port', port);
}

function onEachRequest(request, response, next) {
    console.log(new Date(), request.method, request.url);
    next();
}