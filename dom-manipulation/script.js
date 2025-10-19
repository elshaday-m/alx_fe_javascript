// ------------------------
// Storage keys
// ------------------------
const LS_QUOTES_KEY = "dqg_quotes_v1";
const LS_FILTER_KEY = "dqg_last_filter_v1"; // store last selected filter in localStorage
const SS_LAST_QUOTE_KEY = "dqg_last_viewed_v1";

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

// ------------------------
// Load/Save quotes from localStorage
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
// Filter functions
// ------------------------
function populateCategories() {
  // get unique categories
  const cats = [...new Set(quotes.map((q) => q.category))].sort();

  // clear previous options except "all"
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  cats.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });

  // restore last selected filter
  const lastFilter = localStorage.getItem(LS_FILTER_KEY) || "all";
  categoryFilter.value = cats.includes(lastFilter) ? lastFilter : "all";
}

// Show random quote within selected category filter
function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  let pool = quotes;
  if (selectedCategory !== "all") {
    pool = quotes.filter((q) => q.category === selectedCategory);
  }

  if (pool.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }

  const q = pool[Math.floor(Math.random() * pool.length)];
  quoteDisplay.textContent = `"${q.text}" — ${q.category}`;

  // save last quote in sessionStorage
  sessionStorage.setItem(SS_LAST_QUOTE_KEY, JSON.stringify(q));
}

// Filter quotes (can be called on change)
function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  // save selected filter to localStorage
  localStorage.setItem(LS_FILTER_KEY, selectedCategory);
  // update displayed quote
  showRandomQuote();
}

// ------------------------
// Add a quote (existing function adapted)
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
  categoryFilter.value = category; // select newly added category
  showRandomQuote();
  textInput.value = "";
  catInput.value = "";
}

// ------------------------
// Initialization
// ------------------------
(function init() {
  loadQuotes();
  populateCategories();

  // load last viewed quote if available
  const lastQuote = JSON.parse(
    sessionStorage.getItem(SS_LAST_QUOTE_KEY) || "null"
  );
  if (lastQuote)
    quoteDisplay.textContent = `"${lastQuote.text}" — ${lastQuote.category}`;
  else showRandomQuote();

  // wire events
  if (newQuoteBtn) newQuoteBtn.addEventListener("click", showRandomQuote);
})();
