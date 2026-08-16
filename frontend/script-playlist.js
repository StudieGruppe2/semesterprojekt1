// Henter party_id og user_id fra URL'en
const params = new URLSearchParams(window.location.search);
const party_id = params.get("party_id");
const user_id = params.get("user_id");

// Holder styr på timer intervallet, om timeren kører, afspillede sange og stemmer
let timerInterval = null;
let timerStartet = false;
let afspilledeSange = [];
/*let stemtePaaSange = [];*/

// Den sang der spiller lige nu
let nuværendeSang = null;

// Starter en nedtælling baseret på sangens længde i millisekunder
function startTimer(duration_ms) {
  // Stopper gammel timer hvis der allerede kører en
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  let tidTilbage = duration_ms;

  // Kører hvert sekund og opdaterer tiden på siden
  timerInterval = setInterval(async function () {
    tidTilbage -= 1000;

    // Stopper timeren når tiden er gået og henter næste sang
    if (tidTilbage <= 0) {
      clearInterval(timerInterval);
      tidTilbage = 0;

      // Sætter timerStartet til false så næste sang kan starte
      timerStartet = false;
      await hentPlaylist();
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

// Henter playlisten fra serveren og viser sangene på siden
async function hentPlaylist() {
  const response = await fetch("/api/party/" + party_id + "/playlist");
  const alleSange = await response.json();

  // Fjerner sange der allerede er spillet
  // Sætter afspillede sange bagerst i køen
const ikkAfspillede = alleSange.filter(function (sang) {
  return !afspilledeSange.includes(sang.track_id);
});
const alleredeAfspillede = alleSange.filter(function (sang) {
  return afspilledeSange.includes(sang.track_id);
});
const sange = ikkAfspillede.concat(alleredeAfspillede);

  // Sange uden stemmer der ikke er spillet endnu - vises i midten
  const sangeUdenStemmer = alleSange.filter(function (sang) {
    return sang.stemmer === 0 && !afspilledeSange.includes(sang.track_id);
  });

  // Afspillede sange vises bagerst i listen
  const tidligereAfspillede = alleSange.filter(function (sang) {
    return afspilledeSange.includes(sang.track_id);
  });

  // Samlet rækkefølge: stemte først, derefter ustemte, afspillede bagerst
  const sorteretSange = sangemedStemmer
    .concat(sangeUdenStemmer)
    .concat(tidligereAfspillede);

  // Start næste sang hvis ingen sang spiller
  if (!timerStartet) {
    let næsteSang = null;

    // Vælger sang med flest stemmer først
    if (sangemedStemmer.length > 0) {
      næsteSang = sangemedStemmer[0];
      // Ellers vælges næste sang uden stemmer
    } else if (sangeUdenStemmer.length > 0) {
      næsteSang = sangeUdenStemmer[0];
      // Hvis alle sange er spillet - nulstil og start forfra
    } else if (alleSange.length > 0) {
      afspilledeSange = [];
      næsteSang = alleSange[0];
    }

    if (næsteSang !== null) {
      timerStartet = true;
      nuværendeSang = næsteSang;
      // Gemmer sangen som afspillet så den rykker bagerst
      afspilledeSange.push(næsteSang.track_id);
      startTimer(næsteSang.duration_ms);
    }
  }

  // Viser den sang der spiller nu under progress baren
  if (nuværendeSang !== null) {
    document.getElementById("nuværende-sang").textContent =
      nuværendeSang.title + " - " + nuværendeSang.artist;
  }

  const box1 = document.querySelector(".box1");

  // Fjerner gamle sange rækker så listen kan opdateres
  const gamleRækker = document.querySelectorAll(".row:not(.header-row)");
  gamleRækker.forEach(function (række) {
    række.remove();
  });

  // Tilføjer en række per sang med titel, artist, tid og antal stemmer
  sorteretSange.forEach(function (sang) {
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
  const response = await fetch(
    "/api/track_vote/" + track_id + "/" + party_id + "/" + user_id,
    { method: "POST" },
  );

  const data = await response.json();

  // Viser fejl hvis noget gik galt
  if (data.error) {
    alert(data.error);
  } else {
    // Opdaterer listen med det samme efter stemme
    hentPlaylist();
  }
}

// Kalder hentPlaylist første gang siden loader
hentPlaylist();
setInterval(function () {
  hentPlaylist();
}, 3000);
