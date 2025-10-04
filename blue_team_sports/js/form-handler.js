// ==============================
// Detect which sport page we're on
// ==============================
const currentPage = window.location.pathname.split("/").pop().replace(".html", "");
console.log("Current Page:", currentPage);

// ==============================
// Utility: Push with validation
// ==============================
async function pushPlayer(ref, name, gender, messageEl) {
  const snap = await ref.once("value");
  const players = snap.val() || {};

  if (Object.values(players).some((p) => p.studentName === name)) {
    messageEl.innerText = "⚠️ This student is already registered in this sport.";
    return false;
  }

  await ref.push({ studentName: name, gender, timestamp: Date.now() });
  messageEl.innerText = "✅ Registered successfully!";
  return true;
}

// ==============================
// Common form handler
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("fullName").value.trim();
    const gender = document.getElementById("gender")?.value?.toLowerCase();
    const category = document.getElementById("category")?.value?.toLowerCase();
    const message = document.getElementById("message");

    if (!name) return (message.innerText = "⚠️ Please enter a valid name.");

    // Validate student directory
    const studentsRef = firebase.database().ref("students");
    const snapshot = await studentsRef.orderByChild("name").equalTo(name).once("value");
    if (!snapshot.exists()) {
      message.innerText = "⚠️ Student not found in directory. Please register first.";
      return;
    }

    // ==============================
    // SPORT-SPECIFIC RULES
    // ==============================

    // 🏸 BADMINTON
    if (currentPage === "badminton") {
      const ref = firebase.database().ref(`badminton/${category}/${gender}`);
      const snap = await ref.once("value");
      const players = snap.val() || {};

      if (Object.values(players).some((p) => p.studentName === name)) {
        message.innerText = "⚠️ This student is already registered in this category.";
        return;
      }

      const count = Object.keys(players).length;
      if ((category === "singles" && count >= 1) || (category === "doubles" && count >= 2)) {
        message.innerText = `❌ Sorry, ${gender} ${category} slots are full.`;
        return;
      }

      await ref.push({ studentName: name, timestamp: Date.now() });
      message.innerText = "✅ Registered successfully!";
      form.reset();
      return;
    }

    // 🏀 BASKETBALL
    if (currentPage === "basketball") {
      const ref = firebase.database().ref(`basketball/${gender}`);
      const snap = await ref.once("value");
      const players = snap.val() || {};

      if (Object.values(players).some((p) => p.studentName === name)) {
        message.innerText = "⚠️ This student is already registered in Basketball.";
        return;
      }

      if (Object.keys(players).length >= 20) {
        message.innerText = `❌ Sorry, ${gender} team is already full (20 players).`;
        return;
      }

      await pushPlayer(ref, name, gender, message);
      form.reset();
      return;
    }

    // 🏐 VOLLEYBALL
    if (currentPage === "volleyball") {
      if (gender !== "female") {
        message.innerText = "❌ Only female players are allowed in Volleyball.";
        return;
      }

      const ref = firebase.database().ref("volleyball/female");
      const snap = await ref.once("value");
      const players = snap.val() || {};

      if (Object.values(players).some((p) => p.studentName === name)) {
        message.innerText = "⚠️ This student is already registered in Volleyball.";
        return;
      }

      if (Object.keys(players).length >= 12) {
        message.innerText = "❌ Sorry, Volleyball team is already full (12 players).";
        return;
      }

      await pushPlayer(ref, name, gender, message);
      form.reset();
      return;
    }

    // ♟️ CHESS
    if (currentPage === "chess") {
      const ref = firebase.database().ref("chess");
      const snap = await ref.once("value");
      const players = snap.val() || {};

      if (Object.values(players).some((p) => p.studentName === name)) {
        message.innerText = "⚠️ This student is already registered in Chess.";
        return;
      }

      if (Object.keys(players).length >= 3) {
        message.innerText = "❌ Sorry, Chess already has 3 players.";
        return;
      }

      await pushPlayer(ref, name, gender, message);
      form.reset();
      return;
    }

    // Default for other sports
    const ref = firebase.database().ref(`${currentPage}`);
    await pushPlayer(ref, name, gender, message);
    form.reset();
  });

  // ==============================
  // Student suggestions
  // ==============================
  const nameInput = document.getElementById("fullName");
  const datalist = document.getElementById("studentSuggestions");

  if (nameInput && datalist) {
    const ref = firebase.database().ref("students");
    ref.on("value", (snapshot) => {
      datalist.innerHTML = "";
      const students = snapshot.val() || {};
      const names = Object.values(students)
        .map((s) => s.name?.trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

      names.forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        datalist.appendChild(option);
      });

      console.log(`✅ Loaded ${names.length} student suggestions`);
    });
  }

  // ==============================
  // Live player lists per sport
  // ==============================

  const createListUpdater = (path, listId) => {
    const ref = firebase.database().ref(path);
    ref.on("value", (snapshot) => {
      const players = snapshot.val() || {};
      const ul = document.getElementById(listId);
      if (ul) {
        ul.innerHTML = "";
        Object.values(players).forEach((p) => {
          const li = document.createElement("li");
          li.textContent = p.studentName;
          ul.appendChild(li);
        });
      }
    });
  };

  if (currentPage === "badminton") {
    ["singles", "doubles"].forEach((cat) =>
      ["male", "female"].forEach((gen) =>
        createListUpdater(`badminton/${cat}/${gen}`, `${cat}-${gen}`)
      )
    );
  }

  if (currentPage === "basketball") {
    ["male", "female"].forEach((gen) =>
      createListUpdater(`basketball/${gen}`, `basketball-${gen}`)
    );
  }

  if (currentPage === "volleyball") {
    createListUpdater("volleyball/female", "volleyball-female");
  }

  if (currentPage === "chess") {
    createListUpdater("chess", "chess-list");
  }
});
