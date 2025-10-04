const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const logDiv = document.getElementById("log");

function log(msg) {
  logDiv.innerHTML += msg + "<br>";
  logDiv.scrollTop = logDiv.scrollHeight;
}

uploadBtn.addEventListener("click", () => {
  const file = fileInput.files[0];
  if (!file) return alert("Please select a student.txt file first.");

  const reader = new FileReader();
  reader.onload = async function (e) {
    const lines = e.target.result.split("\n").map(l => l.trim()).filter(l => l);
    const ref = firebase.database().ref("students");

    let successCount = 0;
    for (const line of lines) {
      // Format: "LASTNAME, Firstname Middlename"
      const parts = line.split(",");
      if (parts.length < 2) {
        log(`⚠️ Skipped invalid line: "${line}"`);
        continue;
      }

      const lastName = parts[0].trim();
      const firstName = parts[1].trim();
      const fullName = `${firstName} ${lastName}`;

      // Check if student already exists
      const snap = await ref.orderByChild("name").equalTo(fullName).once("value");
      if (snap.exists()) {
        log(`⏩ Skipped duplicate: ${fullName}`);
        continue;
      }

      // Guess gender by first name (optional improvement later)
      await ref.push({
        name: fullName,
        gender: "unspecified",
        timestamp: Date.now()
      });

      successCount++;
      log(`✅ Added: ${fullName}`);
    }

    log(`<br>🎉 Upload complete! ${successCount} students added.`);
  };

  reader.readAsText(file);
});
