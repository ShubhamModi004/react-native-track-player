import { Platform, AppRegistry, DeviceEventEmitter, NativeEventEmitter, NativeModules } from 'react-native'
// @ts-ignore
import * as resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource'
import {
  MetadataOptions,
  PlayerOptions,
  Event,
  Track,
  State,
  TrackMetadataBase,
  NowPlayingMetadata,
  RepeatMode,
} from './interfaces'

const { TrackPlayerModule: TrackPlayer } = NativeModules
const emitter = Platform.OS !== 'android' ? new NativeEventEmitter(TrackPlayer) : DeviceEventEmitter

// MARK: - Helpers

function resolveImportedPath(path?: number | string) {
  if (!path) return undefined
  return resolveAssetSource(path) || path
}

// RN doesn't allow nullable NSNumbers so convert optional number parameters
// to a conventional default.
function optionalNumberToDefault(
  num?: number,
  defaultValue: number = -1,
): number {
  return num === undefined ? defaultValue : num;
}

// MARK: - General API

/**
 * Initializes the player with the specified options.
 */
async function setupPlayer(options: PlayerOptions = {}): Promise<void> {
  return TrackPlayer.setupPlayer(options || {})
}

function destroy(): Promise<void> {
  if (Platform.OS === 'android') {
    emitter.removeAllListeners()
  }

  return TrackPlayer.destroy()
}

type ServiceHandler = () => Promise<void>
/**
 * Register the playback service. The service will run as long as the player runs.
 */
function registerPlaybackService(factory: () => ServiceHandler) {
  if (Platform.OS === 'android') {
    // Registers the headless task
    AppRegistry.registerHeadlessTask('TrackPlayer', factory)
  } else {
    // Initializes and runs the service in the next tick
    setImmediate(factory())
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addEventListener(event: Event, listener: (data: any) => void) {
  return emitter.addListener(event, listener)
}

/**
 * @deprecated This method should not be used, most methods reject when service is not bound.
 */
function isServiceRunning(): Promise<boolean> {
  return TrackPlayer.isServiceRunning()
}

// MARK: - Queue API

/**
 * Adds one or more tracks to the queue.
 */
async function add(tracks: Track | Track[], insertBeforeIndex?: number): Promise<number | void> {
  // Clone the array before modifying it
  if (Array.isArray(tracks)) {
    tracks = [...tracks]
  } else {
    tracks = [tracks]
  }

  if (tracks.length < 1) return

  for (let i = 0; i < tracks.length; i++) {
    // Clone the object before modifying it
    tracks[i] = { ...tracks[i] }

    // Resolve the URLs
    tracks[i].url = resolveImportedPath(tracks[i].url)
    tracks[i].artwork = resolveImportedPath(tracks[i].artwork)
  }

  // Note: we must be careful about passing nulls to non nullable parameters on Android.
  return TrackPlayer.add(tracks, optionalNumberToDefault(insertBeforeIndex))
}

/**
 * Removes one or more tracks from the queue.
 */
async function remove(tracks: number | number[]): Promise<void> {
  if (!Array.isArray(tracks)) {
    tracks = [tracks]
  }

  return TrackPlayer.remove(tracks)
}

/**
 * Clears any upcoming tracks from the queue.
 */
async function removeUpcomingTracks(): Promise<void> {
  return TrackPlayer.removeUpcomingTracks()
}

/**
 * Skips to a track in the queue.
 */
async function skip(trackIndex: number, initialPosition?: number): Promise<void> {
  return TrackPlayer.skip(trackIndex, optionalNumberToDefault(initialPosition))
}

/**
 * Skips to the next track in the queue.
 */
async function skipToNext(initialPosition?: number): Promise<void> {
  return TrackPlayer.skipToNext(optionalNumberToDefault(initialPosition))
}

/**
 * Skips to the previous track in the queue.
 */
async function skipToPrevious(initialPosition?: number): Promise<void> {
  return TrackPlayer.skipToPrevious(optionalNumberToDefault(initialPosition))
}

// MARK: - Control Center / Notifications API

/**
 * Updates the configuration for the components.
 */
async function updateOptions(options: MetadataOptions = {}): Promise<void> {
  options = { ...options }

  // Resolve the asset for each icon
  options.icon = resolveImportedPath(options.icon)
  options.playIcon = resolveImportedPath(options.playIcon)
  options.pauseIcon = resolveImportedPath(options.pauseIcon)
  options.stopIcon = resolveImportedPath(options.stopIcon)
  options.previousIcon = resolveImportedPath(options.previousIcon)
  options.nextIcon = resolveImportedPath(options.nextIcon)
  options.rewindIcon = resolveImportedPath(options.rewindIcon)
  options.forwardIcon = resolveImportedPath(options.forwardIcon)

  return TrackPlayer.updateOptions(options)
}

/**
 * Updates the metadata of a track in the queue. If the current track is updated,
 * the notification and the Now Playing Center will be updated accordingly.
 */
async function updateMetadataForTrack(trackIndex: number, metadata: TrackMetadataBase): Promise<void> {
  // Clone the object before modifying it
  metadata = Object.assign({}, metadata)

  // Resolve the artwork URL
  metadata.artwork = resolveImportedPath(metadata.artwork)

  return TrackPlayer.updateMetadataForTrack(trackIndex, metadata)
}

function clearNowPlayingMetadata(): Promise<void> {
  return TrackPlayer.clearNowPlayingMetadata()
}

function updateNowPlayingMetadata(metadata: NowPlayingMetadata): Promise<void> {
  // Clone the object before modifying it
  metadata = Object.assign({}, metadata)

  // Resolve the artwork URL
  metadata.artwork = resolveImportedPath(metadata.artwork)

  return TrackPlayer.updateNowPlayingMetadata(metadata)
}

// MARK: - Player API

/**
 * Resets the player stopping the current track and clearing the queue.
 */
async function reset(): Promise<void> {
  return TrackPlayer.reset()
}

/**
 * Plays or resumes the current track.
 */
async function play(): Promise<void> {
  return TrackPlayer.play()
}

/**
 * Pauses the current track.
 */
async function pause(): Promise<void> {
  return TrackPlayer.pause()
}

/**
 * Stops the current track.
 */
async function stop(): Promise<void> {
  return TrackPlayer.stop()
}


/***
 * Controls audio balance 
 */

async function setPan(pan: number): Promise<void> {
  return TrackPlayer.setPan(pan);
}

/**
 * Seeks to a specified time position in the current track.
 */
async function seekTo(position: number): Promise<void> {
  return TrackPlayer.seekTo(position)
}

/**
 * Sets the volume of the player.
 */
async function setVolume(level: number): Promise<void> {
  return TrackPlayer.setVolume(level)
}

/**
 * Sets the playback rate.
 */
async function setRate(rate: number): Promise<void> {
  return TrackPlayer.setRate(rate)
}

/**
 * Sets the repeat mode.
 */
async function setRepeatMode(mode: RepeatMode): Promise<RepeatMode> {
  return TrackPlayer.setRepeatMode(mode)
}

// MARK: - Getters

/**
 * Gets the volume of the player (a number between 0 and 1).
 */
async function getVolume(): Promise<number> {
  return TrackPlayer.getVolume()
}

/**
 * Gets the playback rate, where 1 is the regular speed.
 */
async function getRate(): Promise<number> {
  return TrackPlayer.getRate()
}

/**
 * Gets a track object from the queue.
 */
async function getTrack(trackIndex: number): Promise<Track | null> {
  return TrackPlayer.getTrack(trackIndex)
}

/**
 * Gets the whole queue.
 */
async function getQueue(): Promise<Track[]> {
  return TrackPlayer.getQueue()
}

/**
 * Gets the index of the current track.
 */
async function getCurrentTrack(): Promise<number> {
  return TrackPlayer.getCurrentTrack()
}

/**
 * Gets the duration of the current track in seconds.
 */
async function getDuration(): Promise<number> {
  return TrackPlayer.getDuration()
}

/**
 * Gets the buffered position of the player in seconds.
 */
async function getBufferedPosition(): Promise<number> {
  return TrackPlayer.getBufferedPosition()
}

/**
 * Gets the position of the player in seconds.
 */
async function getPosition(): Promise<number> {
  return TrackPlayer.getPosition()
}

/**
 * Gets the state of the player.
 */
async function getState(): Promise<State> {
  return TrackPlayer.getState()
}

/**
 * Gets the repeat mode.
 */
async function getRepeatMode(): Promise<RepeatMode> {
  return TrackPlayer.getRepeatMode()
}

export default {
  // MARK: - General API
  setupPlayer,
  destroy,
  registerPlaybackService,
  addEventListener,
  isServiceRunning,

  // MARK: - Queue API
  add,
  remove,
  removeUpcomingTracks,
  skip,
  skipToNext,
  skipToPrevious,
  setPan,

  // MARK: - Control Center / Notifications API
  updateOptions,
  updateMetadataForTrack,
  clearNowPlayingMetadata,
  updateNowPlayingMetadata,

  // MARK: - Player API
  reset,
  play,
  pause,
  stop,
  seekTo,
  setVolume,
  setRate,
  setRepeatMode,

  // MARK: - Getters
  getVolume,
  getRate,
  getTrack,
  getQueue,
  getCurrentTrack,
  getDuration,
  getBufferedPosition,
  getPosition,
  getState,
  getRepeatMode,
}
