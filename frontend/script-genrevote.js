const params = new URLSearchParams(window.location.search);
const mood = params.get("mood");
const navn = params.get("navn");
const party_code = params.get("party_code");
const party_name = params.get("party_name");
const party_id = params.get("party_id");
const user_id = params.get("user_id");

document.getElementById("party-code").textContent = party_code;
document.getElementById("party-name").textContent = party_name;

if (mood === "Dinner") {
  document.getElementById("genre1-navn").textContent = "Jazz";
  document.getElementById("genre2-navn").textContent = "Bossa Nova";
} else if (mood === "Party") {
  document.getElementById("genre1-navn").textContent = "Pop";
  document.getElementById("genre2-navn").textContent = "House";
} else if (mood === "Workout") {
  document.getElementById("genre1-navn").textContent = "Rock";
  document.getElementById("genre2-navn").textContent = "Techno";
} else if (mood === "Chill") {
  document.getElementById("genre1-navn").textContent = "Indie";
  document.getElementById("genre2-navn").textContent = "Classical";
}

setInterval(update, 3000);

function update() {
  console.log("opdaterer...");
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
setInterval(updateMembers, 3000);
