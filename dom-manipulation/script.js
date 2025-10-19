// script.js
// Dynamic Quote Generator with LocalStorage, SessionStorage, JSON import/export

/* -------------------------
   Initial default quotes
   ------------------------- */
let quotes = [
  {
    text: "The best way to get started is to quit talking and begin doing.",
    category: "Motivation",
  },
  {
    text: "Life is what happens when you’re busy making other plans.",
    category: "Life",
  },
  { text: "If you can dream it, you can do it.", category: "Inspiration" },
];

/* -------------------------
   DOM elements
   ------------------------- */
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categorySelect = document.getElementById("categorySelect");

/* -------------------------
   Storage keys
   ------------------------- */
const LS_QUOTES_KEY = "dqg_quotes_v1"; // localStorage for persistent quotes
const SS_LAST_QUOTE_KEY = "dqg_last_viewed_v1"; // sessionStorage for last viewed quote

/* -------------------------
   LocalStorage helpers
   ------------------------- */
function saveQuotes() {
  try {
    localStorage.setItem(LS_QUOTES_KEY, JSON.stringify(quotes));
  } catch (err) {
    console.error("Failed to save quotes to localStorage:", err);
  }
}

function loadQuotes() {
  try {
    const raw = localStorage.getItem(LS_QUOTES_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // validate items minimally (must have text and category strings)
      const valid = parsed.every(
        (q) => q && typeof q.text === "string" && typeof q.category === "string"
      );
      if (valid) {
        quotes = parsed;
        return true;
      }
    }
    console.warn("Stored quotes were invalid; keeping defaults.");
    return false;
  } catch (err) {
    console.error("Failed to load quotes from localStorage:", err);
    return false;
  }
}

/* -------------------------
   SessionStorage helpers
   ------------------------- */
function saveLastViewedQuote(quoteObj) {
  try {
    sessionStorage.setItem(SS_LAST_QUOTE_KEY, JSON.stringify(quoteObj));
  } catch (err) {
    console.error("Failed to save last viewed quote to sessionStorage:", err);
  }
}

function loadLastViewedQuote() {
  try {
    const raw = sessionStorage.getItem(SS_LAST_QUOTE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load last viewed quote:", err);
    return null;
  }
}

/* -------------------------
   Category dropdown
   ------------------------- */
function populateCategories() {
  const categories = [...new Set(quotes.map((q) => q.category))].sort();
  categorySelect.innerHTML = "";

  // "All" option
  const allOpt = document.createElement("option");
  allOpt.value = "__ALL__";
  allOpt.textContent = "All categories";
  categorySelect.appendChild(allOpt);

  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

/* -------------------------
   Show random quote
   ------------------------- */
function showRandomQuote() {
  const selectedCategory = categorySelect.value;
  let pool = quotes;

  if (selectedCategory && selectedCategory !== "__ALL__") {
    pool = quotes.filter((q) => q.category === selectedCategory);
  }

  if (pool.length === 0) {
    quoteDisplay.textContent = "No quotes available for this selection.";
    quoteDisplay.setAttribute("title", "");
    return;
  }

  const index = Math.floor(Math.random() * pool.length);
  const q = pool[index];
  quoteDisplay.textContent = `"${q.text}" — ${q.category}`;
  quoteDisplay.setAttribute("title", `${q.text} (${q.category})`);

  // save last viewed quote in sessionStorage
  saveLastViewedQuote({
    text: q.text,
    category: q.category,
    shownAt: new Date().toISOString(),
  });
}

/* -------------------------
   Add quote
   ------------------------- */
function addQuoteFromInputs() {
  const newTextInput = document.getElementById("newQuoteText");
  const newCategoryInput = document.getElementById("newQuoteCategory");
  if (!newTextInput || !newCategoryInput) {
    alert("Add-quote inputs not found.");
    return;
  }

  const newText = newTextInput.value.trim();
  const newCategory = newCategoryInput.value.trim() || "Uncategorized";

  if (!newText) {
    alert("Please enter a quote text.");
    return;
  }

  // add to array
  quotes.push({ text: newText, category: newCategory });

  // persist
  saveQuotes();

  // update UI and make newly added category selected
  populateCategories();
  categorySelect.value = newCategory;

  // clear inputs
  newTextInput.value = "";
  newCategoryInput.value = "";

  // show the newly added quote immediately
  quoteDisplay.textContent = `"${newText}" — ${newCategory}`;
  saveLastViewedQuote({
    text: newText,
    category: newCategory,
    shownAt: new Date().toISOString(),
  });

  // small visual confirmation (avoid blocking alerts in heavy UX)
  const notice = document.createElement("div");
  notice.textContent = "Quote added!";
  notice.className = "small";
  setTimeout(() => notice.remove(), 1500);
  newTextInput.parentNode && newTextInput.parentNode.appendChild(notice);
}

/* -------------------------
   JSON Export
   ------------------------- */
function exportQuotesToJson() {
  try {
    const json = JSON.stringify(quotes, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const filename = `quotes-${now.getFullYear()}${pad(
      now.getMonth() + 1
    )}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(
      now.getSeconds()
    )}.json`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export failed:", err);
    alert("Failed to export quotes.");
  }
}

/* -------------------------
   JSON Import
   - Merge imported quotes with existing ones
   - Validate structure and deduplicate by exact text+category
   ------------------------- */
function importFromJsonFile(file) {
  if (!file) {
    alert("No file selected for import.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (evt) {
    try {
      const parsed = JSON.parse(evt.target.result);
      if (!Array.isArray(parsed))
        throw new Error("Imported JSON must be an array of quotes.");

      // normalize & validate incoming
      const incoming = parsed
        .map((q) => {
          if (
            !q ||
            typeof q.text !== "string" ||
            typeof q.category !== "string"
          )
            return null;
          return {
            text: q.text.trim(),
            category: q.category.trim() || "Uncategorized",
          };
        })
        .filter(Boolean);

      if (incoming.length === 0) {
        alert("Imported file contains no valid quotes.");
        return;
      }

      // deduplicate: create a Set of existing text|category keys
      const key = (q) => `${q.text}|||${q.category}`;
      const existingKeys = new Set(quotes.map(key));

      // append only new items
      let added = 0;
      incoming.forEach((q) => {
        if (!existingKeys.has(key(q))) {
          quotes.push(q);
          existingKeys.add(key(q));
          added++;
        }
      });

      saveQuotes();
      populateCategories();

      alert(`Import complete. ${added} new quote(s) added.`);
    } catch (err) {
      console.error("Import failed:", err);
      alert("Failed to import quotes: invalid JSON or structure.");
    }
  };

  reader.onerror = function () {
    console.error("File read error", reader.error);
    alert("Could not read the file.");
  };

  reader.readAsText(file);
}

/* -------------------------
   createAddQuoteForm - dynamically builds add-quote + import/export UI
   ------------------------- */
function createAddQuoteForm(targetContainerId = "staticFormPlaceholder") {
  // Avoid duplicate
  if (document.getElementById("addQuoteContainer")) return;

  const parent = document.getElementById(targetContainerId) || document.body;

  const container = document.createElement("div");
  container.id = "addQuoteContainer";
  container.className = "form-section";

  // heading
  const h3 = document.createElement("h3");
  h3.textContent = "Add a New Quote";
  container.appendChild(h3);

  // inputs wrapper (to attach small notices)
  const inputsWrap = document.createElement("div");
  inputsWrap.style.display = "inline-block";
  inputsWrap.style.textAlign = "left";

  // quote text
  const quoteInput = document.createElement("input");
  quoteInput.type = "text";
  quoteInput.id = "newQuoteText";
  quoteInput.placeholder = "Enter a new quote";
  quoteInput.style.width = "360px";
  quoteInput.autocomplete = "off";
  inputsWrap.appendChild(quoteInput);

  // category
  const categoryInput = document.createElement("input");
  categoryInput.type = "text";
  categoryInput.id = "newQuoteCategory";
  categoryInput.placeholder = "Enter quote category";
  categoryInput.style.width = "220px";
  categoryInput.autocomplete = "off";
  inputsWrap.appendChild(categoryInput);

  // add button
  const addBtn = document.createElement("button");
  addBtn.id = "addQuoteBtn";
  addBtn.type = "button";
  addBtn.textContent = "Add Quote";
  addBtn.addEventListener("click", addQuoteFromInputs);
  inputsWrap.appendChild(addBtn);

  // allow Enter to submit when focused on inputs
  [quoteInput, categoryInput].forEach((el) =>
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addQuoteFromInputs();
    })
  );

  container.appendChild(inputsWrap);

  // --- import / export controls ---
  const ieWrap = document.createElement("div");
  ieWrap.style.marginTop = "12px";

  const exportBtn = document.createElement("button");
  exportBtn.id = "exportBtn";
  exportBtn.textContent = "Export Quotes (JSON)";
  exportBtn.addEventListener("click", exportQuotesToJson);
  ieWrap.appendChild(exportBtn);

  const importLabel = document.createElement("label");
  importLabel.className = "small";
  importLabel.textContent = " Import JSON: ";
  ieWrap.appendChild(importLabel);

  const importFile = document.createElement("input");
  importFile.type = "file";
  importFile.id = "importFile";
  importFile.accept = ".json,application/json";
  importFile.addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) importFromJsonFile(f);
    // reset input so same file can be chosen again if needed
    e.target.value = "";
  });
  ieWrap.appendChild(importFile);

  container.appendChild(ieWrap);

  // append
  parent.appendChild(container);
}

// Wire static buttons to functions if they exist
const exportBtn = document.getElementById("exportBtn");
if (exportBtn) exportBtn.addEventListener("click", exportQuotesToJson);

const importFile = document.getElementById("importFile");
if (importFile) {
  importFile.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) importFromJsonFile(file);
    e.target.value = ""; // reset input
  });
}

/* -------------------------
   Initialization
   ------------------------- */
(function init() {
  // load from localStorage if available (overrides defaults)
  loadQuotes();

  // create form UI if not present
  createAddQuoteForm();

  // wire existing/expected UI controls
  if (newQuoteBtn) {
    newQuoteBtn.addEventListener("click", showRandomQuote);
  }
  if (categorySelect) {
    categorySelect.addEventListener("change", showRandomQuote);
  }

  // populate categories
  populateCategories();

  // If there's a last viewed quote in session storage, show it first
  const last = loadLastViewedQuote();
  if (
    last &&
    typeof last.text === "string" &&
    typeof last.category === "string"
  ) {
    quoteDisplay.textContent = `"${last.text}" — ${last.category}`;
  } else {
    // otherwise show a random quote on load
    showRandomQuote();
  }

  // ensure quotes persist immediately (persist defaults if LS empty)
  saveQuotes();
})();
