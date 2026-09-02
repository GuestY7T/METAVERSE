// 🎮 METAVERSE Platform - Advanced Avatar Customization System
// Inspired by Roblox, Fortnite, Minecraft styles with cross-platform support
// Compatible: PS4, Xbox Series X/S, PC, Mobile, Older Devices (2018+)

// ============================================================================
// AVATAR CUSTOMIZATION SYSTEM - ROBLOX/FORTNITE/MINECRAFT STYLE
// ============================================================================
class AdvancedAvatarCustomizer {
  constructor() {
    this.currentAvatar = this.loadFromStorage('metaverse_avatar') || this.getDefaultAvatar();
    this.avatarPresets = this.initializePresets();
    this.customizationHistory = [];
    this.initThreeJsModel();
  }

  getDefaultAvatar() {
    return {
      id: 'avatar_' + Date.now(),
      name: 'Default Character',
      style: 'roblox', // roblox, fortnite, minecraft
      body: {
        headShape: 'round', // round, square, oval, cube
        bodyType: 'normal', // thin, normal, muscular, chunky, blocky
        armStyle: 'round', // round, blocky, thin
        legStyle: 'round', // round, blocky, stumpy
        height: 1.0, // 0.7 to 1.3 scale
        scale: 1.0
      },
      colors: {
        headColor: '#FFB3A7',
        torsoColor: '#FF0000',
        leftArmColor: '#FFB3A7',
        rightArmColor: '#FFB3A7',
        leftLegColor: '#0A47A8',
        rightLegColor: '#0A47A8',
        pattern: 'solid', // solid, stripes, checkerboard, gradient
        patternColor: '#000000',
        glowIntensity: 0
      },
      accessories: {
        hat: null,
        hair: 'none',
        face: 'none',
        glasses: null,
        shirtTexture: null,
        pantsTexture: null,
        backpack: null,
        wings: null,
        tail: null,
        aura: 'none' // none, glow, particle, neon, mystic
      },
      animations: {
        idleAnimation: 'default',
        walkAnimation: 'normal',
        runAnimation: 'default',
        jumpAnimation: 'default',
        danceAnimation: 'dance1',
        emotes: ['wave', 'dance', 'cheer', 'cry']
      },
      effects: {
        trailEffect: 'none', // none, particle, glow, fire
        trailColor: '#00A2FF',
        footsteps: 'default',
        shadowType: 'default'
      },
      stats: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        timesUsed: 0
      }
    };
  }

  initializePresets() {
    return {
      robloxStyle: [
        {
          name: 'Classic Roblox Red',
          body: { bodyType: 'normal', armStyle: 'round', legStyle: 'round' },
          colors: { headColor: '#FFB3A7', torsoColor: '#FF0000', leftArmColor: '#FFB3A7', rightArmColor: '#FFB3A7', leftLegColor: '#0A47A8', rightLegColor: '#0A47A8' }
        },
        {
          name: 'Roblox Builder',
          body: { bodyType: 'muscular', armStyle: 'blocky', legStyle: 'blocky' },
          colors: { headColor: '#FFCC80', torsoColor: '#4CAF50', leftArmColor: '#FFCC80', rightArmColor: '#FFCC80', leftLegColor: '#795548', rightLegColor: '#795548' }
        },
        {
          name: 'Roblox Neon',
          body: { bodyType: 'thin', armStyle: 'round', legStyle: 'round' },
          colors: { headColor: '#00FF00', torsoColor: '#FF00FF', leftArmColor: '#00FF00', rightArmColor: '#00FF00', leftLegColor: '#00FFFF', rightLegColor: '#00FFFF', glowIntensity: 1 }
        }
      ],
      fortniteStyle: [
        {
          name: 'Fortnite Commando',
          body: { bodyType: 'normal', armStyle: 'round', legStyle: 'round', height: 1.1 },
          colors: { headColor: '#F5DEB3', torsoColor: '#1E90FF', leftArmColor: '#4169E1', rightArmColor: '#4169E1', leftLegColor: '#000080', rightLegColor: '#000080' },
          accessories: { backpack: 'tactical', aura: 'glow' }
        },
        {
          name: 'Fortnite Ninja',
          body: { bodyType: 'thin', armStyle: 'thin', legStyle: 'thin' },
          colors: { headColor: '#FFE4B5', torsoColor: '#000000', leftArmColor: '#1C1C1C', rightArmColor: '#1C1C1C', leftLegColor: '#000000', rightLegColor: '#000000' },
          accessories: { hat: 'hood', aura: 'mystic' }
        },
        {
          name: 'Fortnite Slayer',
          body: { bodyType: 'muscular', armStyle: 'blocky', legStyle: 'blocky' },
          colors: { headColor: '#FF6347', torsoColor: '#8B0000', leftArmColor: '#A9A9A9', rightArmColor: '#A9A9A9', leftLegColor: '#696969', rightLegColor: '#696969' },
          accessories: { wings: 'fire', aura: 'fire' }
        }
      ],
      minecraftStyle: [
        {
          name: 'Minecraft Steve',
          body: { bodyType: 'blocky', armStyle: 'blocky', legStyle: 'blocky', scale: 0.9 },
          colors: { headColor: '#FFCC80', torsoColor: '#00AA00', leftArmColor: '#FFCC80', rightArmColor: '#FFCC80', leftLegColor: '#0000AA', rightLegColor: '#0000AA', pattern: 'solid' }
        },
        {
          name: 'Minecraft Alex',
          body: { bodyType: 'blocky', armStyle: 'blocky', legStyle: 'blocky', scale: 0.85 },
          colors: { headColor: '#FFE4B5', torsoColor: '#FF00AA', leftArmColor: '#FFE4B5', rightArmColor: '#FFE4B5', leftLegColor: '#006600', rightLegColor: '#006600' }
        },
        {
          name: 'Minecraft Creeper',
          body: { bodyType: 'blocky', armStyle: 'blocky', legStyle: 'blocky', height: 1.1 },
          colors: { headColor: '#00AA00', torsoColor: '#00AA00', leftArmColor: '#00AA00', rightArmColor: '#00AA00', leftLegColor: '#00AA00', rightLegColor: '#00AA00', pattern: 'checkerboard', patternColor: '#000000' }
        }
      ]
    };
  }

  updateAvatarColor(part, color) {
    this.currentAvatar.colors[part + 'Color'] = color;
    this.currentAvatar.stats.modified = new Date().toISOString();
    this.saveAvatar();
    this.updatePreview();
    console.log(`🎨 Updated ${part} to ${color}`);
  }

  updateBodyShape(part, shape) {
    if (part === 'bodyType' || part === 'armStyle' || part === 'legStyle' || part === 'headShape') {
      this.currentAvatar.body[part] = shape;
      this.currentAvatar.stats.modified = new Date().toISOString();
      this.saveAvatar();
      this.updatePreview();
      console.log(`👤 Body shape updated: ${part} = ${shape}`);
    }
  }

  addAccessory(accessoryType, accessoryName) {
    if (this.currentAvatar.accessories.hasOwnProperty(accessoryType)) {
      this.currentAvatar.accessories[accessoryType] = accessoryName;
      this.currentAvatar.stats.modified = new Date().toISOString();
      this.saveAvatar();
      this.updatePreview();
      console.log(`✨ Added accessory: ${accessoryType} = ${accessoryName}`);
      return true;
    }
    return false;
  }

  applyPreset(style, presetName) {
    if (this.avatarPresets[style]) {
      const preset = this.avatarPresets[style].find(p => p.name === presetName);
      if (preset) {
        this.currentAvatar = { ...this.currentAvatar, ...preset, style: style.replace('Style', '') };
        this.currentAvatar.stats.modified = new Date().toISOString();
        this.saveAvatar();
        this.updatePreview();
        console.log(`✅ Applied preset: ${presetName}`);
        return true;
      }
    }
    return false;
  }

  getCustomizationPanelHTML() {
    return `
      <div class="avatar-customizer-panel">
        <div class="customizer-header">
          <h2>👤 Avatar Customization</h2>
          <div class="style-selector">
            <button class="style-btn ${this.currentAvatar.style === 'roblox' ? 'active' : ''}" onclick="gameState.avatarCustomizer.setStyle('roblox')">🟥 Roblox</button>
            <button class="style-btn ${this.currentAvatar.style === 'fortnite' ? 'active' : ''}" onclick="gameState.avatarCustomizer.setStyle('fortnite')">⚔️ Fortnite</button>
            <button class="style-btn ${this.currentAvatar.style === 'minecraft' ? 'active' : ''}" onclick="gameState.avatarCustomizer.setStyle('minecraft')">⬜ Minecraft</button>
          </div>
        </div>

        <div class="customizer-container">
          <!-- 3D Preview -->
          <div class="avatar-preview-section">
            <div id="avatar-preview-3d" class="avatar-preview"></div>
            <div class="avatar-info">
              <h3>${this.currentAvatar.name}</h3>
              <p>Style: ${this.currentAvatar.style.toUpperCase()}</p>
            </div>
          </div>

          <!-- Color Customization -->
          <div class="color-customization">
            <h3>🎨 Colors</h3>
            <div class="color-grid">
              <div class="color-picker-item">
                <label>Head Color</label>
                <input type="color" value="${this.currentAvatar.colors.headColor}" onchange="gameState.avatarCustomizer.updateAvatarColor('head', this.value)">
              </div>
              <div class="color-picker-item">
                <label>Torso Color</label>
                <input type="color" value="${this.currentAvatar.colors.torsoColor}" onchange="gameState.avatarCustomizer.updateAvatarColor('torso', this.value)">
              </div>
              <div class="color-picker-item">
                <label>Left Arm</label>
                <input type="color" value="${this.currentAvatar.colors.leftArmColor}" onchange="gameState.avatarCustomizer.updateAvatarColor('leftArm', this.value)">
              </div>
              <div class="color-picker-item">
                <label>Right Arm</label>
                <input type="color" value="${this.currentAvatar.colors.rightArmColor}" onchange="gameState.avatarCustomizer.updateAvatarColor('rightArm', this.value)">
              </div>
              <div class="color-picker-item">
                <label>Left Leg</label>
                <input type="color" value="${this.currentAvatar.colors.leftLegColor}" onchange="gameState.avatarCustomizer.updateAvatarColor('leftLeg', this.value)">
              </div>
              <div class="color-picker-item">
                <label>Right Leg</label>
                <input type="color" value="${this.currentAvatar.colors.rightLegColor}" onchange="gameState.avatarCustomizer.updateAvatarColor('rightLeg', this.value)">
              </div>
            </div>
          </div>

          <!-- Body Customization -->
          <div class="body-customization">
            <h3>👤 Body Shape</h3>
            <div class="body-options">
              <div class="option-group">
                <label>Head Shape</label>
                <select onchange="gameState.avatarCustomizer.updateBodyShape('headShape', this.value)">
                  <option value="round" ${this.currentAvatar.body.headShape === 'round' ? 'selected' : ''}>Round</option>
                  <option value="square" ${this.currentAvatar.body.headShape === 'square' ? 'selected' : ''}>Square</option>
                  <option value="oval" ${this.currentAvatar.body.headShape === 'oval' ? 'selected' : ''}>Oval</option>
                  <option value="cube" ${this.currentAvatar.body.headShape === 'cube' ? 'selected' : ''}>Cube (Minecraft)</option>
                </select>
              </div>
              <div class="option-group">
                <label>Body Type</label>
                <select onchange="gameState.avatarCustomizer.updateBodyShape('bodyType', this.value)">
                  <option value="thin" ${this.currentAvatar.body.bodyType === 'thin' ? 'selected' : ''}>Thin</option>
                  <option value="normal" ${this.currentAvatar.body.bodyType === 'normal' ? 'selected' : ''}>Normal</option>
                  <option value="muscular" ${this.currentAvatar.body.bodyType === 'muscular' ? 'selected' : ''}>Muscular</option>
                  <option value="chunky" ${this.currentAvatar.body.bodyType === 'chunky' ? 'selected' : ''}>Chunky</option>
                  <option value="blocky" ${this.currentAvatar.body.bodyType === 'blocky' ? 'selected' : ''}>Blocky (Minecraft)</option>
                </select>
              </div>
              <div class="option-group">
                <label>Height: ${(this.currentAvatar.body.height * 100).toFixed(0)}%</label>
                <input type="range" min="70" max="130" value="${this.currentAvatar.body.height * 100}" onchange="gameState.avatarCustomizer.updateHeight(this.value / 100)">
              </div>
            </div>
          </div>

          <!-- Accessories -->
          <div class="accessories-section">
            <h3>✨ Accessories</h3>
            <div class="accessories-grid">
              <div class="accessory-picker">
                <label>Hat</label>
                <select onchange="gameState.avatarCustomizer.addAccessory('hat', this.value)">
                  <option value="">None</option>
                  <option value="cap">Cap</option>
                  <option value="hood">Hood</option>
                  <option value="crown">Crown</option>
                  <option value="helmet">Helmet</option>
                  <option value="tophat">Top Hat</option>
                  <option value="santa">Santa Hat</option>
                  <option value="wizard">Wizard Hat</option>
                </select>
              </div>
              <div class="accessory-picker">
                <label>Aura</label>
                <select onchange="gameState.avatarCustomizer.addAccessory('aura', this.value)">
                  <option value="none">None</option>
                  <option value="glow">Glow</option>
                  <option value="particle">Particle</option>
                  <option value="neon">Neon</option>
                  <option value="mystic">Mystic</option>
                  <option value="fire">Fire</option>
                </select>
              </div>
              <div class="accessory-picker">
                <label>Wings</label>
                <select onchange="gameState.avatarCustomizer.addAccessory('wings', this.value)">
                  <option value="">None</option>
                  <option value="angel">Angel Wings</option>
                  <option value="demon">Demon Wings</option>
                  <option value="fairy">Fairy Wings</option>
                  <option value="fire">Fire Wings</option>
                  <option value="ice">Ice Wings</option>
                </select>
              </div>
              <div class="accessory-picker">
                <label>Tail</label>
                <select onchange="gameState.avatarCustomizer.addAccessory('tail', this.value)">
                  <option value="">None</option>
                  <option value="cat">Cat Tail</option>
                  <option value="fox">Fox Tail</option>
                  <option value="demon">Demon Tail</option>
                  <option value="angel">Angel Tail</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Effects -->
          <div class="effects-section">
            <h3>⚡ Effects</h3>
            <div class="effects-grid">
              <div class="effect-picker">
                <label>Trail Effect</label>
                <select onchange="gameState.avatarCustomizer.addAccessory('trailEffect', this.value)">
                  <option value="none">None</option>
                  <option value="particle">Particles</option>
                  <option value="glow">Glow</option>
                  <option value="fire">Fire</option>
                  <option value="ice">Ice</option>
                  <option value="magic">Magic</option>
                </select>
              </div>
              <div class="effect-picker">
                <label>Trail Color</label>
                <input type="color" value="${this.currentAvatar.effects.trailColor}" onchange="gameState.avatarCustomizer.updateTrailColor(this.value)">
              </div>
            </div>
          </div>

          <!-- Presets -->
          <div class="presets-section">
            <h3>📦 Quick Presets</h3>
            ${this.getPresetsHTML()}
          </div>

          <!-- Save & Load -->
          <div class="avatar-actions">
            <button onclick="gameState.avatarCustomizer.saveAvatar()" class="btn-primary">💾 Save Avatar</button>
            <button onclick="gameState.avatarCustomizer.resetToDefault()" class="btn-secondary">🔄 Reset</button>
            <button onclick="gameState.avatarCustomizer.randomize()" class="btn-secondary">🎲 Randomize</button>
          </div>
        </div>
      </div>
    `;
  }

  getPresetsHTML() {
    const currentStyle = this.currentAvatar.style + 'Style';
    const presets = this.avatarPresets[currentStyle] || [];
    return presets.map(preset => `
      <button class="preset-btn" onclick="gameState.avatarCustomizer.applyPreset('${currentStyle}', '${preset.name}')">
        ${preset.name}
      </button>
    `).join('');
  }

  updateHeight(scale) {
    this.currentAvatar.body.height = scale;
    this.saveAvatar();
    this.updatePreview();
  }

  updateTrailColor(color) {
    this.currentAvatar.effects.trailColor = color;
    this.saveAvatar();
    this.updatePreview();
  }

  setStyle(style) {
    this.currentAvatar.style = style;
    this.saveAvatar();
    this.updatePreview();
    console.log(`✅ Avatar style changed to: ${style}`);
  }

  randomize() {
    const styles = ['roblox', 'fortnite', 'minecraft'];
    const headShapes = ['round', 'square', 'oval', 'cube'];
    const bodyTypes = ['thin', 'normal', 'muscular', 'chunky', 'blocky'];

    this.currentAvatar.body.headShape = headShapes[Math.floor(Math.random() * headShapes.length)];
    this.currentAvatar.body.bodyType = bodyTypes[Math.floor(Math.random() * bodyTypes.length)];
    this.currentAvatar.colors.headColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    this.currentAvatar.colors.torsoColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    this.currentAvatar.colors.leftLegColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    this.currentAvatar.colors.rightLegColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    
    this.saveAvatar();
    this.updatePreview();
    console.log('🎲 Avatar randomized!');
  }

  resetToDefault() {
    this.currentAvatar = this.getDefaultAvatar();
    this.saveAvatar();
    this.updatePreview();
    console.log('🔄 Avatar reset to default');
  }

  updatePreview() {
    const preview = document.getElementById('avatar-preview-3d');
    if (preview) {
      preview.innerHTML = this.generatePreviewHTML();
    }
  }

  generatePreviewHTML() {
    return `
      <div class="avatar-3d-preview" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <svg viewBox="0 0 100 150" width="150" height="200">
          <!-- Head -->
          <circle cx="50" cy="30" r="20" fill="${this.currentAvatar.colors.headColor}"/>
          <!-- Torso -->
          <rect x="35" y="50" width="30" height="40" fill="${this.currentAvatar.colors.torsoColor}"/>
          <!-- Left Arm -->
          <rect x="15" y="55" width="20" height="30" fill="${this.currentAvatar.colors.leftArmColor}"/>
          <!-- Right Arm -->
          <rect x="65" y="55" width="20" height="30" fill="${this.currentAvatar.colors.rightArmColor}"/>
          <!-- Left Leg -->
          <rect x="35" y="90" width="12" height="40" fill="${this.currentAvatar.colors.leftLegColor}"/>
          <!-- Right Leg -->
          <rect x="53" y="90" width="12" height="40" fill="${this.currentAvatar.colors.rightLegColor}"/>
        </svg>
      </div>
    `;
  }

  initThreeJsModel() {
    // Initialize Three.js model if Three.js is available
    if (typeof THREE !== 'undefined') {
      console.log('✅ Three.js model initialization ready');
    }
  }

  saveAvatar() {
    this.currentAvatar.stats.modified = new Date().toISOString();
    this.saveToStorage('metaverse_avatar', this.currentAvatar);
    console.log('💾 Avatar saved');
  }

  loadFromStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || null;
    } catch (e) {
      console.error(`Error loading ${key}:`, e);
      return null;
    }
  }

  saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error saving ${key}:`, e);
    }
  }
}

// ============================================================================
// EXPORT AVATAR CUSTOMIZER
// ============================================================================
if (typeof gameState === 'undefined') {
  var gameState = {};
}
gameState.avatarCustomizer = new AdvancedAvatarCustomizer();

console.log('🎨 Advanced Avatar Customization System Loaded!');
console.log('✅ Roblox Style Support');
console.log('✅ Fortnite Style Support');
console.log('✅ Minecraft Style Support');
