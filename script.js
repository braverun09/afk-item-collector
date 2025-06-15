// Versi Game
const GAME_VERSION = "v1.2.1";

// Element DOM
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
const gameVersion = document.getElementById("gameVersion");

const rareItemEl = document.getElementById("rareItem");
const equippedItemDisplay = document.getElementById("equippedItemDisplay");
const skinImage = document.getElementById("skinImage");
const skinName = document.getElementById("skinName");

const bagItemsEl = document.getElementById("bagItems");
const regularItemsListEl = document.getElementById("regularItemsList");
const limitedItemsListEl = document.getElementById("limitedItemsList");

const transferItemSelect = document.getElementById("transferItemSelect");
const transferToPlayerInput = document.getElementById("transferToPlayerInput");
const btnTransfer = document.getElementById("btnTransfer");

const leaderboardList = document.getElementById("leaderboardList");

// Game Data
let playerName = null;
let players = JSON.parse(localStorage.getItem("players") || "{}");

let crystals = 0;
let collectorLevel = 1;
let upgradeCost = 10;
let collecting = false;
let collectInterval = null;
let autoUpgradeEnabled = false;
let autoUpgradeInterval = null;
const AUTO_UPGRADE_INTERVAL = 3000;

let boosterActive = false;
let boosterEndTime = 0;

const RARITY_LEVELS = ["common", "uncommon", "rare", "epic", "legend"];
const RARITY_NAMES = {
  common: "Biasa",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legend: "Legendary",
};

// Shop Items
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
    price: 200,
  },
  {
    id: "skin_3",
    name: "Skin Rare",
    rarity: "rare",
    img: "assets/rare-armor.png",
    price: 400,
  },
  {
    id: "skin_4",
    name: "Skin Epic",
    rarity: "epic",
    img: "assets/epic-armor.png",
    price: 800,
  },
  {
    id: "skin_5",
    name: "Skin Legend",
    rarity: "legend",
    img: "assets/legend-armor.png",
    price: 1200,
  },
];

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

function savePlayers() {
  localStorage.setItem("players", JSON.stringify(players));
}

function loadPlayerData(name) {
  if (!players[name]) return;
  const p = players[name];
  crystals = p.crystals || 0;
  collectorLevel = p.collectorLevel || 1;
  upgradeCost = Math.floor(10 * Math.pow(1.5, collectorLevel - 1));
  boosterEndTime = p.boosterEndTime || 0;
  boosterActive = boosterEndTime > Date.now();
  collecting = false;
  clearInterval(collectInterval);
  autoUpgradeEnabled = false;
  clearInterval(autoUpgradeInterval);

  updateUI();
  renderEquippedItem();
  renderBag();
  renderRegularShop();
  renderLimitedShop();
  renderTransferItems();
  updateLeaderboard();
  updateBoosterStatus();
}

function updateUI() {
  crystalsEl.textContent = crystals;
  collectorLevelEl.textContent = collectorLevel;
  upgradeCostEl.textContent = upgradeCost;
  btnUpgrade.disabled = crystals < upgradeCost;
  btnBuyBooster.disabled = crystals < 50;
}

function updateBoosterStatus() {
  if (boosterActive) {
    const remaining = Math.max(0, boosterEndTime - Date.now());
    if (remaining <= 0) {
      boosterActive = false;
      players[playerName].boosterEndTime = 0;
      savePlayers();
      boosterStatusEl.textContent = "Booster: Tidak aktif";
    } else {
      const secs = Math.floor((remaining / 1000) % 60);
      const mins = Math.floor(remaining / 60000);
      boosterStatusEl.textContent = `Booster: Aktif (${mins}m ${secs}s)`;
    }
  } else {
    boosterStatusEl.textContent = "Booster: Tidak aktif";
  }
}

function renderBag() {
  const bag = players[playerName].ownedItems;
  bagItemsEl.innerHTML = bag.length ? "" : "Tas kosong";

  transferItemSelect.innerHTML = bag.length
    ? ""
    : '<option value="">Tidak ada item</option>';
  bag.forEach((id) => {
    const item =
      ITEMS.find((i) => i.id === id) || LIMITED_ITEMS.find((i) => i.id === id);
    const div = document.createElement("div");
    div.className = `bag-item ${item.rarity}`;
    div.innerHTML = `<img src="${item.img}" alt="${item.name}" /><span>${item.name}</span>`;
    div.onclick = () => equipItem(id);
    bagItemsEl.appendChild(div);

    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = item.name;
    transferItemSelect.appendChild(opt);
  });
}

function equipItem(id) {
  players[playerName].equippedItem = id;
  savePlayers();
  renderEquippedItem();
}

function renderEquippedItem() {
  const itemId = players[playerName].equippedItem;
  const item = [...ITEMS, ...LIMITED_ITEMS].find((i) => i.id === itemId);
  if (!item) {
    skinImage.src = "";
    skinName.textContent = "Tidak ada item";
    return;
  }
  skinImage.src = item.img;
  skinName.textContent = `${item.name} (${RARITY_NAMES[item.rarity]})`;
}

function renderRegularShop() {
  regularItemsListEl.innerHTML = "";
  ITEMS.forEach((item) => {
    const owned = players[playerName].ownedItems.includes(item.id);
    const div = document.createElement("div");
    div.className = `shop-item ${item.rarity}`;
    div.innerHTML = `
      <img src="${item.img}" alt="${item.name}" />
      <div>${item.name}</div>
      <div>Harga: ${item.price}</div>
      <div>${owned ? "Dimiliki" : "Tersedia"}</div>
    `;
    if (!owned && crystals >= item.price) {
      div.onclick = () => {
        crystals -= item.price;
        players[playerName].crystals = crystals;
        players[playerName].ownedItems.push(item.id);
        savePlayers();
        updateUI();
        renderBag();
        renderRegularShop();
      };
    } else {
      div.style.opacity = 0.5;
    }
    regularItemsListEl.appendChild(div);
  });
}

function renderLimitedShop() {
  limitedItemsListEl.innerHTML = "";
  LIMITED_ITEMS.forEach((item) => {
    const owned = players[playerName].ownedItems.includes(item.id);
    const ownerCount = Object.values(players).filter((p) =>
      p.ownedItems.includes(item.id)
    ).length;
    const soldOut = ownerCount >= item.maxOwners;

    const div = document.createElement("div");
    div.className = `shop-item ${item.rarity}`;
    div.innerHTML = `
      <img src="${item.img}" alt="${item.name}" />
      <div>${item.name}</div>
      <div>Harga: ${item.price}</div>
      <div>${soldOut ? "Terjual habis" : owned ? "Dimiliki" : "Tersedia"}</div>
    `;
    if (!owned && !soldOut && crystals >= item.price) {
      div.onclick = () => {
        crystals -= item.price;
        players[playerName].crystals = crystals;
        players[playerName].ownedItems.push(item.id);
        savePlayers();
        updateUI();
        renderBag();
        renderLimitedShop();
      };
    } else {
      div.style.opacity = 0.5;
    }
    limitedItemsListEl.appendChild(div);
  });
}

function toggleCollecting() {
  collecting = !collecting;
  btnStartPause.textContent = collecting ? "Berhenti Kumpul" : "Mulai Kumpul";
  if (collecting) {
    collectInterval = setInterval(() => {
      crystals += boosterActive ? collectorLevel * 2 : collectorLevel;
      players[playerName].crystals = crystals;
      updateUI();
      updateLeaderboard();
    }, 1000);
  } else {
    clearInterval(collectInterval);
  }
}

function upgradeCollector() {
  if (crystals >= upgradeCost) {
    crystals -= upgradeCost;
    collectorLevel++;
    upgradeCost = Math.floor(10 * Math.pow(1.5, collectorLevel - 1));
    players[playerName].crystals = crystals;
    players[playerName].collectorLevel = collectorLevel;
    savePlayers();
    updateUI();
  }
}

function toggleAutoUpgrade() {
  autoUpgradeEnabled = !autoUpgradeEnabled;
  btnToggleAutoUpgrade.textContent = autoUpgradeEnabled
    ? "Auto Upgrade ON"
    : "Auto Upgrade OFF";
  if (autoUpgradeEnabled) {
    autoUpgradeInterval = setInterval(() => {
      if (crystals >= upgradeCost) upgradeCollector();
    }, AUTO_UPGRADE_INTERVAL);
  } else {
    clearInterval(autoUpgradeInterval);
  }
}

function buyBooster() {
  if (crystals < 50) return alert("Crystal tidak cukup!");
  crystals -= 50;
  boosterActive = true;
  boosterEndTime = Date.now() + 60000;
  players[playerName].crystals = crystals;
  players[playerName].boosterEndTime = boosterEndTime;
  savePlayers();
  updateUI();
  updateBoosterStatus();
}

function setPlayerName() {
  const name = playerNameInput.value.trim();
  if (!name) return alert("Isi nama terlebih dahulu!");
  playerName = name;

  if (!players[playerName]) {
    players[playerName] = {
      crystals: 0,
      collectorLevel: 1,
      ownedItems: [],
      equippedItem: null,
      boosterEndTime: 0,
    };
    savePlayers();
  }

  playerNameInputContainer.style.display = "none";
  gameUI.style.display = "block";
  loadPlayerData(playerName);
  gameVersion.textContent = `Versi: ${GAME_VERSION}`;
}

function transferItem() {
  const itemId = transferItemSelect.value;
  const toPlayer = transferToPlayerInput.value.trim();
  if (!itemId || !toPlayer) return alert("Lengkapi form transfer.");
  if (!players[toPlayer]) return alert("Player tujuan tidak ditemukan.");
  if (toPlayer === playerName) return alert("Tidak bisa ke diri sendiri.");

  const index = players[playerName].ownedItems.indexOf(itemId);
  if (index === -1) return;

  players[playerName].ownedItems.splice(index, 1);
  players[toPlayer].ownedItems.push(itemId);
  savePlayers();
  renderBag();
  renderTransferItems();
  alert("Transfer berhasil!");
}

function renderTransferItems() {
  // Sudah diperbarui saat renderBag
}

function updateLeaderboard() {
  const arr = Object.entries(players).sort(
    (a, b) => b[1].crystals - a[1].crystals
  );
  leaderboardList.innerHTML = "";
  arr.slice(0, 10).forEach(([name, data]) => {
    const li = document.createElement("li");
    li.innerHTML = `${name}<span>${data.crystals}</span>`;
    leaderboardList.appendChild(li);
  });
}

// Event Listeners
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
  playerNameInput.value = "";
};

// Realtime leaderboard refresh
setInterval(updateLeaderboard, 5000);
