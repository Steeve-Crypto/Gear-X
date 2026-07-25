import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

/**
 * Audio Service for Gear X
 * Handles microphone permissions and recording using expo-av.
 * Feeds status into the Listener agent.
 */

let recording: Audio.Recording | null = null;

export async function requestMicrophonePermission(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  return status === 'granted';
}

export async function startListening(): Promise<boolean> {
  try {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      console.warn('Microphone permission denied');
      return false;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    recording = newRecording;
    return true;
  } catch (error) {
    console.error('Failed to start recording:', error);
    return false;
  }
}

export async function stopListening(): Promise<string | null> {
  if (!recording) return null;

  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recording = null;

    // Reset audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    return uri; // local file URI of the recording
  } catch (error) {
    console.error('Failed to stop recording:', error);
    recording = null;
    return null;
  }
}

export async function pauseListening(): Promise<boolean> {
  if (!recording) return false;
  try {
    await recording.pauseAsync();
    return true;
  } catch {
    return false;
  }
}

export async function resumeListening(): Promise<boolean> {
  if (!recording) return false;
  try {
    await recording.startAsync();
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
