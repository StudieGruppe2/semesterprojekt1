//henter data fra URL'en og opdaterer siden baseret på det
const params = new URLSearchParams(window.location.search);

// henter mood, navn, party_code, party_name, party_id og user_id fra URL'en
const mood = params.get("mood");
const navn = params.get("navn");
const party_code = params.get("party_code");
const party_name = params.get("party_name");
const party_id = params.get("party_id");
const user_id = params.get("user_id");

// Finder HTML elementet og viser query parameteren fra URL'en
document.getElementById("party-code").textContent = party_code;
document.getElementById("party-name").textContent = party_name;

// Viser de to genre navne på siden baseret på det valgte mood
// og gemmer deres genre id'er så vi kan bruge dem til afstemningen
let genre1_id;
let genre2_id;

if (mood === "Dinner") {
  document.getElementById("genre1-navn").textContent = "Jazz";
  document.getElementById("genre2-navn").textContent = "Bossa Nova";
  genre1_id = 400;
  genre2_id = 401;
} else if (mood === "Party") {
  document.getElementById("genre1-navn").textContent = "Techno";
  document.getElementById("genre2-navn").textContent = "House";
  genre1_id = 402;
  genre2_id = 403;
} else if (mood === "Workout") {
  document.getElementById("genre1-navn").textContent = "Rock";
  document.getElementById("genre2-navn").textContent = "Pop";
  genre1_id = 404;
  genre2_id = 405;
} else if (mood === "Chill") {
  document.getElementById("genre1-navn").textContent = "Indie";
  document.getElementById("genre2-navn").textContent = "Classical";
  genre1_id = 406;
  genre2_id = 407;
}

// Lytter på klik på genre knapperne og kalder voteGenre med det valgte genre id
document
  .getElementById("genre1-btn")
  .addEventListener("click", async function () {
    await voteGenre(genre1_id);
  });

document
  .getElementById("genre2-btn")
  .addEventListener("click", async function () {
    await voteGenre(genre2_id);
  });

  // Sender en stemme til serveren for det valgte genre
async function voteGenre(genre_id) {
  // Tjekker om party_id findes - ellers kan vi ikke stemme
  if (!party_id) {
    alert("Missing party_id");
    return;
  }

  // Sender POST request til serveren med genre_id, party_id og user_id
  const response = await fetch(
    "/api/genre_vote/" + genre_id + "/" + party_id + "/" + user_id,
    {
      method: "POST",
    },
  );

  // Hvis serveren returnerer en fejl vises en alert
  if (!response.ok) {
    const errorText = await response.text();
    console.log("VOTE ERROR:", errorText);
    alert("Not able to vote for this genre");
    return;
  }
  // Opdaterer vote baren efter stemmen er registreret
  await updateVotes();
}
// Henter stemmer fra serveren og opdaterer vote baren
async function updateVotes() {
  if (!party_id) {
    return;
  }

  // Henter alle stemmer for dette party
  const response = await fetch("/api/genre_vote/" + party_id);
  const votes = await response.json();

  // Tæller stemmer for hver genre
  let genre1Votes = 0;
  let genre2Votes = 0;

  
  votes.forEach(function (vote) {
    if (Number(vote.genre_id) === Number(genre1_id)) { // sørger for at begge værdier er tal
      genre1Votes = Number(vote.votes); 
    }

    if (Number(vote.genre_id) === Number(genre2_id)) {
      genre2Votes = Number(vote.votes);
    }
  });

  // Udregner procent for hver genre
  const totalVotes = genre1Votes + genre2Votes;

  let genre1Percent = 50;
  let genre2Percent = 50;

  // Hvis der er stemmer udregnes procenten, ellers vises 50/50
  if (totalVotes > 0) {
    genre1Percent = Math.round((genre1Votes / totalVotes) * 100);
    genre2Percent = 100 - genre1Percent;
  }

  // Opdaterer vote bar bredde og procent tekst
  document.getElementById("bar-genre1").style.width = genre1Percent + "%";
  document.getElementById("bar-genre2").style.width = genre2Percent + "%";

  document.getElementById("pct-genre1").textContent = genre1Percent + "%";
  document.getElementById("pct-genre2").textContent = genre2Percent + "%";
}

// Henter partymembers fra serveren og viser dem på siden
async function updateMembers() {
  const response = await fetch("/api/party/" + party_code + "/members");
  const members = await response.json();

  // Tømmer listen før den opdateres
  const box = document.getElementById("party-members");
  box.innerHTML = "";

  // Tilføjer hvert medlem som et p element
  members.forEach(function (member) {
    const p = document.createElement("p");
    p.className = "p";
    p.textContent = member.user_name;
    box.appendChild(p); // tilføjer p elementet inde i vores box
  });
}

// Sender brugeren videre til playlist siden med party_id og user_id
document.getElementById("start").addEventListener("click", function () {
  window.location.href =
    "playlist.html?party_id=" + party_id + "&user_id=" + user_id;
});

// Kalder funktionerne første gang siden loader
updateMembers();
updateVotes();

// Opdaterer members og votes hvert 3. sekund (polling)
setInterval(updateMembers, 3000);
setInterval(updateVotes, 3000);
