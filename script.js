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

const rareItemEl = document.getElementById("rareItem");

const equippedItemDisplay = document.getElementById("equippedItemDisplay");
const skinImage = document.getElementById("skinImage");
const skinName = document.getElementById("skinName");

const bagItemsEl = document.getElementById("bagItems");
const limitedItemsListEl = document.getElementById("limitedItemsList");

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
  },
  {
    id: "skin_2",
    name: "Skin Uncommon",
    rarity: "uncommon",
    img: "assets/uncommon-armor.png",
  },
  {
    id: "skin_3",
    name: "Skin Rare",
    rarity: "rare",
    img: "assets/rare-armor.png",
  },
  {
    id: "skin_4",
    name: "Skin Epic",
    rarity: "epic",
    img: "assets/epic-armor.png",
  },
  {
    id: "skin_5",
    name: "Skin Legend",
    rarity: "legend",
    img: "assets/legend-armor.png",
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

  updateUI();
  renderBag();
  renderEquippedItem();
  renderLimitedShop();
  renderTransferItems();
  renderLeaderboard();
  updateBoosterStatus();
}

// Update booster status text
function updateBoosterStatus() {
  if (boosterActive) {
    const remaining = Math.max(0, boosterEndTime - Date.now());
    if (remaining <= 0) {
      boosterActive = false;
      players[playerName].boosterEndTime = 0;
      savePlayers();
      boosterStatusEl.textContent = "Booster: Tidak aktif";
    } else {
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      boosterStatusEl.textContent = `Booster: Aktif (${mins}m ${secs}s)`;
    }
  } else {
    boosterStatusEl.textContent = "Booster: Tidak aktif";
  }
}

// Update UI
function updateUI() {
  crystalsEl.textContent = crystals;
  collectorLevelEl.textContent = collectorLevel;
  upgradeCostEl.textContent = upgradeCost;

  btnStartPause.disabled = false;
  btnUpgrade.disabled = crystals < upgradeCost;
  btnBuyBooster.disabled = crystals < 50;

  updateBoosterStatus();
}

// Render bag items
function renderBag() {
  if (!players[playerName].ownedItems.length) {
    bagItemsEl.textContent = "Tas kosong";
    transferItemSelect.innerHTML =
      '<option value="">- Tidak ada item -</option>';
    return;
  }
  bagItemsEl.innerHTML = "";
  transferItemSelect.innerHTML = '<option value="">- Pilih item -</option>';
  players[playerName].ownedItems.forEach((itemId) => {
    const item =
      ITEMS.find((i) => i.id === itemId) ||
      LIMITED_ITEMS.find((i) => i.id === itemId);
    if (!item) return;

    const div = document.createElement("div");
    div.className = "bag-item " + item.rarity;
    div.title = `${item.name} (${RARITY_NAMES[item.rarity]})`;
    div.dataset.itemId = item.id;
    div.innerHTML = `<img src="${item.img}" alt="${item.name}" /><span>${item.name}</span>`;
    div.onclick = () => {
      equipItem(item.id);
    };
    bagItemsEl.appendChild(div);

    // Add to transfer select
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = `${item.name} (${RARITY_NAMES[item.rarity]})`;
    transferItemSelect.appendChild(opt);
  });
}

// Equip item (show in skin display)
function equipItem(itemId) {
  players[playerName].equippedItem = itemId;
  savePlayers();
  renderEquippedItem();
}

function renderEquippedItem() {
  const equippedId = players[playerName].equippedItem;
  if (!equippedId) {
    skinImage.src = "";
    skinName.textContent = "Tidak ada item";
    equippedItemDisplay.style.opacity = 0.6;
  } else {
    const item =
      ITEMS.find((i) => i.id === equippedId) ||
      LIMITED_ITEMS.find((i) => i.id === equippedId);
    if (!item) return;
    skinImage.src = item.img;
    skinImage.alt = item.name;
    skinName.textContent = `${item.name} (${RARITY_NAMES[item.rarity]})`;
    equippedItemDisplay.style.opacity = 1;
  }
}

// Render limited shop items with ownership check
function renderLimitedShop() {
  limitedItemsListEl.innerHTML = "";
  LIMITED_ITEMS.forEach((item) => {
    // Count owners
    let ownerCount = 0;
    for (const p in players) {
      if (players[p].ownedItems.includes(item.id)) ownerCount++;
    }

    const owned = players[playerName].ownedItems.includes(item.id);
    const soldOut = ownerCount >= item.maxOwners;

    const div = document.createElement("div");
    div.className = "shop-item " + item.rarity;
    div.title = `${item.name} (${RARITY_NAMES[item.rarity]}) - Harga: ${
      item.price
    } Crystals`;
    div.innerHTML = `
      <img src="${item.img}" alt="${item.name}" />
      <div>${item.name}</div>
      <div>Harga: ${item.price}</div>
      <div>${soldOut ? "Terjual habis" : owned ? "Dimiliki" : "Tersedia"}</div>
    `;
    if (!owned && !soldOut && crystals >= item.price) {
      div.style.cursor = "pointer";
      div.onclick = () => {
        buyLimitedItem(item.id);
      };
    } else {
      div.style.opacity = 0.5;
    }
    limitedItemsListEl.appendChild(div);
  });
}

// Buy limited item
function buyLimitedItem(itemId) {
  const item = LIMITED_ITEMS.find((i) => i.id === itemId);
  if (!item) return;
  if (crystals < item.price) {
    alert("Crystals tidak cukup!");
    return;
  }
  // Check ownership limit
  let ownerCount = 0;
  for (const p in players) {
    if (players[p].ownedItems.includes(itemId)) ownerCount++;
  }
  if (ownerCount >= item.maxOwners) {
    alert("Item sudah terjual habis!");
    renderLimitedShop();
    return;
  }

  crystals -= item.price;
  players[playerName].crystals = crystals;
  players[playerName].ownedItems.push(itemId);
  savePlayers();
  updateUI();
  renderBag();
  renderLimitedShop();
  alert(`Berhasil membeli ${item.name}!`);
}

// Toggle collecting
function toggleCollecting() {
  if (collecting) {
    stopCollecting();
  } else {
    startCollecting();
  }
}

function startCollecting() {
  collecting = true;
  btnStartPause.textContent = "Berhenti Kumpul";
  collectInterval = setInterval(() => {
    let gain = collectorLevel;
    if (boosterActive) gain *= 2;
    crystals += gain;
    players[playerName].crystals = crystals;
    updateUI();
  }, 1000);
}

function stopCollecting() {
  collecting = false;
  btnStartPause.textContent = "Mulai Kumpul";
  clearInterval(collectInterval);
}

// Upgrade collector level
function upgradeCollector() {
  if (crystals < upgradeCost) return;
  crystals -= upgradeCost;
  collectorLevel++;
  upgradeCost = Math.floor(10 * Math.pow(1.5, collectorLevel - 1));
  players[playerName].crystals = crystals;
  players[playerName].collectorLevel = collectorLevel;
  savePlayers();
  updateUI();
}

// Toggle auto upgrade
function toggleAutoUpgrade() {
  autoUpgradeEnabled = !autoUpgradeEnabled;
  btnToggleAutoUpgrade.textContent = autoUpgradeEnabled
    ? "Auto Upgrade ON"
    : "Auto Upgrade OFF";
  if (autoUpgradeEnabled) {
    autoUpgradeInterval = setInterval(() => {
      if (crystals >= upgradeCost) {
        upgradeCollector();
      }
    }, AUTO_UPGRADE_INTERVAL);
  } else {
    clearInterval(autoUpgradeInterval);
  }
}

// Buy booster (double crystals for 30s)
function buyBooster() {
  if (crystals < 50) return alert("Crystals tidak cukup untuk booster!");
  crystals -= 50;
  boosterActive = true;
  boosterEndTime = Date.now() + 30000;
  players[playerName].crystals = crystals;
  players[playerName].boosterEndTime = boosterEndTime;
  savePlayers();
  updateUI();
}

// Set player name and initialize data
function setPlayerName() {
  const name = playerNameInput.value.trim();
  if (!name) {
    alert("Nama pemain tidak boleh kosong!");
    return;
  }
  playerName = name;
  if (!players[playerName]) {
    players[playerName] = {
      crystals: 0,
      collectorLevel: 1,
      boosterEndTime: 0,
      ownedItems: [],
      equippedItem: null,
      transfers: [],
      score: 0,
    };
    savePlayers();
  }
  playerNameInputContainer.style.display = "none";
  gameUI.style.display = "block";
  loadPlayerData(playerName);
}

// Transfer item to another player
function transferItem() {
  const itemId = transferItemSelect.value;
  const toPlayer = transferToPlayerInput.value.trim();
  if (!itemId) {
    alert("Pilih item yang ingin ditransfer!");
    return;
  }
  if (!toPlayer) {
    alert("Masukkan nama pemain tujuan!");
    return;
  }
  if (!players[toPlayer]) {
    alert("Pemain tujuan tidak ditemukan!");
    return;
  }
  if (toPlayer === playerName) {
    alert("Tidak bisa transfer ke diri sendiri!");
    return;
  }
  const playerData = players[playerName];
  const index = playerData.ownedItems.indexOf(itemId);
  if (index === -1) {
    alert("Item tidak ditemukan di tas Anda!");
    return;
  }

  // Remove from sender
  playerData.ownedItems.splice(index, 1);
  // Add to receiver
  players[toPlayer].ownedItems.push(itemId);

  savePlayers();
  renderBag();
  renderTransferItems();

  alert(`Berhasil mentransfer item ke ${toPlayer}`);
}

// Render transfer items dropdown
function renderTransferItems() {
  if (!players[playerName].ownedItems.length) {
    transferItemSelect.innerHTML =
      '<option value="">- Tidak ada item -</option>';
  }
}

// Render leaderboard
function renderLeaderboard() {
  const entries = Object.entries(players);
  entries.sort((a, b) => {
    return (b[1].score || 0) - (a[1].score || 0);
  });
  leaderboardList.innerHTML = "";
  for (const [name, data] of entries) {
    const li = document.createElement("li");
    li.textContent = name;
    const span = document.createElement("span");
    span.textContent = data.score || 0;
    li.appendChild(span);
    leaderboardList.appendChild(li);
  }
}

// Event listeners
btnStartPause.onclick = toggleCollecting;
btnUpgrade.onclick = upgradeCollector;
btnToggleAutoUpgrade.onclick = toggleAutoUpgrade;
btnBuyBooster.onclick = buyBooster;
btnSetName.onclick = setPlayerName;
btnTransfer.onclick = transferItem;
btnLogout.onclick = () => {
  playerName = null;
  gameUI.style.display = "none";
  playerNameInputContainer.style.display = "block";
};
