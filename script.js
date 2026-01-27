/**
 * THE COLLECTOR - AFK
 * Core Logic
 */

// --- Constants & Config ---
const CONFIG = {
  FPS: 60,
  AUTO_SAVE_INTERVAL: 30000,
  OFFLINE_GAIN_PERCENT: 0.5 // 50% efficiency when offline
};

// --- Game State ---
const Game = {
  resources: {
    crystals: 0,
    souls: 0
  },
  stats: {
    totalClicks: 0,
    lifetimeCrystals: 0,
    startTime: Date.now(),
    lastSaveTime: Date.now()
  },
  systems: {
    clickPower: 1,
    autoClickers: 0,
    upgrades: {},
    inventory: [],
    equipped: [],
    unlockedZones: ['cave'],
    currentZone: 'cave'
  },
  settings: {
    notifications: true
  },
  isLoaded: false
};

// --- Game Data ---
const ZonesData = [
  {
    id: 'cave',
    name: 'Crystal Cave',
    desc: 'The starting point. Rich in basic crystals.',
    multiplier: 1,
    unlockCost: 0,
    color: '#a3a3a3'
  },
  {
    id: 'magma',
    name: 'Magma Chamber',
    desc: 'Intense heat forges denser crystals. (2x Multiplier)',
    multiplier: 2,
    unlockCost: 5000,
    color: '#f87171'
  },
  {
    id: 'void',
    name: 'Void Expanse',
    desc: 'A place where reality bends. (5x Multiplier)',
    multiplier: 5,
    unlockCost: 25000,
    color: '#a855f7'
  },
  {
    id: 'sanctum',
    name: 'Ancient Sanctum',
    desc: 'Sacred grounds of the Old Collectors. (10x Multiplier)',
    multiplier: 10,
    unlockCost: 100000,
    color: '#eab308'
  }
];

const AssetItemsData = [
  { id: 'common-armor', filename: 'common-armor.png', name: 'Common Armor', type: 'Armor', rarity: 'common' },
  { id: 'epic-armor', filename: 'epic-armor.png', name: 'Epic Armor', type: 'Armor', rarity: 'epic' },
  { id: 'legend-armor', filename: 'legend-armor.png', name: 'Legend Armor', type: 'Armor', rarity: 'legendary' },
  { id: 'patung-megah', filename: 'patung-megah.png', name: 'Patung Megah', type: 'Relic', rarity: 'epic' },
  { id: 'pedang-legend', filename: 'pedang-legend.png', name: 'Pedang Legend', type: 'Weapon', rarity: 'legendary' },
  { id: 'perisai-gila', filename: 'perisai-gila.png', name: 'Perisai Gila', type: 'Defense', rarity: 'rare' },
  { id: 'rare-armor', filename: 'rare-armor.png', name: 'Rare Armor', type: 'Armor', rarity: 'rare' },
  { id: 'topi-biasa', filename: 'topi-biasa.png', name: 'Topi Biasa', type: 'Headgear', rarity: 'common' },
  { id: 'uncommon-armor', filename: 'uncommon-armor.png', name: 'Uncommon Armor', type: 'Armor', rarity: 'uncommon' }
];

const ItemsData = {
  suffixes: ['of Mining', 'of Power', 'of Greed', 'of Speed', 'of Fortune'],
  types: ['Drill', 'Battery', 'Chip', 'Relic'],
  rarities: [
    { id: 'common', name: 'Common', chance: 0.6, mult: 1, color: 'text-common' },
    { id: 'uncommon', name: 'Uncommon', chance: 0.25, mult: 2, color: 'text-uncommon' },
    { id: 'rare', name: 'Rare', chance: 0.1, mult: 5, color: 'text-rare' },
    { id: 'epic', name: 'Epic', chance: 0.04, mult: 15, color: 'text-epic' },
    { id: 'legendary', name: 'Legendary', chance: 0.01, mult: 50, color: 'text-legendary' }
  ]
};

const UpgradesData = [
  { id: 'click_power_1', name: 'Crystal Polisher', desc: 'Increases click power by +1', baseCost: 15, basePower: 1, type: 'click', icon: '⛏️' },
  { id: 'auto_clicker_1', name: 'Auto-Miner Bot', desc: 'Generates +1 Crystal/sec', baseCost: 50, basePower: 1, type: 'auto', icon: '🤖' },
  { id: 'click_power_2', name: 'Laser Drill', desc: 'Increases click power by +5', baseCost: 250, basePower: 5, type: 'click', icon: '🔦' },
  { id: 'auto_clicker_2', name: 'Extraction Drone', desc: 'Generates +5 Crystals/sec', baseCost: 500, basePower: 5, type: 'auto', icon: '🛸' },
  { id: 'auto_clicker_3', name: 'Crystal Farm', desc: 'Generates +25 Crystals/sec', baseCost: 2500, basePower: 25, type: 'auto', icon: '🏭' }
];

// --- Core Modules ---

const SoundSystem = {
  play: function (id) {
    // Placeholder
    // console.log(`Playing sound: ${id}`);
  }
};

const InventorySystem = {
  generateItem: function () {
    // Chance to generate a special asset item
    if (Math.random() < 0.3) { // 30% chance for asset item
      const assetItem = AssetItemsData[Math.floor(Math.random() * AssetItemsData.length)];
      const rarityDef = ItemsData.rarities.find(r => r.id === assetItem.rarity) || ItemsData.rarities[0];
      const basePower = Math.floor(Math.random() * 5) + 1;
      const power = basePower * rarityDef.mult;

      return {
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        name: assetItem.name,
        type: assetItem.type, // Category from filename mapping
        rarity: assetItem.rarity,
        rarityName: rarityDef.name,
        stats: { clickPower: power },
        icon: null, // No emoji icon
        image: `assets/${assetItem.filename}` // Path to image
      };
    }

    const roll = Math.random();
    let rarity = ItemsData.rarities[0];
    // ... existing logic ...
    if (roll < 0.01) rarity = ItemsData.rarities[4];
    else if (roll < 0.05) rarity = ItemsData.rarities[3];
    else if (roll < 0.15) rarity = ItemsData.rarities[2];
    else if (roll < 0.40) rarity = ItemsData.rarities[1];
    else rarity = ItemsData.rarities[0];

    const type = ItemsData.types[Math.floor(Math.random() * ItemsData.types.length)];
    const suffix = ItemsData.suffixes[Math.floor(Math.random() * ItemsData.suffixes.length)];
    const basePower = Math.floor(Math.random() * 5) + 1;
    const power = basePower * rarity.mult;

    return {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      name: `${rarity.name} ${type} ${suffix}`,
      type: type,
      rarity: rarity.id,
      rarityName: rarity.name,
      stats: { clickPower: power },
      icon: type === 'Drill' ? '🔩' : type === 'Battery' ? '🔋' : type === 'Chip' ? '💾' : '🗿',
      image: null
    };
  },

  addItem: function (item) {
    if (!Game.systems.inventory) Game.systems.inventory = [];
    Game.systems.inventory.push(item);
    UI.renderInventory();

    if (item.rarity === 'legendary') {
      UI.showNotification(`LEGENDARY DROP: ${item.name}`, 'success');
      Gameplay.triggerSlowMotion();
      SoundSystem.play('legendary_drop');
      // Auto save on legendary
      SaveSystem.save();
    } else {
      UI.showNotification(`Found: ${item.name}`, 'success');
      SoundSystem.play('item_drop');
    }
  },

  equipItem: function (itemId) {
    if (!Game.systems.equipped) Game.systems.equipped = [];
    const item = Game.systems.inventory.find(i => i.id === itemId);
    if (!item) return;

    if (Game.systems.equipped.length < 3) {
      Game.systems.inventory = Game.systems.inventory.filter(i => i.id !== itemId);
      Game.systems.equipped.push(item);
      UI.renderInventory();
      this.recalcStats();
    } else {
      UI.showNotification('Equipment slots full!', 'error');
    }
  },

  unequipItem: function (itemId) {
    const item = Game.systems.equipped.find(i => i.id === itemId);
    if (!item) return;

    Game.systems.equipped = Game.systems.equipped.filter(i => i.id !== itemId);
    Game.systems.inventory.push(item);
    UI.renderInventory();
    this.recalcStats();
  },

  recalcStats: function () {
    let addedClick = 0;
    if (Game.systems.equipped) {
      Game.systems.equipped.forEach(i => {
        if (i.stats.clickPower) addedClick += i.stats.clickPower;
      });
    }
    Game.systems.equipmentBonus = { clickPower: addedClick };
  }
};

const ShopSystem = {
  dailyStock: [],
  limitedStock: [],
  lastRestockTime: 0,

  init: function () {
    if (Date.now() - this.lastRestockTime > 86400000) {
      this.restock();
    }
    this.render();
  },

  restock: function () {
    this.dailyStock = [];
    this.limitedStock = [];
    for (let i = 0; i < 5; i++) {
      this.dailyStock.push(this.generateShopItem('common'));
    }
    for (let i = 0; i < 2; i++) {
      const roll = Math.random();
      const rarity = roll < 0.1 ? 'legendary' : (roll < 0.4 ? 'epic' : 'rare');
      this.limitedStock.push(this.generateShopItem(rarity));
    }
    this.lastRestockTime = Date.now();
    SaveSystem.save();
  },

  generateShopItem: function (forcedRarity) {
    let item = InventorySystem.generateItem();
    if (forcedRarity) {
      const rarityDef = ItemsData.rarities.find(r => r.id === forcedRarity) || ItemsData.rarities[0];
      const basePower = Math.floor(Math.random() * 5) + 1;
      const power = basePower * rarityDef.mult;
      item.rarity = rarityDef.id;
      item.rarityName = rarityDef.name;
      item.stats.clickPower = power;
      item.name = `${rarityDef.name} ${item.type}`;
    }
    const rarityDef = ItemsData.rarities.find(r => r.id === item.rarity);
    const basePrice = 100;
    item.price = Math.floor(basePrice * rarityDef.mult * (0.8 + Math.random() * 0.4));
    return item;
  },

  buyItem: function (stockType, index) {
    const stock = stockType === 'daily' ? this.dailyStock : this.limitedStock;
    const item = stock[index];
    if (!item) return;

    if (Game.resources.crystals >= item.price) {
      Game.resources.crystals -= item.price;
      InventorySystem.addItem(item);
      stock.splice(index, 1);
      this.render();
      UI.updateDisplay();
      UI.showNotification('Item Purchased!', 'success');
      SaveSystem.save();
    } else {
      UI.showNotification('Not enough Crystals!', 'error');
    }
  },

  render: function () {
    const daily = document.getElementById('daily-shop');
    const limited = document.getElementById('limited-shop');

    if (daily) {
      daily.innerHTML = '<h3>Daily Supply <button onclick="ShopSystem.restock(); ShopSystem.render()">Refresh (Dev)</button></h3><div class="shop-grid"></div>';
      const grid = daily.querySelector('.shop-grid');
      this.dailyStock.forEach((item, idx) => grid.appendChild(this.createShopCard(item, 'daily', idx)));
    }

    if (limited) {
      limited.innerHTML = '<h3>Limited Edition <span style="font-size:0.8rem">Resets Daily</span></h3><div class="shop-grid"></div>';
      const grid = limited.querySelector('.shop-grid');
      this.limitedStock.forEach((item, idx) => grid.appendChild(this.createShopCard(item, 'limited', idx)));
    }
  },

  createShopCard: function (item, type, index) {
    const card = document.createElement('div');
    card.className = `shop-item ${item.rarity}`;
    card.style.borderColor = UI.getRarityColor(item.rarity);
    card.innerHTML = `
            <div class="icon" style="font-size:2rem; text-align:center">
                ${item.image ? `<img src="${item.image}" class="shop-item-image">` : item.icon}
            </div>
            <div class="name"><strong>${item.name}</strong></div>
            <div class="stats" style="font-size:0.9rem; color:#aaa">+${item.stats.clickPower} Power</div>
            <div class="price">💎 ${UI.formatNumber(item.price)}</div>
            <button class="buy-btn" onclick="ShopSystem.buyItem('${type}', ${index})">Buy</button>
        `;
    return card;
  }
};

const ZoneSystem = {
  travel: function (id) {
    const zone = ZonesData.find(z => z.id === id);
    if (!zone) return;
    const unlocked = Game.systems.unlockedZones?.includes(id) || id === 'cave';

    if (unlocked) {
      Game.systems.currentZone = id;
      UI.renderZones();
      UI.showNotification(`Traveled to ${zone.name}`, 'success');
      SaveSystem.save();
    } else {
      if (Game.resources.crystals >= zone.unlockCost) {
        if (confirm(`Unlock ${zone.name} for ${UI.formatNumber(zone.unlockCost)} Crystals?`)) {
          Game.resources.crystals -= zone.unlockCost;
          if (!Game.systems.unlockedZones) Game.systems.unlockedZones = ['cave'];
          Game.systems.unlockedZones.push(id);
          Game.systems.currentZone = id;
          UI.renderZones();
          UI.updateDisplay();
          UI.showNotification(`Unlocked ${zone.name}`, 'success');
        }
      } else {
        UI.showNotification('Not enough Crystals to unlock!', 'error');
      }
    }
  },

  getMultiplier: function () {
    const zoneId = Game.systems.currentZone || 'cave';
    const zone = ZonesData.find(z => z.id === zoneId);
    return zone ? zone.multiplier : 1;
  }
};

const SaveSystem = {
  STORAGE_KEY: 'AFK_Collector_Save_v1',
  save: function () {
    Game.stats.lastSaveTime = Date.now();
    const data = JSON.stringify(Game);
    try {
      localStorage.setItem(this.STORAGE_KEY, btoa(data));
      console.log('Game Saved');
    } catch (e) { console.error('Save Failed:', e); }
  },
  load: function () {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(atob(data));
        Object.assign(Game, parsed);
        // System checks
        if (!Game.systems.upgrades) Game.systems.upgrades = {};
        if (!Game.systems.inventory) Game.systems.inventory = [];
        if (!Game.systems.equipped) Game.systems.equipped = [];
        if (!Game.systems.unlockedZones) Game.systems.unlockedZones = ['cave'];
        InventorySystem.recalcStats();
        return true;
      } catch (e) { console.error('Corrupt Save Data'); return false; }
    }
    return false;
  },
  wipe: function () {
    if (confirm('Wipe save? Cannot be undone.')) {
      localStorage.removeItem(this.STORAGE_KEY);
      location.reload();
    }
  }
};

const UI = {
  els: {
    crystals: document.getElementById('res-crystals'),
    souls: document.getElementById('res-souls'),
    mainCrystal: document.getElementById('main-crystal'),
    clickPower: document.getElementById('click-power-disp'),
    cps: document.getElementById('cps-disp'),
    floatingLayer: document.getElementById('floating-text-layer'),
    notificationsLayer: document.getElementById('notifications-layer'),
    upgradesList: document.getElementById('upgrades-list'),
    equipmentSlots: document.querySelector('.equipment-slots'),
    bagGrid: document.querySelector('.bag-grid'),
    mapGrid: document.getElementById('map-grid')
  },

  init: function () {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        if (!target) return;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
        const targetView = document.getElementById(target);
        if (targetView) targetView.style.display = 'block';
        if (target === 'shop') ShopSystem.render();
      });
    });

    this.els.mainCrystal.addEventListener('mousedown', (e) => Gameplay.clickCrystal(e));
    document.getElementById('save-btn')?.addEventListener('click', () => { SaveSystem.save(); this.showNotification('Game Saved', 'success'); });
    document.getElementById('wipe-btn')?.addEventListener('click', () => SaveSystem.wipe());
    document.getElementById('prestige-btn')?.addEventListener('click', () => Gameplay.prestige());

    this.renderUpgrades();
    this.renderInventory();
    this.renderZones();
    ShopSystem.init();
    this.updateDisplay();
  },

  updateDisplay: function () {
    this.els.crystals.textContent = this.formatNumber(Game.resources.crystals);
    this.els.souls.textContent = this.formatNumber(Game.resources.souls);

    const baseClick = Game.systems.clickPower;
    const equipClick = Game.systems.equipmentBonus?.clickPower || 0;
    const multiplier = ZoneSystem.getMultiplier();

    this.els.clickPower.textContent = this.formatNumber((baseClick + equipClick) * multiplier);
    this.els.cps.textContent = this.formatNumber(Game.systems.autoClickers * multiplier);
    this.updateUpgradeButtons();
  },

  renderInventory: function () {
    if (!this.els.equipmentSlots || !this.els.bagGrid) return;
    this.els.equipmentSlots.innerHTML = '';
    const equipped = Game.systems.equipped || [];
    for (let i = 0; i < 3; i++) {
      const item = equipped[i];
      const slot = document.createElement('div');
      slot.className = `equip-slot ${item ? 'filled' : ''}`;
      if (item) {
        if (item.image) {
          slot.innerHTML = `<img src="${item.image}" alt="${item.name}" class="item-image">`;
        } else {
          slot.innerHTML = `<div class="item-icon">${item.icon}</div>`;
        }
        slot.title = `${item.name}\n+${item.stats.clickPower} Click Power\n(Click to Unequip)`;
        slot.onclick = () => InventorySystem.unequipItem(item.id);
        slot.className += ` ${item.rarity}`;
        slot.style.borderColor = this.getRarityColor(item.rarity);
      } else {
        slot.innerHTML = '<span style="opacity:0.3">Empty</span>';
      }
      this.els.equipmentSlots.appendChild(slot);
    }

    this.els.bagGrid.innerHTML = '';
    const inventory = Game.systems.inventory || [];
    inventory.forEach(item => {
      const card = document.createElement('div');
      card.className = `item-card ${item.rarity}`;
      if (item.image) {
        card.innerHTML = `<img src="${item.image}" alt="${item.name}" class="item-image">`;
      } else {
        card.innerHTML = `<div>${item.icon}</div>`;
      }
      card.title = `${item.name}\n+${item.stats.clickPower} Click Power\nClick to Equip`;
      card.onclick = () => InventorySystem.equipItem(item.id);
      this.els.bagGrid.appendChild(card);
    });
  },

  getRarityColor: function (rarity) {
    switch (rarity) {
      case 'common': return '#a3a3a3';
      case 'uncommon': return '#22c55e';
      case 'rare': return 'var(--accent-rare)';
      case 'epic': return 'var(--accent-epic)';
      case 'legendary': return 'var(--accent-legend)';
      default: return '#fff';
    }
  },

  renderUpgrades: function () {
    this.els.upgradesList.innerHTML = '';
    UpgradesData.forEach(upgrade => {
      const level = Game.systems.upgrades?.[upgrade.id] || 0;
      const cost = Gameplay.calculateCost(upgrade.baseCost, level);
      const el = document.createElement('div');
      el.className = 'card upgrade-item';
      el.innerHTML = `
                <div class="upgrade-header">
                    <div class="upgrade-icon">${upgrade.icon}</div>
                    <div class="upgrade-info">
                        <h4>${upgrade.name}</h4>
                        <p>${upgrade.desc}</p>
                    </div>
                </div>
                <div class="upgrade-btn-area">
                    <button class="btn-upgrade" id="btn-${upgrade.id}" onclick="Gameplay.buyUpgrade('${upgrade.id}')">
                        <span>Lvl ${level}</span>
                        <span>💎 ${this.formatNumber(cost)}</span>
                    </button>
                </div>
            `;
      this.els.upgradesList.appendChild(el);
    });
  },

  updateUpgradeButtons: function () {
    UpgradesData.forEach(upgrade => {
      const btn = document.getElementById(`btn-${upgrade.id}`);
      if (!btn) return;
      const level = Game.systems.upgrades?.[upgrade.id] || 0;
      const cost = Gameplay.calculateCost(upgrade.baseCost, level);
      if (Game.resources.crystals >= cost) {
        btn.removeAttribute('disabled');
        btn.style.borderColor = 'var(--accent-neon)';
      } else {
        btn.setAttribute('disabled', 'true');
        btn.style.borderColor = 'var(--border-color)';
      }
      btn.querySelector('span:nth-child(2)').textContent = `💎 ${this.formatNumber(cost)}`;
      btn.querySelector('span:first-child').textContent = `Lvl ${level}`;
    });
  },

  showNotification: function (msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `notification-toast ${type}`;
    el.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span><span>${msg}</span>`;
    this.els.notificationsLayer.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  },

  renderZones: function () {
    if (!this.els.mapGrid) return;
    this.els.mapGrid.innerHTML = '';
    const current = Game.systems.currentZone || 'cave';
    const unlocked = Game.systems.unlockedZones || ['cave'];
    ZonesData.forEach(zone => {
      const isUnlocked = unlocked.includes(zone.id) || zone.id === 'cave';
      const isActive = current === zone.id;
      const card = document.createElement('div');
      card.className = `zone-card ${isUnlocked ? '' : 'locked'} ${isActive ? 'active' : ''}`;
      card.style.background = `linear-gradient(to bottom, ${zone.color}22, var(--bg-secondary))`;
      card.innerHTML = `
                <div class="zone-header"><h3>${zone.name}</h3></div>
                <div class="zone-info">
                    <p>${zone.desc}</p>
                    <p class="multiplier">Multiplier: <strong>x${zone.multiplier}</strong></p>
                    ${!isUnlocked ? `<p class="cost">Unlock: 💎 ${this.formatNumber(zone.unlockCost)}</p>` : ''}
                </div>
           `;
      card.onclick = () => ZoneSystem.travel(zone.id);
      this.els.mapGrid.appendChild(card);
    });
  },

  formatNumber: function (num) {
    if (num < 1000) return Math.floor(num);
    if (num < 1000000) return (num / 1000).toFixed(1) + 'k';
    if (num < 1000000000) return (num / 1000000).toFixed(2) + 'M';
    return (num / 1000000000).toFixed(2) + 'B';
  },

  spawnFloatingText: function (x, y, text, color = '#fff') {
    const el = document.createElement('div');
    el.className = 'float-text';
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = color;
    this.els.floatingLayer.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
};

const Gameplay = {
  timeScale: 1,
  clickCrystal: function (e) {
    const base = Game.systems.clickPower;
    const equip = Game.systems.equipmentBonus?.clickPower || 0;
    const multiplier = ZoneSystem.getMultiplier();
    const amount = (base + equip) * multiplier;

    this.addResource('crystals', amount);

    if (Math.random() < 0.05) {
      const item = InventorySystem.generateItem();
      InventorySystem.addItem(item);
    }

    UI.spawnFloatingText(e.clientX, e.clientY, `+${UI.formatNumber(amount)}`, 'var(--accent-neon)');
    const crystal = document.getElementById('main-crystal');
    crystal.style.transform = 'scale(0.95)';
    setTimeout(() => crystal.style.transform = 'scale(1)', 50);
    Game.stats.totalClicks++;
  },

  addResource: function (type, amount) {
    if (!Game.resources[type] && Game.resources[type] !== 0) return;
    Game.resources[type] += amount;
    if (type === 'crystals') {
      Game.stats.lifetimeCrystals += amount;
    }
    UI.updateDisplay();
  },

  calculateCost: function (base, level) {
    return Math.floor(base * Math.pow(1.5, level));
  },

  buyUpgrade: function (id) {
    const upgrade = UpgradesData.find(u => u.id === id);
    if (!upgrade) return;
    if (!Game.systems.upgrades) Game.systems.upgrades = {};
    const level = Game.systems.upgrades[id] || 0;
    const cost = this.calculateCost(upgrade.baseCost, level);
    if (Game.resources.crystals >= cost) {
      Game.resources.crystals -= cost;
      Game.systems.upgrades[id] = level + 1;
      if (upgrade.type === 'click') Game.systems.clickPower += upgrade.basePower;
      else if (upgrade.type === 'auto') Game.systems.autoClickers += upgrade.basePower;
      UI.showNotification(`Purchased ${upgrade.name}`, 'success');
      UI.updateDisplay();
      SaveSystem.save();
    } else {
      UI.showNotification('Not enough Crystals!', 'error');
    }
  },

  processAutoTick: function (dt) {
    const scaledDt = dt * this.timeScale;
    if (Game.systems.autoClickers > 0) {
      const multiplier = ZoneSystem.getMultiplier();
      const gain = Game.systems.autoClickers * multiplier * scaledDt;
      this.addResource('crystals', gain);
    }
  },

  prestige: function () {
    const crystals = Game.stats.lifetimeCrystals;
    const pendingSouls = Math.floor(crystals / 1000000);
    if (pendingSouls < 1) {
      alert('You need at least 1M Lifetime Crystals to Ascend!');
      return;
    }
    if (confirm(`Ascend and claim ${UI.formatNumber(pendingSouls)} Souls? Reset progress.`)) {
      Game.resources.crystals = 0;
      Game.systems.clickPower = 1;
      Game.systems.autoClickers = 0;
      Game.systems.upgrades = {};
      Game.systems.inventory = [];
      Game.systems.equipped = [];
      Game.systems.unlockedZones = ['cave'];
      Game.systems.currentZone = 'cave';
      Game.resources.souls += pendingSouls;
      SaveSystem.save();
      location.reload();
    }
  },

  triggerSlowMotion: function () {
    this.timeScale = 0.2;
    document.body.style.transition = 'filter 0.5s';
    document.body.style.filter = 'contrast(1.2) saturate(1.5) hue-rotate(15deg)';
    setTimeout(() => {
      this.timeScale = 1;
      document.body.style.filter = 'none';
    }, 3000);
  }
};

// --- Main Loop ---
let lastTime = 0;
let autoSaveTimer = 0;

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  Gameplay.processAutoTick(dt);
  autoSaveTimer += dt * 1000;
  if (autoSaveTimer >= CONFIG.AUTO_SAVE_INTERVAL) {
    SaveSystem.save();
    autoSaveTimer = 0;
  }
  UI.updateDisplay();
  requestAnimationFrame(gameLoop);
}

// --- Initialization ---
window.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('loading-screen');
  const bar = document.querySelector('.progress-bar');
  const hasSave = SaveSystem.load();
  setTimeout(() => { bar.style.width = '100%'; }, 100);
  setTimeout(() => {
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
      document.getElementById('game-container').style.display = 'flex';
      Game.isLoaded = true;
      if (hasSave) {
        const now = Date.now();
        const diff = (now - Game.stats.lastSaveTime) / 1000;
        if (diff > 60) {
          const multiplier = ZoneSystem.getMultiplier();
          const offlineGain = Game.systems.autoClickers * multiplier * diff * CONFIG.OFFLINE_GAIN_PERCENT;
          if (offlineGain > 0) {
            Gameplay.addResource('crystals', offlineGain);
            alert(`Welcome back! You earned ${UI.formatNumber(offlineGain)} crystals while offline.`);
          }
        }
      }
      UI.init();
      requestAnimationFrame(gameLoop);
    }, 500);
  }, 1000);
});
