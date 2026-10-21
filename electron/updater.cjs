const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const REPOSITORY = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function createUpdater({ app, autoUpdater, repository, platform = process.platform, arch = process.arch, onState = () => {} }) {
  const currentVersion = app.getVersion();
  let state = { phase: 'unavailable', currentVersion, message: '此版本尚未設定更新來源。' };
  const configured = app.isPackaged && platform === 'darwin' && ['arm64', 'x64'].includes(arch) && REPOSITORY.test(repository || '') && SEMVER.test(currentVersion);
  const publish = (next) => {
    state = { ...state, ...next, currentVersion };
    onState(state);
    return state;
  };

  if (!app.isPackaged || platform !== 'darwin') {
    state = { phase: 'unsupported', currentVersion, message: '自動更新僅適用於正式簽署的 macOS 版本。' };
  } else if (!configured) {
    state = { phase: 'unavailable', currentVersion, message: '此版本尚未設定有效的 GitHub 更新來源。' };
  } else {
    try {
      autoUpdater.setFeedURL({ url: `https://update.electronjs.org/${repository}/darwin-${arch}/${currentVersion}` });
      autoUpdater.on('checking-for-update', () => publish({ phase: 'checking', message: '正在檢查更新…' }));
      autoUpdater.on('update-available', (info = {}) => publish({ phase: 'downloading', availableVersion: info.version, progress: 0, message: `正在下載 ${info.version || '新版本'}…` }));
      autoUpdater.on('download-progress', (progress = {}) => {
        const percent = Number(progress.percent);
        publish({ phase: 'downloading', progress: Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : undefined, message: '正在下載更新…' });
      });
      autoUpdater.on('update-not-available', () => publish({ phase: 'current', availableVersion: undefined, progress: undefined, message: `目前已是最新版本（${currentVersion}）。` }));
      autoUpdater.on('update-downloaded', (info = {}) => publish({ phase: 'downloaded', availableVersion: info.version, progress: 100, message: `OpenMind ${info.version || ''} 已下載完成。`.trim() }));
      autoUpdater.on('error', () => publish({ phase: 'error', message: '更新失敗，請檢查網路連線後再試一次。' }));
      state = { phase: 'idle', currentVersion, message: `目前版本 ${currentVersion}。` };
    } catch {
      state = { phase: 'error', currentVersion, message: '無法初始化更新服務。' };
    }
  }

  return {
    getState: () => ({ ...state }),
    check() {
      if (!configured) return this.getState();
      if (state.phase === 'checking' || state.phase === 'downloading' || state.phase === 'downloaded' || state.phase === 'installing') return this.getState();
      publish({ phase: 'checking', availableVersion: undefined, progress: undefined, message: '正在檢查更新…' });
      try {
        autoUpdater.checkForUpdates();
      } catch {
        publish({ phase: 'error', message: '無法連線至更新服務，請稍後再試。' });
      }
      return this.getState();
    },
    install() {
      if (state.phase !== 'downloaded') return false;
      publish({ phase: 'installing', message: '正在重新啟動並安裝更新…' });
      autoUpdater.quitAndInstall();
      return true;
    },
  };
}

module.exports = { createUpdater };
