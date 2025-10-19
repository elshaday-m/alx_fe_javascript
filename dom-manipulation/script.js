// ------------------------
// Storage keys & server
// ------------------------
const LS_QUOTES_KEY = "dqg_quotes_v1";
const LS_FILTER_KEY = "dqg_last_filter_v1";
const SS_LAST_QUOTE_KEY = "dqg_last_viewed_v1";
const SERVER_API = "https://jsonplaceholder.typicode.com/posts"; // mock server

// ------------------------
// Quotes array
// ------------------------
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

// ------------------------
// DOM elements
// ------------------------
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const syncBtn = document.getElementById("syncBtn");

// ------------------------
// LocalStorage helpers
// ------------------------
function saveQuotes() {
  localStorage.setItem(LS_QUOTES_KEY, JSON.stringify(quotes));
}
function loadQuotes() {
  const raw = localStorage.getItem(LS_QUOTES_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) quotes = parsed;
  }
}

// ------------------------
// Category filtering
// ------------------------
function populateCategories() {
  const cats = [...new Set(quotes.map((q) => q.category))].sort();
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  cats.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });

  const lastFilter = localStorage.getItem(LS_FILTER_KEY) || "all";
  categoryFilter.value = cats.includes(lastFilter) ? lastFilter : "all";
}

function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  let pool =
    selectedCategory === "all"
      ? quotes
      : quotes.filter((q) => q.category === selectedCategory);

  if (pool.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }

  const q = pool[Math.floor(Math.random() * pool.length)];
  quoteDisplay.textContent = `"${q.text}" — ${q.category}`;
  sessionStorage.setItem(SS_LAST_QUOTE_KEY, JSON.stringify(q));
}

function filterQuotes() {
  localStorage.setItem(LS_FILTER_KEY, categoryFilter.value);
  showRandomQuote();
}

// ------------------------
// Add quote
// ------------------------
function addQuoteFromInputs() {
  const textInput = document.getElementById("newQuoteText");
  const catInput = document.getElementById("newQuoteCategory");
  const text = textInput.value.trim();
  const category = catInput.value.trim() || "Uncategorized";
  if (!text) return alert("Enter a quote text.");

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  categoryFilter.value = category;
  showRandomQuote();
  textInput.value = "";
  catInput.value = "";
}

// ------------------------
// JSON import/export
// ------------------------
function exportQuotesToJson() {
  const json = JSON.stringify(quotes, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const now = new Date();
  a.download = `quotes-${now.getFullYear()}${String(
    now.getMonth() + 1
  ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(file) {
  if (!file) return alert("No file selected.");
  const reader = new FileReader();
  reader.onload = function (evt) {
    try {
      const imported = JSON.parse(evt.target.result).filter(
        (q) => q.text && q.category
      );
      const existingKeys = new Set(
        quotes.map((q) => `${q.text}|||${q.category}`)
      );
      let added = 0;
      imported.forEach((q) => {
        const key = `${q.text}|||${q.category}`;
        if (!existingKeys.has(key)) {
          quotes.push(q);
          existingKeys.add(key);
          added++;
        }
      });
      saveQuotes();
      populateCategories();
      alert(`Import complete. ${added} new quote(s) added.`);
    } catch {
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
}

// ------------------------
// Create add-quote form dynamically
// ------------------------
function createAddQuoteForm(targetId = "staticFormPlaceholder") {
  if (document.getElementById("addQuoteContainer")) return;
  const parent = document.getElementById(targetId) || document.body;
  const container = document.createElement("div");
  container.id = "addQuoteContainer";
  container.className = "form-section";

  const h3 = document.createElement("h3");
  h3.textContent = "Add a New Quote";
  container.appendChild(h3);

  const inputsWrap = document.createElement("div");
  inputsWrap.style.display = "inline-block";
  inputsWrap.style.textAlign = "left";

  const quoteInput = document.createElement("input");
  quoteInput.type = "text";
  quoteInput.id = "newQuoteText";
  quoteInput.placeholder = "Enter a new quote";
  inputsWrap.appendChild(quoteInput);

  const categoryInput = document.createElement("input");
  categoryInput.type = "text";
  categoryInput.id = "newQuoteCategory";
  categoryInput.placeholder = "Enter quote category";
  inputsWrap.appendChild(categoryInput);

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.textContent = "Add Quote";
  addBtn.addEventListener("click", addQuoteFromInputs);
  inputsWrap.appendChild(addBtn);

  [quoteInput, categoryInput].forEach((el) =>
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addQuoteFromInputs();
    })
  );
  container.appendChild(inputsWrap);

  // import/export
  const ieWrap = document.createElement("div");
  ieWrap.style.marginTop = "12px";

  const exportBtn = document.createElement("button");
  exportBtn.textContent = "Export Quotes (JSON)";
  exportBtn.addEventListener("click", exportQuotesToJson);
  ieWrap.appendChild(exportBtn);

  const importLabel = document.createElement("label");
  importLabel.className = "small";
  importLabel.textContent = " Import JSON: ";
  ieWrap.appendChild(importLabel);

  const importFile = document.createElement("input");
  importFile.type = "file";
  importFile.accept = ".json,application/json";
  importFile.addEventListener("change", (e) => {
    if (e.target.files[0]) importFromJsonFile(e.target.files[0]);
    e.target.value = "";
  });
  ieWrap.appendChild(importFile);

  container.appendChild(ieWrap);
  parent.appendChild(container);
}

// ------------------------
// Server syncing
// ------------------------
async function fetchServerQuotes() {
  try {
    const res = await fetch(SERVER_API);
    if (!res.ok) throw new Error("Server fetch failed");
    const data = await res.json();
    return data.map((post) => ({
      text: post.body,
      category: post.title,
      id: post.id,
    }));
  } catch {
    return [];
  }
}

async function syncLocalWithServer() {
  const serverQuotes = await fetchServerQuotes();
  if (!serverQuotes.length) return;
  let conflictsResolved = 0;
  const localKeys = new Set(quotes.map((q) => `${q.text}|||${q.category}`));

  serverQuotes.forEach((sq) => {
    const key = `${sq.text}|||${sq.category}`;
    if (!localKeys.has(key)) {
      quotes.push({ text: sq.text, category: sq.category });
      localKeys.add(key);
      conflictsResolved++;
    }
  });

  saveQuotes();
  populateCategories();
  if (conflictsResolved) {
    alert(`${conflictsResolved} new quote(s) synced from server.`);
    showRandomQuote();
  }
}

// ------------------------
// Initialization
// ------------------------
(function init() {
  loadQuotes();
  createAddQuoteForm();
  populateCategories();

  const lastQuote = JSON.parse(
    sessionStorage.getItem(SS_LAST_QUOTE_KEY) || "null"
  );
  if (lastQuote)
    quoteDisplay.textContent = `"${lastQuote.text}" — ${lastQuote.category}`;
  else showRandomQuote();

  if (newQuoteBtn) newQuoteBtn.addEventListener("click", showRandomQuote);
  if (syncBtn) syncBtn.addEventListener("click", syncLocalWithServer);

  // automatic periodic sync every 30 seconds
  setInterval(syncLocalWithServer, 30000);

  saveQuotes();
})();
