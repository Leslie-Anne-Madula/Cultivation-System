/* Runs before first paint so the saved theme and page-turn cover apply without a flash. */
(() => {
  try {
    const theme = JSON.parse(localStorage.getItem("dao:theme"));
    if (theme) document.documentElement.dataset.theme = theme;
    if (sessionStorage.getItem("dao:veil")) document.documentElement.classList.add("arriving");
  } catch {
    /* storage unavailable */
  }
})();
