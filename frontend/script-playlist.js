const params = new URLSearchParams(window.location.search);
const party_id = params.get("party_id");
const user_id = params.get("user_id");

let timerInterval = null;
let timerStartet = false;
let currentSongs = [];
let currentSongIndex = 0;

function startTimer(duration_ms, songs, index) {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  currentSongIndex = index;
  let timeLeft = duration_ms;

  timerInterval = setInterval(function () {
    timeLeft -= 1000;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timeLeft = 0;

      const nextIndex = currentSongIndex + 1;
      currentSongIndex = nextIndex;

      if (nextIndex < currentSongs.length) {
        startTimer(currentSongs[nextIndex].duration_ms, currentSongs, nextIndex);
      }
    }

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    document.querySelector(".time").textContent =
      minutes + ":" + (seconds < 10 ? "0" : "") + seconds;

    const percent = (timeLeft / duration_ms) * 100;
    document.querySelector(".progress").style.width = percent + "%";
  }, 1000);
}

async function hentPlaylist() {
  const response = await fetch("/api/party/" + party_id + "/playlist");
  const sange = await response.json();

  currentSongs = sange;

  if (sange.length > 0 && !timerStartet) {
    startTimer(sange[0].duration_ms, sange, 0);
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

    const minutes = Math.floor(sang.duration_ms / 60000);
    const seconds = Math.floor((sang.duration_ms % 60000) / 1000);
    const tid = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;

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