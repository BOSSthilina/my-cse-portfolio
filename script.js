let myPortfolio = JSON.parse(localStorage.getItem('myCSEData')) || [];
const BROKERAGE_RATE = 0.0112; // 1.12% කොමිස් මුදල

document.addEventListener('DOMContentLoaded', () => {
    renderTable();
    updateSymbolList();
    
    // Search Filter එකට අදාළ Event එක
    const searchInput = document.getElementById('searchStock');
    if(searchInput) {
        searchInput.addEventListener('input', renderTable);
    }
});

document.getElementById('addBtn').addEventListener('click', function() {
    const symbol = document.getElementById('symbol').value;
    const buy = parseFloat(document.getElementById('buyPrice').value) || 0;
    const qty = parseFloat(document.getElementById('qty').value) || 0;
    const sellPrice = parseFloat(document.getElementById('sellPrice').value) || 0;

    if (symbol !== "") {
        const totalBuy = buy * qty;
        const buyCostWithFee = totalBuy * (1 + BROKERAGE_RATE); // කොමිස් සහිත වියදම
        
        const totalSell = sellPrice * qty;
        const sellNet = totalSell * (1 - BROKERAGE_RATE); // කොමිස් කැපූ ලාභය
        const income = sellNet - buyCostWithFee;

        const stockEntry = {
            id: Date.now(),
            symbol: symbol.toUpperCase(),
            buy: buy,
            qty: qty,
            totalBuy: totalBuy,
            costWithFee: buyCostWithFee,
            sellPrice: sellPrice,
            income: income
        };

        myPortfolio.push(stockEntry);
        saveAndShow();
        
        // Input fields clear කිරීම
        document.getElementById('symbol').value = '';
        document.getElementById('buyPrice').value = '';
        document.getElementById('qty').value = '';
        document.getElementById('sellPrice').value = '0';
    }
});

function updateSellPrice(id, newPrice) {
    const price = parseFloat(newPrice) || 0;
    myPortfolio = myPortfolio.map(item => {
        if (item.id === id) {
            // පරණ දත්තයක් නම් costWithFee එක හදාගන්නවා
            const currentCost = item.costWithFee || (item.totalBuy * (1 + BROKERAGE_RATE));
            const totalSell = price * item.qty;
            const sellNet = totalSell * (1 - BROKERAGE_RATE);
            const updatedIncome = sellNet - currentCost;
            
            // costWithFee එකත් එක්කම save කරනවා
            return { ...item, sellPrice: price, income: updatedIncome, costWithFee: currentCost };
        }
        return item;
    });
    localStorage.setItem('myCSEData', JSON.stringify(myPortfolio));
    renderTable();
}

function saveAndShow() {
    localStorage.setItem('myCSEData', JSON.stringify(myPortfolio));
    renderTable();
    updateSymbolList();
}

function removeStock(id) {
    myPortfolio = myPortfolio.filter(item => item.id !== id);
    saveAndShow();
}

function updateSymbolList() {
    const dataList = document.getElementById('symbol-list');
    if(!dataList) return;

    const uniqueSymbols = [...new Set(myPortfolio.map(item => item.symbol))];
    dataList.innerHTML = ""; 
    uniqueSymbols.forEach(symbol => {
        const option = document.createElement('option');
        option.value = symbol;
        dataList.appendChild(option);
    });
}

function getSymbolColor(symbol) {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
        hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 80%, 85%)`; 
}

function renderTable() {
    const list = document.getElementById('stock-list');
    const searchTerm = document.getElementById('searchStock')?.value.toUpperCase() || "";
    if(!list) return;

    list.innerHTML = "";
    let overallCost = 0;
    let overallIncome = 0;

    myPortfolio.sort((a, b) => a.symbol.localeCompare(b.symbol));

    myPortfolio.forEach(item => {
    if (item.symbol.includes(searchTerm)) {
        
        // --- මේ පේළිය අලුතින් ඇතුළත් කරන්න ---
        const displayCost = item.costWithFee || (item.totalBuy * (1 + BROKERAGE_RATE)); 

            // Total ගණනය කිරීම (Brokerage එක ඇතුළුව)
            if (item.sellPrice === 0 || item.sellPrice === "") {
            overallCost += displayCost; // item.costWithFee වෙනුවට displayCost දාන්න
        } else {
            overallIncome += item.income;
        }

            const bgColor = getSymbolColor(item.symbol);
            const row = `<tr data-id="${item.id}">
                <td style="background-color: ${bgColor}; border-left: 5px solid hsl(${(bgColor.match(/\d+/) || [0])[0]}, 70%, 40%); font-weight: bold;">
                    ${item.symbol}
                </td>
                <td>${item.buy}</td>
                <td>${item.qty}</td>
                <td>${displayCost.toFixed(2)}</td>
                <td>
                    <input type="number" class="edit-input" value="${item.sellPrice}" 
                           onchange="updateSellPrice(${item.id}, this.value)">
                </td>
                <td class="income-cell" style="color: ${item.income >= 0 ? 'green' : 'red'}; font-weight: bold;">
                    ${item.income.toFixed(2)}
                </td>
                <td><button class="delete-btn" onclick="removeStock(${item.id})">Delete</button></td>
            </tr>`;
            list.innerHTML += row;
        }
    });

    document.getElementById('overall-cost').innerText = overallCost.toLocaleString(undefined, {minimumFractionDigits: 2});
    document.getElementById('overall-income').innerText = overallIncome.toLocaleString(undefined, {minimumFractionDigits: 2});
    document.getElementById('overall-income').style.color = overallIncome >= 0 ? '#27ae60' : '#ff0000';
}
// පේජ් එක මාරු කරන Function එක
function showPage(pageId) {
    const mainPage = document.getElementById('main-page');
    const averagePage = document.getElementById('average-page');

    if (pageId === 'main') {
        mainPage.style.display = 'block';
        averagePage.style.display = 'none';
    } else if (pageId === 'average') {
        mainPage.style.display = 'none';
        averagePage.style.display = 'block';
        renderAverageTable(); // Average table එක ඇතුළේ දත්ත update කරන්න
    }
}

    
