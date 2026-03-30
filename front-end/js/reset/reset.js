document.addEventListener("DOMContentLoaded", () => {
    const resetBtn = document.getElementById("reset-btn");
    const statusMsg = document.getElementById("status-msg");

    resetBtn.addEventListener("click", () => {
        // Confirm before wiping
        if (confirm("Are you entirely sure you want to wipe the local database? All modified data will be lost forever.")) {
            // Delete database and this tab's session
            localStorage.removeItem("fsd_store");
            sessionStorage.removeItem("fsd_session");

            // Display success
            statusMsg.style.display = "block";
            resetBtn.disabled = true;
            resetBtn.style.backgroundColor = "#aaa";
            resetBtn.style.cursor = "not-allowed";

            // Redirect back to login after a short delay
            setTimeout(() => {
                window.location.replace("../auth_pages/login.html");
            }, 1000);
        }
    });
});
