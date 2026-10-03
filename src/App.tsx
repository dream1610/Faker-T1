import React, { useState, useEffect, useCallback } from 'react';
import { UserAccount, GameTheme, MapObstacleConfig } from './types';
import { StorageService } from './services/storage';
import { GAME_THEMES, getThemeById } from './constants/themes';
import { ALL_MAPS, getMapById } from './constants/maps';
import { getSkinById } from './constants/skins';
import { soundManager } from './services/sound';

import { Header } from './components/Header';
import { MainMenu } from './components/MainMenu';
import { SingleGameArena } from './components/SingleGameArena';
import { DuelMatchArena } from './components/DuelMatchArena';
import { AuthModal } from './components/AuthModal';
import { SkinShopModal } from './components/SkinShopModal';
import { MapSelectModal } from './components/MapSelectModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { DailyRewardModal } from './components/DailyRewardModal';
import { DuelRoomModal } from './components/DuelRoomModal';
import { ChatAndEmotes } from './components/ChatAndEmotes';
import { Footer } from './components/Footer';

export default function App() {
  // Current user account (null means user must register/login first)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Navigation View: 'menu' (Main Menu) or 'game' (Playing Game Arena)
  const [currentView, setCurrentView] = useState<'menu' | 'game'>('menu');

  // Active Game Settings
  const [currentTheme, setCurrentTheme] = useState<GameTheme>(GAME_THEMES[0]);
  const [currentMap, setCurrentMap] = useState<MapObstacleConfig>(ALL_MAPS[0]); // 10x10 Tự Do

  // Game Mode: Single or 2-Player Duel
  const [gameMode, setGameMode] = useState<'single' | 'duel'>('single');

  // Duel Match Session State
  const [isBotDuel, setIsBotDuel] = useState<boolean>(true);
  const [duelOpponentName, setDuelOpponentName] = useState<string>('Bot Nokia AI');
  const [duelOpponentSkinId, setDuelOpponentSkinId] = useState<string>('cyber_ruby');
  const [duelRoomCode, setDuelRoomCode] = useState<string>('SOLO_BOT');
  const [activeEmote, setActiveEmote] = useState<string | undefined>(undefined);

  // Modals state
  const [showShop, setShowShop] = useState<boolean>(false);
  const [showMaps, setShowMaps] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showDailyReward, setShowDailyReward] = useState<boolean>(false);
  const [showDuelModal, setShowDuelModal] = useState<boolean>(false);

  // Sound & Fullscreen
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.isMuted);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Initialize active user on startup
  useEffect(() => {
    const user = StorageService.getActiveUser();
    if (user) {
      setCurrentUser(user);
      setCurrentView('menu');
      if (user.currentThemeId) {
        setCurrentTheme(getThemeById(user.currentThemeId));
      }
      // If user hasn't claimed today's daily reward, hint with daily modal after brief start
      const { canClaim } = StorageService.checkDailyReward(user);
      if (canClaim) {
        setTimeout(() => setShowDailyReward(true), 800);
      }
    } else {
      setShowAuthModal(true);
    }
  }, []);

  // Robust Fullscreen state listener across iOS, Android and embedded iframes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isNative = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      // When user exits native fullscreen via ESC or gesture, sync state
      if (!isNative && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  const handleToggleFullscreen = () => {
    soundManager.playClick();
    const doc = document as any;
    const isCurrentlyNative = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    if (isFullscreen || isCurrentlyNative) {
      // Exit fullscreen
      setIsFullscreen(false);
      try {
        if (doc.exitFullscreen) {
          doc.exitFullscreen().catch(() => {});
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          doc.msExitFullscreen();
        }
      } catch {
        // Fallback silently
      }
    } else {
      // Enter fullscreen: ALWAYS activate in-app fullscreen immediately so mobile & iframes work seamlessly!
      setIsFullscreen(true);
      try {
        window.scrollTo(0, 1);
        const elem = document.documentElement as any;
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {});
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        }
      } catch {
        // Fallback silently
      }
    }
  };

  const handleToggleMute = () => {
    const nextMuted = soundManager.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleThemeChange = (theme: GameTheme) => {
    setCurrentTheme(theme);
    if (currentUser) {
      const updated = StorageService.updateActiveUser((u) => {
        u.currentThemeId = theme.id;
        return u;
      });
      if (updated) setCurrentUser(updated);
    }
  };

  const handleCycleTheme = () => {
    const currentIndex = GAME_THEMES.findIndex((t) => t.id === currentTheme.id);
    const nextIndex = (currentIndex + 1) % GAME_THEMES.length;
    handleThemeChange(GAME_THEMES[nextIndex]);
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    setCurrentView('menu');
    if (user.currentThemeId) {
      setCurrentTheme(getThemeById(user.currentThemeId));
    }
    // Check daily reward
    const { canClaim } = StorageService.checkDailyReward(user);
    if (canClaim) {
      setTimeout(() => setShowDailyReward(true), 600);
    }
  };

  const handleSwitchAccount = () => {
    StorageService.logout();
    setCurrentUser(null);
    setCurrentView('menu');
    setShowAuthModal(true);
  };

  const handleUserUpdated = (updated: UserAccount) => {
    setCurrentUser({ ...updated });
  };

  const checkIsMobile = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;
    const isSmallScreen = window.innerWidth <= 768;
    const isMobileUA = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent || '');
    return (isTouch && isSmallScreen) || isMobileUA;
  }, []);

  const autoEnterFullscreenOnMobile = useCallback(() => {
    if (checkIsMobile()) {
      setIsFullscreen(true);
      try {
        const doc = document as any;
        const elem = document.documentElement as any;
        if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
          if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(() => {});
          } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
          }
        }
      } catch {
        // Fallback silently
      }
    }
  }, [checkIsMobile]);

  // When game starts or view becomes 'game' on mobile, automatically activate fullscreen
  useEffect(() => {
    if (currentView === 'game' && checkIsMobile() && !isFullscreen) {
      autoEnterFullscreenOnMobile();
    }
  }, [currentView, checkIsMobile, isFullscreen, autoEnterFullscreenOnMobile]);

  const handleStartSingleGame = () => {
    autoEnterFullscreenOnMobile();
    setGameMode('single');
    setCurrentView('game');
  };

  const handleStartDuel = (isBot: boolean, oppName: string, oppSkin: string, roomCode: string) => {
    autoEnterFullscreenOnMobile();
    setIsBotDuel(isBot);
    setDuelOpponentName(oppName);
    setDuelOpponentSkinId(oppSkin);
    setDuelRoomCode(roomCode);
    setGameMode('duel');
    setCurrentView('game');
    setShowDuelModal(false);
  };

  const handleSendEmote = (emote: string) => {
    setActiveEmote(emote);
    setTimeout(() => setActiveEmote(undefined), 3500);
  };

  const currentSkin = currentUser ? getSkinById(currentUser.currentSkinId) : getSkinById('classic_nokia');

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col justify-between transition-colors duration-300 select-none overflow-x-hidden"
      style={{
        backgroundColor: currentTheme.bg,
        color: currentTheme.textColor,
      }}
    >
      {/* 1. TOP RETRO NAVIGATION HEADER (Hidden in Game Fullscreen to maximize play space, visible in Menu) */}
      {currentUser && (!isFullscreen || currentView === 'menu') && (
        <Header
          currentUser={currentUser}
          currentTheme={currentTheme}
          onThemeChange={handleThemeChange}
          onOpenShop={() => setShowShop(true)}
          onOpenMaps={() => setShowMaps(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenDailyReward={() => setShowDailyReward(true)}
          onOpenDuelRoom={() => setShowDuelModal(true)}
          onSwitchAccount={handleSwitchAccount}
          onReturnToMenu={() => {
            setIsFullscreen(false);
            setCurrentView('menu');
          }}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          gameMode={gameMode}
          onSetGameMode={(mode) => {
            setGameMode(mode);
            if (mode === 'single') {
              handleStartSingleGame();
            }
          }}
        />
      )}

      {/* 2. MAIN VIEW: MENU OR GAME ARENA */}
      <main
        className={`flex-1 flex flex-col items-center justify-center w-full max-w-full ${
          isFullscreen && currentView === 'game'
            ? 'p-0 h-[100dvh] max-h-[100dvh] overflow-hidden'
            : 'p-1 sm:p-2'
        }`}
      >
        {currentUser && (
          <>
            {currentView === 'menu' ? (
              <MainMenu
                currentUser={currentUser}
                currentMap={currentMap}
                currentTheme={currentTheme}
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
                onStartSingleGame={handleStartSingleGame}
                onOpenMapSelect={() => setShowMaps(true)}
                onOpenDuelModal={() => setShowDuelModal(true)}
                onOpenSkinShop={() => setShowShop(true)}
                onOpenLeaderboard={() => setShowLeaderboard(true)}
                onOpenDailyReward={() => setShowDailyReward(true)}
                onOpenThemeSelect={handleCycleTheme}
                onLogout={handleSwitchAccount}
              />
            ) : (
              <>
                {gameMode === 'single' ? (
                  <SingleGameArena
                    currentUser={currentUser}
                    currentMap={currentMap}
                    theme={currentTheme}
                    skin={currentSkin}
                    onUserUpdated={handleUserUpdated}
                    activeEmote={activeEmote}
                    onReturnToMenu={() => {
                      setIsFullscreen(false);
                      setCurrentView('menu');
                    }}
                    onChangeMap={() => setShowMaps(true)}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={handleToggleFullscreen}
                  />
                ) : (
                  <DuelMatchArena
                    currentUser={currentUser}
                    currentMap={currentMap}
                    theme={currentTheme}
                    skin={currentSkin}
                    isBotOpponent={isBotDuel}
                    opponentName={duelOpponentName}
                    opponentSkinId={duelOpponentSkinId}
                    roomCode={duelRoomCode}
                    onExitDuel={() => {
                      setIsFullscreen(false);
                      setGameMode('single');
                      setCurrentView('menu');
                    }}
                    onUserUpdated={handleUserUpdated}
                    activeEmote={activeEmote}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={handleToggleFullscreen}
                  />
                )}

                {/* Bottom Interactive Chat & Emote Drawer in match (Hidden in Fullscreen to maximize play space) */}
                {!isFullscreen && (
                  <div className="w-full max-w-xl px-2 mt-4">
                    <ChatAndEmotes
                      currentUser={currentUser}
                      onSendEmote={handleSendEmote}
                      roomCode={gameMode === 'duel' ? duelRoomCode : undefined}
                      isDuelMode={gameMode === 'duel'}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* 3. FOOTER ("Designed by Gdreed") - Shown when not in active fullscreen game */}
      {(!isFullscreen || currentView === 'menu') && <Footer />}

      {/* 4. MODALS */}
      {/* Mandatory Auth modal when not logged in */}
      <AuthModal
        isOpen={showAuthModal || !currentUser}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Skin & Customization Shop */}
      {currentUser && (
        <SkinShopModal
          isOpen={showShop}
          onClose={() => setShowShop(false)}
          currentUser={currentUser}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {/* 28 Maps Selector */}
      {currentUser && (
        <MapSelectModal
          isOpen={showMaps}
          onClose={() => setShowMaps(false)}
          selectedMap={currentMap}
          onSelectMap={setCurrentMap}
          onStartGame={(map) => {
            setCurrentMap(map);
            handleStartSingleGame();
          }}
          currentUser={currentUser}
        />
      )}

      {/* Leaderboard & Rank Tiers */}
      {currentUser && (
        <LeaderboardModal
          isOpen={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
          currentUser={currentUser}
        />
      )}

      {/* Daily Login Reward Streak */}
      {currentUser && (
        <DailyRewardModal
          isOpen={showDailyReward}
          onClose={() => setShowDailyReward(false)}
          currentUser={currentUser}
          onRewardClaimed={handleUserUpdated}
        />
      )}

      {/* 1v1 Duel Room Creation / Matchmaking */}
      {currentUser && (
        <DuelRoomModal
          isOpen={showDuelModal}
          onClose={() => setShowDuelModal(false)}
          currentUser={currentUser}
          currentMap={currentMap}
          onStartDuel={handleStartDuel}
        />
      )}
    </div>
  );
}
