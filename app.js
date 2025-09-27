// Load products & control rules
let allProducts = [];
let controlRules = {};

const productsGrid = document.getElementById("products-grid");
const searchInput = document.querySelector(".search-input");
const downloadModal = document.querySelector(".download-modal");
const downloadBtnModal = document.querySelector(".download-btn-modal");
const closeDownload = document.querySelector(".close-download");
const downloadTitle = document.querySelector(".download-title");

// Load JSON data
async function loadData() {
  const productsRes = await fetch("products.json");
  const controlsRes = await fetch("controls.json");

  const products = await productsRes.json();
  controlRules = await controlsRes.json();

  // Apply control rules
  allProducts = applyControls(products);
  renderProducts(allProducts);
}

// Apply rules: delete, block, pin-to-top
function applyControls(products) {
  let result = [...products];

  // Remove deleted
  if (controlRules.delete) {
    result = result.filter(p => !controlRules.delete.includes(p.id));
  }

  // Blocked items → mark as blocked
  if (controlRules.block) {
    result = result.map(p =>
      controlRules.block.includes(p.id) ? { ...p, blocked: true } : p
    );
  }

  // Sort pinned items to top
  if (controlRules.pinTop) {
    result.sort((a, b) => {
      if (controlRules.pinTop.includes(a.id)) return -1;
      if (controlRules.pinTop.includes(b.id)) return 1;
      return new Date(b.releaseDate) - new Date(a.releaseDate);
    });
  } else {
    result.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
  }

  return result;
}

// Render products
function renderProducts(products) {
  productsGrid.innerHTML = "";

  if (!products.length) {
    productsGrid.innerHTML = `<div class="no-results"><i class="fas fa-search"></i><h3>No products found</h3></div>`;
    return;
  }

  products.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";

    let description = product.blocked
      ? "<em>Blocked by admin</em>"
      : product.description;

    card.innerHTML = `
      <div class="product-image"><i class="${product.icon}"></i></div>
      <h3 class="product-title">${product.name}</h3>
      <div class="product-id">ID: ${product.id}</div>
      <div class="product-date">${new Date(product.releaseDate).toLocaleDateString()}</div>
      <p class="product-description">${description}</p>
      ${
        product.blocked
          ? `<button class="download-btn" disabled><i class="fas fa-ban"></i> Blocked</button>`
          : `<button class="download-btn"><i class="fas fa-download"></i> Download</button>`
      }
    `;

    if (!product.blocked) {
      card.querySelector(".download-btn").addEventListener("click", () =>
        showDownloadModal(product)
      );
    }

    productsGrid.appendChild(card);
  });
}

// Modal functions
function showDownloadModal(product) {
  downloadTitle.textContent = `Download ${product.name}`;
  downloadModal.style.display = "flex";
}

// Search
searchInput.addEventListener("input", () =>
  filterProducts(searchInput.value.toLowerCase())
);

function filterProducts(term) {
  if (!term) return renderProducts(allProducts);
  const results = allProducts.filter(p =>
    [p.name, p.description, p.id].some(v => v.toLowerCase().includes(term))
  );
  renderProducts(results);
}

// Modal controls
downloadBtnModal.addEventListener("click", () => {
  alert("Download started (demo)");
  downloadModal.style.display = "none";
});
closeDownload.addEventListener("click", () => (downloadModal.style.display = "none"));

// Init
loadData();