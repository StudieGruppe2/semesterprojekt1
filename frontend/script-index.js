// Henter popup elementet og gemmer det valgte mood
const popup = document.getElementById("popup");
let valgtMood = "";

// Lytter på klik på mood knapperne og gemmer det valgte mood
const moodButtons = document.querySelectorAll(".mood-btn");

moodButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    valgtMood = button.id;
    console.log("Valgt mood:", valgtMood);
    popup.style.display = "flex";
  });
});

// Lukker popup når der klikkes på kryds knappen
function closePopup() {
  popup.style.display = "none";
}
document.querySelector(".close-btn").addEventListener("click", closePopup);

// Opretter et party når host trykker "Create party"
document
  .getElementById("createPartyBtn")
  .addEventListener("click", async function () {
    const navn = document.querySelector(".textareaname1").value;

    // Tjekker at navn ikke er tomt
    if (navn === "") {
      alert("Write your name!");
      return;
    }

    // Sender POST request til serveren med mood og navn
    const response = await fetch(
      "/api/party/create/" + valgtMood + "/" + navn,
      {
        method: "POST",
      },
    );

    // Viser fejl hvis serveren ikke kan oprette party
    if (!response.ok) {
      const errorText = await response.text();
      console.log("CREATE ERROR:", errorText);
      alert("Not able to create party");
      return;
    }

    const data = await response.json();

    console.log("SERVER RESPONSE:", data);

    // Sender host videre til genrevote siden med alle nødvendige data i URL'en
    window.location.href =
      "genrevote.html?mood=" +
      valgtMood +
      "&navn=" +
      navn +
      "&party_code=" +
      data.party_code +
      "&party_name=" +
      data.party_name +
      "&party_id=" +
      data.party_id +
      "&user_id=" +
      data.user_id;
  });

// Joiner et eksisterende party når bruger trykker "Get in the mix"
document
  .getElementById("joinPartyBtn")
  .addEventListener("click", async function () {
    const navn = document.querySelector(".textareaname").value;
    const party_code = document.querySelector(".textareacode").value;

    // Tjekker at navn og party kode ikke er tomme
    if (navn === "") {
      alert("Write your name!");
      return;
    }
    if (party_code === "") {
      alert("Enter party code!");
      return;
    }

    // Sender POST request til serveren med party kode og navn
    const response = await fetch("/api/party/join/" + party_code + "/" + navn, {
      method: "POST",
    });

    // Viser fejl hvis party ikke findes
    if (!response.ok) {
      const errorText = await response.text();
      console.log("JOIN ERROR:", errorText);
      alert("Not able to join party");
      return;
    }

    const data = await response.json();
    console.log("JOIN SERVER RESPONSE:", data);

    // Sender bruger videre til genrevote siden med alle nødvendige data i URL'en
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
