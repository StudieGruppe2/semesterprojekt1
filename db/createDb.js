import { connect } from "./connect.js";
import upload from "pg-upload";

const db = await connect(); // altså den skal vente med at gøre noget til forbindelsen til databasen oprettes
const timestamp = (await db.query("select now() as timestamp")).rows[0][
  "timestamp"
];
console.log(`Recreating database on ${timestamp}...`);
/* await er den der gør at koden venter på at køre til resultatet er klar.
det er i parantes så den tages først */

await db.query("drop table if exists party_playlist");
await db.query("drop table if exists party");
await db.query("drop table if exists genre_vote");
await db.query("drop table if exists track_vote");
await db.query("drop table if exists playlist");
await db.query("drop table if exists tracks");
await db.query("drop table if exists genre");
await db.query("drop table if exists artist");
await db.query("drop table if exists mood");
await db.query("drop table if exists users");

// TODO: drop more tables, if they exist

console.log("Creating tables...");
// en query er en database-forespørgsel - en slags kommando man sender til databasen for at gøre noget
await db.query(` 
    create table users (
        user_id     bigint primary key,
        user_name   text, 
        is_host     boolean
    )
`);

await db.query(` 
    create table mood (
        mood_id     integer primary key,
        mood_type   text not null unique
    )
`);

await db.query(` 
    create table artist (
        artist_id    integer primary key,
        artist_name  text not null
    )
`);

await db.query(` 
    create table genre (
       genre_id     integer primary key,
       genre_type   text not null, 
       mood_id      integer not null references mood (mood_id)
       playlist_id  integer not null references playlist (playlist_id)
    )
`);

await db.query(` 
    create table tracks (
      track_id      integer primary key,
      title         text not null, 
      duration_ms   integer,
      artist_id     integer not null references artist (artist_id),
      genre_id      integer references genre (genre_id)
    )
`);

await db.query(` 
    create table playlist (
        playlist_id      integer primary key
        track_id         integer unique not null references tracks (track_id
        artist_id        integer unique not null references artist (artist_id)
        genre_id         integer unique not null references genre (genre_id)
    )
`);

await db.query(` 
    create table party (
       party_id         integer primary key,
       party_code       integer unique not null,
       party_name       text not null,
       playlist_id      integer not null references playlist (playlist_id)
       user_id          integer unique not null
       timestamp        timestamp
    )
`);

await db.query(` 
    create table party_playlist (
       track_id          integer not null references tracks (track_id),
       playlist_id       integer not null references playlist (playlist_id),
       sort_order        integer default 0
    )
`);

await db.query(` 
    create table track_vote (
       track_vote_id       integer unique not null,
       track_id            integer not null references tracks (track_id),
       user_id             bigint unique references users (user_id),
       party_id            integer not null references party (party_id)
    )
`);

await db.query(` 
    create table genre_vote (
        genre_vote_id         integer unique not null,
        genre_id              integer not null references genre (genre_id),
        user_id               bigint references users (user_id)
        party_id              integer references party (party_id)
    )
`);

await upload(db,'db/mood.csv', `
  copy     mood(mood_id, mood_type)
  from     stdin
  with     csv header encoding 'UTF-8'`
);

await upload(db,'db/artist.csv', `
  copy     artist(artist_id, artist_name)
  from     stdin
  with     csv header encoding 'UTF-8'`
);

await upload(db,'db/genre.csv', `
  copy        genre(genre_id, genre_type, mood_id)
  from        stdin
  with        csv header encoding 'UTF-8'`
);

await upload(db,'db/tracks.csv', `
  copy       tracks(track_id, title, duration_ms, artist_id, genre_id)
  from       stdin
  with       csv header encoding 'UTF-8'`
);

await upload(db,'db/playlist.csv', `
  copy     playlist(playlist_id)
  from     stdin
  with     csv header encoding 'UTF-8'`
);


// TODO: import data from csv files into tables

await db.end();
console.log('Database successfully recreated.');
