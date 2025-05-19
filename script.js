// =======================
// Variabel dan Data Game
// =======================

let playerName = "";
let players = {}; // semua data player { playerName: {...data} }

// Item limited dengan rarity dan gambar
const rarityColors = {
  common: "#cccccc",
  rare: "#4ade80",
  epic: "#a78bfa",
  legend: "#facc15",
};

const limitedItems = [
  {
    id: "sword",
    name: "Pedang Legendaris",
    price: 500,
    rarity: "legend",
    img: "assets/pedang-legend.png",
  },
  {
    id: "statue",
    name: "Patung Megah",
    price: 700,
    rarity: "epic",
    img: "assets/patung-megah.png",
  },
  {
    id: "shield",
    name: "Perisai Perkasa",
    price: 600,
    rarity: "rare",
    img: "assets/perisai-gila.png",
  },
  {
    id: "hat",
    name: "Topi Biasa",
    price: 100,
    rarity: "common",
    img: "assets/topi-biasa.png",
  },
];

// ===== Game State =====
let crystals = 0;
let collectorLevel = 1;
let upgradeCost = 10;
let collecting = false;
let collectingInterval = null;
let rareClaimedToday = false;
let boosterActive = false;
let boosterEndTime = 0;
const AUTO_UPGRADE_INTERVAL = 5000;
let autoUpgradeEnabled = false;
let autoUpgradeInterval = null;
let ownedItems = [];
let equippedItem = null;

// ===== DOM Elements =====
const crystalsEl = document.getElementById("crystals");
const levelEl = document.getElementById("collectorLevel");
const upgradeCostEl = document.getElementById("upgradeCost");
const btnStartPause = document.getElementById("btnStartPause");
const boosterStatusEl = document.getElementById("boosterStatus");
const rareItemEl = document.getElementById("rareItem");
const limitedItemsListEl = document.getElementById("limitedItemsList");
const skinImageEl = document.getElementById("skinImage");
const skinNameEl = document.getElementById("skinName");
const animationContainer = document.getElementById("animationContainer");
const btnToggleAutoUpgrade = document.getElementById("btnToggleAutoUpgrade");
const transferItemSelect = document.getElementById("transferItemSelect");
const transferToPlayerInput = document.getElementById("transferToPlayer");
const leaderboardListEl = document.getElementById("leaderboardList");
const playerNameInputContainer = document.getElementById(
  "playerNameInputContainer"
);
const playerNameInput = document.getElementById("playerNameInput");
const gameUI = document.getElementById("gameUI");

const soundUpgrade = document.getElementById("soundUpgrade");
const soundRare = document.getElementById("soundRare");

// ======================
// Fungsi Set Nama Player & Load Data
// ======================
function setPlayerName() {
  const name = playerNameInput.value.trim();
  if (!name) return alert("Nama player harus diisi!");
  playerName = name;

  const savedPlayers = localStorage.getItem("players");
  players = savedPlayers ? JSON.parse(savedPlayers) : {};

  if (!players[playerName]) {
    players[playerName] = {
      crystals: 0,
      collectorLevel: 1,
      ownedItems: [],
      equippedItem: null,
      lastRareClaimDate: null,
      boosterEndTime: 0,
    };
  }

  loadPlayerData();

  playerNameInputContainer.style.display = "none";
  gameUI.style.display = "block";

  updateUI();
  renderLimitedItems();
  updateTransferItemsSelect();
  updateLeaderboard();

  if (autoUpgradeEnabled) startAutoUpgrade();
}

function loadPlayerData() {
  const p = players[playerName];
  crystals = p.crystals;
  collectorLevel = p.collectorLevel;
  ownedItems = p.ownedItems;
  equippedItem = p.equippedItem;
  boosterEndTime = p.boosterEndTime || 0;

  boosterActive = Date.now() < boosterEndTime;

  const lastDate = p.lastRareClaimDate;
  if (lastDate) {
    const todayStr = new Date().toISOString().slice(0, 10);
    rareClaimedToday = lastDate === todayStr;
  } else {
    rareClaimedToday = false;
  }
}

function savePlayerData() {
  players[playerName] = {
    crystals,
    collectorLevel,
    ownedItems,
    equippedItem,
    lastRareClaimDate: rareClaimedToday
      ? new Date().toISOString().slice(0, 10)
      : null,
    boosterEndTime,
  };
  localStorage.setItem("players", JSON.stringify(players));
  updateLeaderboard();
}

// ===================
// Update UI
// ===================
function updateUI() {
  crystalsEl.textContent = crystals;
  levelEl.textContent = collectorLevel;
  upgradeCostEl.textContent = upgradeCost;

  boosterStatusEl.textContent = boosterActive
    ? "Booster: Aktif (x2 crystals)"
    : "Booster: Tidak aktif";

  rareItemEl.style.display = rareClaimedToday ? "none" : "block";

  if (equippedItem) {
    const item = limitedItems.find((i) => i.id === equippedItem);
    if (item) {
      skinImageEl.src = item.img;
      skinNameEl.textContent = item.name;
      skinImageEl.style.borderColor = rarityColors[item.rarity] || "#333";
      skinImageEl.className = "skin-image " + item.rarity;
    } else {
      resetSkinUI();
    }
  } else {
    resetSkinUI();
  }
}

function resetSkinUI() {
  skinImageEl.src = "";
  skinNameEl.textContent = "Tidak ada item";
  skinImageEl.style.borderColor = "#333";
  skinImageEl.className = "skin-image";
}

// ===================
// Collecting Crystals
// ===================
function toggleCollecting() {
  collecting = !collecting;
  if (collecting) {
    btnStartPause.textContent = "Berhenti Kumpul";
    startCollecting();
  } else {
    btnStartPause.textContent = "Mulai Kumpul";
    stopCollecting();
  }
}

function startCollecting() {
  if (collectingInterval) clearInterval(collectingInterval);
  collectingInterval = setInterval(() => {
    let crystalsPerTick = collectorLevel;
    if (boosterActive) crystalsPerTick *= 2;
    crystals += crystalsPerTick;
    updateUI();
    savePlayerData();
  }, 1000);
}

function stopCollecting() {
  if (collectingInterval) clearInterval(collectingInterval);
}

// ===================
// Upgrade Collector
// ===================
function upgradeCollector() {
  if (crystals >= upgradeCost) {
    crystals -= upgradeCost;
    collectorLevel++;
    upgradeCost = Math.floor(upgradeCost * 1.5);
    soundUpgrade.play();
    updateUI();
    savePlayerData();
  } else {
    alert("Crystal tidak cukup!");
  }
}

// ===================
// Auto Upgrade
// ===================
function toggleAutoUpgrade() {
  autoUpgradeEnabled = !autoUpgradeEnabled;
  btnToggleAutoUpgrade.textContent =
    "Auto Upgrade: " + (autoUpgradeEnabled ? "ON" : "OFF");
  if (autoUpgradeEnabled) startAutoUpgrade();
  else stopAutoUpgrade();
}

function startAutoUpgrade() {
  if (autoUpgradeInterval) clearInterval(autoUpgradeInterval);
  autoUpgradeInterval = setInterval(() => {
    if (crystals >= upgradeCost) upgradeCollector();
  }, AUTO_UPGRADE_INTERVAL);
}

function stopAutoUpgrade() {
  if (autoUpgradeInterval) clearInterval(autoUpgradeInterval);
}

// ===================
// Claim Rare Item
// ===================
function claimRareItem() {
  if (rareClaimedToday) return alert("Sudah claim hari ini!");
  crystals += 100;
  rareClaimedToday = true;
  soundRare.play();
  updateUI();
  savePlayerData();
}

// ===================
// Booster
// ===================
function buyBooster() {
  if (crystals >= 50) {
    crystals -= 50;
    boosterActive = true;
    boosterEndTime = Date.now() + 60000; // booster 1 menit
    updateUI();
    savePlayerData();
    setTimeout(() => {
      boosterActive = false;
      updateUI();
      savePlayerData();
    }, 60000);
  } else {
    alert("Crystal tidak cukup!");
  }
}

// ===================
// Render Limited Items (Toko)
// ===================
function renderLimitedItems() {
  limitedItemsListEl.innerHTML = "";
  limitedItems.forEach((item) => {
    const div = document.createElement("div");
    div.className = "limited-item " + item.rarity;
    div.style.borderColor = rarityColors[item.rarity];
    div.style.boxShadow = "0 0 8px " + rarityColors[item.rarity];
    div.style.borderWidth = "2px";

    const img = document.createElement("img");
    img.src = item.img;
    img.alt = item.name;

    const name = document.createElement("div");
    name.textContent = item.name;

    const price = document.createElement("div");
    price.textContent = item.price + " Crystals";

    const btnBuy = document.createElement("button");
    btnBuy.textContent = "Beli";
    btnBuy.onclick = () => buyLimitedItem(item.id);

    div.appendChild(img);
    div.appendChild(name);
    div.appendChild(price);
    div.appendChild(btnBuy);

    limitedItemsListEl.appendChild(div);
  });
}

// ===================
// Beli Limited Item
// ===================
function buyLimitedItem(itemId) {
  const item = limitedItems.find((i) => i.id === itemId);
  if (!item) return alert("Item tidak ditemukan");

  // Cek kepemilikan terbatas max 100 player
  let ownerCount = 0;
  for (const p in players) {
    if (players[p].ownedItems.includes(itemId)) ownerCount++;
  }
  if (ownerCount >= 100) {
    return alert(
      "Item ini sudah dimiliki oleh 100 pemain lain, tidak bisa beli lagi."
    );
  }

  if (crystals >= item.price) {
    crystals -= item.price;
    if (!ownedItems.includes(itemId)) ownedItems.push(itemId);
    equippedItem = itemId; // langsung equip
    alert("Berhasil beli dan memakai item: " + item.name);
    savePlayerData();
    updateUI();
    updateTransferItemsSelect();
  } else {
    alert("Crystal tidak cukup!");
  }
}

// ===================
// Update Pilihan Item untuk Transfer
// ===================
function updateTransferItemsSelect() {
  transferItemSelect.innerHTML = "";
  ownedItems.forEach((itemId) => {
    const item = limitedItems.find((i) => i.id === itemId);
    if (!item) return;
    const opt = document.createElement("option");
    opt.value = itemId;
    opt.textContent = item.name + ` (${item.rarity})`;
    transferItemSelect.appendChild(opt);
  });
}

// ===================
// Transfer Item ke Player Lain
// ===================
function transferItem() {
  const itemId = transferItemSelect.value;
  const toPlayer = transferToPlayerInput.value.trim();

  if (!itemId) return alert("Pilih item untuk ditransfer");
  if (!toPlayer) return alert("Masukkan nama player tujuan");
  if (toPlayer === playerName)
    return alert("Tidak bisa transfer ke diri sendiri");
  if (!players[toPlayer]) return alert("Player tujuan tidak ditemukan");
  if (!ownedItems.includes(itemId))
    return alert("Kamu tidak memiliki item ini");

  // Transfer item
  ownedItems = ownedItems.filter((id) => id !== itemId);
  if (equippedItem === itemId) equippedItem = null;

  players[toPlayer].ownedItems = players[toPlayer].ownedItems || [];
  if (!players[toPlayer].ownedItems.includes(itemId)) {
    players[toPlayer].ownedItems.push(itemId);
  }

  alert(`Berhasil transfer item ke ${toPlayer}`);

  savePlayerData();
  updateUI();
  updateTransferItemsSelect();
}

// ===================
// Update Leaderboard
// ===================
function updateLeaderboard() {
  const arr = Object.entries(players).sort(
    (a, b) => b[1].crystals - a[1].crystals
  );

  leaderboardListEl.innerHTML = "";
  arr.slice(0, 10).forEach(([name, data], idx) => {
    const li = document.createElement("li");
    li.textContent = `${name} - Crystals: ${data.crystals} - Level: ${data.collectorLevel} - Items: ${data.ownedItems.length}`;
    leaderboardListEl.appendChild(li);
  });
}
