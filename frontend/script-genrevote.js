const params = new URLSearchParams(window.location.search);
const mood = params.get("mood");
const navn = params.get("navn");

if (mood === "Dinner") {
  document.getElementById("genre1-navn").textContent = "Jazz";
  document.getElementById("genre2-navn").textContent = "Bossa Nova";
} else if (mood === "Party") {
  document.getElementById("genre1-navn").textContent = "Pop";
  document.getElementById("genre2-navn").textContent = "House";
} else if (mood === "Workout") {
  document.getElementById("genre1-navn").textContent = "Rock";
  document.getElementById("genre2-navn").textContent = "Techno";
} else if (mood === "Chill") {
  document.getElementById("genre1-navn").textContent = "Indie";
  document.getElementById("genre2-navn").textContent = "Classical";
}
