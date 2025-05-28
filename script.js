// Constants & globals
const crystalsEl = document.getElementById("crystals");
const collectorLevelEl = document.getElementById("collectorLevel");
const upgradeCostEl = document.getElementById("upgradeCost");
const boosterStatusEl = document.getElementById("boosterStatus");

const btnStartPause = document.getElementById("btnStartPause");
const btnUpgrade = document.getElementById("btnUpgrade");
const btnToggleAutoUpgrade = document.getElementById("btnToggleAutoUpgrade");
const btnBuyBooster = document.getElementById("btnBuyBooster");
const btnSetName = document.getElementById("btnSetName");
const btnLogout = document.getElementById("btnLogout");

const playerNameInput = document.getElementById("playerNameInput");
const playerNameInputContainer = document.getElementById(
  "playerNameInputContainer"
);
const gameUI = document.getElementById("gameUI");
const playerNameDisplay = document.getElementById("playerNameDisplay");

const equippedItemDisplay = document.getElementById("equippedItemDisplay");
const skinImage = document.getElementById("skinImage");
const skinName = document.getElementById("skinName");

const bagItemsEl = document.getElementById("bagItems");
const limitedItemsListEl = document.getElementById("limitedItemsList");
const regularShopEl = document.getElementById("regularShop");

const transferItemSelect = document.getElementById("transferItemSelect");
const transferToPlayerInput = document.getElementById("transferToPlayerInput");
const btnTransfer = document.getElementById("btnTransfer");

const leaderboardList = document.getElementById("leaderboardList");

let playerName = null;
let players = JSON.parse(localStorage.getItem("players") || "{}");

let crystals = 0;
let collectorLevel = 1;
let upgradeCost = 10;
let collecting = false;
let collectInterval = null;
let autoUpgradeEnabled = false;
let autoUpgradeInterval = null;
const AUTO_UPGRADE_INTERVAL = 2500;

let boosterActive = false;
let boosterEndTime = 0;

// Define rarity colors and order (matching CSS classes)
const RARITY_LEVELS = ["common", "uncommon", "rare", "epic", "legend"];
const RARITY_NAMES = {
  common: "Biasa",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legend: "Legend",
};

const ITEMS = [
  {
    id: "skin_1",
    name: "Skin Biasa",
    rarity: "common",
    img: "assets/common-armor.png",
    price: 100,
  },
  {
    id: "skin_2",
    name: "Skin Uncommon",
    rarity: "uncommon",
    img: "assets/uncommon-armor.png",
    price: 300,
  },
  {
    id: "skin_3",
    name: "Skin Rare",
    rarity: "rare",
    img: "assets/rare-armor.png",
    price: 700,
  },
  {
    id: "skin_4",
    name: "Skin Epic",
    rarity: "epic",
    img: "assets/epic-armor.png",
    price: 1500,
  },
  {
    id: "skin_5",
    name: "Skin Legend",
    rarity: "legend",
    img: "assets/legend-armor.png",
    price: 3000,
  },
];

// Limited items in shop - max 100 player limit
const LIMITED_ITEMS = [
  {
    id: "limited_1",
    name: "Legendary Sword",
    rarity: "legend",
    img: "assets/pedang-legend.png",
    price: 2500,
    maxOwners: 100,
  },
  {
    id: "limited_2",
    name: "Epic Shield",
    rarity: "epic",
    img: "assets/perisai-gila.png",
    price: 1500,
    maxOwners: 100,
  },
];

// Utility function to save players data
function savePlayers() {
  localStorage.setItem("players", JSON.stringify(players));
}

// Load player data
function loadPlayerData(name) {
  if (!players[name]) return;
  const data = players[name];
  crystals = data.crystals || 0;
  collectorLevel = data.collectorLevel || 1;
  upgradeCost = Math.floor(10 * Math.pow(1.5, collectorLevel - 1));
  boosterEndTime = data.boosterEndTime || 0;
  boosterActive = boosterEndTime > Date.now();
  collecting = false;
  clearInterval(collectInterval);
  autoUpgradeEnabled = false;
  clearInterval(autoUpgradeInterval);

  playerNameDisplay.textContent = playerName;
  updateUI();
  renderInventory();
  renderShop();
  renderLimitedShop();
  renderTransferOptions();
  renderLeaderboard();
}

// Save current player progress to global players list
function saveCurrentPlayer() {
  players[playerName] = {
    crystals,
    collectorLevel,
    boosterEndTime,
    bag: players[playerName]?.bag || [],
  };
  savePlayers();
}

// Create or get player bag
function getPlayerBag() {
  if (!players[playerName]) players[playerName] = {};
  if (!players[playerName].bag) players[playerName].bag = [];
  return players[playerName].bag;
}

// Update main UI elements
function updateUI() {
  crystalsEl.textContent = crystals.toFixed(1);
  collectorLevelEl.textContent = collectorLevel;
  upgradeCost = Math.floor(10 * Math.pow(1.5, collectorLevel - 1));
  upgradeCostEl.textContent = upgradeCost;

  boosterStatusEl.textContent = boosterActive ? "Aktif" : "Tidak aktif";

  btnUpgrade.disabled = crystals < upgradeCost;
  btnBuyBooster.disabled = crystals < 50;
}

// Auto collect crystals function
function autoCollect() {
  let gain = 1 * collectorLevel;
  if (boosterActive) gain *= 2;
  crystals += gain;
  updateUI();
  saveCurrentPlayer();
}

// Start collecting crystals every second
function startCollecting() {
  if (collecting) return;
  collecting = true;
  btnStartPause.textContent = "Pause Kumpul";
  collectInterval = setInterval(() => {
    autoCollect();
    if (autoUpgradeEnabled) tryAutoUpgrade();
    checkBoosterTimeout();
  }, 1000);
}

// Pause collecting crystals
function pauseCollecting() {
  if (!collecting) return;
  collecting = false;
  btnStartPause.textContent = "Mulai Kumpul";
  clearInterval(collectInterval);
}

// Toggle collecting on/off
btnStartPause.addEventListener("click", () => {
  if (collecting) pauseCollecting();
  else startCollecting();
});

// Upgrade collector if crystals cukup
btnUpgrade.addEventListener("click", () => {
  if (crystals >= upgradeCost) {
    crystals -= upgradeCost;
    collectorLevel++;
    upgradeCost = Math.floor(10 * Math.pow(1.5, collectorLevel - 1));
    updateUI();
    saveCurrentPlayer();
  }
});

// Toggle auto upgrade collector
btnToggleAutoUpgrade.addEventListener("click", () => {
  autoUpgradeEnabled = !autoUpgradeEnabled;
  btnToggleAutoUpgrade.textContent = autoUpgradeEnabled
    ? "Auto Upgrade ON"
    : "Auto Upgrade OFF";

  if (autoUpgradeEnabled) {
    autoUpgradeInterval = setInterval(() => {
      tryAutoUpgrade();
    }, AUTO_UPGRADE_INTERVAL);
  } else {
    clearInterval(autoUpgradeInterval);
  }
});

// Try auto upgrade collector if crystals cukup
function tryAutoUpgrade() {
  if (crystals >= upgradeCost) {
    crystals -= upgradeCost;
    collectorLevel++;
    upgradeCost = Math.floor(10 * Math.pow(1.5, collectorLevel - 1));
    updateUI();
    saveCurrentPlayer();
  }
}

// Buy booster function (double crystals gain 60 detik)
btnBuyBooster.addEventListener("click", () => {
  if (crystals >= 50 && !boosterActive) {
    crystals -= 50;
    boosterActive = true;
    boosterEndTime = Date.now() + 60000; // 60 detik booster
    boosterStatusEl.textContent = "Aktif";
    updateUI();
    saveCurrentPlayer();
  }
});

// Check booster timeout
function checkBoosterTimeout() {
  if (boosterActive && Date.now() > boosterEndTime) {
    boosterActive = false;
    boosterStatusEl.textContent = "Tidak aktif";
    saveCurrentPlayer();
  }
}

// Render regular shop items
function renderShop() {
  regularShopEl.innerHTML = "";
  ITEMS.forEach((item) => {
    const div = document.createElement("div");
    div.classList.add("shop-item", item.rarity);
    div.title = `${item.name} (${RARITY_NAMES[item.rarity]})\nHarga: ${
      item.price
    } crystals`;
    div.innerHTML = `<img src="${item.img}" alt="${item.name}" /><div>${item.name}</div><div>${item.price} 💎</div>`;
    div.addEventListener("click", () => {
      buyItem(item);
    });
    regularShopEl.appendChild(div);
  });
}

// Render limited shop items with owner count
function renderLimitedShop() {
  limitedItemsListEl.innerHTML = "";
  LIMITED_ITEMS.forEach((item) => {
    // Count how many owners
    let ownersCount = 0;
    for (const p in players) {
      if (players[p].bag?.includes(item.id)) ownersCount++;
    }
    const div = document.createElement("div");
    div.classList.add("shop-item", item.rarity);
    div.title = `${item.name} (${RARITY_NAMES[item.rarity]})\nHarga: ${
      item.price
    } crystals\nPemilik: ${ownersCount}/${item.maxOwners}`;
    div.innerHTML = `<img src="${item.img}" alt="${item.name}" /><div>${item.name}</div><div>${item.price} 💎</div><div>(${ownersCount}/${item.maxOwners})</div>`;
    if (ownersCount >= item.maxOwners) {
      div.style.opacity = "0.4";
      div.style.pointerEvents = "none";
    } else {
      div.addEventListener("click", () => {
        buyItem(item);
      });
    }
    limitedItemsListEl.appendChild(div);
  });
}

// Buy item function
function buyItem(item) {
  if (crystals < item.price) {
    alert("Crystals tidak cukup!");
    return;
  }
  if (item.maxOwners) {
    // limited item check ownership
    let ownersCount = 0;
    for (const p in players) {
      if (players[p].bag?.includes(item.id)) ownersCount++;
    }
    if (ownersCount >= item.maxOwners) {
      alert("Item terbatas sudah habis!");
      return;
    }
  }
  crystals -= item.price;
  const bag = getPlayerBag();
  bag.push(item.id);
  updateUI();
  saveCurrentPlayer();
  renderInventory();
  renderLimitedShop();
  renderTransferOptions();
  renderLeaderboard();
}

// Render player inventory (bag items)
function renderInventory() {
  const bag = getPlayerBag();
  bagItemsEl.innerHTML = "";
  if (bag.length === 0) {
    bagItemsEl.textContent = "Tas kosong";
    equippedItemDisplay.classList.remove("active");
    skinImage.src = "";
    skinName.textContent = "Tidak ada item";
    return;
  }
  equippedItemDisplay.classList.add("active");

  bag.forEach((itemId) => {
    const item =
      ITEMS.find((i) => i.id === itemId) ||
      LIMITED_ITEMS.find((i) => i.id === itemId);
    if (!item) return;

    const div = document.createElement("div");
    div.classList.add("bag-item", item.rarity);
    div.title = `${item.name} (${RARITY_NAMES[item.rarity]})`;
    div.innerHTML = `<img src="${item.img}" alt="${item.name}" /><div>${item.name}</div>`;
    div.addEventListener("click", () => {
      equipItem(item);
    });
    bagItemsEl.appendChild(div);
  });

  // Show equipped item - first item by default
  if (!equippedItemDisplay.dataset.equippedId && bag.length > 0) {
    const firstItem =
      ITEMS.find((i) => i.id === bag[0]) ||
      LIMITED_ITEMS.find((i) => i.id === bag[0]);
    equipItem(firstItem);
  }
}

// Equip an item from inventory
function equipItem(item) {
  equippedItemDisplay.dataset.equippedId = item.id;
  skinImage.src = item.img;
  skinName.textContent = item.name;
  equippedItemDisplay.classList.add("active");
}

// Render transfer item options
function renderTransferOptions() {
  const bag = getPlayerBag();
  transferItemSelect.innerHTML = '<option value="">- Pilih item -</option>';
  bag.forEach((itemId) => {
    const item =
      ITEMS.find((i) => i.id === itemId) ||
      LIMITED_ITEMS.find((i) => i.id === itemId);
    if (!item) return;
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    transferItemSelect.appendChild(option);
  });
}

// Transfer item to another player
btnTransfer.addEventListener("click", () => {
  const itemId = transferItemSelect.value;
  const targetPlayer = transferToPlayerInput.value.trim();
  if (!itemId || !targetPlayer) {
    alert("Pilih item dan masukkan nama pemain tujuan.");
    return;
  }
  if (targetPlayer === playerName) {
    alert("Tidak bisa transfer ke diri sendiri.");
    return;
  }
  if (!players[targetPlayer]) {
    alert("Pemain tujuan tidak ditemukan.");
    return;
  }
  const bag = getPlayerBag();
  const itemIndex = bag.indexOf(itemId);
  if (itemIndex === -1) {
    alert("Item tidak ditemukan di tas.");
    return;
  }
  // Remove item from current player
  bag.splice(itemIndex, 1);
  // Add to target player bag
  if (!players[targetPlayer].bag) players[targetPlayer].bag = [];
  players[targetPlayer].bag.push(itemId);

  alert(`Berhasil transfer item ke ${targetPlayer}!`);
  saveCurrentPlayer();
  savePlayers();
  renderInventory();
  renderTransferOptions();
  renderLeaderboard();
});

// Leaderboard render (by crystals descending)
function renderLeaderboard() {
  const entries = Object.entries(players).map(([name, data]) => ({
    name,
    crystals: data.crystals || 0,
  }));
  entries.sort((a, b) => b.crystals - a.crystals);

  leaderboardList.innerHTML = "";
  entries.forEach((entry, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${i + 1}. ${
      entry.name
    }</span><span>${entry.crystals.toFixed(1)} 💎</span>`;
    leaderboardList.appendChild(li);
  });
}

// Player name set and load game
btnSetName.addEventListener("click", () => {
  const name = playerNameInput.value.trim();
  if (!name) {
    alert("Masukkan nama pemain!");
    return;
  }
  playerName = name;
  playerNameInputContainer.style.display = "none";
  gameUI.style.display = "block";
  if (!players[playerName]) {
    players[playerName] = {
      crystals: 0,
      collectorLevel: 1,
      bag: [],
      boosterEndTime: 0,
    };
    savePlayers();
  }
  loadPlayerData(playerName);
});

// Logout
btnLogout.addEventListener("click", () => {
  pauseCollecting();
  playerName = null;
  playerNameInput.value = "";
  playerNameInputContainer.style.display = "flex";
  gameUI.style.display = "none";
});

// On page load if player saved?
window.addEventListener("load", () => {
  const savedPlayers = JSON.parse(localStorage.getItem("players") || "{}");
  if (!savedPlayers) return;
  players = savedPlayers;
});
