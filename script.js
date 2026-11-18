/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineButton = document.getElementById("generateRoutine");
const clearSelectionsButton = document.getElementById("clearSelections");
const productSearch = document.getElementById("productSearch");
const directionToggle = document.getElementById("directionToggle");

// Store AI messages and user messages to maintain conversation context.
let messages = [
  {
    role: "system",
    content:
      "You are a L'Oréal beauty advisor. You may create, change, or explain beauty routines using L'Oréal skincare, haircare, makeup, or fragrance products. You may also answer follow-up questions about the user's current routine and selected products. Requests to generate a new routine are allowed whenever the user provides L'Oréal products, even if they are different from products used in a previous routine. Base routine advice primarily on the selected products. Use current web information only when helpful and include authoritative source links or citations. Keep responses concise, clear, and accurate. Do not fabricate information or give medical advice. Do not answer unrelated questions outside L'Oréal beauty and skincare topics.",
  },
];

let allProducts = [];
let selectedProductIds = loadSavedSelections();

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Loading products...
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Load saved product IDs, keeping only valid numeric IDs */
function loadSavedSelections() {
  try {
    const savedIds = JSON.parse(localStorage.getItem("selectedL'OrealProducts")) || [];
    return new Set(savedIds.map((id) => Number(id)));
  } catch (error) {
    return new Set();
  }
}

/* Save the current selections so they remain after a page reload */
function saveSelections() {
  localStorage.setItem(
    "selectedL'OrealProducts",
    JSON.stringify([...selectedProductIds])
  );
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map((product) => {
      const isSelected = selectedProductIds.has(product.id);
      return `
        <article class="product-card ${isSelected ? "selected" : ""}"
          data-product-id="${product.id}"
          tabindex="0"
          role="button"
          aria-pressed="${isSelected}"
          aria-label="${isSelected ? "Unselect" : "Select"} ${product.name}">
          <img src="${product.image}" alt="${product.name}">
          <div class="product-info">
            <span class="selection-check" aria-hidden="true">
              <i class="fa-solid fa-check"></i>
            </span>
            <h3>${product.name}</h3>
            <p class="product-brand">${product.brand}</p>
            <button class="description-btn" type="button"
              aria-expanded="false" aria-controls="description-${product.id}">
              View details
            </button>
            <p class="product-description" id="description-${product.id}">
              ${product.description}
            </p>
          </div>
        </article>
      `;
    })
    .join("");
}

/* Update the selected-products list and card highlights */
function updateSelectedProducts() {
  const selectedProducts = allProducts.filter((product) =>
    selectedProductIds.has(product.id)
  );

  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML =
      '<p class="empty-selection">No products selected yet.</p>';
  } else {
    selectedProductsList.innerHTML = selectedProducts
      .map(
        (product) => `
          <div class="selected-item">
            <span>${product.name}</span>
            <button type="button" class="remove-selected"
              data-product-id="${product.id}"
              aria-label="Remove ${product.name}">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
        `
      )
      .join("");
  }

  clearSelectionsButton.hidden = selectedProducts.length === 0;

  document.querySelectorAll(".product-card").forEach((card) => {
    const productId = Number(card.dataset.productId);
    const isSelected = selectedProductIds.has(productId);
    card.classList.toggle("selected", isSelected);
    card.setAttribute("aria-pressed", String(isSelected));

    const product = allProducts.find((item) => item.id === productId);
    card.setAttribute(
      "aria-label",
      `${isSelected ? "Unselect" : "Select"} ${product ? product.name : "product"}`
    );
  });

  saveSelections();
}

/* Add or remove a product when its card is activated */
function toggleProduct(productId) {
  if (selectedProductIds.has(productId)) {
    selectedProductIds.delete(productId);
  } else {
    selectedProductIds.add(productId);
  }
  updateSelectedProducts();
}

/* Load products once and restore any saved selections */
async function initializeProducts() {
  allProducts = await loadProducts();
  displayProducts(allProducts);
  updateSelectedProducts();
}

initializeProducts();

/* Combine category and keyword filters as the user browses */
function filterProducts() {
  const selectedCategory = categoryFilter.value;
  const keyword = productSearch.value.trim().toLowerCase();

  const filteredProducts = allProducts.filter((product) => {
    const matchesCategory =
      selectedCategory === "" || product.category === selectedCategory;
    const searchableText =
      `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase();
    return matchesCategory && searchableText.includes(keyword);
  });

  if (filteredProducts.length === 0) {
    productsContainer.innerHTML =
      '<div class="placeholder-message">No products match your search.</div>';
  } else {
    displayProducts(filteredProducts);
  }
}

categoryFilter.addEventListener("change", filterProducts);
productSearch.addEventListener("input", filterProducts);

/* Toggle between left-to-right and right-to-left layouts */
function setDirection(direction) {
  document.documentElement.setAttribute("dir", direction);
  document.documentElement.setAttribute("lang", direction === "rtl" ? "ar" : "en");
  localStorage.setItem("lorealLayoutDirection", direction);

  const isRTL = direction === "rtl";
  directionToggle.setAttribute(
    "aria-label",
    isRTL ? "Switch to left-to-right layout" : "Switch to right-to-left layout"
  );
  directionToggle.setAttribute("aria-pressed", String(isRTL));
  directionToggle.querySelector("span").textContent = isRTL ? "LTR" : "RTL";
  directionToggle.querySelector("i").className = isRTL
    ? "fa-solid fa-align-left"
    : "fa-solid fa-align-right";
}

const savedDirection = localStorage.getItem("lorealLayoutDirection");
setDirection(savedDirection === "rtl" ? "rtl" : "ltr");

directionToggle.addEventListener("click", () => {
  const currentDirection = document.documentElement.getAttribute("dir");
  setDirection(currentDirection === "rtl" ? "ltr" : "rtl");
});

/* Handle card selection, keyboard selection, and description toggles */
productsContainer.addEventListener("click", (event) => {
  const descriptionButton = event.target.closest(".description-btn");
  if (descriptionButton) {
    const card = descriptionButton.closest(".product-card");
    const description = card.querySelector(".product-description");
    const isOpen = description.classList.toggle("visible");
    descriptionButton.setAttribute("aria-expanded", String(isOpen));
    descriptionButton.textContent = isOpen ? "Hide details" : "View details";
    return;
  }

  const card = event.target.closest(".product-card");
  if (card) {
    toggleProduct(Number(card.dataset.productId));
  }
});

productsContainer.addEventListener("keydown", (event) => {
  if (event.target.closest(".description-btn")) return;
  const card = event.target.closest(".product-card");
  if (card && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    toggleProduct(Number(card.dataset.productId));
  }
});

/* Allow individual removal and clearing of all saved selections */
selectedProductsList.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-selected");
  if (!removeButton) return;
  selectedProductIds.delete(Number(removeButton.dataset.productId));
  updateSelectedProducts();
});

clearSelectionsButton.addEventListener("click", () => {
  selectedProductIds.clear();
  updateSelectedProducts();
});

/* Render safe links and bold text inside an AI chat message */
function renderInlineText(container, text) {
  const pattern =
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      container.append(document.createTextNode(text.slice(lastIndex, match.index)));
    }

    if (match[1] && match[2]) {
      const link = document.createElement("a");
      link.href = match[2];
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = match[1];
      container.appendChild(link);
    } else if (match[3]) {
      const strong = document.createElement("strong");
      strong.textContent = match[3];
      container.appendChild(strong);
    } else if (match[4]) {
      const link = document.createElement("a");
      link.href = match[4].replace(/[),.;]+$/, "");
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = match[4];
      container.appendChild(link);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    container.append(document.createTextNode(text.slice(lastIndex)));
  }
}

/* Render AI text as paragraphs and Markdown-style headers */
function renderAssistantText(container, content) {
  const lines = content.split(/\r?\n/);

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);

    if (headerMatch) {
      const header = document.createElement(`h${headerMatch[1].length}`);
      header.className = "chat-heading";
      renderInlineText(header, headerMatch[2]);
      container.appendChild(header);
    } else if (trimmedLine === "") {
      container.appendChild(document.createElement("br"));
    } else {
      const paragraph = document.createElement("p");
      renderInlineText(paragraph, line);
      container.appendChild(paragraph);
    }
  });
}

/* Add one chat message to the visible chat window */
function addChatMessage(role, content) {
  const message = document.createElement("div");
  message.className = `chat-message ${role}`;
  if (role === "assistant") {
    renderAssistantText(message, content);
  } else {
    const text = document.createElement("p");
    text.textContent = content;
    message.appendChild(text);
  }
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Send a question or routine request to the Cloudflare Worker */
async function sendToWorker() {
  const response = await fetch(
    "https://improvedloreal.starwars3805.workers.dev/",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages }),
    }
  );

  if (!response.ok) {
    throw new Error("The AI advisor could not be reached.");
  }

  const data = await response.json();

  // The Responses API provides the completed text in data.output_text.
  // If output_text is missing, look through the output items instead.
  let reply = "";

  if (typeof data.output_text === "string") {
    reply = data.output_text;
  } else if (Array.isArray(data.output)) {
    data.output.forEach((item) => {
      if (item.type === "message" && Array.isArray(item.content)) {
        item.content.forEach((part) => {
          if (part.type === "output_text" && typeof part.text === "string") {
            reply += part.text;
          }
        });
      }
    });
  }

  // Keep support for a worker that still returns Chat Completions data.
  if (
    reply === "" &&
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    typeof data.choices[0].message.content === "string"
  ) {
    reply = data.choices[0].message.content;
  }

  if (reply === "") {
    throw new Error("The AI returned an unexpected response.");
  }

  return reply;
}

/* Generate a routine using only the user's selected product data */
generateRoutineButton.addEventListener("click", async () => {
  const selectedProducts = allProducts.filter((product) =>
    selectedProductIds.has(product.id)
  );

  if (selectedProducts.length === 0) {
    addChatMessage("assistant", "Please select at least one product to begin.");
    return;
  }

  generateRoutineButton.disabled = true;
  generateRoutineButton.textContent = "Creating your routine...";
  addChatMessage("assistant", "Creating a personalized routine...");

  const productData = selectedProducts.map((product) => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
  }));

  const prompt =
    "This is a request to create a new personalized beauty routine. " +
    "Use the new set of selected L'Oréal products below, not any previous routine or previous product selection. " +
    "Organize the steps by order of use, explain briefly why each step is useful, " +
    "and include a short tip for safe use. Use current web information when helpful and include links or citations to authoritative sources. Selected products: " +
    JSON.stringify(productData);

  // Reset the conversation before a new routine so old products do not limit
  // the new routine. The first message keeps the L'Oréal advisor instructions.
  messages = [messages[0]];
  messages.push({ role: "user", content: prompt });

  try {
    const reply = await sendToWorker();
    chatWindow.lastElementChild.remove();
    messages.push({ role: "assistant", content: reply });
    addChatMessage("assistant", reply);
  } catch (error) {
    chatWindow.lastElementChild.remove();
    addChatMessage("assistant", error.message);
  } finally {
    generateRoutineButton.disabled = false;
    generateRoutineButton.innerHTML =
      '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Routine';
  }
});

/* Chat form submission handler */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const question = userInput.value.trim();
  if (!question) return;

  addChatMessage("user", question);
  messages.push({ role: "user", content: question });
  userInput.value = "";
  addChatMessage("assistant", "Thinking...");
  const sendButton = document.getElementById("sendBtn");
  sendButton.disabled = true;

  try {
    const reply = await sendToWorker();
    chatWindow.lastElementChild.remove();
    messages.push({ role: "assistant", content: reply });
    addChatMessage("assistant", reply);
  } catch (error) {
    chatWindow.lastElementChild.remove();
    addChatMessage("assistant", error.message);
  } finally {
    sendButton.disabled = false;
  }
});
