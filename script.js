let crystals = 0;
let collectorLevel = 1;
let upgradeCost = 10;
let collecting = false;
let collectingInterval = null;

let rareClaimedToday = false;

let boosterActive = false;
let boosterEndTime = 0;

const AUTO_UPGRADE_INTERVAL = 5000; // 5 detik
let autoUpgradeEnabled = false;
let autoUpgradeInterval = null;

const limitedItems = [
  {
    id: "sword",
    name: "Pedang Legendaris",
    price: 500,
    img: "https://cdn-icons-png.flaticon.com/512/616/616408.png",
  },
  {
    id: "statue",
    name: "Patung Megah",
    price: 700,
    img: "https://cdn-icons-png.flaticon.com/512/616/616574.png",
  },
  {
    id: "shield",
    name: "Perisai Perkasa",
    price: 600,
    img: "https://cdn-icons-png.flaticon.com/512/616/616563.png",
  },
];

let ownedItems = [];
let equippedItem = null;

function loadData() {
  const savedCrystals = localStorage.getItem("crystals");
  const savedLevel = localStorage.getItem("collectorLevel");
  const savedUpgradeCost = localStorage.getItem("upgradeCost");
  const savedRareDate = localStorage.getItem("rareClaimedDate");
  const savedBoosterEndTime = localStorage.getItem("boosterEndTime");
  const savedOwnedItems = localStorage.getItem("ownedItems");
  const savedEquippedItem = localStorage.getItem("equippedItem");
  const savedAutoUpgrade = localStorage.getItem("autoUpgradeEnabled");

  if (savedCrystals !== null) crystals = parseInt(savedCrystals);
  if (savedLevel !== null) collectorLevel = parseInt(savedLevel);
  if (savedUpgradeCost !== null) upgradeCost = parseInt(savedUpgradeCost);

  const today = new Date().toDateString();
  if (savedRareDate === today) rareClaimedToday = true;

  if (savedBoosterEndTime !== null) {
    boosterEndTime = parseInt(savedBoosterEndTime);
    if (boosterEndTime > Date.now()) boosterActive = true;
    else boosterActive = false;
  }

  if (savedOwnedItems !== null) ownedItems = JSON.parse(savedOwnedItems);
  else ownedItems = [];

  if (savedEquippedItem !== null && ownedItems.includes(savedEquippedItem))
    equippedItem = savedEquippedItem;
  else equippedItem = null;

  autoUpgradeEnabled = savedAutoUpgrade === "true";

  // Update toggle button text sesuai data
  const btnAuto = document.getElementById("btnToggleAutoUpgrade");
  if (btnAuto)
    btnAuto.textContent = `Auto Upgrade: ${autoUpgradeEnabled ? "ON" : "OFF"}`;
}

function saveData() {
  localStorage.setItem("crystals", crystals);
  localStorage.setItem("collectorLevel", collectorLevel);
  localStorage.setItem("upgradeCost", upgradeCost);
  if (rareClaimedToday) {
    localStorage.setItem("rareClaimedDate", new Date().toDateString());
  }
  if (boosterActive) {
    localStorage.setItem("boosterEndTime", boosterEndTime.toString());
  } else {
    localStorage.removeItem("boosterEndTime");
  }
  localStorage.setItem("ownedItems", JSON.stringify(ownedItems));
  localStorage.setItem("equippedItem", equippedItem);
  localStorage.setItem("autoUpgradeEnabled", autoUpgradeEnabled.toString());
}

function toggleCollecting() {
  if (collecting) stopCollecting();
  else startCollecting();
}

function startCollecting() {
  if (collecting) return;
  collecting = true;
  document.getElementById("btnStartPause").textContent = "Pause Kumpul";

  collectingInterval = setInterval(() => {
    let gain = collectorLevel;
    if (boosterActive) gain *= 2;
    crystals += gain;
    updateDisplay();
    playCrystalAnimation();
    saveData();
  }, 1000);

  if (autoUpgradeEnabled && !autoUpgradeInterval) {
    startAutoUpgrade();
  }
}

function stopCollecting() {
  if (!collecting) return;
  collecting = false;
  document.getElementById("btnStartPause").textContent = "Mulai Kumpul";
  clearInterval(collectingInterval);
}

function upgradeCollector() {
  if (crystals >= upgradeCost) {
    crystals -= upgradeCost;
    collectorLevel++;
    upgradeCost = Math.floor(upgradeCost * 1.5);
    updateDisplay();
    saveData();
    document.getElementById("soundUpgrade").play();
  } else {
    alert("Crystals belum cukup untuk upgrade!");
  }
}

function startAutoUpgrade() {
  if (autoUpgradeInterval) return;
  autoUpgradeInterval = setInterval(() => {
    if (collectorLevel < 100 && crystals >= upgradeCost) {
      upgradeCollector();
    }
  }, AUTO_UPGRADE_INTERVAL);
}

function stopAutoUpgrade() {
  if (autoUpgradeInterval) {
    clearInterval(autoUpgradeInterval);
    autoUpgradeInterval = null;
  }
}

function toggleAutoUpgrade() {
  autoUpgradeEnabled = !autoUpgradeEnabled;
  const btn = document.getElementById("btnToggleAutoUpgrade");
  btn.textContent = `Auto Upgrade: ${autoUpgradeEnabled ? "ON" : "OFF"}`;

  if (autoUpgradeEnabled) {
    startAutoUpgrade();
  } else {
    stopAutoUpgrade();
  }
  saveData();
}

function updateDisplay() {
  document.getElementById("crystals").textContent = crystals;
  document.getElementById("collectorLevel").textContent = collectorLevel;
  document.getElementById("upgradeCost").textContent = upgradeCost;
  updateRareItem();
  updateBoosterStatus();
  renderLimitedShop();
  updateSkinDisplay();
}

function updateRareItem() {
  const rareDiv = document.getElementById("rareItem");
  const now = new Date();
  if (now.getDay() === 0 && !rareClaimedToday) rareDiv.style.display = "block";
  else rareDiv.style.display = "none";
}

function claimRareItem() {
  if (!rareClaimedToday) {
    crystals += 100;
    rareClaimedToday = true;
    updateDisplay();
    saveData();
    document.getElementById("soundRare").play();
    alert("Crystal Core +100 berhasil diambil!");
  }
}

function buyBooster() {
  if (boosterActive) {
    alert("Booster sedang aktif!");
    return;
  }
  if (crystals >= 50) {
    crystals -= 50;
    boosterActive = true;
    boosterEndTime = Date.now() + 30000;
    startBoosterCountdown();
    updateDisplay();
    saveData();
    alert("Booster aktif selama 30 detik!");
  } else {
    alert("Crystals tidak cukup untuk booster!");
  }
}

function updateBoosterStatus() {
  const boosterStatus = document.getElementById("boosterStatus");
  if (boosterActive) {
    const remain = Math.max(
      0,
      Math.floor((boosterEndTime - Date.now()) / 1000)
    );
    boosterStatus.textContent = `Booster: aktif (${remain} detik tersisa)`;
  } else {
    boosterStatus.textContent = "Booster: Tidak aktif";
  }
}

function startBoosterCountdown() {
  const interval = setInterval(() => {
    if (!boosterActive) {
      clearInterval(interval);
      updateBoosterStatus();
      return;
    }
    if (Date.now() > boosterEndTime) {
      boosterActive = false;
      boosterEndTime = 0;
      clearInterval(interval);
      updateBoosterStatus();
      saveData();
    } else {
      updateBoosterStatus();
    }
  }, 1000);
}

function renderLimitedShop() {
  const container = document.getElementById("limitedItemsList");
  container.innerHTML = "";
  limitedItems.forEach((item) => {
    const owned = ownedItems.includes(item.id);
    const isSelected = equippedItem === item.id;
    const div = document.createElement("div");
    div.className = "limited-item" + (isSelected ? " selected" : "");
    div.title = `${item.name}\nHarga: ${item.price} crystals\n${
      owned ? "Sudah dimiliki" : "Belum dimiliki"
    }`;
    div.onclick = () => {
      if (owned) {
        equipItem(item.id);
      } else {
        buyLimitedItem(item.id);
      }
    };
    div.innerHTML = `
      <img src="${item.img}" alt="${item.name}" />
      <div>${item.name}</div>
      <div style="font-size: 0.8em; color: #555;">${
        owned ? "Klik untuk pakai" : item.price + " 💎"
      }</div>
    `;
    container.appendChild(div);
  });
}

function buyLimitedItem(id) {
  const item = limitedItems.find((i) => i.id === id);
  if (!item) return;
  if (crystals >= item.price) {
    crystals -= item.price;
    ownedItems.push(id);
    equippedItem = id;
    updateDisplay();
    saveData();
    alert(`Berhasil membeli "${item.name}" dan langsung dipakai!`);
  } else {
    alert("Crystal tidak cukup untuk membeli item ini.");
  }
}

function equipItem(id) {
  if (ownedItems.includes(id)) {
    equippedItem = id;
    updateDisplay();
    saveData();
    alert(
      `Kamu memakai "${limitedItems.find((i) => i.id === id).name}" sekarang.`
    );
  }
}

function updateSkinDisplay() {
  const skinImage = document.getElementById("skinImage");
  const skinName = document.getElementById("skinName");
  if (equippedItem) {
    const item = limitedItems.find((i) => i.id === equippedItem);
    skinImage.src = item.img;
    skinName.textContent = item.name;
  } else {
    skinImage.src = "";
    skinName.textContent = "Tidak ada item";
  }
}

function playCrystalAnimation() {
  const container = document.getElementById("animationContainer");
  const crystal = document.createElement("div");
  crystal.className = "crystal-fly";

  const btn = document.getElementById("btnStartPause");
  const btnRect = btn.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  const startX = btnRect.left - containerRect.left + btnRect.width / 2 - 10;
  const startY = btnRect.top - containerRect.top + btnRect.height / 2 - 10;

  crystal.style.left = startX + "px";
  crystal.style.top = startY + "px";

  container.appendChild(crystal);

  crystal.addEventListener("animationend", () => {
    container.removeChild(crystal);
  });
}

// Saat page load
loadData();
updateDisplay();

// Jika auto upgrade aktif, start auto upgrade
if (autoUpgradeEnabled) startAutoUpgrade();
