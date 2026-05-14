// Henter party_id og user_id fra URL'en
const params = new URLSearchParams(window.location.search);
const party_id = params.get("party_id");
const user_id = params.get("user_id");

// Holder styr på timer intervallet så vi kan stoppe det
let timerInterval = null;

// Holder styr på om en sang spiller
let sangSpiller = false;

// Holder styr på hvilke sange brugeren har stemt på i denne sang
let stemtePaaSange = [];

// Starter en nedtælling baseret på sangens længde i millisekunder
function startTimer(duration_ms, songs, index) {
  // Stopper gammel timer hvis der allerede kører en
  if (timerInterval) {
    clearInterval(timerInterval);
  }
}

  let tidTilbage = duration_ms;

  // Kører hvert sekund og opdaterer tiden på siden
  timerInterval = setInterval(async function () {
    tidTilbage -= 1000;

 // Stopper timeren når tiden er gået og starter næste sang
    if (tidTilbage <= 0) {
      clearInterval(timerInterval);
      tidTilbage = 0;

      stemtePaaSange = [];
      sangSpiller = false;

      const response = await fetch("/api/party/" + party_id + "/playlist");
      nuværendeSange = await response.json();

      if (nuværendeSange.length > 0) {
        nuværendeIndex = 0;
        startTimer(nuværendeSange[0].duration_ms, nuværendeSange, 0);
      }
    }
    
    // Konverterer millisekunder til minutter og sekunder
    const minutter = Math.floor(tidTilbage / 60000);
    const sekunder = Math.floor((tidTilbage % 60000) / 1000);
    
    // Viser tiden på siden
    document.querySelector(".time").textContent =
      minutter + ":" + (sekunder < 10 ? "0" : "") + sekunder;


// Opdaterer progress bar bredde baseret på hvor meget tid der er tilbage
    const procent = (tidTilbage / duration_ms) * 100;
    document.querySelector(".progress").style.width = procent + "%";
}, 1000);

// Henter playlisten fra serveren og viser sangene på siden
async function hentPlaylist() {
  const response = await fetch("/api/party/" + party_id + "/playlist");
  const sange = await response.json();

  //viser den sang der afspilles
  if (sange.length > 0){
    document.getElementById("nuværende-sang").textContent=sange[0].title + " - " + sange[0].artist;
  }

  // Starter timeren for første sang kun hvis ingen sang spiller
  if (sange.length > 0 && !sangSpiller) {
    sangSpiller = true;
    startTimer(sange[0].duration_ms, sange, 0);
  }

  const box1 = document.querySelector(".box1");

  // Fjerner gamle sange rækker så listen kan opdateres
  const gamleRækker = document.querySelectorAll(".row:not(.header-row)");
  gamleRækker.forEach(function (række) {
    række.remove();
  });

  // Tilføjer en række per sang med titel, artist, tid og antal stemmer
  sange.forEach(function (sang) {
    const række = document.createElement("div");
    række.classList.add("row");

    // Konverterer millisekunder til minutter og sekunder
    const minutter = Math.floor(sang.duration_ms / 60000);
    const sekunder = Math.floor((sang.duration_ms % 60000) / 1000);
    const tid = minutter + ":" + (sekunder < 10 ? "0" : "") + sekunder;

    // 4 spans - titel, artist, tid og likes
    række.innerHTML = `
      <span>${sang.title}</span>
      <span>${sang.artist}</span>
      <span>${tid}</span>
      <span>${sang.stemmer}</span>
    `;

    // Opretter like knap og tilføjer event listener
    const knap = document.createElement("button");
    knap.classList.add("like-btn");
    knap.innerHTML = `<img src="pinkhjerte.png" alt="like" />`;
    knap.addEventListener("click", function () {
      stemPaaSang(sang.track_id);
    });

    række.appendChild(knap);
    box1.appendChild(række);
  });
}

// Sender en stemme til serveren for den valgte sang
async function stemPaaSang(track_id) {
  // Tjekker om brugeren allerede har stemt i denne sang
  if (stemtePaaSange.includes(track_id)) {
    alert("Vent til næste sang!");
    return;
  }

  const response = await fetch(
    "/api/track_vote/" + track_id + "/" + party_id + "/" + user_id,
    { method: "POST" },
  );

  const data = await response.json();

  // Viser fejl hvis noget gik galt
  if (data.error) {
    alert(data.error);
  } else {
    // Tilføjer sangen til listen over stemte sange
    stemtePaaSange.push(track_id);
    // Opdaterer listen med det samme efter stemme
    hentPlaylist();
  }
}

// Kalder hentPlaylist første gang siden loader
hentPlaylist();

// Opdaterer playlisten hvert 3. sekund (polling)
setInterval(hentPlaylist, 3000);
