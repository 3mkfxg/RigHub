/* =====================================================================
   PC COMPONENTS Storefront JS Logic - Real-Time Search & Compare Engine
   ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // STATE MANAGEMENT
    let allProducts = [];
    let filteredProducts = [];
    let comparedProducts = [];

    let currentPage = 1;
    const itemsPerPage = 12;

    let selectedCategory = "all";
    let selectedStores = ["iGeek.jo", "City Center", "Oriental Store", "PC Circle", "Taipei Computer", "MCC Jordan"];
    let stockOnly = false;
    let searchQuery = "";
    let sortBy = "price-asc";

    let dataPriceMin = 0;
    let dataPriceMax = 2500;
    let currentFilterMin = 0;
    let currentFilterMax = 2500;

    // Category details with specific icons mapping
    const CATEGORY_MAP = {
        "Monitor": { label: "Monitors", icon: "fa-desktop" },
        "Monitor Arm": { label: "Monitor Arms", icon: "fa-dolly" },
        "GPU": { label: "Graphics Cards", icon: "fa-server" },
        "Processor": { label: "Processors (CPU)", icon: "fa-microchip" },
        "Motherboard": { label: "Motherboards", icon: "fa-chess-board" },
        "RAM": { label: "Memory (RAM)", icon: "fa-memory" },
        "SSD": { label: "SSDs (M.2/SATA)", icon: "fa-database" },
        "Hard Disk": { label: "Hard Disks (HDD)", icon: "fa-hdd" },
        "Case": { label: "PC Cases", icon: "fa-box" },
        "PSU": { label: "Power Supplies", icon: "fa-plug" },
        "Fan": { label: "Fans & Coolers", icon: "fa-fan" }
    };

    // DOM ELEMENTS
    const gridContainer = document.getElementById("products-catalog-grid");
    const paginationPanel = document.getElementById("pagination-panel");
    const searchInput = document.getElementById("search-input");
    const btnClearSearch = document.getElementById("btn-clear-search");
    const storeFilters = document.querySelectorAll(".store-filter");
    const categoryFilterList = document.getElementById("category-filter-list");
    const priceMinInput = document.getElementById("price-min");
    const priceMaxInput = document.getElementById("price-max");
    const sliderMin = document.getElementById("slider-min");
    const sliderMax = document.getElementById("slider-max");
    const sliderTrack = document.getElementById("slider-track");
    const stockToggle = document.getElementById("stock-only-toggle");
    const sortSelect = document.getElementById("sort-select");
    const btnResetFilters = document.getElementById("btn-reset-filters");

    // Stats elements
    const statTotal = document.getElementById("stat-total-products");
    const statIgeek = document.getElementById("stat-igeek-count");
    const statCity = document.getElementById("stat-city-count");
    const statOsjo = document.getElementById("stat-osjo-count");
    const resultsCountText = document.getElementById("results-count-text");
    const activeChipsContainer = document.getElementById("active-chips-container");

    // Compare UI elements
    const compareTray = document.getElementById("compare-tray");
    const compareTrayToggle = document.getElementById("compare-tray-toggle");
    const trayChevron = document.getElementById("tray-chevron");
    const compareSlots = document.getElementById("compare-slots");
    const btnTriggerCompare = document.getElementById("btn-trigger-compare");
    const btnClearCompareAll = document.getElementById("btn-clear-compare-all");
    const compareCountBadge = document.getElementById("compare-count");

    // Compare Modal elements
    const compareModal = document.getElementById("compare-modal");
    const btnCloseCompareModal = document.getElementById("btn-close-compare-modal");

    // ================= 1. INITIAL LOADING & METADATA COMPILATION =================
    async function loadProductCatalog() {
        try {
            let response;
            try {
                // Try current directory first (JSON database)
                response = await fetch("products.json");
                if (!response.ok) throw new Error("Not found in current folder");
            } catch (e) {
                // Fall back to parent directory (JSON database)
                response = await fetch("../web/products.json");
                if (!response.ok) {
                    response = await fetch("web/products.json");
                    if (!response.ok) {
                        throw new Error("Could not find 'products.json' in current or fallback folders.");
                    }
                }
            }

            const sheetData = await response.json();

            // Clean up fields and parse prices
            allProducts = sheetData.map(p => {
                // Default missing structural fields
                if (!p["Component Type"]) p["Component Type"] = "Unknown";
                if (!p["Status"]) p["Status"] = "In Stock";
                if (!p["Image URL"]) p["Image URL"] = "";

                // Map attributes dynamically
                p.price_val = p.price_val || 0.0;
                p.screen_size = p.screen_size || null;
                p.refresh_rate = p.refresh_rate || null;
                p.response_time = p.response_time || null;
                p.arms_supported = p.arms_supported || null;
                p.weight_support = p.weight_support || null;

                if (CATEGORY_MAP[p["Component Type"]]) {
                    p.category_key = p["Component Type"];
                } else {
                    p.category_key = "Unknown";
                }
                return p;
            });

            console.log(`Loaded ${allProducts.length} items successfully from JSON.`);

            compileMetadata();
            initializeFilterUI();
            applyFiltersAndSorting();

        } catch (error) {
            console.error("Initialization Error: ", error);
            gridContainer.innerHTML = `
                <div class="catalog-empty-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <h3>Data Sync Error</h3>
                    <p>${error.message}</p>
                    <p style="font-size:0.85rem;color:var(--text-muted);">Please make sure you have placed and exported 'products.json' in your web directory.</p>
                </div>
            `;
        }
    }

    function compileMetadata() {
        // Compile counts
        let countIgeek = 0;
        let countCity = 0;
        let countOsjo = 0;
        let countPcCircle = 0;
        let countTaipei = 0;
        let countMcc = 0;

        let minPrice = Infinity;
        let maxPrice = -Infinity;

        allProducts.forEach(p => {
            // Count per store
            const store = p["Website Name"];
            if (store === "iGeek.jo") countIgeek++;
            else if (store === "City Center") countCity++;
            else if (store === "Oriental Store") countOsjo++;
            else if (store === "PC Circle") countPcCircle++;
            else if (store === "Taipei Computer") countTaipei++;
            else if (store === "MCC Jordan") countMcc++;

            // Min/max prices
            if (p.price_val > 0) {
                if (p.price_val < minPrice) minPrice = p.price_val;
                if (p.price_val > maxPrice) maxPrice = p.price_val;
            }
        });

        dataPriceMin = Math.floor(minPrice === Infinity ? 0 : minPrice);
        dataPriceMax = Math.ceil(maxPrice === -Infinity ? 1000 : maxPrice);
        currentFilterMin = dataPriceMin;
        currentFilterMax = dataPriceMax;

        // Update stats widgets
        statTotal.textContent = allProducts.length.toLocaleString();
        statIgeek.textContent = countIgeek.toLocaleString();
        statCity.textContent = countCity.toLocaleString();
        statOsjo.textContent = countOsjo.toLocaleString();
        
        const badgePcCircle = document.getElementById("stat-pccircle-count");
        const badgeTaipei = document.getElementById("stat-taipei-count");
        const badgeMcc = document.getElementById("stat-mcc-count");
        if (badgePcCircle) badgePcCircle.textContent = countPcCircle.toLocaleString();
        if (badgeTaipei) badgeTaipei.textContent = countTaipei.toLocaleString();
        if (badgeMcc) badgeMcc.textContent = countMcc.toLocaleString();
    }

    function initializeFilterUI() {
        // 1. Dynamic category grid injection
        let categoryGridHTML = `
            <button class="btn-category active" data-category="all">
                <i class="fa-solid fa-border-all"></i> All Parts
            </button>
        `;

        Object.keys(CATEGORY_MAP).forEach(key => {
            const cat = CATEGORY_MAP[key];
            categoryGridHTML += `
                <button class="btn-category" data-category="${key}">
                    <i class="fa-solid ${cat.icon}"></i> ${cat.label}
                </button>
            `;
        });

        categoryFilterList.innerHTML = categoryGridHTML;

        // Add Category Click Event Listeners
        const categoryButtons = document.querySelectorAll(".btn-category");
        categoryButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                categoryButtons.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                selectedCategory = btn.getAttribute("data-category");
                currentPage = 1;
                applyFiltersAndSorting();
            });
        });

        // 2. Set up Double Price Slider inputs
        priceMinInput.value = dataPriceMin;
        priceMaxInput.value = dataPriceMax;

        sliderMin.min = dataPriceMin;
        sliderMin.max = dataPriceMax;
        sliderMin.value = dataPriceMin;

        sliderMax.min = dataPriceMin;
        sliderMax.max = dataPriceMax;
        sliderMax.value = dataPriceMax;

        updateSliderTrack();
    }

    // ================= 2. FILTERING AND SORTING ACTIONS =================
    function applyFiltersAndSorting() {
        // 1. Apply active filter rules
        filteredProducts = allProducts.filter(p => {
            // Check Store origin
            if (!selectedStores.includes(p["Website Name"])) return false;

            // Check Component Category
            if (selectedCategory !== "all" && p.category_key !== selectedCategory) return false;

            // Check Stock status
            if (stockOnly && p.Status !== "In Stock") return false;

            // Check Price boundaries
            if (p.price_val < currentFilterMin || p.price_val > currentFilterMax) return false;

            // Check Search query
            if (searchQuery) {
                const titleLower = p["Full Name"].toLowerCase();
                const catLower = p["Component Type"].toLowerCase();
                const storeLower = p["Website Name"].toLowerCase();
                const terms = searchQuery.toLowerCase().split(/\s+/);

                // All typed terms must match either name, category, or store
                return terms.every(term =>
                    titleLower.includes(term) ||
                    catLower.includes(term) ||
                    storeLower.includes(term)
                );
            }

            return true;
        });

        // 2. Apply active sorting choice
        if (sortBy === "price-asc") {
            filteredProducts.sort((a, b) => a.price_val - b.price_val);
        } else if (sortBy === "price-desc") {
            filteredProducts.sort((a, b) => b.price_val - a.price_val);
        } else if (sortBy === "name-asc") {
            filteredProducts.sort((a, b) => a["Full Name"].localeCompare(b["Full Name"]));
        } else if (sortBy === "category") {
            filteredProducts.sort((a, b) => a.category_key.localeCompare(b.category_key));
        }

        // 3. Update Result widgets
        resultsCountText.innerHTML = `Found <span style="color:var(--neon-cyan);">${filteredProducts.length}</span> components matching filters`;
        renderChips();
        renderProductsCatalog();
    }

    // Renders tags at the top showing current active filtering choices
    function renderChips() {
        let chipsHTML = "";

        if (selectedCategory !== "all") {
            const label = CATEGORY_MAP[selectedCategory]?.label || selectedCategory;
            chipsHTML += `<span class="filter-chip" id="chip-cat"><i class="fa-solid fa-microchip"></i> Category: ${label} <i class="fa-solid fa-xmark"></i></span>`;
        }

        if (selectedStores.length < 3) {
            selectedStores.forEach(s => {
                chipsHTML += `<span class="filter-chip" data-store="${s}"><i class="fa-solid fa-store"></i> ${s} <i class="fa-solid fa-xmark"></i></span>`;
            });
        }

        if (stockOnly) {
            chipsHTML += `<span class="filter-chip" id="chip-stock"><i class="fa-solid fa-circle-check"></i> In Stock <i class="fa-solid fa-xmark"></i></span>`;
        }

        if (currentFilterMin > dataPriceMin || currentFilterMax < dataPriceMax) {
            chipsHTML += `<span class="filter-chip" id="chip-price"><i class="fa-solid fa-coins"></i> ${currentFilterMin}JOD - ${currentFilterMax}JOD <i class="fa-solid fa-xmark"></i></span>`;
        }

        activeChipsContainer.innerHTML = chipsHTML;

        // Add click events to remove individual filters
        const chips = activeChipsContainer.querySelectorAll(".filter-chip");
        chips.forEach(chip => {
            chip.addEventListener("click", () => {
                if (chip.id === "chip-cat") {
                    selectedCategory = "all";
                    const allCatBtn = categoryFilterList.querySelector('[data-category="all"]');
                    if (allCatBtn) {
                        categoryFilterList.querySelectorAll(".btn-category").forEach(b => b.classList.remove("active"));
                        allCatBtn.classList.add("active");
                    }
                } else if (chip.id === "chip-stock") {
                    stockOnly = false;
                    stockToggle.checked = false;
                } else if (chip.id === "chip-price") {
                    currentFilterMin = dataPriceMin;
                    currentFilterMax = dataPriceMax;
                    priceMinInput.value = dataPriceMin;
                    priceMaxInput.value = dataPriceMax;
                    sliderMin.value = dataPriceMin;
                    sliderMax.value = dataPriceMax;
                    updateSliderTrack();
                } else {
                    const storeName = chip.getAttribute("data-store");
                    if (storeName) {
                        selectedStores = selectedStores.filter(s => s !== storeName);
                        storeFilters.forEach(cb => {
                            if (cb.value === storeName) cb.checked = false;
                        });
                    }
                }
                currentPage = 1;
                applyFiltersAndSorting();
            });
        });
    }

    // ================= 3. DOM RENDERING LOGIC =================
    function renderProductsCatalog() {
        gridContainer.innerHTML = "";

        if (filteredProducts.length === 0) {
            gridContainer.innerHTML = `
                <div class="catalog-empty-state">
                    <i class="fa-solid fa-box-open"></i>
                    <h3>No Components Match Your Criteria</h3>
                    <p>Try clearing your search keyword, adjusting your price limits, or toggling additional stores.</p>
                </div>
            `;
            paginationPanel.innerHTML = "";
            return;
        }

        // Pagination slicing
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length);
        const pageItems = filteredProducts.slice(startIndex, endIndex);

        pageItems.forEach((product, index) => {
            const isCompared = comparedProducts.some(p => p.URL === product.URL);

            // Clean up Name formatting
            let cardTitle = product["Full Name"];

            // Search highlighting logic
            if (searchQuery) {
                const terms = searchQuery.toLowerCase().split(/\s+/);
                terms.forEach(term => {
                    if (term) {
                        const regex = new RegExp(`(${escapeRegExp(term)})`, "gi");
                        cardTitle = cardTitle.replace(regex, `<span class="card-title-highlighted">$1</span>`);
                    }
                });
            }

            const isOutOfStock = product.Status !== "In Stock";
            const priceText = product.Price || `${product.price_val.toFixed(2)} JOD`;

            // Determine dynamic store classes
            let storeClass = "card-igeek";
            let storeBadge = "badge-igeek";
            if (product["Website Name"] === "City Center") {
                storeClass = "card-citycenter";
                storeBadge = "badge-citycenter";
            } else if (product["Website Name"] === "Oriental Store") {
                storeClass = "card-osjo";
                storeBadge = "badge-osjo";
            } else if (product["Website Name"] === "PC Circle") {
                storeClass = "card-pccircle";
                storeBadge = "badge-pccircle";
            } else if (product["Website Name"] === "Taipei Computer") {
                storeClass = "card-taipei";
                storeBadge = "badge-taipei";
            } else if (product["Website Name"] === "MCC Jordan") {
                storeClass = "card-mcc";
                storeBadge = "badge-mcc";
            }

            const cardHTML = `
                <div class="product-card ${storeClass} glass-panel">
                    <div class="card-top">
                        <span class="card-store-badge ${storeBadge}">${product["Website Name"]}</span>
                        <span class="card-category-badge">${product.category_key}</span>
                    </div>
                    
                    <div class="card-image-wrapper">
                        ${product["Image URL"] ? `
                            <img class="card-image" src="${product["Image URL"]}" alt="${product["Full Name"]}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        ` : ''}
                        <div class="card-image-fallback" style="${product["Image URL"] ? 'display: none;' : 'display: flex;'}">
                            <i class="fa-solid ${CATEGORY_MAP[product.category_key]?.icon || 'fa-microchip'} fallback-icon"></i>
                        </div>
                    </div>
                    
                    <div class="card-middle">
                        <h4 class="card-title" title="${product["Full Name"]}">${cardTitle}</h4>
                        
                        <!-- Specs Pill Row -->
                        ${(product.category_key === "Monitor") ? `
                            <div class="card-specs-row">
                                ${product.screen_size ? `<span class="spec-pill spec-inches"><i class="fa-solid fa-expand"></i> ${product.screen_size}"</span>` : ''}
                                ${product.refresh_rate ? `<span class="spec-pill spec-hz"><i class="fa-solid fa-gauge-high"></i> ${product.refresh_rate}Hz</span>` : ''}
                                ${product.response_time ? `<span class="spec-pill spec-ms"><i class="fa-solid fa-bolt"></i> ${product.response_time}ms</span>` : ''}
                            </div>
                        ` : (product.category_key === "Monitor Arm") ? `
                            <div class="card-specs-row">
                                ${product.arms_supported ? `<span class="spec-pill spec-arms"><i class="fa-solid fa-circle-nodes"></i> ${product.arms_supported === 1 ? 'Single Arm' : product.arms_supported === 2 ? 'Dual Arm' : product.arms_supported === 3 ? 'Triple Arm' : product.arms_supported + ' Arms'}</span>` : ''}
                                ${product.weight_support ? `<span class="spec-pill spec-weight"><i class="fa-solid fa-weight-hanging"></i> Max ${String(product.weight_support).toLowerCase().includes('kg') ? product.weight_support : product.weight_support + 'kg'}</span>` : ''}
                            </div>
                        ` : ''}

                        <div class="card-stock-row">
                            <span class="stock-indicator ${isOutOfStock ? "out-stock-indicator" : "in-stock-indicator"}"></span>
                            <span class="${isOutOfStock ? "stock-text-out" : "stock-text-in"}">${product.Status}</span>
                        </div>
                    </div>
                    
                    <div class="card-bottom">
                        <div class="card-price-row">
                            <span class="card-price">${priceText}</span>
                        </div>
                        <div class="card-actions">
                            <a href="${product.URL}" target="_blank" class="btn-card-action btn-card-visit">
                                <i class="fa-solid fa-arrow-up-right-from-square"></i> Visit Store
                            </a>
                            <button class="btn-card-action btn-card-compare ${isCompared ? "active" : ""}" data-index="${startIndex + index}" title="Compare this item">
                                <i class="fa-solid ${isCompared ? "fa-circle-check" : "fa-scale-balanced"}"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            gridContainer.insertAdjacentHTML("beforeend", cardHTML);
        });

        // Add compare toggle click handlers
        const compareBtns = gridContainer.querySelectorAll(".btn-card-compare");
        compareBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const productIndex = parseInt(btn.getAttribute("data-index"));
                const product = filteredProducts[productIndex];
                toggleCompareProduct(product, btn);
            });
        });

        renderPaginationUI();
    }

    function renderPaginationUI() {
        paginationPanel.innerHTML = "";
        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

        if (totalPages <= 1) return;

        // Previous Button
        const prevBtn = document.createElement("button");
        prevBtn.className = "btn-page";
        prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener("click", () => {
            currentPage--;
            renderProductsCatalog();
            window.scrollTo({ top: gridContainer.offsetTop - 100, behavior: "smooth" });
        });
        paginationPanel.appendChild(prevBtn);

        // Dynamic page indexes rendering (handling high page numbers with ellipses)
        let pageNumbers = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
        } else {
            if (currentPage <= 4) {
                pageNumbers = [1, 2, 3, 4, 5, "...", totalPages];
            } else if (currentPage >= totalPages - 3) {
                pageNumbers = [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            } else {
                pageNumbers = [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
            }
        }

        pageNumbers.forEach(page => {
            if (page === "...") {
                const span = document.createElement("span");
                span.className = "pagination-ellipsis";
                span.textContent = "...";
                paginationPanel.appendChild(span);
            } else {
                const btn = document.createElement("button");
                btn.className = `btn-page ${page === currentPage ? "active" : ""}`;
                btn.textContent = page;
                btn.addEventListener("click", () => {
                    currentPage = page;
                    renderProductsCatalog();
                    window.scrollTo({ top: gridContainer.offsetTop - 100, behavior: "smooth" });
                });
                paginationPanel.appendChild(btn);
            }
        });

        // Next Button
        const nextBtn = document.createElement("button");
        nextBtn.className = "btn-page";
        nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener("click", () => {
            currentPage++;
            renderProductsCatalog();
            window.scrollTo({ top: gridContainer.offsetTop - 100, behavior: "smooth" });
        });
        paginationPanel.appendChild(nextBtn);
    }

    // ================= 4. COMPARISON TRAY & MODAL LOGIC =================
    function toggleCompareProduct(product, btnElement) {
        const existingIdx = comparedProducts.findIndex(p => p.URL === product.URL);

        if (existingIdx > -1) {
            // Already inside comparison tray, remove it
            comparedProducts.splice(existingIdx, 1);
            if (btnElement) btnElement.classList.remove("active");
            showNotification(`Removed component from comparison list.`);
        } else {
            // Add to comparison tray
            if (comparedProducts.length >= 3) {
                showNotification("⚠️ Maximum comparison reached! Clear items first.", "error");
                return;
            }
            comparedProducts.push(product);
            if (btnElement) btnElement.classList.add("active");
            showNotification(`Added '${product["Full Name"].substring(0, 30)}...' to comparison tray.`);
        }

        updateCompareTrayUI();
    }

    function updateCompareTrayUI() {
        compareCountBadge.textContent = comparedProducts.length;

        // Empty compare Slots container
        compareSlots.innerHTML = "";

        for (let i = 0; i < 3; i++) {
            const product = comparedProducts[i];
            const slot = document.createElement("div");

            if (product) {
                slot.className = "compare-slot filled";

                let storeLabelClass = "badge-igeek";
                if (product["Website Name"] === "City Center") storeLabelClass = "badge-citycenter";
                else if (product["Website Name"] === "Oriental Store") storeLabelClass = "badge-osjo";
                else if (product["Website Name"] === "PC Circle") storeLabelClass = "badge-pccircle";
                else if (product["Website Name"] === "Taipei Computer") storeLabelClass = "badge-taipei";
                else if (product["Website Name"] === "MCC Jordan") storeLabelClass = "badge-mcc";

                slot.innerHTML = `
                    <div class="slot-filled-content">
                        <span class="slot-title" title="${product["Full Name"]}">${product["Full Name"]}</span>
                        <div class="slot-meta">
                            <span class="slot-store ${storeLabelClass}">${product["Website Name"]}</span>
                            <span class="slot-price">${product.Price}</span>
                        </div>
                    </div>
                    <button class="btn-remove-slot" data-index="${i}"><i class="fa-solid fa-xmark"></i></button>
                `;

                slot.querySelector(".btn-remove-slot").addEventListener("click", (e) => {
                    e.stopPropagation();
                    comparedProducts.splice(i, 1);
                    updateCompareTrayUI();
                    renderProductsCatalog(); // Refresh grids active classes
                });

            } else {
                slot.className = "compare-slot";
                slot.innerHTML = `
                    <div class="slot-empty-text">
                        <i class="fa-solid fa-circle-plus"></i> Slot ${i + 1}
                    </div>
                `;
            }

            compareSlots.appendChild(slot);
        }

        // Slide up / Open comparison tray if at least 1 item is added
        if (comparedProducts.length > 0) {
            compareTray.classList.add("open");
        } else {
            compareTray.classList.remove("open");
        }

        // Enable or disable Compare button
        if (comparedProducts.length >= 2) {
            btnTriggerCompare.removeAttribute("disabled");
        } else {
            btnTriggerCompare.setAttribute("disabled", "true");
        }
    }

    function openCompareModal() {
        if (comparedProducts.length < 2) return;

        // Clean table columns except the first label cells
        const headerRow = document.getElementById("compare-row-headers");
        const imageRow = document.getElementById("compare-row-image");
        const storeRow = document.getElementById("compare-row-store");
        const categoryRow = document.getElementById("compare-row-category");
        const nameRow = document.getElementById("compare-row-name");
        const priceRow = document.getElementById("compare-row-price");
        const sizeRow = document.getElementById("compare-row-size");
        const hzRow = document.getElementById("compare-row-hz");
        const msRow = document.getElementById("compare-row-ms");
        const armsRow = document.getElementById("compare-row-arms");
        const weightRow = document.getElementById("compare-row-weight");
        const statusRow = document.getElementById("compare-row-status");
        const actionRow = document.getElementById("compare-row-action");

        headerRow.innerHTML = '<th class="attr-header">Attributes</th>';
        imageRow.innerHTML = '<td class="attr-label">Product Image</td>';
        storeRow.innerHTML = '<td class="attr-label">Store Origin</td>';
        categoryRow.innerHTML = '<td class="attr-label">Category</td>';
        nameRow.innerHTML = '<td class="attr-label">Product Name</td>';
        priceRow.innerHTML = '<td class="attr-label">Price (JOD)</td>';
        sizeRow.innerHTML = '<td class="attr-label">Screen Size (Inches)</td>';
        hzRow.innerHTML = '<td class="attr-label">Refresh Rate (Hz)</td>';
        msRow.innerHTML = '<td class="attr-label">Response Time (ms)</td>';
        armsRow.innerHTML = '<td class="attr-label">Arms Supported</td>';
        weightRow.innerHTML = '<td class="attr-label">Weight Capacity (kg)</td>';
        statusRow.innerHTML = '<td class="attr-label">Stock Status</td>';
        actionRow.innerHTML = '<td class="attr-label">Store Page</td>';

        comparedProducts.forEach(item => {
            // Store badge class
            let storeBadge = "badge-igeek";
            if (item["Website Name"] === "City Center") storeBadge = "badge-citycenter";
            else if (item["Website Name"] === "Oriental Store") storeBadge = "badge-osjo";
            else if (item["Website Name"] === "PC Circle") storeBadge = "badge-pccircle";
            else if (item["Website Name"] === "Taipei Computer") storeBadge = "badge-taipei";
            else if (item["Website Name"] === "MCC Jordan") storeBadge = "badge-mcc";

            const isOutOfStock = item.Status !== "In Stock";

            // Image cell injection
            let compareImageHTML = "";
            if (item["Image URL"]) {
                compareImageHTML = `
                    <div class="compare-image-wrapper">
                        <img class="compare-image" src="${item["Image URL"]}" alt="${item["Full Name"]}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="compare-image-fallback" style="display:none;">
                            <i class="fa-solid ${CATEGORY_MAP[item.category_key]?.icon || 'fa-desktop'} fallback-icon"></i>
                        </div>
                    </div>
                `;
            } else {
                compareImageHTML = `
                    <div class="compare-image-wrapper">
                        <div class="compare-image-fallback">
                            <i class="fa-solid ${CATEGORY_MAP[item.category_key]?.icon || 'fa-desktop'} fallback-icon"></i>
                        </div>
                    </div>
                `;
            }

            headerRow.insertAdjacentHTML("beforeend", `<th class="compare-col-header">${item["Full Name"].substring(0, 40)}...</th>`);
            imageRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell cell-image-cell">${compareImageHTML}</td>`);
            storeRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell"><span class="card-store-badge ${storeBadge}">${item["Website Name"]}</span></td>`);
            categoryRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell" style="font-weight:600;">${item.category_key}</td>`);
            nameRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell" style="font-size:0.85rem;text-align:left;">${item["Full Name"]}</td>`);
            priceRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell cell-price">${item.Price}</td>`);

            // Specialized specifications cells
            sizeRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell">${item.screen_size ? item.screen_size + '"' : 'N/A'}</td>`);
            hzRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell">${item.refresh_rate ? item.refresh_rate + 'Hz' : 'N/A'}</td>`);
            msRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell">${item.response_time ? item.response_time + 'ms' : 'N/A'}</td>`);

            let armsLabel = 'N/A';
            if (item.arms_supported) {
                armsLabel = item.arms_supported === 1 ? "1 (Single)" : item.arms_supported === 2 ? "2 (Dual)" : item.arms_supported === 3 ? "3 (Triple)" : item.arms_supported;
            }
            armsRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell">${armsLabel}</td>`);
            weightRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell">${item.weight_support ? (String(item.weight_support).toLowerCase().includes('kg') ? item.weight_support : item.weight_support + ' kg') : 'N/A'}</td>`);

            statusRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell">
                <span class="stock-text-${isOutOfStock ? "out" : "in"}">
                    <i class="fa-solid ${isOutOfStock ? "fa-circle-xmark" : "fa-circle-check"}"></i> ${item.Status}
                </span>
            </td>`);
            actionRow.insertAdjacentHTML("beforeend", `<td class="compare-item-cell cell-action">
                <a href="${item.URL}" target="_blank" class="btn-modal-visit">
                    <i class="fa-solid fa-shopping-cart"></i> View Page
                </a>
            </td>`);
        });

        compareModal.classList.add("open");
    }

    // ================= 5. EVENT LISTENERS =================

    // Toggle Compare Tray manually clicking header
    compareTrayToggle.addEventListener("click", () => {
        if (comparedProducts.length === 0) return;

        if (compareTray.style.bottom === "0px" || compareTray.classList.contains("open")) {
            compareTray.classList.remove("open");
            trayChevron.className = "fa-solid fa-chevron-up";
        } else {
            compareTray.classList.add("open");
            trayChevron.className = "fa-solid fa-chevron-down";
        }
    });

    // Reset All filters button
    btnResetFilters.addEventListener("click", () => {
        // Reset Search
        searchQuery = "";
        searchInput.value = "";
        btnClearSearch.style.display = "none";

        // Reset Category
        selectedCategory = "all";
        const allCatBtn = categoryFilterList.querySelector('[data-category="all"]');
        categoryFilterList.querySelectorAll(".btn-category").forEach(b => b.classList.remove("active"));
        if (allCatBtn) allCatBtn.classList.add("active");

        // Reset Stores Checkbox
        selectedStores = ["iGeek.jo", "City Center", "Oriental Store", "PC Circle", "Taipei Computer", "MCC Jordan"];
        storeFilters.forEach(cb => cb.checked = true);

        // Reset Price
        currentFilterMin = dataPriceMin;
        currentFilterMax = dataPriceMax;
        priceMinInput.value = dataPriceMin;
        priceMaxInput.value = dataPriceMax;
        sliderMin.value = dataPriceMin;
        sliderMax.value = dataPriceMax;
        updateSliderTrack();

        // Reset Stock toggle
        stockOnly = false;
        stockToggle.checked = false;

        currentPage = 1;
        applyFiltersAndSorting();
        showNotification("Filters have been completely reset.");
    });

    // Instant search input typing
    let typingTimer;
    searchInput.addEventListener("input", () => {
        clearTimeout(typingTimer);
        searchQuery = searchInput.value.trim();

        if (searchQuery.length > 0) {
            btnClearSearch.style.display = "block";
        } else {
            btnClearSearch.style.display = "none";
        }

        typingTimer = setTimeout(() => {
            currentPage = 1;
            applyFiltersAndSorting();
        }, 300); // 300ms Debounce typing
    });

    btnClearSearch.addEventListener("click", () => {
        searchInput.value = "";
        searchQuery = "";
        btnClearSearch.style.display = "none";
        currentPage = 1;
        applyFiltersAndSorting();
    });

    // Store Checkbox filters clicking
    storeFilters.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            const activeStores = [];
            storeFilters.forEach(cb => {
                if (cb.checked) activeStores.push(cb.value);
            });
            selectedStores = activeStores;
            currentPage = 1;
            applyFiltersAndSorting();
        });
    });

    // Stock toggle clicking
    stockToggle.addEventListener("change", () => {
        stockOnly = stockToggle.checked;
        currentPage = 1;
        applyFiltersAndSorting();
    });

    // Sorting selection change
    sortSelect.addEventListener("change", () => {
        sortBy = sortSelect.value;
        currentPage = 1;
        applyFiltersAndSorting();
    });

    // Price double sliders sliding logic
    sliderMin.addEventListener("input", () => {
        let val1 = parseInt(sliderMin.value);
        let val2 = parseInt(sliderMax.value);

        if (val1 >= val2) {
            sliderMin.value = val2 - 10;
            val1 = val2 - 10;
        }

        currentFilterMin = val1;
        priceMinInput.value = val1;
        updateSliderTrack();

        clearTimeout(typingTimer);
        typingTimer = setTimeout(applyFiltersAndSorting, 150);
    });

    sliderMax.addEventListener("input", () => {
        let val1 = parseInt(sliderMin.value);
        let val2 = parseInt(sliderMax.value);

        if (val2 <= val1) {
            sliderMax.value = val1 + 10;
            val2 = val1 + 10;
        }

        currentFilterMax = val2;
        priceMaxInput.value = val2;
        updateSliderTrack();

        clearTimeout(typingTimer);
        typingTimer = setTimeout(applyFiltersAndSorting, 150);
    });

    // Direct price inputs typing
    priceMinInput.addEventListener("change", () => {
        let val = parseInt(priceMinInput.value);
        if (isNaN(val) || val < dataPriceMin) val = dataPriceMin;
        if (val >= currentFilterMax) val = currentFilterMax - 10;

        currentFilterMin = val;
        sliderMin.value = val;
        updateSliderTrack();
        applyFiltersAndSorting();
    });

    priceMaxInput.addEventListener("change", () => {
        let val = parseInt(priceMaxInput.value);
        if (isNaN(val) || val > dataPriceMax) val = dataPriceMax;
        if (val <= currentFilterMin) val = currentFilterMin + 10;

        currentFilterMax = val;
        sliderMax.value = val;
        updateSliderTrack();
        applyFiltersAndSorting();
    });

    // Compare Triggers
    btnTriggerCompare.addEventListener("click", openCompareModal);
    btnClearCompareAll.addEventListener("click", () => {
        comparedProducts = [];
        updateCompareTrayUI();
        renderProductsCatalog();
        showNotification("Cleared comparison slots.");
    });

    // Close Compare modal
    btnCloseCompareModal.addEventListener("click", () => {
        compareModal.classList.remove("open");
    });
    compareModal.addEventListener("click", (e) => {
        if (e.target === compareModal) {
            compareModal.classList.remove("open");
        }
    });

    // Helper functions
    function updateSliderTrack() {
        const percent1 = ((sliderMin.value - dataPriceMin) / (dataPriceMax - dataPriceMin)) * 100;
        const percent2 = ((sliderMax.value - dataPriceMin) / (dataPriceMax - dataPriceMin)) * 100;
        sliderTrack.style.left = percent1 + "%";
        sliderTrack.style.width = (percent2 - percent1) + "%";
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    // Dynamic neon Toast Notification popup alert
    function showNotification(message, type = "success") {
        const toast = document.createElement("div");
        toast.className = `toast-neon ${type === "error" ? "toast-error" : ""}`;
        toast.innerHTML = `
            <i class="fa-solid ${type === "error" ? "fa-circle-exclamation" : "fa-circle-info"}"></i>
            <span>${message}</span>
        `;

        // CSS properties inject for dynamic toast alerts
        toast.style.position = "fixed";
        toast.style.top = "30px";
        toast.style.right = "30px";
        toast.style.background = "var(--bg-panel)";
        toast.style.border = `1px solid ${type === "error" ? "var(--neon-coral)" : "var(--neon-cyan)"}`;
        toast.style.color = "var(--text-white)";
        toast.style.padding = "14px 20px";
        toast.style.borderRadius = "10px";
        toast.style.fontSize = "0.88rem";
        toast.style.fontWeight = "500";
        toast.style.display = "flex";
        toast.style.alignItems = "center";
        toast.style.gap = "10px";
        toast.style.boxShadow = type === "error" ? "0 0 15px rgba(248,113,113,0.3)" : "var(--glow-cyan)";
        toast.style.zIndex = "99999";
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-20px)";
        toast.style.transition = "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.15)";

        document.body.appendChild(toast);

        // Trigger show slide translation
        setTimeout(() => {
            toast.style.opacity = "1";
            toast.style.transform = "translateY(0)";
        }, 50);

        // Slide hide translation and clear DOM
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(-20px)";
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // RUN ON LOAD
    loadProductCatalog();
});
