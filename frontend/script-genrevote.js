const params = new URLSearchParams(window.location.search);

const mood = params.get("mood");
const navn = params.get("navn");
const party_code = params.get("party_code");
const party_name = params.get("party_name");
const party_id = params.get("party_id");
const user_id = params.get("user_id");

console.log("GENREVOTE PARAMS:", {
  mood,
  navn,
  party_code,
  party_name,
  party_id,
  user_id,
});

document.getElementById("party-code").textContent = party_code;
document.getElementById("party-name").textContent = party_name;

let genre1_id;
let genre2_id;

if (mood === "Dinner") {
  document.getElementById("genre1-navn").textContent = "Jazz";
  document.getElementById("genre2-navn").textContent = "Bossa Nova";
  genre1_id = 400;
  genre2_id = 401;
} else if (mood === "Party") {
  document.getElementById("genre1-navn").textContent = "Pop";
  document.getElementById("genre2-navn").textContent = "House";
  genre1_id = 402;
  genre2_id = 403;
} else if (mood === "Workout") {
  document.getElementById("genre1-navn").textContent = "Rock";
  document.getElementById("genre2-navn").textContent = "Techno";
  genre1_id = 404;
  genre2_id = 405;
} else if (mood === "Chill") {
  document.getElementById("genre1-navn").textContent = "Indie";
  document.getElementById("genre2-navn").textContent = "Classical";
  genre1_id = 406;
  genre2_id = 407;
}

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

async function voteGenre(genre_id) {
  if (!party_id) {
    alert("Mangler party_id");
    return;
  }

  const response = await fetch("/api/genre_vote/" + genre_id + "/" + party_id + "/" + user_id, {
    method: "POST",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log("VOTE FEJL:", errorText);
    alert("Kunne ikke stemme");
    return;
  }

  await updateVotes();
}

async function updateVotes() {
  if (!party_id) {
    return;
  }

  const response = await fetch("/api/genre_vote/" + party_id);
  const votes = await response.json();

  let genre1Votes = 0;
  let genre2Votes = 0;

  votes.forEach(function (vote) {
    if (Number(vote.genre_id) === Number(genre1_id)) {
      genre1Votes = Number(vote.votes);
    }

    if (Number(vote.genre_id) === Number(genre2_id)) {
      genre2Votes = Number(vote.votes);
    }
  });

  const totalVotes = genre1Votes + genre2Votes;

  let genre1Percent = 50;
  let genre2Percent = 50;

  if (totalVotes > 0) {
    genre1Percent = Math.round((genre1Votes / totalVotes) * 100);
    genre2Percent = 100 - genre1Percent;
  }

  document.getElementById("bar-genre1").style.width = genre1Percent + "%";
  document.getElementById("bar-genre2").style.width = genre2Percent + "%";

  document.getElementById("pct-genre1").textContent = genre1Percent + "%";
  document.getElementById("pct-genre2").textContent = genre2Percent + "%";
}

async function updateMembers() {
  const response = await fetch("/api/party/" + party_code + "/members");
  const members = await response.json();

  const box = document.getElementById("party-members");
  box.innerHTML = "";

  members.forEach(function (member) {
    const p = document.createElement("p");
    p.className = "p";
    p.textContent = member.user_name;
    box.appendChild(p);
  });
}

document.getElementById("start").addEventListener("click", function () {
  window.location.href =
    "playlist.html?party_id=" + party_id + "&user_id=" + user_id;
});

updateMembers();
updateVotes();

setInterval(updateMembers, 3000);
setInterval(updateVotes, 3000);
