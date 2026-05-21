import { connect } from "./connect.js"; 
import upload from "pg-upload";

const db = await connect(); 
const timestamp = (await db.query("select now() as timestamp")).rows[0][
  "timestamp"
];
console.log(`Recreating database on ${timestamp}...`);
/* await er den der gør at koden venter på at køre til resultatet er klar.
det er i parantes så den tages først */

// tjekker om vores tabeller findes og sletter dem + sletter tabeller afhængige af hinanden vha cascade
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
        user_id     bigint primary key generated always as identity, -- skaber auto-inkrementerende user_id's
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
       mood_id      integer not null references mood (mood_id) -- en foreign key
    )
`);

await db.query(` 
    create table tracks (
      track_id      integer primary key,
      title         text not null, 
      duration_ms   integer,
      artist_id     integer not null references artist (artist_id) -- en foreign key
    )
`);

await db.query(` 
    create table playlist (
        playlist_id      integer primary key,
        genre_id         integer not null references genre (genre_id) -- en foreign key
    )
`);

await db.query(` 
    create table party (
       party_id         integer primary key generated always as identity, -- skaber auto-inkrementerende party_id's
       party_code       integer unique not null,
       party_name       text not null,
       mood_id          integer not null references mood (mood_id), -- foreign key
       playlist_id      integer not null references playlist (playlist_id), -- foreign key
       user_id          bigint references users (user_id) -- foreign key
    )
`);

await db.query(`
    create table partymember (
        partymember_id  integer primary key generated always as identity, -- skaber auto-inkrementerende partymember_id's
        party_id        integer references party (party_id), -- foreign key
        user_id         bigint references users (user_id) --foreign key
    )
`);
await db.query(` 
    create table track_playlist (
       track_id          integer not null references tracks (track_id),
       playlist_id       integer not null references playlist (playlist_id), -- foreign key
       primary key       (track_id, playlist_id) -- tilsammen bliver de den unikke nøgle, altså primary key
    )
`);

await db.query(` 
    create table track_vote (
       track_vote_id       integer primary key generated always as identity, -- skaber auto-inkrementerende track_vote_id's
       track_id            integer not null references tracks (track_id), -- foreign key
       user_id             bigint not null references users (user_id), -- foreign key
       party_id            integer not null references party (party_id), -- foreign key
       unique              (user_id, party_id) -- user_id og party_id tilsammen skal være unikke for at kunne stemme
    )
`);

await db.query(` 
    create table genre_vote (
    genre_vote_id integer primary key generated always as identity, -- skaber auto-inkrementerende genre_vote_id's
    genre_id      integer not null references genre (genre_id), -- foreign key
    user_id       bigint not null references users (user_id), -- foreign key
    party_id      integer not null references party (party_id), -- foreign key
    unique        (user_id, party_id) -- skal til sammen være unique før stemmen er gældende
    )
`);

// upload af info fra csv-filer ind i vores tabeller
await upload(
  db,
  "db/mood.csv",
  `
  copy     mood(mood_id, mood_type)
  from     stdin -- standard input
  with     csv header encoding 'UTF-8'`, // fordi der er en overskrift i CSV'en
);

await upload(
  db,
  "db/artist.csv",
  `
  copy     artist(artist_id, artist_name)
  from     stdin -- standard input
  with     csv header encoding 'UTF-8'`, // fordi der er en overskrift i CSV'en
);

await upload(
  db,
  "db/genre.csv",
  `
  copy        genre(genre_id, genre_type, mood_id)
  from        stdin -- standard input
  with        csv header encoding 'UTF-8'`, // fordi der er en overskrift i CSV'en
);

await upload(
  db,
  "db/tracks.csv",
  `
  copy       tracks(track_id, title, duration_ms, artist_id)
  from       stdin -- standard input
  with       csv header encoding 'UTF-8'`, // fordi der er en overskrift i CSV'en
);

await upload(
  db,
  "db/playlist.csv",
  `
  copy     playlist(playlist_id, genre_id)
  from     stdin -- standard input
  with     csv header encoding 'UTF-8'`, // fordi der er en overskrift i CSV'en
);

await upload(
  db,
  "db/track_playlist.csv",
  `
  copy track_playlist(track_id, playlist_id)
  from stdin -- standard input
  with csv header encoding 'UTF-8'`, // fordi der er en overskrift i CSV'en
);

await db.end();
console.log("Database successfully recreated.");
