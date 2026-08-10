import {
  AudioModule,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import type { AudioRecorder, RecordingOptions } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Audio Service for Gear X
 * Handles microphone permissions and recording using expo-audio.
 * Feeds status into the Listener agent.
 */

let recording: AudioRecorder | null = null;
const NativeAudioRecorder = Reflect.get(AudioModule, 'AudioRecorder') as new (
  options: Partial<RecordingOptions>,
) => AudioRecorder;

export async function requestMicrophonePermission(): Promise<boolean> {
  const { granted } = await requestRecordingPermissionsAsync();
  return granted;
}

export async function startListening(): Promise<boolean> {
  try {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      return false;
    }

    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });

    const nextRecording = new NativeAudioRecorder(RecordingPresets.HIGH_QUALITY);
    await nextRecording.prepareToRecordAsync();
    nextRecording.record();
    recording = nextRecording;
    return true;
  } catch {
    return false;
  }
}

export async function stopListening(): Promise<string | null> {
  if (!recording) return null;

  const activeRecording = recording;
  try {
    await activeRecording.stop();
    const uri = activeRecording.uri;
    recording = null;
    await setAudioModeAsync({ allowsRecording: false });
    return uri;
  } catch {
    recording = null;
    await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
    return null;
  }
}

export async function pauseListening(): Promise<boolean> {
  if (!recording) return false;
  try {
    recording.pause();
    return true;
  } catch {
    return false;
  }
}

export async function resumeListening(): Promise<boolean> {
  if (!recording) return false;
  try {
    recording.record();
    return true;
  } catch {
    return false;
  }
}

export function isCurrentlyRecording(): boolean {
  return recording !== null;
}

export async function deleteRecording(uri: string): Promise<boolean> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
    return true;
  } catch {
    return false;
  }
}
