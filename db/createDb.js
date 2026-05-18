import { connect } from "./connect.js"; 
import upload from "pg-upload";

const db = await connect(); 
const timestamp = (await db.query("select now() as timestamp")).rows[0][
  "timestamp"
];
console.log(`Recreating database on ${timestamp}...`);
/* await er den der gør at koden venter på at køre til resultatet er klar.
det er i parantes så den tages først */

await db.query("drop table if exists track_playlist cascade");
await db.query("drop table if exists party cascade");
await db.query("drop table if exists genre_vote cascade");
await db.query("drop table if exists track_vote cascade");
await db.query("drop table if exists playlist cascade");
await db.query("drop table if exists tracks cascade");
await db.query("drop table if exists genre cascade");
await db.query("drop table if exists artist cascade");
await db.query("drop table if exists mood cascade");
await db.query("drop table if exists users cascade");
await db.query("drop table if exists partymember cascade");

console.log("Creating tables...");

// oprettelse af alle tabeller i DB
await db.query(` 
    create table users (
        user_id     bigint primary key generated always as identity, -- skabe auto-inkrementerende primærnøgler på
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
    )
`);

await db.query(` 
    create table tracks (
      track_id      integer primary key,
      title         text not null, 
      duration_ms   integer,
      artist_id     integer not null references artist (artist_id)
    )
`);

await db.query(` 
    create table playlist (
        playlist_id      integer primary key,
        genre_id         integer not null references genre (genre_id)
    )
`);

await db.query(` 
    create table party (
       party_id         integer primary key generated always as identity,
       party_code       integer unique not null,
       party_name       text not null,
       mood_id          integer not null references mood (mood_id),
       playlist_id      integer not null references playlist (playlist_id),
       user_id          bigint references users (user_id)
    )
`);

await db.query(`
    create table partymember (
        partymember_id  integer primary key generated always as identity,
        party_id        integer references party (party_id),
        user_id         bigint references users (user_id)
    )
`);
await db.query(` 
    create table track_playlist (
       track_id          integer not null references tracks (track_id),
       playlist_id       integer not null references playlist (playlist_id),
       primary key       (track_id, playlist_id)
    )
`);

await db.query(` 
    create table track_vote (
       track_vote_id       integer primary key generated always as identity,
       track_id            integer not null references tracks (track_id),
       user_id             bigint not null references users (user_id),
       party_id            integer not null references party (party_id),
       unique              (user_id, party_id)
    )
`);

await db.query(` 
    create table genre_vote (
    genre_vote_id integer primary key generated always as identity,
    genre_id      integer not null references genre (genre_id),
    user_id       bigint not null references users (user_id),
    party_id      integer not null references party (party_id),
    unique        (user_id, party_id)
    )
`);

// upload af info fra csv-filer ind i vores tabeller
await upload(
  db,
  "db/mood.csv",
  `
  copy     mood(mood_id, mood_type)
  from     stdin
  with     csv header encoding 'UTF-8'`,
);

await upload(
  db,
  "db/artist.csv",
  `
  copy     artist(artist_id, artist_name)
  from     stdin
  with     csv header encoding 'UTF-8'`,
);

await upload(
  db,
  "db/genre.csv",
  `
  copy        genre(genre_id, genre_type, mood_id)
  from        stdin
  with        csv header encoding 'UTF-8'`,
);

await upload(
  db,
  "db/tracks.csv",
  `
  copy       tracks(track_id, title, duration_ms, artist_id)
  from       stdin
  with       csv header encoding 'UTF-8'`,
);

await upload(
  db,
  "db/playlist.csv",
  `
  copy     playlist(playlist_id, genre_id)
  from     stdin
  with     csv header encoding 'UTF-8'`,
);

await upload(
  db,
  "db/track_playlist.csv",
  `
  copy track_playlist(track_id, playlist_id)
  from stdin
  with csv header encoding 'UTF-8'`,
);

await db.end();
console.log("Database successfully recreated.");
