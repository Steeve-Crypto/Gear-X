import {
  isCurrentlyRecording,
  pauseListening,
  requestMicrophonePermission,
  resumeListening,
  startListening,
  stopListening,
} from '../src/services/audio';
import { AudioModule, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';

jest.mock('expo-audio', () => {
  const recorder = {
    prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
    record: jest.fn(),
    stop: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    uri: 'file://capture.m4a',
  };
  return {
    AudioModule: { AudioRecorder: jest.fn(() => recorder) },
    RecordingPresets: { HIGH_QUALITY: { extension: '.m4a' } },
    requestRecordingPermissionsAsync: jest.fn(),
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  };
});
jest.mock('expo-file-system/legacy', () => ({ deleteAsync: jest.fn() }));

describe('audio recording service', () => {
  test('honors permission and manages the recorder lifecycle', async () => {
    jest.mocked(requestRecordingPermissionsAsync).mockResolvedValueOnce({ granted: false } as never);
    expect(await requestMicrophonePermission()).toBe(false);

    jest.mocked(requestRecordingPermissionsAsync).mockResolvedValueOnce({ granted: true } as never);
    expect(await startListening()).toBe(true);
    expect(isCurrentlyRecording()).toBe(true);

    const recorder = jest.mocked(AudioModule.AudioRecorder).mock.results[0].value;
    expect(recorder.prepareToRecordAsync).toHaveBeenCalled();
    expect(recorder.record).toHaveBeenCalledTimes(1);
    expect(await pauseListening()).toBe(true);
    expect(recorder.pause).toHaveBeenCalled();
    expect(await resumeListening()).toBe(true);
    expect(recorder.record).toHaveBeenCalledTimes(2);
    expect(await stopListening()).toBe('file://capture.m4a');
    expect(recorder.stop).toHaveBeenCalled();
    expect(isCurrentlyRecording()).toBe(false);
    expect(setAudioModeAsync).toHaveBeenLastCalledWith({ allowsRecording: false });
  });
});
