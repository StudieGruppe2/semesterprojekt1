// Henter party_id og user_id fra URL'en
const params = new URLSearchParams(window.location.search);
const party_id = params.get("party_id");
const user_id = params.get("user_id");


let timerInterval = null;

function startTimer(duration_ms) {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  let tidTilbage = duration_ms;

  timerInterval = setInterval(function () {
    tidTilbage -= 1000;

    if (tidTilbage <= 0) {
      clearInterval(timerInterval);
      tidTilbage = 0;
    }

    const minutter = Math.floor(tidTilbage / 60000);
    const sekunder = Math.floor((tidTilbage % 60000) / 1000);

    document.querySelector(".time").textContent =
      minutter + ":" + (sekunder < 10 ? "0" : "") + sekunder;

    const procent = (tidTilbage / duration_ms) * 100;
    document.querySelector(".progress").style.width = procent + "%";
  }, 1000);
}

let timerStartet = false;

async function hentPlaylist() {
  const response = await fetch("/api/party/" + party_id + "/playlist");
  const sange = await response.json();

  console.log("party_id:", party_id);
  console.log("sange:", sange);

  if (sange.length > 0 && !timerStartet) {
    startTimer(sange[0].duration_ms);
    timerStartet = true;
  }

  const box1 = document.querySelector(".box1");

  const gamleRækker = document.querySelectorAll(".row:not(.header-row)");
  gamleRækker.forEach(function (række) {
    række.remove();
  });

  sange.forEach(function (sang) {
    const række = document.createElement("div");
    række.classList.add("row");

    const minutter = Math.floor(sang.duration_ms / 60000);
    const sekunder = Math.floor((sang.duration_ms % 60000) / 1000);
    const tid = minutter + ":" + (sekunder < 10 ? "0" : "") + sekunder;

    række.innerHTML = `
  <span>${sang.title}</span>
  <span>${sang.artist}</span>
  <span>${tid}</span>
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
