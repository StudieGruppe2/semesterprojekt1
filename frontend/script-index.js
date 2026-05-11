const popup = document.getElementById("popup");
let valgtMood = "";

// Mood knapper
const moodButtons = document.querySelectorAll(".mood-btn");
moodButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    valgtMood = button.id;
    console.log("Valgt mood:", valgtMood);
    popup.style.display = "flex";
  });
});

// Luk popup
function closePopup() {
  popup.style.display = "none";
}

// Create party knap
document
  .getElementById("createPartyBtn")
  .addEventListener("click", async function () {
    const navn = document.querySelector(".textareaname1").value;

    if (navn === "") {
      alert("Skriv dit navn!");
      return;
    }

    const response = await fetch(
      "/api/party/create/" + valgtMood + "/" + navn,
      {
        method: "POST",
      },
    );

    const data = await response.json();
    const party_code = data.party_code;
    const party_name = data.party_name;

    window.location.href =
      "genrevote.html?mood=" +
      valgtMood +
      "&navn=" +
      navn +
      "&party_code=" +
      party_code +
      "&party_name=" +
      party_name;
  });

//join party knap

document
  .getElementById("joinPartyBtn")
  .addEventListener("click", async function () {
    const navn = document.querySelector(".textareaname").value;
    const party_code = document.querySelector(".textareacode").value; // ← hent fra inputfeltet

    if (navn === "") {
      alert("Skriv dit navn!");
      return;
    }

    if (party_code === "") {
      alert("Indtast party kode!");
      return;
    }

    const response = await fetch("/api/party/join/" + party_code + "/" + navn, {
      method: "POST",
    });

    const data = await response.json();

    console.log(data.party_code);
    console.log(data.party_name);
    console.log(data.user_id);
    console.log(data.user_name);

    window.location.href =
      "genrevote.html?navn=" +
      navn +
      "&party_code=" +
      data.party_code +
      "&party_name=" +
      data.party_name +
      "&mood=" +
      data.mood_type;
  });
