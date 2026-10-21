const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createUpdater } = require('../electron/updater.cjs');

function fixture({ packaged = true, platform = 'darwin', arch = 'arm64', repository = 'openmind/OpenMind', version = '0.3.1' } = {}) {
  const autoUpdater = new EventEmitter();
  autoUpdater.setFeedURL = (feed) => { autoUpdater.feed = feed; };
  autoUpdater.checkForUpdates = () => { autoUpdater.checks = (autoUpdater.checks || 0) + 1; };
  autoUpdater.quitAndInstall = () => { autoUpdater.installs = (autoUpdater.installs || 0) + 1; };
  const updater = createUpdater({ app: { isPackaged: packaged, getVersion: () => version }, autoUpdater, repository, platform, arch });
  return { autoUpdater, updater };
}

describe('macOS updater', () => {
  it('configures the architecture-specific feed but checks only on request', () => {
    const { autoUpdater, updater } = fixture();
    assert.deepEqual(autoUpdater.feed, { url: 'https://update.electronjs.org/openmind/OpenMind/darwin-arm64/0.3.1' });
    assert.equal(autoUpdater.checks, undefined);
    assert.equal(updater.check().phase, 'checking');
    assert.equal(autoUpdater.checks, 1);
    assert.equal(fixture({ arch: 'x64' }).autoUpdater.feed.url, 'https://update.electronjs.org/openmind/OpenMind/darwin-x64/0.3.1');
  });

  it('does not enable updates for development builds, other platforms, or invalid repository configuration', () => {
    assert.equal(fixture({ packaged: false }).updater.getState().phase, 'unsupported');
    assert.equal(fixture({ platform: 'win32' }).updater.getState().phase, 'unsupported');
    const invalid = fixture({ repository: 'https://example.com/openmind' });
    assert.equal(invalid.updater.getState().phase, 'unavailable');
    assert.equal(invalid.autoUpdater.feed, undefined);
  });

  it('tracks download progress and permits installation only after a completed download', () => {
    const { autoUpdater, updater } = fixture();
    assert.equal(updater.install(), false);
    autoUpdater.emit('update-available', { version: '0.3.2' });
    assert.equal(updater.getState().phase, 'downloading');
    autoUpdater.emit('download-progress', { percent: 36.4 });
    assert.equal(updater.getState().progress, 36.4);
    autoUpdater.emit('update-downloaded', { version: '0.3.2' });
    assert.equal(updater.getState().phase, 'downloaded');
    assert.equal(updater.install(), true);
    assert.equal(autoUpdater.installs, 1);
    assert.equal(updater.getState().phase, 'installing');
  });

  it('returns to a retryable current/error state without exposing raw updater errors', () => {
    const { autoUpdater, updater } = fixture();
    autoUpdater.emit('update-not-available');
    assert.equal(updater.getState().phase, 'current');
    autoUpdater.emit('error', new Error('/private/user/document.openmind failed'));
    assert.equal(updater.getState().phase, 'error');
    assert.equal(updater.getState().message.includes('/private/user'), false);
    updater.check();
    assert.equal(updater.getState().phase, 'checking');
  });
});
