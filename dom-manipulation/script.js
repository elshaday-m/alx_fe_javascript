// script.js

// Initial quote data
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

// Select DOM elements that exist in the page
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categorySelect = document.getElementById("categorySelect");

// Helper: populate category dropdown with unique categories
function populateCategories() {
  const categories = [...new Set(quotes.map((q) => q.category))];
  // If there are no categories yet, add a placeholder option
  categorySelect.innerHTML = "";
  if (categories.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No categories";
    categorySelect.appendChild(opt);
    return;
  }

  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

// Show a random quote from the selected category
function showRandomQuote() {
  const selectedCategory = categorySelect.value;
  const filteredQuotes = quotes.filter((q) => q.category === selectedCategory);

  if (!selectedCategory || filteredQuotes.length === 0) {
    // If nothing selected or no quotes in that category, show a random from all quotes
    if (quotes.length === 0) {
      quoteDisplay.textContent = "No quotes available.";
      return;
    }
    const randomAll = quotes[Math.floor(Math.random() * quotes.length)];
    quoteDisplay.textContent = `"${randomAll.text}" — ${randomAll.category}`;
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];
  quoteDisplay.textContent = `"${randomQuote.text}" — ${randomQuote.category}`;
}

// Add a new quote (reads inputs by id: newQuoteText, newQuoteCategory)
function addQuote() {
  const newTextInput = document.getElementById("newQuoteText");
  const newCategoryInput = document.getElementById("newQuoteCategory");

  // If inputs are missing, try to find them inside a generated form container
  if (!newTextInput || !newCategoryInput) {
    alert(
      "Add-quote form not found. Please ensure the form is present in the DOM."
    );
    return;
  }

  const newText = newTextInput.value.trim();
  const newCategory = newCategoryInput.value.trim();

  if (!newText || !newCategory) {
    alert("Please enter both a quote and a category!");
    return;
  }

  // Add new quote to the array
  quotes.push({ text: newText, category: newCategory });

  // Update category dropdown dynamically and keep the newly added category selected
  populateCategories();
  categorySelect.value = newCategory;

  // Clear inputs
  newTextInput.value = "";
  newCategoryInput.value = "";

  // Immediately show the newly added quote
  showRandomQuote();

  // Optionally show a short confirmation
  // (if you prefer no alerts, remove the next line)
  alert("Quote added successfully!");
}

// createAddQuoteForm - dynamically creates the add-quote UI and wires it up
function createAddQuoteForm(targetContainerId = null) {
  // Avoid creating duplicate forms
  if (document.getElementById("addQuoteContainer")) {
    return; // form already exists
  }

  // Decide where to attach the form. If a container id was passed and exists, use it.
  // Otherwise append to the body after the quoteDisplay
  let parent;
  if (targetContainerId) {
    const candidate = document.getElementById(targetContainerId);
    parent = candidate || document.body;
  } else {
    parent = document.body;
  }

  // create container
  const container = document.createElement("div");
  container.id = "addQuoteContainer";
  container.className = "form-section";
  container.style.marginTop = "1.5rem";
  container.style.textAlign = "center";

  // heading
  const h3 = document.createElement("h3");
  h3.textContent = "Add a New Quote";
  container.appendChild(h3);

  // input: quote text
  const quoteInput = document.createElement("input");
  quoteInput.type = "text";
  quoteInput.id = "newQuoteText";
  quoteInput.placeholder = "Enter a new quote";
  quoteInput.style.padding = "0.5rem";
  quoteInput.style.margin = "0.3rem";
  quoteInput.style.width = "300px";
  container.appendChild(quoteInput);

  // input: quote category
  const categoryInput = document.createElement("input");
  categoryInput.type = "text";
  categoryInput.id = "newQuoteCategory";
  categoryInput.placeholder = "Enter quote category";
  categoryInput.style.padding = "0.5rem";
  categoryInput.style.margin = "0.3rem";
  categoryInput.style.width = "200px";
  container.appendChild(categoryInput);

  // add button
  const addBtn = document.createElement("button");
  addBtn.id = "addQuoteBtn";
  addBtn.textContent = "Add Quote";
  addBtn.style.padding = "0.5rem 1rem";
  addBtn.style.marginLeft = "0.5rem";
  addBtn.style.cursor = "pointer";
  container.appendChild(addBtn);

  // append the container right after the quoteDisplay if possible
  const quoteDisplayElem = document.getElementById("quoteDisplay");
  if (quoteDisplayElem && quoteDisplayElem.parentNode) {
    quoteDisplayElem.parentNode.insertBefore(
      container,
      quoteDisplayElem.nextSibling
    );
  } else {
    parent.appendChild(container);
  }

  // wire button to addQuote
  addBtn.addEventListener("click", addQuote);

  // Also allow pressing Enter inside the quote input to add the quote
  quoteInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      addQuote();
    }
  });
  categoryInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      addQuote();
    }
  });
}

// wire up existing buttons and initialize
if (newQuoteBtn) {
  newQuoteBtn.addEventListener("click", showRandomQuote);
}

// create add-quote form dynamically if not already present in HTML
createAddQuoteForm(); // call with an id string if you want it attached elsewhere

// initialize categories and display
populateCategories();

// if there is at least one category, select the first one and show a quote
if (categorySelect.options.length > 0) {
  categorySelect.selectedIndex = 0;
}
showRandomQuote();
