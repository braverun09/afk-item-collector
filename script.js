// DOM
const crystalsEl = document.getElementById("crystals");
const collectorLevelEl = document.getElementById("collectorLevel");
const upgradeCostEl = document.getElementById("upgradeCost");
const boosterStatusEl = document.getElementById("boosterStatus");

const playerNameInput = document.getElementById("playerNameInput");
const btnSetName = document.getElementById("btnSetName");
const btnStartPause = document.getElementById("btnStartPause");
const btnUpgrade = document.getElementById("btnUpgrade");
const btnToggleAutoUpgrade = document.getElementById("btnToggleAutoUpgrade");
const btnBuyBooster = document.getElementById("btnBuyBooster");
const btnLogout = document.getElementById("btnLogout");
const btnTransfer = document.getElementById("btnTransfer");

const loginScreen = document.getElementById("loginScreen");
const gameUI = document.getElementById("gameUI");
const playerNameDisplay = document.getElementById("playerNameDisplay");

const equippedItemDisplay = document.getElementById("equippedItemDisplay");
const skinImage = document.getElementById("skinImage");
const skinName = document.getElementById("skinName");

const bagItemsEl = document.getElementById("bagItems");
const limitedItemsList = document.getElementById("limitedItemsList");
const regularItemsList = document.getElementById("regularItemsList");
const leaderboardList = document.getElementById("leaderboardList");

const transferItemSelect = document.getElementById("transferItemSelect");
const transferToPlayerInput = document.getElementById("transferToPlayerInput");

// State
let playerName = null;
let players = JSON.parse(localStorage.getItem("players") || "{}");
let crystals = 0;
let collectorLevel = 1;
let upgradeCost = 10;
let collecting = false;
let autoUpgradeEnabled = false;
let collectInterval = null;
let autoUpgradeInterval = null;
let boosterActive = false;
let boosterEndTime = 0;

// Constants
const AUTO_UPGRADE_INTERVAL = 2000;
const BOOSTER_COST = 50;
const BOOSTER_DURATION = 30000;

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
    price: 250,
  },
  {
    id: "skin_3",
    name: "Skin Rare",
    rarity: "rare",
    img: "assets/rare-armor.png",
    price: 500,
  },
  {
    id: "skin_4",
    name: "Skin Epic",
    rarity: "epic",
    img: "assets/epic-armor.png",
    price: 1000,
  },
  {
    id: "skin_5",
    name: "Skin Legend",
    rarity: "legend",
    img: "assets/legend-armor.png",
    price: 2000,
  },
];

const LIMITED_ITEMS = [
  {
    id: "limited_1",
    name: "Legendary Sword",
    rarity: "legend",
    img: "assets/pedang-legend.png",
    price: 3000,
    maxOwners: 100,
  },
  {
    id: "limited_2",
    name: "Epic Shield",
    rarity: "epic",
    img: "assets/perisai-gila.png",
    price: 2000,
    maxOwners: 100,
  },
];

// Init
function save() {
  localStorage.setItem("players", JSON.stringify(players));
}

function updateUI() {
  crystalsEl.textContent = crystals;
  collectorLevelEl.textContent = collectorLevel;
  upgradeCostEl.textContent = upgradeCost;
  btnUpgrade.disabled = crystals < upgradeCost;
  btnBuyBooster.disabled = crystals < BOOSTER_COST;
  updateBoosterStatus();
  renderBag();
  renderEquippedItem();
  renderRegularShop();
  renderLimitedShop();
  renderTransferItems();
  renderLeaderboard();
}

function updateBoosterStatus() {
  if (boosterActive && boosterEndTime > Date.now()) {
    const timeLeft = boosterEndTime - Date.now();
    const min = Math.floor(timeLeft / 60000);
    const sec = Math.floor((timeLeft % 60000) / 1000);
    boosterStatusEl.textContent = `Booster: Aktif (${min}m ${sec}s)`;
  } else {
    boosterActive = false;
    boosterStatusEl.textContent = "Booster: Tidak Aktif";
    players[playerName].boosterEndTime = 0;
    save();
  }
}

function startCollecting() {
  if (collecting) return;
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

function upgradeCollector() {
  if (crystals < upgradeCost) return;
  crystals -= upgradeCost;
  collectorLevel++;
  upgradeCost = Math.floor(10 * Math.pow(1.5, collectorLevel - 1));
  players[playerName].collectorLevel = collectorLevel;
  players[playerName].crystals = crystals;
  save();
  updateUI();
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
  if (crystals < BOOSTER_COST) return;
  crystals -= BOOSTER_COST;
  boosterEndTime = Date.now() + BOOSTER_DURATION;
  boosterActive = true;
  players[playerName].boosterEndTime = boosterEndTime;
  players[playerName].crystals = crystals;
  save();
  updateUI();
}

function equipItem(itemId) {
  players[playerName].equippedItem = itemId;
  save();
  renderEquippedItem();
}

function renderEquippedItem() {
  const itemId = players[playerName].equippedItem;
  if (!itemId) {
    skinImage.src = "";
    skinName.textContent = "Belum ada item";
    equippedItemDisplay.style.opacity = 0.6;
    return;
  }
  const item = [...ITEMS, ...LIMITED_ITEMS].find((i) => i.id === itemId);
  if (!item) return;
  skinImage.src = item.img;
  skinImage.alt = item.name;
  skinName.textContent = `${item.name} (${RARITY_NAMES[item.rarity]})`;
  equippedItemDisplay.style.opacity = 1;
}

function renderBag() {
  const bag = players[playerName].ownedItems || [];
  bagItemsEl.innerHTML = "";
  if (bag.length === 0) return (bagItemsEl.textContent = "Tas kosong");

  bag.forEach((id) => {
    const item = [...ITEMS, ...LIMITED_ITEMS].find((i) => i.id === id);
    if (!item) return;
    const div = document.createElement("div");
    div.className = `bag-item ${item.rarity}`;
    div.innerHTML = `<img src="${item.img}" alt="${item.name}" /><div>${item.name}</div>`;
    div.onclick = () => equipItem(item.id);
    bagItemsEl.appendChild(div);
  });
}

function renderRegularShop() {
  regularItemsList.innerHTML = "";
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
      div.onclick = () => buyItem(item);
      div.style.cursor = "pointer";
    } else {
      div.style.opacity = 0.5;
    }
    regularItemsList.appendChild(div);
  });
}

function buyItem(item) {
  if (players[playerName].ownedItems.includes(item.id)) return;
  crystals -= item.price;
  players[playerName].ownedItems.push(item.id);
  players[playerName].crystals = crystals;
  save();
  updateUI();
}

function renderLimitedShop() {
  limitedItemsList.innerHTML = "";
  LIMITED_ITEMS.forEach((item) => {
    let count = Object.values(players).filter((p) =>
      p.ownedItems.includes(item.id)
    ).length;
    const owned = players[playerName].ownedItems.includes(item.id);
    const soldOut = count >= item.maxOwners;
    const div = document.createElement("div");
    div.className = `shop-item ${item.rarity}`;
    div.innerHTML = `
      <img src="${item.img}" alt="${item.name}" />
      <div>${item.name}</div>
      <div>Harga: ${item.price}</div>
      <div>${soldOut ? "Terjual Habis" : owned ? "Dimiliki" : "Tersedia"}</div>
    `;
    if (!owned && !soldOut && crystals >= item.price) {
      div.onclick = () => buyItem(item);
      div.style.cursor = "pointer";
    } else {
      div.style.opacity = 0.5;
    }
    limitedItemsList.appendChild(div);
  });
}

function renderTransferItems() {
  transferItemSelect.innerHTML = '<option value="">Pilih item</option>';
  const owned = players[playerName].ownedItems;
  owned.forEach((id) => {
    const item = [...ITEMS, ...LIMITED_ITEMS].find((i) => i.id === id);
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = `${item.name} (${RARITY_NAMES[item.rarity]})`;
    transferItemSelect.appendChild(opt);
  });
}

function transferItem() {
  const itemId = transferItemSelect.value;
  const to = transferToPlayerInput.value.trim();
  if (!itemId || !to || !players[to] || to === playerName)
    return alert("Transfer gagal.");
  const index = players[playerName].ownedItems.indexOf(itemId);
  if (index === -1) return;
  players[playerName].ownedItems.splice(index, 1);
  players[to].ownedItems.push(itemId);
  save();
  updateUI();
}

function renderLeaderboard() {
  leaderboardList.innerHTML = "";
  const entries = Object.entries(players).sort(
    (a, b) => (b[1].crystals || 0) - (a[1].crystals || 0)
  );
  entries.forEach(([name, data]) => {
    const li = document.createElement("li");
    li.innerHTML = `${name} <span>${data.crystals || 0}</span>`;
    leaderboardList.appendChild(li);
  });
}

function loadPlayer(name) {
  if (!players[name]) return;
  const data = players[name];
  playerName = name;
  crystals = data.crystals || 0;
  collectorLevel = data.collectorLevel || 1;
  upgradeCost = Math.floor(10 * Math.pow(1.5, collectorLevel - 1));
  boosterEndTime = data.boosterEndTime || 0;
  boosterActive = boosterEndTime > Date.now();
  playerNameDisplay.textContent = name;
  loginScreen.style.display = "none";
  gameUI.classList.remove("hidden");
  updateUI();
}

// Events
btnSetName.onclick = () => {
  const name = playerNameInput.value.trim();
  if (!name) return alert("Nama tidak boleh kosong");
  if (!players[name]) {
    players[name] = {
      crystals: 0,
      collectorLevel: 1,
      boosterEndTime: 0,
      ownedItems: [],
      equippedItem: null,
    };
    save();
  }
  loadPlayer(name);
};

btnLogout.onclick = () => {
  playerName = null;
  gameUI.classList.add("hidden");
  loginScreen.style.display = "flex";
};

btnStartPause.onclick = () => {
  collecting ? stopCollecting() : startCollecting();
};

btnUpgrade.onclick = upgradeCollector;
btnToggleAutoUpgrade.onclick = toggleAutoUpgrade;
btnBuyBooster.onclick = buyBooster;
btnTransfer.onclick = transferItem;
