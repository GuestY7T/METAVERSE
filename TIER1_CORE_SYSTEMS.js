// 🎮 METAVERSE Platform - Enhanced Game System (v2.0)
// This module contains all major feature implementations
// Last Updated: September 2, 2026

// ============================================================================
// TIER 1 IMPLEMENTATION - HIGH PRIORITY FEATURES
// ============================================================================

// ============================================================================
// 1. FRIEND SYSTEM
// ============================================================================
class FriendSystem {
  constructor() {
    this.friends = this.loadFromStorage('metaverse_friends') || [];
    this.friendRequests = this.loadFromStorage('metaverse_friend_requests') || [];
    this.blockedPlayers = this.loadFromStorage('metaverse_blocked') || [];
    this.onlinePlayers = new Map();
    this.initEventListeners();
  }

  addFriend(userId, userName) {
    const friend = { id: userId, name: userName, addedDate: new Date().toISOString(), online: false };
    if (!this.friends.find(f => f.id === userId)) {
      this.friends.push(friend);
      this.saveToStorage('metaverse_friends', this.friends);
      this.notifyFriendAdded(friend);
      return true;
    }
    return false;
  }

  sendFriendRequest(userId, userName) {
    const request = { id: userId, name: userName, timestamp: new Date().toISOString(), status: 'pending' };
    if (!this.friendRequests.find(r => r.id === userId)) {
      this.friendRequests.push(request);
      this.saveToStorage('metaverse_friend_requests', this.friendRequests);
      this.notifyFriendRequest(request);
      return true;
    }
    return false;
  }

  acceptFriendRequest(userId) {
    const request = this.friendRequests.find(r => r.id === userId);
    if (request) {
      this.addFriend(userId, request.name);
      this.friendRequests = this.friendRequests.filter(r => r.id !== userId);
      this.saveToStorage('metaverse_friend_requests', this.friendRequests);
      return true;
    }
    return false;
  }

  removeFriend(userId) {
    this.friends = this.friends.filter(f => f.id !== userId);
    this.saveToStorage('metaverse_friends', this.friends);
    return true;
  }

  blockPlayer(userId) {
    if (!this.blockedPlayers.includes(userId)) {
      this.blockedPlayers.push(userId);
      this.saveToStorage('metaverse_blocked', this.blockedPlayers);
      return true;
    }
    return false;
  }

  unblockPlayer(userId) {
    this.blockedPlayers = this.blockedPlayers.filter(id => id !== userId);
    this.saveToStorage('metaverse_blocked', this.blockedPlayers);
    return true;
  }

  updateFriendOnlineStatus(userId, online) {
    const friend = this.friends.find(f => f.id === userId);
    if (friend) {
      friend.online = online;
      this.saveToStorage('metaverse_friends', this.friends);
      this.notifyStatusChange(friend);
    }
  }

  getFriendsUI() {
    return `
      <div class="friends-panel">
        <h3>👥 Friends (${this.friends.length})</h3>
        <div class="friends-list">
          ${this.friends.map(friend => `
            <div class="friend-item">
              <div class="friend-info">
                <span class="status-dot ${friend.online ? 'online' : 'offline'}"></span>
                <span class="friend-name">${friend.name}</span>
              </div>
              <div class="friend-actions">
                <button onclick="gameState.friendSystem.inviteToGame('${friend.id}')">Invite</button>
                <button onclick="gameState.friendSystem.removeFriend('${friend.id}')">Remove</button>
              </div>
            </div>
          `).join('')}
        </div>
        <h3>📬 Requests (${this.friendRequests.length})</h3>
        <div class="requests-list">
          ${this.friendRequests.map(req => `
            <div class="request-item">
              <span>${req.name}</span>
              <button onclick="gameState.friendSystem.acceptFriendRequest('${req.id}')">✓</button>
              <button onclick="gameState.friendSystem.rejectFriendRequest('${req.id}')">✗</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  notifyFriendAdded(friend) {
    console.log(`✅ ${friend.name} added to friends!`);
  }

  notifyFriendRequest(request) {
    console.log(`📬 Friend request from ${request.name}`);
  }

  notifyStatusChange(friend) {
    console.log(`${friend.online ? '🟢' : '🔴'} ${friend.name} is now ${friend.online ? 'online' : 'offline'}`);
  }

  inviteToGame(friendId) {
    const friend = this.friends.find(f => f.id === friendId);
    if (friend) {
      console.log(`🎮 Inviting ${friend.name} to game...`);
      return true;
    }
  }

  rejectFriendRequest(userId) {
    this.friendRequests = this.friendRequests.filter(r => r.id !== userId);
    this.saveToStorage('metaverse_friend_requests', this.friendRequests);
    return true;
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

  initEventListeners() {
    // Friend status updates every 5 seconds
    setInterval(() => this.syncFriendStatuses(), 5000);
  }

  syncFriendStatuses() {
    // Simulate online status checking
    this.friends.forEach(friend => {
      const randomOnline = Math.random() > 0.5;
      this.updateFriendOnlineStatus(friend.id, randomOnline);
    });
  }
}

// ============================================================================
// 2. GUILD SYSTEM
// ============================================================================
class GuildSystem {
  constructor() {
    this.myGuild = this.loadFromStorage('metaverse_my_guild') || null;
    this.guildInvites = this.loadFromStorage('metaverse_guild_invites') || [];
    this.allGuilds = this.loadFromStorage('metaverse_all_guilds') || [];
  }

  createGuild(guildName, guildTag, description) {
    if (this.myGuild) {
      console.log('❌ You are already in a guild!');
      return false;
    }

    const guild = {
      id: 'guild_' + Date.now(),
      name: guildName,
      tag: guildTag,
      description: description,
      leader: 'currentPlayer', // Would be player ID
      members: ['currentPlayer'],
      founded: new Date().toISOString(),
      level: 1,
      treasury: 0,
      perks: [],
      chatHistory: []
    };

    this.myGuild = guild;
    this.allGuilds.push(guild);
    this.saveToStorage('metaverse_my_guild', guild);
    this.saveToStorage('metaverse_all_guilds', this.allGuilds);
    console.log(`✅ Guild "${guildName}" created!`);
    return guild;
  }

  joinGuild(guildId) {
    if (this.myGuild) {
      console.log('❌ Leave your current guild first!');
      return false;
    }

    const guild = this.allGuilds.find(g => g.id === guildId);
    if (guild) {
      guild.members.push('currentPlayer');
      this.myGuild = guild;
      this.saveToStorage('metaverse_my_guild', guild);
      this.saveToStorage('metaverse_all_guilds', this.allGuilds);
      console.log(`✅ Joined guild: ${guild.name}`);
      return true;
    }
    return false;
  }

  leaveGuild() {
    if (!this.myGuild) {
      console.log('❌ You are not in a guild!');
      return false;
    }

    const guild = this.allGuilds.find(g => g.id === this.myGuild.id);
    if (guild) {
      guild.members = guild.members.filter(m => m !== 'currentPlayer');
      this.myGuild = null;
      this.saveToStorage('metaverse_my_guild', null);
      this.saveToStorage('metaverse_all_guilds', this.allGuilds);
      console.log('✅ Left guild');
      return true;
    }
    return false;
  }

  inviteMemberToGuild(memberId) {
    if (!this.myGuild) {
      console.log('❌ You are not in a guild!');
      return false;
    }

    this.guildInvites.push({
      guildId: this.myGuild.id,
      memberId: memberId,
      timestamp: new Date().toISOString()
    });
    this.saveToStorage('metaverse_guild_invites', this.guildInvites);
    console.log(`📬 Invite sent to ${memberId}`);
    return true;
  }

  getGuildUI() {
    if (!this.myGuild) {
      return `<div class="guild-panel"><p>You are not in a guild. <button onclick="showGuildBrowser()">Browse Guilds</button></p></div>`;
    }

    return `
      <div class="guild-panel">
        <h3>[${this.myGuild.tag}] ${this.myGuild.name}</h3>
        <p>${this.myGuild.description}</p>
        <div class="guild-stats">
          <div>Level: ${this.myGuild.level}</div>
          <div>Members: ${this.myGuild.members.length}</div>
          <div>Treasury: 💰 ${this.myGuild.treasury}</div>
        </div>
        <div class="guild-members">
          <h4>Members (${this.myGuild.members.length})</h4>
          ${this.myGuild.members.map(m => `<div class="member">${m}</div>`).join('')}
        </div>
        <div class="guild-chat">
          <h4>Guild Chat</h4>
          <div class="chat-box" id="guild-chat-box"></div>
          <input type="text" placeholder="Say something..." id="guild-chat-input">
          <button onclick="gameState.guildSystem.sendGuildMessage()">Send</button>
        </div>
      </div>
    `;
  }

  sendGuildMessage() {
    const input = document.getElementById('guild-chat-input');
    if (input && input.value && this.myGuild) {
      const message = {
        player: 'currentPlayer',
        text: input.value,
        timestamp: new Date().toISOString()
      };
      this.myGuild.chatHistory.push(message);
      this.saveToStorage('metaverse_my_guild', this.myGuild);
      console.log(`💬 Guild message sent: ${input.value}`);
      input.value = '';
    }
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
// 3. GLOBAL LEADERBOARD SYSTEM
// ============================================================================
class LeaderboardSystem {
  constructor() {
    this.globalLeaderboard = this.loadFromStorage('metaverse_leaderboard') || [];
    this.weeklyLeaderboard = this.loadFromStorage('metaverse_weekly_leaderboard') || [];
    this.friendLeaderboard = this.loadFromStorage('metaverse_friend_leaderboard') || [];
  }

  updatePlayerScore(playerId, playerName, score) {
    let player = this.globalLeaderboard.find(p => p.id === playerId);
    if (!player) {
      player = { id: playerId, name: playerName, score: 0, rank: 0, winRate: 0, lastUpdated: new Date().toISOString() };
      this.globalLeaderboard.push(player);
    }
    player.score = Math.max(player.score, score);
    player.lastUpdated = new Date().toISOString();
    this.sortLeaderboard();
    this.saveToStorage('metaverse_leaderboard', this.globalLeaderboard);
  }

  sortLeaderboard() {
    this.globalLeaderboard.sort((a, b) => b.score - a.score);
    this.globalLeaderboard.forEach((player, index) => {
      player.rank = index + 1;
    });
  }

  getPlayerRank(playerId) {
    const player = this.globalLeaderboard.find(p => p.id === playerId);
    return player ? player.rank : 'Unranked';
  }

  getTopPlayers(limit = 10) {
    return this.globalLeaderboard.slice(0, limit);
  }

  getLeaderboardUI() {
    return `
      <div class="leaderboard-panel">
        <h3>🏆 Global Leaderboard</h3>
        <div class="leaderboard-table">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Score</th>
                <th>Win Rate</th>
              </tr>
            </thead>
            <tbody>
              ${this.globalLeaderboard.slice(0, 20).map((player, i) => `
                <tr class="${i < 3 ? 'top-' + (i + 1) : ''}">
                  <td>#${player.rank}</td>
                  <td>${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''} ${player.name}</td>
                  <td>${player.score}</td>
                  <td>${player.winRate || 0}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  loadFromStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
      console.error(`Error loading ${key}:`, e);
      return [];
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
// 4. ACHIEVEMENT & BADGE SYSTEM
// ============================================================================
class AchievementSystem {
  constructor() {
    this.achievements = this.initAchievements();
    this.playerAchievements = this.loadFromStorage('metaverse_achievements') || {};
    this.achievementNotifications = [];
  }

  initAchievements() {
    return {
      first_login: { name: 'Welcome!', description: 'Login for the first time', icon: '🎮', points: 10 },
      coin_collector: { name: 'Coin Collector', description: 'Earn 10,000 coins', icon: '💰', points: 50 },
      game_master: { name: 'Game Master', description: 'Win 50 mini-games', icon: '🏆', points: 100 },
      social_butterfly: { name: 'Social Butterfly', description: 'Add 20 friends', icon: '👥', points: 50 },
      fashion_forward: { name: 'Fashion Forward', description: 'Buy 5 cosmetics', icon: '👗', points: 30 },
      level_50: { name: 'Reaching Heights', description: 'Reach level 50', icon: '📈', points: 75 },
      battle_pass_complete: { name: 'Battle Hardened', description: 'Complete a battle pass', icon: '⚔️', points: 100 },
      guild_founder: { name: 'Guild Founder', description: 'Create a guild', icon: '🏰', points: 200 }
    };
  }

  unlockAchievement(achievementId) {
    if (!this.playerAchievements[achievementId]) {
      const achievement = this.achievements[achievementId];
      if (achievement) {
        this.playerAchievements[achievementId] = {
          unlockedAt: new Date().toISOString(),
          ...achievement
        };
        this.saveToStorage('metaverse_achievements', this.playerAchievements);
        this.showAchievementNotification(achievement);
        return true;
      }
    }
    return false;
  }

  showAchievementNotification(achievement) {
    const notification = `🏅 Achievement Unlocked: ${achievement.name}! (+${achievement.points} XP)`;
    console.log(notification);
    this.achievementNotifications.push(notification);
  }

  getAchievementUI() {
    return `
      <div class="achievement-panel">
        <h3>🏅 Achievements</h3>
        <div class="achievements-grid">
          ${Object.entries(this.achievements).map(([id, achievement]) => `
            <div class="achievement-card ${this.playerAchievements[id] ? 'unlocked' : 'locked'}">
              <div class="achievement-icon">${achievement.icon}</div>
              <div class="achievement-info">
                <h4>${achievement.name}</h4>
                <p>${achievement.description}</p>
                <span class="points">+${achievement.points} XP</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="total-points">Total: ${Object.values(this.playerAchievements).reduce((sum, a) => sum + a.points, 0)} XP</div>
      </div>
    `;
  }

  loadFromStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || {};
    } catch (e) {
      console.error(`Error loading ${key}:`, e);
      return {};
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
// 5. BATTLE PASS SYSTEM
// ============================================================================
class BattlePassSystem {
  constructor() {
    this.currentSeason = 1;
    this.freeTracks = [];
    this.premiumTracks = [];
    this.playerProgress = this.loadFromStorage('metaverse_battle_pass') || {};
    this.initBattlePass();
  }

  initBattlePass() {
    this.freeTracks = [
      { level: 1, reward: { type: 'coins', amount: 100 }, description: 'Free Track' },
      { level: 5, reward: { type: 'coins', amount: 250 }, description: 'Free Track' },
      { level: 10, reward: { type: 'cosmetic', name: 'Common Skin' }, description: 'Free Track' },
      { level: 15, reward: { type: 'coins', amount: 500 }, description: 'Free Track' },
      { level: 20, reward: { type: 'cosmetic', name: 'Rare Skin' }, description: 'Free Track' }
    ];

    this.premiumTracks = [
      { level: 2, reward: { type: 'premium', name: 'Premium Cosmetic 1' }, description: 'Premium Track' },
      { level: 7, reward: { type: 'premium', name: 'Premium Cosmetic 2' }, description: 'Premium Track' },
      { level: 12, reward: { type: 'premium', name: 'Premium Emote' }, description: 'Premium Track' },
      { level: 18, reward: { type: 'premium', name: 'Premium Skin' }, description: 'Premium Track' },
      { level: 25, reward: { type: 'premium', name: 'Legendary Cosmetic' }, description: 'Premium Track' }
    ];
  }

  addBattlePassXP(amount) {
    if (!this.playerProgress[this.currentSeason]) {
      this.playerProgress[this.currentSeason] = { level: 1, xp: 0, rewards: [] };
    }
    this.playerProgress[this.currentSeason].xp += amount;
    this.checkLevelUp();
    this.saveToStorage('metaverse_battle_pass', this.playerProgress);
  }

  checkLevelUp() {
    const progress = this.playerProgress[this.currentSeason];
    const xpPerLevel = 1000;
    const newLevel = Math.floor(progress.xp / xpPerLevel) + 1;
    if (newLevel > progress.level) {
      progress.level = newLevel;
      console.log(`⬆️ Battle Pass Level ${progress.level}!`);
      this.grantLevelRewards(progress.level);
    }
  }

  grantLevelRewards(level) {
    const progress = this.playerProgress[this.currentSeason];
    const freeReward = this.freeTracks.find(t => t.level === level);
    if (freeReward) {
      progress.rewards.push(freeReward.reward);
      console.log(`✨ Free Reward: ${JSON.stringify(freeReward.reward)}`);
    }
  }

  getBattlePassUI() {
    const progress = this.playerProgress[this.currentSeason] || { level: 1, xp: 0 };
    const xpPerLevel = 1000;
    const currentLevelXP = (progress.xp % xpPerLevel);
    const progressPercent = (currentLevelXP / xpPerLevel) * 100;

    return `
      <div class="battle-pass-panel">
        <h3>⚔️ Battle Pass - Season ${this.currentSeason}</h3>
        <div class="bp-level-info">
          <h4>Level ${progress.level}</h4>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercent}%"></div>
          </div>
          <p>${currentLevelXP} / ${xpPerLevel} XP</p>
        </div>
        <div class="bp-tracks">
          <div class="free-track">
            <h4>Free Track</h4>
            ${this.freeTracks.map(t => `
              <div class="bp-reward ${progress.level >= t.level ? 'unlocked' : ''}">
                <span class="level">Level ${t.level}</span>
                <span class="reward">${t.reward.name || t.reward.amount}</span>
              </div>
            `).join('')}
          </div>
          <div class="premium-track">
            <h4>Premium Track (Paid)</h4>
            ${this.premiumTracks.map(t => `
              <div class="bp-reward ${progress.level >= t.level ? 'unlocked' : ''}">
                <span class="level">Level ${t.level}</span>
                <span class="reward">✨ ${t.reward.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  loadFromStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || {};
    } catch (e) {
      console.error(`Error loading ${key}:`, e);
      return {};
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
// EXPORT ALL SYSTEMS
// ============================================================================
const gameState = {
  friendSystem: new FriendSystem(),
  guildSystem: new GuildSystem(),
  leaderboardSystem: new LeaderboardSystem(),
  achievementSystem: new AchievementSystem(),
  battlePassSystem: new BattlePassSystem()
};

// Initialize and log
console.log('🚀 METAVERSE Platform v2.0 Systems Loaded!');
console.log('✅ Friend System Ready');
console.log('✅ Guild System Ready');
console.log('✅ Leaderboard System Ready');
console.log('✅ Achievement System Ready');
console.log('✅ Battle Pass System Ready');
