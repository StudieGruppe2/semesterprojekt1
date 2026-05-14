// Henter party_id og user_id fra URL'en
const params = new URLSearchParams(window.location.search);
const party_id = params.get("party_id");
const user_id = params.get("user_id");

// Holder styr på timer intervallet så vi kan stoppe det
let timerInterval = null;

// Starter en nedtælling baseret på sangens længde i millisekunder
function startTimer(duration_ms, songs, index) {
  // Stopper gammel timer hvis der allerede kører en
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  let tidTilbage = duration_ms;

  // Kører hvert sekund og opdaterer tiden på siden
  timerInterval = setInterval(function () {
    tidTilbage -= 1000;

    // Stopper timeren når tiden er gået og starter næste sang
    if (tidTilbage <= 0) {
      clearInterval(timerInterval);
      tidTilbage = 0;

      // Starter næste sang når nuværende er færdig
      const nextIndex = index + 1;
      if (nextIndex < songs.length) {
        const nextSong = songs[nextIndex];
        startTimer(nextSong.duration_ms, songs, nextIndex);
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
}

// Holder styr på om timeren er startet så den ikke resetter ved polling
let timerStartet = false;

// Henter playlisten fra serveren og viser sangene på siden
async function hentPlaylist() {
  const response = await fetch("/api/party/" + party_id + "/playlist");
  const sange = await response.json();

  // Starter timeren for første sang - kun første gang
  if (sange.length > 0 && !timerStartet) {
    startTimer(sange[0].duration_ms, sange, 0);
    timerStartet = true;
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
  const response = await fetch(
    "/api/track_vote/" + track_id + "/" + party_id + "/" + user_id,
    { method: "POST" },
  );

  const data = await response.json();

  // Viser fejl hvis brugeren allerede har stemt
  if (data.error) {
    alert(data.error);
  } else {
    // Opdaterer listen med det samme efter stemme
    hentPlaylist();
  }
}

// Kalder hentPlaylist første gang siden loader
hentPlaylist();

// Opdaterer playlisten hvert 3. sekund (polling)
setInterval(hentPlaylist, 3000);
