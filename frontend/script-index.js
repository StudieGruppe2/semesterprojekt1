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
    // kalde fetchData funktionen
    await postParty(navn, valgtMood);

    window.location.href = "genrevote.html?mood=" + valgtMood + "&navn=" + navn;
  });

// HTTP metode
async function postParty(navn, mood) {
  const response = await fetch(`/api/party/${navn}/${mood}`, {
    method: "POST", // man skal vælge post selv - default er get
  });
}
