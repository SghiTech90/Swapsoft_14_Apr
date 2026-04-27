/**
 * useAIVoice.js — CRASH-HARDENED VERSION
 *
 * Fixes:
 * 1. Partial arrives AFTER onSpeechEnd → fire command via delayed timer
 * 2. speak() resolved by its own Tts.stop() tts-cancel → ignore early cancel
 * 3. Ghost onSpeechStart events → strict sessionId gate
 * 4. All callbacks wrapped in try/catch
 */

import { useEffect, useRef, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice';

export default function useAIVoice({
  visibleRef,
  phaseRef,
  downloadingRef,
  onCommand,
  onListeningChange,
  onTranscript,
  startPulse,
  stopPulse,
}) {
  const isListeningRef    = useRef(false);
  const isSpeakingRef     = useRef(false);
  const suppressUntilRef  = useRef(0);
  const onCommandRef      = useRef(onCommand);
  const sessionActiveRef  = useRef(false);
  const mountedRef        = useRef(true);
  const startingRef       = useRef(false);

  // Incremented on every Voice.start() — listeners use it to reject stale events
  const sessionIdRef      = useRef(0);

  const lastSpokenRef     = useRef('');
  const commandFiredRef   = useRef(false);

  // Timer that fires the command if a partial arrives after onSpeechEnd
  const partialFallbackTimerRef = useRef(null);

  useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);

  // ── helpers ──────────────────────────────────────────────────────────────
  const safeFireCommand = useCallback((spoken, source) => {
    if (!visibleRef.current) return;
    if (commandFiredRef.current) return;
    if (!spoken) return;
    commandFiredRef.current = true;
    console.log('[Voice] firing command from', source, ':', spoken);
    try {
      onCommandRef.current && onCommandRef.current(spoken);
    } catch (err) {
      console.log('[Voice] onCommand callback error:', err?.message);
    }
  }, [visibleRef]);

  const clearPartialFallback = () => {
    if (partialFallbackTimerRef.current) {
      clearTimeout(partialFallbackTimerRef.current);
      partialFallbackTimerRef.current = null;
    }
  };

  // ── speak() ─────────────────────────────────────────────────────────────
  const speak = useCallback((text) => {
    return new Promise((resolve) => {
      console.log('[TTS] speaking:', text);
      isSpeakingRef.current    = true;
      suppressUntilRef.current = Date.now() + 1500;

      let resolved = false;
      // Ignore tts-cancel events for 400ms — they come from our own Tts.stop() call
      let ignoreCancelUntil = Date.now() + 400;

      const safetyTimer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          try { fSub.remove(); cSub.remove(); } catch (_) {}
          isSpeakingRef.current = false;
          resolve();
        }
      }, 12000);

      const cleanup = (reason) => {
        if (!resolved) {
          console.log('[TTS] finished via:', reason);
          resolved = true;
          clearTimeout(safetyTimer);
          try { fSub.remove(); cSub.remove(); } catch (_) {}
          isSpeakingRef.current = false;
          resolve();
        }
      };

      const fSub = Tts.addListener('tts-finish', () => cleanup('tts-finish'));
      const cSub = Tts.addListener('tts-cancel', () => {
        // Skip the cancel that comes from our own Tts.stop() call
        if (Date.now() < ignoreCancelUntil) return;
        cleanup('tts-cancel');
      });

      Tts.stop();
      Tts.speak(text);
    });
  }, []);

  // ── wireListeners ────────────────────────────────────────────────────────
  const wireListeners = useCallback(() => {
    Voice.onSpeechStart = () => {
      try {
        if (!sessionActiveRef.current) {
          console.log('[Voice] ghost onSpeechStart — ignored');
          return;
        }
        console.log('[Voice] 🎙️ onSpeechStart — mic is active');
        isListeningRef.current  = true;
        lastSpokenRef.current   = '';
        commandFiredRef.current = false;
        clearPartialFallback();
        if (mountedRef.current) onListeningChange(true);
        startPulse();
      } catch (err) {
        console.log('[Voice] onSpeechStart error:', err?.message);
      }
    };

    Voice.onSpeechPartialResults = (e) => {
      try {
        if (!mountedRef.current) return;
        const p = e?.value?.[0] ?? '';
        if (!p) return;

        const spoken = p.toLowerCase().trim();
        lastSpokenRef.current = spoken;
        console.log('[Voice] partial:', spoken);
        if (mountedRef.current) onTranscript(spoken);

        // KEY FIX: If session already ended (onSpeechEnd fired early),
        // schedule a fallback command from this partial after a short delay.
        if (!sessionActiveRef.current && !commandFiredRef.current) {
          clearPartialFallback();
          console.log('[Voice] partial arrived after end — scheduling fallback timer');
          partialFallbackTimerRef.current = setTimeout(() => {
            partialFallbackTimerRef.current = null;
            safeFireCommand(lastSpokenRef.current, 'partial-after-end-timer');
            if (mountedRef.current) {
              onListeningChange(false);
              stopPulse();
            }
          }, 800);
        }
      } catch (err) {
        console.log('[Voice] onSpeechPartialResults error:', err?.message);
      }
    };

    Voice.onSpeechResults = (e) => {
      try {
        if (!e?.value?.[0]) return;
        if (!mountedRef.current) return;
        clearPartialFallback();
        const spoken = e.value[0].toLowerCase().trim();
        lastSpokenRef.current = spoken;
        console.log('[Voice] ✅ RESULT:', spoken);
        if (mountedRef.current) onTranscript(spoken);
        safeFireCommand(spoken, 'onSpeechResults');
        setTimeout(() => {
          if (mountedRef.current && visibleRef.current) onTranscript('');
        }, 4000);
      } catch (err) {
        console.log('[Voice] onSpeechResults error:', err?.message);
      }
    };

    Voice.onSpeechError = (e) => {
      try {
        if (Date.now() < suppressUntilRef.current) {
          console.log('[Voice] error suppressed (TTS window):', e?.error?.code);
          return;
        }
        console.log('[Voice] ❌ error:', e?.error?.code, '/', e?.error?.message);
        sessionActiveRef.current = false;
        isListeningRef.current   = false;
        // Still fire fallback if we have a partial
        if (!commandFiredRef.current && lastSpokenRef.current) {
          clearPartialFallback();
          safeFireCommand(lastSpokenRef.current, 'onSpeechError-fallback');
        }
        if (!mountedRef.current) return;
        onListeningChange(false);
        stopPulse();
      } catch (err) {
        console.log('[Voice] onSpeechError handler error:', err?.message);
      }
    };

    Voice.onSpeechEnd = () => {
      try {
        console.log('[Voice] 🔇 onSpeechEnd — visible:', visibleRef.current,
          '| lastSpoken:', lastSpokenRef.current);
        sessionActiveRef.current = false;
        isListeningRef.current   = false;

        // Only fire command immediately if we already have a partial.
        // If lastSpoken is empty, the partial might arrive shortly after —
        // the partial handler's timer will take care of it.
        if (lastSpokenRef.current && !commandFiredRef.current) {
          clearPartialFallback();
          safeFireCommand(lastSpokenRef.current, 'onSpeechEnd-fallback');
        } else if (!lastSpokenRef.current) {
          // No partial yet — give it 1200ms for a late partial to arrive
          console.log('[Voice] onSpeechEnd with no partial — waiting 1200ms for late partial');
          clearPartialFallback();
          partialFallbackTimerRef.current = setTimeout(() => {
            partialFallbackTimerRef.current = null;
            if (!commandFiredRef.current && lastSpokenRef.current) {
              safeFireCommand(lastSpokenRef.current, 'late-partial-timer');
            }
            if (mountedRef.current) {
              onListeningChange(false);
              stopPulse();
            }
          }, 1200);
          return; // Don't call onListeningChange(false) yet
        }

        if (!mountedRef.current) return;
        onListeningChange(false);
        stopPulse();
      } catch (err) {
        console.log('[Voice] onSpeechEnd handler error:', err?.message);
      }
    };
  }, [onListeningChange, onTranscript, startPulse, stopPulse, visibleRef, safeFireCommand]);

  // ── startListening ────────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    if (startingRef.current)    { console.log('[Voice] skip: already starting'); return; }
    if (isSpeakingRef.current)  { console.log('[Voice] skip: TTS active');       return; }
    if (!visibleRef.current)    { console.log('[Voice] skip: modal hidden');      return; }
    if (phaseRef.current < 2)   { console.log('[Voice] skip: phase < 2');        return; }
    if (downloadingRef.current) { console.log('[Voice] skip: downloading');       return; }

    startingRef.current = true;
    console.log('[Voice] startListening — full clean start');

    try {
      if (Platform.OS === 'android') {
        const r = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          { title: 'Microphone', message: 'AI needs mic access.', buttonPositive: 'OK', buttonNegative: 'Cancel' },
        );
        if (r !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('[Voice] mic denied'); return;
        }
        console.log('[Voice] mic granted');
      }

      clearPartialFallback();
      lastSpokenRef.current   = '';
      commandFiredRef.current = false;

      console.log('[Voice] stopping & destroying previous session...');
      try { await Voice.stop();    } catch (_) {}
      try { await Voice.destroy(); } catch (_) {}

      console.log('[Voice] waiting 2000ms for OS release...');
      await new Promise(r => setTimeout(r, 2000));

      if (!visibleRef.current || isSpeakingRef.current || downloadingRef.current) {
        console.log('[Voice] guard failed after wait — aborting'); return;
      }

      wireListeners();

      const opts = Platform.OS === 'android' ? {
        EXTRA_PARTIAL_RESULTS: true,
        EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 10000,
        EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 8000,
      } : {};

      // New session id — stale callbacks from old session will be ignored
      sessionIdRef.current += 1;
      sessionActiveRef.current = true;

      for (const locale of ['en-US', 'en-IN', 'hi-IN']) {
        try {
          console.log('[Voice] trying locale:', locale);
          await Voice.start(locale, opts);
          console.log('[Voice] ✅ started with locale:', locale);
          return;
        } catch (e) {
          console.log('[Voice] locale failed:', locale, e?.message);
        }
      }

      console.log('[Voice] ❌ all locales failed');
      sessionActiveRef.current = false;
      isListeningRef.current   = false;
      if (mountedRef.current) onListeningChange(false);
    } catch (err) {
      console.log('[Voice] startListening fatal error:', err?.message);
      sessionActiveRef.current = false;
      if (mountedRef.current) onListeningChange(false);
    } finally {
      startingRef.current = false;
    }
  }, [visibleRef, phaseRef, downloadingRef, onListeningChange, wireListeners]);

  // ── Mount: TTS init ───────────────────────────────────────────────────────
  useEffect(() => {
    Tts.getInitStatus()
      .then(() => {
        Tts.setDefaultLanguage('en-US');
        Tts.setDefaultRate(0.46);
        Tts.setDefaultPitch(1.0);
        console.log('[TTS] initialised');
      })
      .catch(err => console.log('[TTS] init error:', err));

    wireListeners();

    return () => {
      mountedRef.current = false;
      clearPartialFallback();
      Tts.stop();
      sessionActiveRef.current = false;
      Voice.stop().catch(() => {});
      Voice.destroy().catch(() => {});
      stopPulse();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── resetAll ─────────────────────────────────────────────────────────────
  const resetAll = useCallback(() => {
    console.log('[Voice] resetAll()');
    clearPartialFallback();
    Tts.stop();
    sessionActiveRef.current = false;
    isListeningRef.current   = false;
    isSpeakingRef.current    = false;
    lastSpokenRef.current    = '';
    commandFiredRef.current  = false;
    Voice.stop().catch(() => {});
    Voice.destroy().catch(() => {});
    if (mountedRef.current) onListeningChange(false);
    stopPulse();
  }, [onListeningChange, stopPulse]);

  return { speak, startListening, resetAll };
}