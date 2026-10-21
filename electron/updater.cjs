const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
function isValidRepository(repository) {
  if (typeof repository !== 'string' || repository.trim() !== repository) return false;
  const parts = repository.split('/');
  return parts.length === 2 && /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(parts[0]) && /^[A-Za-z0-9_.-]{1,100}$/.test(parts[1]) && !['.', '..'].includes(parts[1]);
}

function isValidUpdateChannel(channel) {
  return channel === 'preview' || channel === 'stable';
}

function updateErrorMessage(error) {
  const status = error?.statusCode ?? error?.status ?? error?.response?.statusCode;
  const message = typeof error?.message === 'string' ? error.message : '';
  return Number(status) === 404 || /\b404\b|\bno (?:published |stable )?releases?\b|\bno release (?:found|available)\b/i.test(message)
    ? '目前尚無可用的正式更新，請稍後再試。'
    : '更新失敗，請稍後再試。';
}

function createUpdater({ app, autoUpdater, repository, channel = 'preview', platform = process.platform, arch = process.arch, onState = () => {} }) {
  const currentVersion = app.getVersion();
  let state = { phase: 'unavailable', currentVersion, message: '此版本尚未設定更新來源。' };
  const configured = app.isPackaged && platform === 'darwin' && ['arm64', 'x64'].includes(arch) && isValidRepository(repository) && isValidUpdateChannel(channel) && SEMVER.test(currentVersion);
  let nativeEnabled = false;
  const publish = (next) => {
    state = { ...state, ...next, currentVersion };
    onState(state);
    return state;
  };

  if (!app.isPackaged || platform !== 'darwin') {
    state = { phase: 'unsupported', currentVersion, message: '自動更新僅適用於正式簽署的 macOS 版本。' };
  } else if (!configured) {
    state = { phase: 'unavailable', currentVersion, message: '此版本尚未設定有效的 GitHub 更新來源。' };
  } else if (channel === 'preview') {
    state = { phase: 'manual', currentVersion, releasesUrl: `https://github.com/${repository}/releases`, message: '預覽版採用手動更新，請開啟下載頁面取得新版，再拖曳至「應用程式」取代舊版。' };
  } else {
    try {
      autoUpdater.setFeedURL({ url: `https://update.electronjs.org/${repository}/darwin-${arch}/${currentVersion}` });
      autoUpdater.on('checking-for-update', () => publish({ phase: 'checking', message: '正在檢查更新…' }));
      // Electron's native updater supplies no version or progress payload here.
      autoUpdater.on('update-available', () => publish({ phase: 'downloading', availableVersion: undefined, message: '正在下載更新…' }));
      autoUpdater.on('update-not-available', () => publish({ phase: 'current', availableVersion: undefined, message: `目前已是最新版本（${currentVersion}）。` }));
      autoUpdater.on('update-downloaded', (_event, _releaseNotes, releaseName) => {
        const version = typeof releaseName === 'string' ? releaseName.replace(/^v/, '') : '';
        const availableVersion = version.trim() === version && SEMVER.test(version) ? version : undefined;
        publish({ phase: 'downloaded', availableVersion, message: availableVersion ? `OpenMind ${availableVersion} 已下載完成。` : '更新已下載完成，可重新啟動並安裝。' });
      });
      autoUpdater.on('error', error => publish({ phase: 'error', message: updateErrorMessage(error) }));
      nativeEnabled = true;
      state = { phase: 'idle', currentVersion, message: `目前版本 ${currentVersion}。` };
    } catch {
      state = { phase: 'error', currentVersion, message: '無法初始化更新服務。' };
    }
  }

  return {
    getState: () => ({ ...state }),
    check() {
      if (!nativeEnabled) return this.getState();
      if (state.phase === 'checking' || state.phase === 'downloading' || state.phase === 'downloaded' || state.phase === 'installing') return this.getState();
      publish({ phase: 'checking', availableVersion: undefined, message: '正在檢查更新…' });
      try {
        autoUpdater.checkForUpdates();
      } catch (error) {
        publish({ phase: 'error', message: updateErrorMessage(error) });
      }
      return this.getState();
    },
    install() {
      if (!nativeEnabled || state.phase !== 'downloaded') return false;
      publish({ phase: 'installing', message: '正在重新啟動並安裝更新…' });
      try {
        autoUpdater.quitAndInstall();
        return true;
      } catch (error) {
        publish({ phase: 'error', message: updateErrorMessage(error) });
        return false;
      }
    },
  };
}

module.exports = { createUpdater, isValidRepository, isValidUpdateChannel };
