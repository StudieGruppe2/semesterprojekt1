const params = new URLSearchParams(window.location.search);
const party_id = params.get("party_id");
const user_id = params.get("user_id");

let timerInterval = null;
let timerStartet = false;
let afspilledeSange = [];
let stemtePaaSange = [];

// Den sang der spiller lige nu
let nuværendeSang = null;

function startTimer(duration_ms) {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  let tidTilbage = duration_ms;

  timerInterval = setInterval(async function () {
    tidTilbage -= 1000;

    if (tidTilbage <= 0) {
      clearInterval(timerInterval);
      tidTilbage = 0;

      timerStartet = false;
      await hentPlaylist();
    }

    const minutter = Math.floor(tidTilbage / 60000);
    const sekunder = Math.floor((tidTilbage % 60000) / 1000);

    document.querySelector(".time").textContent =
      minutter + ":" + (sekunder < 10 ? "0" : "") + sekunder;

    const procent = (tidTilbage / duration_ms) * 100;
    document.querySelector(".progress").style.width = procent + "%";
  }, 1000);
}

async function hentPlaylist() {
  const response = await fetch("/api/party/" + party_id + "/playlist");
  const alleSange = await response.json();

  // Sange med stemmer der ikke er spillet endnu
  const sangemedStemmer = alleSange.filter(function (sang) {
    return sang.stemmer > 0 && !afspilledeSange.includes(sang.track_id);
  });

  // Sange uden stemmer der ikke er spillet endnu
  const sangeUdenStemmer = alleSange.filter(function (sang) {
    return sang.stemmer === 0 && !afspilledeSange.includes(sang.track_id);
  });

  // Afspillede sange bagerst
  const tidligereAfspillede = alleSange.filter(function (sang) {
    return afspilledeSange.includes(sang.track_id);
  });

  // Samlet rækkefølge: stemte først, derefter ustemte, afspillede bagerst
  const sorteretSange = sangemedStemmer
    .concat(sangeUdenStemmer)
    .concat(tidligereAfspillede);

  // Start næste sang hvis ingen spiller
  if (!timerStartet) {
    let næsteSang = null;

    if (sangemedStemmer.length > 0) {
      næsteSang = sangemedStemmer[0];
    } else if (sangeUdenStemmer.length > 0) {
      næsteSang = sangeUdenStemmer[0];
    } else if (alleSange.length > 0) {
      // Alle sange er spillet - nulstil og start forfra
      afspilledeSange = [];
      næsteSang = alleSange[0];
    }

    if (næsteSang !== null) {
      timerStartet = true;
      nuværendeSang = næsteSang;
      afspilledeSange.push(næsteSang.track_id);
      startTimer(næsteSang.duration_ms);
    }
  }

  // Viser den sang der spiller nu
  if (nuværendeSang !== null) {
    document.getElementById("nuværende-sang").textContent =
      nuværendeSang.title + " - " + nuværendeSang.artist;
  }

  const box1 = document.querySelector(".box1");

  const gamleRækker = document.querySelectorAll(".row:not(.header-row)");
  gamleRækker.forEach(function (række) {
    række.remove();
  });

  sorteretSange.forEach(function (sang) {
    const række = document.createElement("div");
    række.classList.add("row");

    const minutter = Math.floor(sang.duration_ms / 60000);
    const sekunder = Math.floor((sang.duration_ms % 60000) / 1000);
    const tid = minutter + ":" + (sekunder < 10 ? "0" : "") + sekunder;

    række.innerHTML = `
      <span>${sang.title}</span>
      <span>${sang.artist}</span>
      <span>${tid}</span>
      <span>${sang.stemmer}</span>
    `;

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

async function stemPaaSang(track_id) {
  const response = await fetch(
    "/api/track_vote/" + track_id + "/" + party_id + "/" + user_id,
    { method: "POST" },
  );

  const data = await response.json();

  if (data.error) {
    alert(data.error);
  } else {
    hentPlaylist();
  }
}

hentPlaylist();
setInterval(hentPlaylist, 3000);
