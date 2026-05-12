let myPortfolio = JSON.parse(localStorage.getItem('myCSEData')) || [];
let myDividends = JSON.parse(localStorage.getItem('myCSEDividends')) || [];
const BROKERAGE_RATE = 0.0112; // 1.12% කොමිස් මුදල

document.addEventListener('DOMContentLoaded', () => {
    renderTable();
    renderDividendTable(); // <--- අන්න මේ පේළිය මෙතනට එකතු කරන්න
    updateSymbolList();
    updateChart();
    
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

// Dividend එකතු කරන කොටස
document.getElementById('addDivBtn').addEventListener('click', function() {
    const symbol = document.getElementById('divSymbol').value.toUpperCase();
    const amount = parseFloat(document.getElementById('divAmount').value) || 0;

    if (symbol !== "" && amount > 0) {
        myDividends.push({ id: Date.now(), symbol: symbol, amount: amount });
        localStorage.setItem('myCSEDividends', JSON.stringify(myDividends));
        renderDividendTable();
        renderTable(); // මුළු ලාභය update වෙන්න මේකත් ඕනේ
        
        document.getElementById('divSymbol').value = '';
        document.getElementById('divAmount').value = '';
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
                    <a href="https://finance.yahoo.com/quote/${item.symbol}.LK" target="_blank" style="text-decoration: none; color: inherit;">
                        ${item.symbol} 🔗
                    </a>
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

    // ... renderTable function එක ඇතුළේ අන්තිම ටික බලන්න ...

    // 1. Dividend ටිකේ එකතුව මුලින්ම ගණනය කරගන්නවා
    const totalDivReceived = myDividends.reduce((sum, item) => sum + item.amount, 0);
    
    // 2. දැනට තියෙන overallIncome එකට dividend එකතුව එකතු කරනවා
    const finalTotalIncome = overallIncome + totalDivReceived;

    // 3. දැන් Dashboard එකේ display කරන පේළිය:
    document.getElementById('overall-cost').innerText = overallCost.toLocaleString(undefined, {minimumFractionDigits: 2});
    
    // මේ පේළිය තමයි ඔයා වෙනස් කරන්න ඕනේ (finalTotalIncome එක පාවිච්චි කරන්න)
    document.getElementById('overall-income').innerText = finalTotalIncome.toLocaleString(undefined, {minimumFractionDigits: 2});
    
    // පාට වෙනස් කරන කොටස (finalTotalIncome එකට අනුව)
    document.getElementById('overall-income').style.color = finalTotalIncome >= 0 ? '#27ae60' : '#ff0000';
    updateChart();
}

// පේජ් එක මාරු කරන Function එක
function showPage(pageId) {
    const mainPage = document.getElementById('main-page');
    const averagePage = document.getElementById('average-page');
    const historyPage = document.getElementById('history-page');

    // මුලින්ම සියලුම පිටු වසනවා
    if(mainPage) mainPage.style.display = 'none';
    if(averagePage) averagePage.style.display = 'none';
    if(historyPage) historyPage.style.display = 'none';

    // අදාළ පිටුව විවෘත කර දත්ත පෙන්වනවා
    if (pageId === 'main') {
        mainPage.style.display = 'block';
        renderTable(); 
    } else if (pageId === 'average') {
        averagePage.style.display = 'block';
        renderAverageTable(); // Average පිටුවට යනකොට මේක Call වෙන්නම ඕනේ
    } else if (pageId === 'history') {
        historyPage.style.display = 'block';
        renderHistoryTable(); // History පිටුවට යනකොට මේක Call වෙන්නම ඕනේ
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
            <td style="font-weight: bold; background-color: ${getSymbolColor(symbol)}">
                <a href="https://finance.yahoo.com/quote/${symbol}.LK" target="_blank" style="text-decoration: none; color: inherit;">
                    ${symbol} 🔗
                </a>
            </td>
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

function renderDividendTable() {
    const list = document.getElementById('dividend-list');
    if (!list) return;
    list.innerHTML = "";
    let totalDiv = 0;

    myDividends.forEach(item => {
        totalDiv += item.amount;
        list.innerHTML += `<tr>
            <td>${item.symbol}</td>
            <td>${item.amount.toFixed(2)}</td>
            <td><button onclick="removeDividend(${item.id})" style="background: red; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Delete</button></td>
        </tr>`;
    });
    document.getElementById('total-dividends').innerText = totalDiv.toLocaleString(undefined, {minimumFractionDigits: 2});
}

function removeDividend(id) {
    myDividends = myDividends.filter(item => item.id !== id);
    localStorage.setItem('myCSEDividends', JSON.stringify(myDividends));
    renderDividendTable();
    renderTable();
}
let myChart = null;

function updateChart() {
    const ctx = document.getElementById('portfolioChart').getContext('2d');
    
    // දැනට තියෙන shares වල symbol සහ cost ටික ගන්නවා
    const summary = {};
    myPortfolio.forEach(item => {
        if (item.sellPrice === 0) {
            const cost = item.costWithFee || (item.totalBuy * (1.0112));
            summary[item.symbol] = (summary[item.symbol] || 0) + cost;
        }
    });

    const labels = Object.keys(summary);
    const data = Object.values(summary);

    if (myChart) {
        myChart.destroy(); // පරණ chart එක අයින් කරනවා අලුත් එක දාන්න කලින්
    }

    myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: labels.map(s => getSymbolColor(s)), // අපි කලින් හදාගත්තු colors ම පාවිච්චි කරනවා
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Portfolio Diversification' }
            }
        }
    });
}

function removeStock(id) {
    if (confirm("ඔබට මෙම දත්තය මැකීමට අවශ්‍ය බව ස්ථිරද?")) {
        myPortfolio = myPortfolio.filter(item => item.id !== id);
        saveAndShow();
    }
}
    
