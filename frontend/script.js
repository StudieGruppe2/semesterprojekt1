//polling
//set timeout funktion

//Popup box

const popup = document.getElementById("popup");

const moodButtons = document.querySelectorAll(".btn1");

// Åbner popup når du klikker på en mood
moodButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    popup.style.display = "flex";
  });
});

// Luk popup
function closePopup() {
  popup.style.display = "none";
}
