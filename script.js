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
        // --- මෙන්න මේ IF එක තමයි අලුත් කොටස ---
        // මේකෙන් කරන්නේ විකුණපු නැති (sellPrice 0) සහ search එකට ගැලපෙන ඒවා විතරක් Dashboard පෙන්වන එක
        if (item.sellPrice === 0 && item.symbol.includes(searchTerm)) {
            
            const displayCost = item.costWithFee || (item.totalBuy * (1 + BROKERAGE_RATE)); 

            overallCost += displayCost;

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
        // විකුණපු ඒවා (sellPrice > 0) Dashboard එකේ පෙන්වන්නේ නැතත්, 
        // ඒවායේ Income එක Total Income එකට එකතු වෙන්න ඕනේ නිසා මේ කොටස දානවා:
        else if (item.sellPrice > 0) {
            overallIncome += item.income;
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
    const historyPage = document.getElementById('history-page');

    // ඔක්කොම වහනවා
    mainPage.style.display = 'none';
    averagePage.style.display = 'none';
    historyPage.style.display = 'none';

    if (pageId === 'main') {
        mainPage.style.display = 'block';
        renderTable();
    } else if (pageId === 'average') {
        averagePage.style.display = 'block';
        renderAverageTable();
    } else if (pageId === 'history') {
        historyPage.style.display = 'block';
        renderHistoryTable(); // History එක පෙන්නන function එක
    }
}
function renderAverageTable() {
    const avgList = document.getElementById('average-list');
    if (!avgList) return;
    
    avgList.innerHTML = ""; 

    const summary = {};

    myPortfolio.forEach(item => {
        // --- මෙන්න මේ IF එක තමයි එකතු කරන්න ඕනේ ---
        // විකුණපු නැති (sellPrice 0) කොටස් විතරක් ගණනය කිරීම සඳහා
        if (item.sellPrice === 0) {
            const symbol = item.symbol;
            const qty = item.qty;
            const costWithFee = item.costWithFee || (item.totalBuy * (1 + BROKERAGE_RATE));

            if (!summary[symbol]) {
                summary[symbol] = { totalQty: 0, totalCost: 0 };
            }

            summary[symbol].totalQty += qty;
            summary[symbol].totalCost += costWithFee;
        }
    });

    for (const symbol in summary) {
        const data = summary[symbol];
        const avgPrice = data.totalCost / data.totalQty;

        const row = `<tr>
            <td style="font-weight: bold; background-color: ${getSymbolColor(symbol)}">${symbol}</td>
            <td>${data.totalQty.toLocaleString()}</td>
            <td>${avgPrice.toFixed(2)}</td>
            <td>${data.totalCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
        </tr>`;
        avgList.innerHTML += row;
    }
}
function renderHistoryTable() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    
    historyList.innerHTML = "";

    // sellPrice එක 0 ට වඩා වැඩි ඒ කියන්නේ විකුණපු shares විතරක් පෙරලා ගන්නවා
    const soldShares = myPortfolio.filter(item => item.sellPrice > 0);

    soldShares.forEach(item => {
        const row = `<tr>
            <td style="font-weight: bold; background-color: ${getSymbolColor(item.symbol)}">${item.symbol}</td>
            <td>${item.qty.toLocaleString()}</td>
            <td>${item.buy.toFixed(2)}</td>
            <td>${item.sellPrice.toFixed(2)}</td>
            <td style="color: ${item.income >= 0 ? 'green' : 'red'}; font-weight: bold;">
                ${item.income.toFixed(2)}
            </td>
        </tr>`;
        historyList.innerHTML += row;
    });
}



    
