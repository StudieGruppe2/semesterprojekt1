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

document.querySelector(".close-btn").addEventListener("click", closePopup);

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

    if (!response.ok) {
      const errorText = await response.text();
      console.log("CREATE FEJL:", errorText);
      alert("Kunne ikke oprette party");
      return;
    }

    const data = await response.json();
    console.log("SERVER SVAR:", data);

    window.location.href =
      "genrevote.html?mood=" +
      valgtMood +
      "&navn=" +
      navn +
      "&party_code=" +
      party_code +
      "&party_name=" +
      party_name +
      "&party_id=" +
      data.party_id +
      "&user_id=" +
      data.user_id;
  });

// Join party knap
document
  .getElementById("joinPartyBtn")
  .addEventListener("click", async function () {
    const navn = document.querySelector(".textareaname").value;
    const party_code = document.querySelector(".textareacode").value;

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

    if (!response.ok) {
      const errorText = await response.text();
      console.log("JOIN FEJL:", errorText);
      alert("Kunne ikke joine party");
      return;
    }

    const data = await response.json();
    console.log("JOIN SERVER SVAR:", data);

    window.location.href =
      "genrevote.html?navn=" +
      navn +
      "&party_code=" +
      data.party_code +
      "&party_name=" +
      data.party_name +
      "&mood=" +
      data.mood_type +
      "&party_id=" +
      data.party_id +
      "&user_id=" +
      data.user_id; 
  });
