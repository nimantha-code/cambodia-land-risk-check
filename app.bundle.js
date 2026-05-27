if (location.protocol === "file:") {
  document.addEventListener("DOMContentLoaded", () => {
    const notice = document.getElementById("notice");
    if (notice) {
      notice.hidden = false;
      notice.textContent = "Open the Vercel link or run a local web server to view the interactive map.";
    }
  });
} else {
  import("./app.js");
}
