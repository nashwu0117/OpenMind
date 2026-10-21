const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createUpdater, isValidRepository, isValidUpdateChannel } = require('../electron/updater.cjs');

function fixture({ packaged = true, platform = 'darwin', arch = 'arm64', repository = 'openmind/OpenMind', version = '0.3.1', channel = 'stable' } = {}) {
  const autoUpdater = new EventEmitter();
  autoUpdater.setFeedURL = (feed) => { autoUpdater.feed = feed; };
  autoUpdater.checkForUpdates = () => { autoUpdater.checks = (autoUpdater.checks || 0) + 1; };
  autoUpdater.quitAndInstall = () => { autoUpdater.installs = (autoUpdater.installs || 0) + 1; };
  const updater = createUpdater({ app: { isPackaged: packaged, getVersion: () => version }, autoUpdater, repository, platform, arch, channel });
  return { autoUpdater, updater };
}

describe('macOS updater', () => {
  it('configures the architecture-specific feed but checks only on request', () => {
    const { autoUpdater, updater } = fixture();
    assert.deepEqual(autoUpdater.feed, { url: 'https://update.electronjs.org/openmind/OpenMind/darwin-arm64/0.3.1' });
    assert.equal(autoUpdater.checks, undefined);
    assert.equal(autoUpdater.installs, undefined);
    assert.equal(updater.check().phase, 'checking');
    assert.equal(autoUpdater.checks, 1);
    updater.check();
    assert.equal(autoUpdater.checks, 1);
    assert.equal(fixture({ arch: 'x64' }).autoUpdater.feed.url, 'https://update.electronjs.org/openmind/OpenMind/darwin-x64/0.3.1');
  });

  it('keeps preview updates manual without initializing, checking, downloading, or installing native updates', () => {
    const { autoUpdater, updater } = fixture({ channel: 'preview' });
    assert.deepEqual(updater.getState(), {
      phase: 'manual', currentVersion: '0.3.1', releasesUrl: 'https://github.com/openmind/OpenMind/releases',
      message: '預覽版採用手動更新，請開啟下載頁面取得新版，再拖曳至「應用程式」取代舊版。',
    });
    assert.equal(autoUpdater.feed, undefined);
    assert.equal(autoUpdater.eventNames().length, 0);
    assert.equal(updater.check().phase, 'manual');
    assert.equal(updater.install(), false);
    assert.equal(autoUpdater.checks, undefined);
    assert.equal(autoUpdater.installs, undefined);
    const defaults = createUpdater({ app: { isPackaged: true, getVersion: () => '0.3.1' }, autoUpdater, repository: 'openmind/OpenMind', platform: 'darwin', arch: 'arm64' });
    assert.equal(defaults.getState().phase, 'manual');
  });

  it('does not enable updates for development builds, other platforms, or invalid repository configuration', () => {
    assert.equal(fixture({ packaged: false }).updater.getState().phase, 'unsupported');
    assert.equal(fixture({ platform: 'win32' }).updater.getState().phase, 'unsupported');
    const invalid = fixture({ repository: 'https://example.com/openmind' });
    assert.equal(invalid.updater.getState().phase, 'unavailable');
    assert.equal(invalid.autoUpdater.feed, undefined);
    assert.equal(fixture({ arch: 'invalid' }).updater.getState().phase, 'unavailable');
    assert.equal(fixture({ version: 'not-a-version' }).updater.getState().phase, 'unavailable');
    for (const options of [{ packaged: false }, { platform: 'win32' }, { arch: 'invalid' }]) {
      const unsupported = fixture({ ...options, channel: 'preview' });
      assert.equal(unsupported.updater.getState().releasesUrl, undefined);
      unsupported.updater.check();
      assert.equal(unsupported.updater.install(), false);
      assert.equal(unsupported.autoUpdater.feed, undefined);
      assert.equal(unsupported.autoUpdater.checks, undefined);
    }
  });

  it('validates update channels and repository paths before constructing an external URL', () => {
    assert.equal(isValidUpdateChannel('preview'), true);
    assert.equal(isValidUpdateChannel('stable'), true);
    for (const channel of ['', 'nightly', 'STABLE', null, 1]) {
      assert.equal(isValidUpdateChannel(channel), false);
      const invalid = fixture({ channel });
      assert.equal(invalid.updater.getState().phase, 'unavailable');
      assert.equal(invalid.autoUpdater.feed, undefined);
    }
    for (const repository of ['', '../OpenMind', 'owner/..', 'owner/.', 'owner/repo/extra', 'https://github.com/owner/repo', 'owner/repo?token=secret', 'owner/repo#fragment', 'owner/repo%2Fextra', 'owner/repo\n']) {
      assert.equal(isValidRepository(repository), false, repository);
      const invalid = fixture({ channel: 'preview', repository });
      assert.equal(invalid.updater.getState().phase, 'unavailable');
      assert.equal(invalid.updater.getState().releasesUrl, undefined);
      assert.equal(invalid.autoUpdater.feed, undefined);
    }
  });

  it('uses native Electron event signatures and permits installation only by request after download', () => {
    const { autoUpdater, updater } = fixture();
    assert.equal(updater.install(), false);
    autoUpdater.emit('update-available');
    assert.equal(updater.getState().phase, 'downloading');
    assert.equal(updater.getState().availableVersion, undefined);
    assert.equal(autoUpdater.listenerCount('download-progress'), 0);
    autoUpdater.emit('download-progress', { percent: 36.4 });
    assert.equal(updater.getState().progress, undefined);
    assert.equal(updater.install(), false);
    autoUpdater.emit('update-downloaded', { sender: 'native-event' }, 'release notes', 'v0.3.2', new Date(), 'https://example.com/update.zip');
    assert.equal(updater.getState().phase, 'downloaded');
    assert.equal(updater.getState().availableVersion, '0.3.2');
    assert.equal(autoUpdater.installs, undefined);
    updater.check();
    assert.equal(autoUpdater.checks, undefined);
    assert.equal(updater.install(), true);
    assert.equal(autoUpdater.installs, 1);
    assert.equal(updater.getState().phase, 'installing');
    assert.equal(updater.install(), false);
  });

  it('uses safe generic download copy when the native release name is absent or not a version', () => {
    for (const releaseName of [undefined, 'OpenMind new release', '0.3.2\n']) {
      const { autoUpdater, updater } = fixture();
      autoUpdater.emit('update-downloaded', {}, 'private release notes', releaseName);
      assert.equal(updater.getState().availableVersion, undefined);
      assert.equal(updater.getState().message, '更新已下載完成，可重新啟動並安裝。');
    }
  });

  it('returns to a retryable current/error state without exposing raw updater errors', () => {
    const { autoUpdater, updater } = fixture();
    autoUpdater.emit('update-not-available');
    assert.equal(updater.getState().phase, 'current');
    autoUpdater.emit('error', new Error('/private/user/document.openmind failed'));
    assert.equal(updater.getState().phase, 'error');
    assert.equal(updater.getState().message.includes('/private/user'), false);
    assert.equal(updater.getState().message, '更新失敗，請稍後再試。');
    updater.check();
    assert.equal(updater.getState().phase, 'checking');
  });

  it('explains a missing official release without leaking updater details or blaming the network', () => {
    for (const error of [new Error('HTTP 404 https://private.example/?token=secret'), Object.assign(new Error('secret'), { statusCode: 404 }), new Error('No releases found')]) {
      const { autoUpdater, updater } = fixture();
      autoUpdater.emit('error', error);
      assert.equal(updater.getState().message, '目前尚無可用的正式更新，請稍後再試。');
      assert.equal(updater.getState().message.includes('secret'), false);
    }
  });

  it('handles synchronous native check and installation errors with safe retryable copy', () => {
    const { autoUpdater, updater } = fixture();
    autoUpdater.checkForUpdates = () => { throw new Error('private detail'); };
    assert.equal(updater.check().message, '更新失敗，請稍後再試。');
    autoUpdater.emit('update-downloaded', {}, '', '0.3.2');
    autoUpdater.quitAndInstall = () => { throw new Error('private detail'); };
    assert.equal(updater.install(), false);
    assert.equal(updater.getState().phase, 'error');
    assert.equal(updater.getState().message, '更新失敗，請稍後再試。');
  });
});
