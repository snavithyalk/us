// Data Storage
let inventory = JSON.parse(localStorage.getItem('pos-inventory')) || [
    { id: 101, name: 'Monstera Deliciosa', price: 2500, stock: 15, category: 'Indoor' },
    { id: 102, name: 'Fiddle Leaf Fig', price: 4500, stock: 5, category: 'Indoor' },
    { id: 103, name: 'Golden Pothos', price: 800, stock: 25, category: 'Indoor' },
    { id: 104, name: 'Terracotta Pot (Medium)', price: 1200, stock: 2, category: 'Pots' }
];
let salesHistory = JSON.parse(localStorage.getItem('pos-sales')) || [];
let currentBill = [];
let currentCategory = 'All';

// DOM Elements
const inventoryList = document.getElementById('inventory-list');
const billingProductsGrid = document.getElementById('billing-products-grid');
const billItems = document.getElementById('bill-items');
const billTotal = document.getElementById('bill-total');
const historyList = document.getElementById('history-list');

// Tab Switching
function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
    
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    const navItems = document.querySelectorAll('.nav-links li');
    navItems.forEach(li => {
        if (li.innerText.toLowerCase().includes(tabId)) {
            li.classList.add('active');
        }
    });

    if (tabId === 'dashboard') updateDashboard();
    if (tabId === 'inventory') renderInventory();
    if (tabId === 'billing') renderBilling();
    if (tabId === 'history') renderHistory();
}

// Inventory Logic
function handleAddProduct(e) {
    e.preventDefault();
    const name = document.getElementById('prod-name').value;
    const price = parseFloat(document.getElementById('prod-price').value);
    const stock = parseInt(document.getElementById('prod-stock').value);
    const category = document.getElementById('prod-category').value;

    const product = { id: Date.now(), name, price, stock, category };
    inventory.push(product);
    saveInventory();
    e.target.reset();
    renderInventory();
    alert('Plant added to inventory!');
}

function renderInventory() {
    const searchTerm = document.getElementById('inventory-search')?.value.toLowerCase() || '';
    inventoryList.innerHTML = '';
    
    inventory.filter(p => p.name.toLowerCase().includes(searchTerm)).forEach(p => {
        const tr = document.createElement('tr');
        const stockColor = p.stock <= 5 ? '#ef5350' : 'inherit';
        tr.innerHTML = `
            <td><strong>${p.name}</strong></td>
            <td><span class="pill">${p.category}</span></td>
            <td>Rs. ${p.price}</td>
            <td style="color:${stockColor}; font-weight:600;">${p.stock}</td>
            <td>
                <button onclick="deleteProduct(${p.id})" style="color:var(--danger); background:none; border:none; cursor:pointer; font-weight:600;">Remove</button>
            </td>
        `;
        inventoryList.appendChild(tr);
    });
}

function deleteProduct(id) {
    if (confirm('Delete this item from inventory?')) {
        inventory = inventory.filter(p => p.id !== id);
        saveInventory();
        renderInventory();
    }
}

function saveInventory() {
    localStorage.setItem('pos-inventory', JSON.stringify(inventory));
}

// Billing Logic
function filterByCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    event.target.classList.add('active');
    renderBilling();
}

function renderBilling() {
    const searchTerm = document.getElementById('billing-search')?.value.toLowerCase() || '';
    billingProductsGrid.innerHTML = '';
    
    let filtered = inventory;
    if (currentCategory !== 'All') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }
    if (searchTerm) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
    }

    filtered.forEach(p => {
        const div = document.createElement('div');
        div.className = 'prod-item';
        div.onclick = () => addToBill(p.id);
        
        let icon = '🌿';
        if (p.category === 'Pots') icon = '🏺';
        if (p.category === 'Fertilizer') icon = '🧪';
        if (p.category === 'Succulents') icon = '🌵';

        div.innerHTML = `
            <div class="icon">${icon}</div>
            <h4 style="margin-bottom:0.5rem;">${p.name}</h4>
            <p style="color:var(--primary-light);">Rs. ${p.price}</p>
            <p style="font-size:0.7rem; color:var(--text-muted); margin-top:5px;">Qty: ${p.stock}</p>
        `;
        billingProductsGrid.appendChild(div);
    });
}

function addToBill(prodId) {
    const product = inventory.find(p => p.id === prodId);
    if (!product) return;
    if (product.stock <= 0) return alert('Out of stock!');

    const existing = currentBill.find(b => b.id === prodId);
    if (existing) {
        if (existing.qty >= product.stock) return alert('No more stock available!');
        existing.qty++;
    } else {
        currentBill.push({ ...product, qty: 1 });
    }
    renderBill();
}

function renderBill() {
    billItems.innerHTML = '';
    let total = 0;
    
    if (currentBill.length === 0) {
        billItems.innerHTML = '<p style="text-align:center; color:var(--text-muted); margin-top:2rem;">Cart is empty</p>';
    } else {
        currentBill.forEach(item => {
            const div = document.createElement('div');
            div.className = 'bill-item';
            div.innerHTML = `
                <div>
                    <div style="font-weight:600;">${item.name}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">Rs. ${item.price} x ${item.qty}</div>
                </div>
                <div style="font-weight:700;">Rs. ${item.price * item.qty}</div>
            `;
            billItems.appendChild(div);
            total += item.price * item.qty;
        });
    }
    billTotal.innerText = `Rs. ${total}`;
}

function clearBill() {
    if (confirm('Discard current cart?')) {
        currentBill = [];
        renderBill();
    }
}

function handleCheckout() {
    if (currentBill.length === 0) return alert('Cart is empty!');

    const total = currentBill.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const transaction = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        items: currentBill.map(i => `${i.name} (${i.qty})`).join(', '),
        total: total,
        status: 'Completed'
    };

    // Update Inventory
    currentBill.forEach(billItem => {
        const invItem = inventory.find(p => p.id === billItem.id);
        if (invItem) invItem.stock -= billItem.qty;
    });

    salesHistory.push(transaction);
    currentBill = [];
    
    saveInventory();
    localStorage.setItem('pos-sales', JSON.stringify(salesHistory));
    
    renderBill();
    alert('Purchase confirmed! Stock levels updated.');
    updateDashboard();
}

// History & Dashboard
function renderHistory() {
    historyList.innerHTML = '';
    salesHistory.slice().reverse().forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${s.date}</td>
            <td style="font-size:0.9rem;">${s.items}</td>
            <td><span class="pill" style="background:rgba(76, 175, 80, 0.2); color:var(--primary-light);">Success</span></td>
            <td style="font-weight:700;">Rs. ${s.total}</td>
        `;
        historyList.appendChild(tr);
    });
}

function updateDashboard() {
    const totalSales = salesHistory.reduce((sum, s) => sum + s.total, 0);
    const today = new Date().toLocaleDateString();
    const todaySales = salesHistory
        .filter(s => new Date(s.date).toLocaleDateString() === today)
        .reduce((sum, s) => sum + s.total, 0);

    document.getElementById('stat-daily-sales').innerText = `Rs. ${todaySales}`;
    document.getElementById('stat-monthly-sales').innerText = `Rs. ${totalSales}`;
    document.getElementById('stat-total-products').innerText = inventory.length;

    // Low Stock Alerts
    const lowStockContainer = document.getElementById('low-stock-list');
    const lowStockItems = inventory.filter(p => p.stock <= 5);
    
    if (lowStockItems.length > 0) {
        lowStockContainer.innerHTML = '';
        lowStockItems.forEach(p => {
            const div = document.createElement('div');
            div.style.padding = '10px';
            div.style.background = 'rgba(239, 83, 80, 0.1)';
            div.style.borderRadius = '8px';
            div.style.marginBottom = '8px';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.innerHTML = `<span>${p.name}</span> <strong style="color:var(--danger)">Stock: ${p.stock}</strong>`;
            lowStockContainer.appendChild(div);
        });
    } else {
        lowStockContainer.innerHTML = '<p style="color:var(--text-muted);">All inventory levels are healthy.</p>';
    }
}

// Initial Call
window.onload = () => {
    updateDashboard();
    renderInventory();
};
window.switchTab = switchTab;
window.handleAddProduct = handleAddProduct;
window.deleteProduct = deleteProduct;
window.filterByCategory = filterByCategory;
window.addToBill = addToBill;
window.renderBilling = renderBilling;
window.handleCheckout = handleCheckout;
window.clearBill = clearBill;
window.renderInventory = renderInventory;
