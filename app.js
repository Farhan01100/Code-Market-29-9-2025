// Load products & control rules from window.appData
let allProducts = [];
let controlRules = {};
let currentProduct = null;
let filteredProducts = [];

const productsGrid = document.getElementById("products-grid");
const searchInput = document.querySelector(".search-input");
const downloadModal = document.querySelector(".download-modal");
const downloadBtnModal = document.querySelector(".download-btn-modal");
const closeDownload = document.querySelector(".close-download");
const downloadTitle = document.querySelector(".download-title");
const filterButtons = document.querySelectorAll('.filter-btn');

// Theme toggle functionality
const themeToggle = document.querySelector('.theme-toggle');
const mobileToggle = document.querySelector('.mobile-toggle');
const navLinks = document.querySelector('.nav-links');

// Mobile menu toggle
mobileToggle.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

// Theme toggle
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('alt');
  const icon = themeToggle.querySelector('i');
  if (document.body.classList.contains('alt')) {
    icon.className = 'fas fa-sun';
  } else {
    icon.className = 'fas fa-moon';
  }
});

// Filter functionality
filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Update active button
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    // Filter products
    const filter = button.dataset.filter;
    filterProductsByType(filter);
  });
});

// Load data from data-loader.js
function loadData() {
  controlRules = window.appData.controls;
  allProducts = applyControls(window.appData.products);
  filteredProducts = [...allProducts];
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

// Filter products by type
function filterProductsByType(type) {
  if (type === 'all') {
    filteredProducts = [...allProducts];
  } else {
    filteredProducts = allProducts.filter(product => product.type === type);
  }
  renderProducts(filteredProducts);
}

// Render products
function renderProducts(products) {
  productsGrid.innerHTML = "";

  if (!products.length) {
    productsGrid.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search"></i>
        <h3>No products found</h3>
        <p>Try adjusting your search or filter criteria</p>
      </div>`;
    return;
  }

  products.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.setAttribute('data-type', product.type);

    let description = product.blocked
      ? "<em>Blocked by admin</em>"
      : product.description;

    // Get appropriate icon based on type
    let typeIcon = 'fas fa-code';
    if (product.type === 'css-library') typeIcon = 'fas fa-palette';
    if (product.type === 'js-library') typeIcon = 'fas fa-cube';
    if (product.type === 'python-module') typeIcon = 'fab fa-python';
    if (product.type === 'java-code') typeIcon = 'fab fa-java';

    card.innerHTML = `
      <div class="product-image"><i class="${product.icon}"></i></div>
      <h3 class="product-title">${product.name}</h3>
      <div class="product-type ${product.type}">
        <i class="${typeIcon}"></i> ${getTypeDisplayName(product.type)}
      </div>
      <div class="product-id">ID: ${product.id}</div>
      <div class="product-date">${new Date(product.releaseDate).toLocaleDateString()}</div>
      <p class="product-description">${description}</p>
      ${
        product.blocked
          ? `<button class="download-btn" disabled><i class="fas fa-ban"></i> Blocked</button>`
          : `<button class="download-btn"><i class="fas fa-code"></i> View Code</button>`
      }
    `;

    if (!product.blocked) {
      card.querySelector(".download-btn").addEventListener("click", () =>
        showCodeModal(product)
      );
    }

    productsGrid.appendChild(card);
  });
}

// Get display name for product type
function getTypeDisplayName(type) {
  const typeMap = {
    'es6-module': 'ES6 Module',
    'css-library': 'CSS Library',
    'js-library': 'JS Library',
    'python-module': 'Python Module',
    'java-code': 'Java Code'
  };
  return typeMap[type] || type;
}

// Get file extension for product type
function getFileExtension(type, language) {
  const extensionMap = {
    'javascript': 'js',
    'css': 'css',
    'python': 'py',
    'java': 'java'
  };
  return extensionMap[language] || 'txt';
}

// Show code modal instead of download modal
function showCodeModal(product) {
  currentProduct = product;
  downloadTitle.textContent = `${product.name} - Source Code`;
  
  // Update modal content for code viewing
  const downloadText = document.querySelector('.download-text');
  const downloadIcon = document.querySelector('.download-icon i');
  const downloadBtn = document.querySelector('.download-btn-modal');
  
  downloadIcon.className = product.icon;
  downloadText.innerHTML = `You can copy the code below or download it as a <strong>${product.id.toLowerCase()}.${getFileExtension(product.type, product.language)}</strong> file.`;
  downloadBtn.innerHTML = `<i class="fas fa-download"></i> Download ${getFileExtension(product.type, product.language).toUpperCase()} File`;
  
  // Create code display area if it doesn't exist
  let codeContainer = document.querySelector('.code-container');
  if (!codeContainer) {
    codeContainer = document.createElement('div');
    codeContainer.className = 'code-container';
    document.querySelector('.download-header').after(codeContainer);
  }
  
  // Calculate file size
  const fileSize = new Blob([product.code]).size;
  const fileSizeKB = (fileSize / 1024).toFixed(2);
  
  codeContainer.innerHTML = `
    <div class="code-header">
      <span>${product.id}.${getFileExtension(product.type, product.language)}
        <span class="language-badge ${product.language}">${product.language}</span>
      </span>
      <button class="copy-code-btn"><i class="fas fa-copy"></i> Copy Code</button>
    </div>
    <div class="code-display">
      <pre><code class="language-${product.language}">${escapeHtml(product.code)}</code></pre>
    </div>
    <div class="file-info">
      <i class="fas fa-info-circle"></i> File size: ${fileSizeKB} KB | Lines: ${product.code.split('\n').length}
    </div>
  `;
  
  // Add copy functionality
  const copyBtn = codeContainer.querySelector('.copy-code-btn');
  copyBtn.addEventListener('click', () => copyCodeToClipboard(product.code, copyBtn));
  
  // Highlight syntax with Prism
  Prism.highlightAllUnder(codeContainer);
  
  downloadModal.style.display = "flex";
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Copy code to clipboard
async function copyCodeToClipboard(code, button) {
  try {
    await navigator.clipboard.writeText(code);
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    button.classList.add('copied');
    
    setTimeout(() => {
      button.innerHTML = '<i class="fas fa-copy"></i> Copy Code';
      button.classList.remove('copied');
    }, 2000);
  } catch (err) {
    console.error('Failed to copy code: ', err);
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = code;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      button.innerHTML = '<i class="fas fa-check"></i> Copied!';
      button.classList.add('copied');
      
      setTimeout(() => {
        button.innerHTML = '<i class="fas fa-copy"></i> Copy Code';
        button.classList.remove('copied');
      }, 2000);
    } catch (fallbackErr) {
      alert('Failed to copy code to clipboard. Please select and copy manually.');
    }
    document.body.removeChild(textArea);
  }
}

// Download code as file
function downloadCodeAsFile(code, filename, extension) {
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename.toLowerCase()}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Search functionality
searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();
  filterProducts(term);
});

function filterProducts(term) {
  if (!term) {
    filteredProducts = [...allProducts];
  } else {
    filteredProducts = allProducts.filter(p =>
      [p.name, p.description, p.id, p.type].some(v => 
        v && v.toString().toLowerCase().includes(term)
      )
    );
  }
  
  // Apply active filter if any
  const activeFilter = document.querySelector('.filter-btn.active');
  if (activeFilter && activeFilter.dataset.filter !== 'all') {
    filteredProducts = filteredProducts.filter(
      product => product.type === activeFilter.dataset.filter
    );
  }
  
  renderProducts(filteredProducts);
}

// Modal controls
downloadBtnModal.addEventListener("click", () => {
  if (currentProduct) {
    downloadCodeAsFile(
      currentProduct.code, 
      currentProduct.id, 
      getFileExtension(currentProduct.type, currentProduct.language)
    );
  }
});

closeDownload.addEventListener("click", () => {
  downloadModal.style.display = "none";
  currentProduct = null;
});

// Close modal when clicking outside
downloadModal.addEventListener('click', (e) => {
  if (e.target === downloadModal) {
    downloadModal.style.display = 'none';
    currentProduct = null;
  }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && downloadModal.style.display === 'flex') {
    downloadModal.style.display = 'none';
    currentProduct = null;
  }
});

// Initialize the app
loadData();