const showStartupNotice = (message) => {
  document.addEventListener("DOMContentLoaded", () => {
    const notice = document.getElementById("notice");
    if (notice) {
      notice.hidden = false;
      notice.textContent = message;
    }
  });
};

if (location.protocol === "file:") {
  showStartupNotice("Open the Vercel link or run a local web server to view the interactive map.");
} else {
  import("./app.js?v=20260527-map-zoom")
    .catch((error) => {
      console.error("Could not load map application", error);
      showStartupNotice("The map application could not load. Please refresh this page once Vercel finishes redeploying.");
    });
}
