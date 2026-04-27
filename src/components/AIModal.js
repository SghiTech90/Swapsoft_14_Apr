/**
 * AIModal.js
 *
 * VOICE_TEST_MODE = true  → just listen + display text, no command matching
 * VOICE_TEST_MODE = false → full report selection + download flow
 */

// ── SET THIS TO false TO RESTORE FULL FUNCTIONALITY ──────────────────────────
const VOICE_TEST_MODE = false;

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  Animated, Dimensions, ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';

import useAIVoice from './useAIVoice';
import useAIDownload from './useAIDownload';

const { width, height } = Dimensions.get('window');

// ── MUST be at module level — creating inside render = crash on Android ──────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Module-level — voice callbacks read these directly, never stale ──────────
export const BUTTON_DATA = [
  { label: 'MPR', color: '#28a745', subButtons: ['Building', 'CRF', 'Annuity', 'NABARD', 'Road', 'NonPlan'], keywords: ['mpr', 'एम पी आर'] },
  { label: 'Headwise', color: '#fa9c19', subButtons: ['Building', 'CRF', 'Annuity', 'NABARD', 'Road', 'NonPlan'], keywords: ['headwise', 'हेड वाईज'] },
  { label: 'All', color: '#14b8a6', subButtons: ['Building', 'CRF', 'Annuity', 'NABARD', 'Road', 'NonPlan'], keywords: ['all', 'सर्व'] },
  { label: 'Abstract', color: '#a78bfa', subButtons: ['Building', 'CRF', 'Annuity', 'NABARD', 'Road', 'NonPlan'], keywords: ['abstract', 'अॅबस्ट्रॅक्ट', 'संक्षिप्त'] },
];
export const SUB_KEYWORDS = {
  Building: ['building', 'इमारत', 'बांधकाम'],
  CRF: ['crf', 'सीआरएफ'],
  Road: ['road', 'रस्ता', 'मार्ग'],
  Annuity: ['annuity', 'अॅन्युइटी'],
  NABARD: ['nabard', 'नाबार्ड'],
  NonPlan: ['nonplan', 'नॉन प्लॅन'],
};
// ─────────────────────────────────────────────────────────────────────────────

const AIModal = ({ visible, onClose }) => {
  // ── Animated values ────────────────────────────────────────────────────────
  const translateY = useRef(new Animated.Value(500)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState(0);
  const [headerStep, setHeaderStep] = useState(0);
  const [location, setLocation] = useState(null);
  const [expandedButtons, setExpandedButtons] = useState(null);
  const [selectedButtonColor, setSelectedButtonColor] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [progressValue, setProgressValue] = useState(10);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  // ── Refs ───────────────────────────────────────────────────────────────────
  const visibleRef = useRef(false);
  const phaseRef = useRef(0);
  const downloadingRef = useRef(false);
  const expandedRef = useRef(null);
  const selectedSecRef = useRef(null);
  const pendingCommandRef = useRef(null);
  // FIX 1: blocks stale post-restart / pre-settle commands
  const mountReadyRef = useRef(false);
  // FIX 2: prevents phase-2 effect re-triggering startListening after category selected
  const categorySelectedRef = useRef(false);

  useEffect(() => { visibleRef.current = visible; }, [visible]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { downloadingRef.current = downloading; }, [downloading]);
  useEffect(() => { expandedRef.current = expandedButtons; }, [expandedButtons]);
  useEffect(() => { selectedSecRef.current = selectedSection; }, [selectedSection]);

  // ── Pulse ─────────────────────────────────────────────────────────────────
  const stopPulse = useCallback(() => {
    if (pulseLoopRef.current) {
      pulseLoopRef.current.stop();
      pulseLoopRef.current = null;
    }
    Animated.timing(pulseAnim, {
      toValue: 1, duration: 150, useNativeDriver: true,
    }).start();
  }, [pulseAnim]);

  const startPulse = useCallback(() => {
    stopPulse();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.8, duration: 500, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]));
    pulseLoopRef.current = loop;
    loop.start();
  }, [pulseAnim, stopPulse]);

  // ── onCommand — stores spoken text, triggers useEffect via tick ───────────
  const [commandTick, setCommandTick] = useState(0);

  const onCommandWithTick = useCallback((spoken) => {
    try {
      if (!spoken || typeof spoken !== 'string') return;
      console.log('[AIModal] onCommand received:', spoken);
      pendingCommandRef.current = spoken.toLowerCase().trim();
      setCommandTick(t => t + 1);
    } catch (err) {
      console.log('[AIModal] onCommandWithTick error:', err?.message);
    }
  }, []);

  // ── Voice hook ────────────────────────────────────────────────────────────
  const { speak, startListening, resetAll } = useAIVoice({
    visibleRef, phaseRef, downloadingRef,
    onCommand: onCommandWithTick,
    onListeningChange: setIsListening,
    onTranscript: setTranscript,
    startPulse, stopPulse,
  });

  // ── Download hook ─────────────────────────────────────────────────────────
  const { download } = useAIDownload({
    location, progressAnim, setProgressValue, setDownloading, downloadingRef,
  });

  // ── Process pending voice command ─────────────────────────────────────────
  useEffect(() => {
    try {
      if (!pendingCommandRef.current) return;

      if (!mountReadyRef.current) {
        console.log('[AIModal] command blocked — modal not ready, discarding:', pendingCommandRef.current);
        pendingCommandRef.current = null;
        return;
      }

      const spoken = pendingCommandRef.current;
      pendingCommandRef.current = null;
      console.log('[AIModal] processing command:', spoken,
        '| phase:', phaseRef.current,
        '| categorySelected:', categorySelectedRef.current);

      if (VOICE_TEST_MODE) return;

      if (spoken.includes('close') || spoken.includes('exit') ||
        spoken.includes('cancel') || spoken.includes('बंद')) {
        onClose(); return;
      }

      const catMatch = BUTTON_DATA.find(b =>
        spoken.includes(b.label.toLowerCase()) || b.keywords.some(k => spoken.includes(k))
      );
      let subMatch = null;
      const pool = catMatch ? [catMatch] : BUTTON_DATA;
      for (const cat of pool) {
        const found = cat.subButtons.find(s =>
          spoken.includes(s.toLowerCase()) ||
          (SUB_KEYWORDS[s] && SUB_KEYWORDS[s].some(k => spoken.includes(k)))
        );
        if (found) { subMatch = found; break; }
      }

      if (catMatch && !categorySelectedRef.current) {
        handleCategoryPress(catMatch.label);
        return;
      }
      if (subMatch && expandedRef.current) {
        handleSubPress(selectedSecRef.current, subMatch);
        return;
      }
      if (subMatch && !expandedRef.current) {
        speak('Please select a report type first.');
      }
    } catch (err) {
      console.log('[AIModal] commandTick effect error:', err?.message);
    }
  }, [commandTick]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load location ──────────────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem('LOCATION_ID')
      .then(v => { if (v) setLocation(v); })
      .catch(() => { });
  }, []);

  // ── Modal open / close ─────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      // FIX 1 + FIX 2: reset both guards on every open
      mountReadyRef.current = false;
      categorySelectedRef.current = false;

      setPhase(0);
      setHeaderStep(0);
      setExpandedButtons(null);
      setSelectedSection(null);
      setSelectedButtonColor(null);
      setTranscript('');
      setIsListening(false);
      // ── Reset download state so progress ring never sticks on reopen ──
      setDownloading(false);
      downloadingRef.current = false;
      progressAnim.setValue(0);
      setProgressValue(0);
      pendingCommandRef.current = null;
      resetAll();

      translateY.setValue(500);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 480, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        // Wait 500 ms after animation before accepting any voice commands,
        // so stale onSpeechEnd events from a previous/crashed session are dropped.
        setTimeout(() => {
          mountReadyRef.current = true;
          console.log('[AIModal] mount settled — commands enabled');
          setTimeout(() => setPhase(1), 120);
        }, 500);
      });
    } else {
      mountReadyRef.current = false;
      resetAll();
      setPhase(0);
      setHeaderStep(0);
      // ── Reset download state on close so progress ring is clean ──
      setDownloading(false);
      downloadingRef.current = false;
      progressAnim.setValue(0);
      setProgressValue(0);
      Animated.parallel([
        Animated.timing(translateY, { toValue: 500, duration: 280, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Phase progression ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const wait = ms => new Promise(r => setTimeout(r, ms));

    const run = async () => {
      if (phase === 1) {
        await speak('Welcome to AI Assistant.');
        if (cancelled) return;
        setHeaderStep(1); await wait(500); if (cancelled) return;
        setHeaderStep(2); await wait(500); if (cancelled) return;
        setHeaderStep(3); await wait(600); if (cancelled) return;
        setPhase(2);
      }

      if (phase === 2) {
        await speak('Please select a report type. Say MPR, Headwise, All, or Abstract.');
        if (cancelled) return;
        // FIX 2: skip startListening if user already tapped/voiced a category
        if (!categorySelectedRef.current) {
          console.log('[AIModal] phase 2 — starting listener');
          startListening();
        } else {
          console.log('[AIModal] phase 2 — category already selected, skipping startListening');
        }
      }
    };

    run();
    return () => { cancelled = true; };
  }, [phase, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Button handlers ────────────────────────────────────────────────────────
  const handleCategoryPress = useCallback(async (category) => {
    try {
      console.log('[AIModal] handleCategoryPress:', category);
      categorySelectedRef.current = true;
      const btn = BUTTON_DATA.find(b => b.label === category);
      setSelectedButtonColor(btn?.color ?? '#007AFF');
      setExpandedButtons(category);
      setSelectedSection(category);
      await speak(`${category} selected. Now say the section name. Building, C R F, Annuity, NABARD, or Road.`);
      startListening();
    } catch (err) {
      console.log('[AIModal] handleCategoryPress error:', err?.message);
    }
  }, [speak, startListening]);

  const handleSubPress = useCallback(async (category, sub) => {
    try {
      console.log('[AIModal] handleSubPress:', category, sub);
      await download(category, sub, speak);
      // After download: speak thank-you then close only the modal
      await speak('Thank you for choosing Swapsoft AI. Your report has been saved to Downloads.');
      onClose();
    } catch (err) {
      console.log('[AIModal] handleSubPress error:', err?.message);
      onClose();
    }
  }, [download, speak, onClose]);

  const showButtons = phase >= 2;

  const HEADER_LINES = [
    { text: 'महाराष्ट्र शासन', step: 1, style: styles.hl1 },
    { text: 'सार्वजनिक बांधकाम मंडळ, अकोला', step: 2, style: styles.hl2 },
    { text: 'AI निर्मित अहवाल', step: 3, style: styles.hl2 },
  ];

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
          <LinearGradient colors={['#F5D5E0', '#E3F2FD']} style={styles.gradient}>

            {/* ── Top bar ──────────────────────────────────────────────── */}
            <View style={styles.topBar}>
              <Animated.View style={[
                styles.listenBadge,
                { opacity: isListening ? 1 : 0, transform: [{ scale: isListening ? 1 : 0.85 }] },
              ]}>
                <View style={styles.glowWrap}>
                  <Animated.View style={[styles.pulseRing, {
                    transform: [{ scale: pulseAnim }],
                    opacity: pulseAnim.interpolate({ inputRange: [1, 1.8], outputRange: [0.5, 0] }),
                  }]} />
                  <View style={styles.micDot}>
                    <Text style={styles.micEmoji}>🎙️</Text>
                  </View>
                </View>
                <View>
                  <Text style={styles.listenLabel}>AI Listening</Text>
                  <Text style={styles.listenSub}>Speak now...</Text>
                </View>
              </Animated.View>

              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* ── Listening status chip (compact, production) ────────────── */}
            {phase >= 2 && isListening && (
              <View style={styles.listeningChip}>
                <Text style={styles.listeningChipTxt}>🎙️  Listening — speak now!</Text>
              </View>
            )}

            {/* ── Manual mic fallback ───────────────────────────────────── */}
            {!isListening && phase >= 2 && !downloading && (
              <View style={styles.manualWrap}>
                <TouchableOpacity style={styles.manualBtn} onPress={startListening}>
                  <LinearGradient colors={['#007AFF', '#0044CC']} style={styles.manualGrad}>
                    <Text style={styles.manualTxt}>🎙️  Tap to Speak</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Marathi header lines ──────────────────────────────────── */}
            <View style={styles.headerBlock}>
              {HEADER_LINES.map(({ text, step, style: s }) =>
                headerStep >= step ? <Text key={step} style={s}>{text}</Text> : null
              )}
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner}>

              {/* ── Category buttons ──────────────────────────────────── */}
              {showButtons && (
                <View style={styles.catSection}>
                  <View style={styles.catRow}>
                    {BUTTON_DATA.map((b, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.catBtn, { backgroundColor: b.color }]}
                        onPress={() => handleCategoryPress(b.label)}>
                        <Text style={styles.catBtnTxt} numberOfLines={1}>{b.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.hintBox}>
                    <Text style={styles.hintTxt}>
                      {expandedButtons
                        ? `${expandedButtons} → select a section below`
                        : 'Tap a report type  or  say its name'}
                    </Text>
                  </View>
                </View>
              )}

              {/* ── Sub-section buttons ────────────────────────────────── */}
              {expandedButtons && (
                <View style={styles.subRow}>
                  {BUTTON_DATA.find(b => b.label === expandedButtons)
                    ?.subButtons.map((sub, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.subBtn, { backgroundColor: selectedButtonColor }]}
                        onPress={() => handleSubPress(selectedSection, sub)}>
                        <Text style={styles.subBtnTxt}>{sub}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              )}

              {/* ── Download progress ring ────────────────────────────── */}
              {downloading && (
                <View style={styles.progressWrap}>
                  <Svg height="100" width="100" viewBox="0 0 100 100">
                    <Circle cx="50" cy="50" r="40" stroke="#ddd" strokeWidth="10" fill="none" />
                    <AnimatedCircle
                      cx="50" cy="50" r="40"
                      stroke="#007AFF" strokeWidth="10"
                      strokeDasharray="251.2"
                      strokeDashoffset={progressAnim.interpolate({
                        inputRange: [0, 100], outputRange: [251, 0],
                      })}
                      fill="none" strokeLinecap="round"
                    />
                  </Svg>
                  <Text style={styles.progressTxt}>{progressValue}%</Text>
                </View>
              )}

            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  container: { width: width * 0.88, height: height * 0.85, borderRadius: 22, overflow: 'hidden' },
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  scrollInner: { alignItems: 'center', paddingBottom: 28 },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingTop: 14, height: 68 },
  closeBtn: { position: 'absolute', top: 14, right: 14, width: 40, height: 40, backgroundColor: '#FFC0CB', borderRadius: 20, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  closeTxt: { fontSize: 20, fontWeight: 'bold', color: '#333' },

  listenBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 30, elevation: 8, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 },
  glowWrap: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  pulseRing: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF' },
  micDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  micEmoji: { fontSize: 14 },
  listenLabel: { fontSize: 13, color: '#007AFF', fontWeight: '700' },
  listenSub: { fontSize: 10, color: '#555' },

  listeningChip: { marginHorizontal: 14, marginTop: 6, alignSelf: 'flex-start', backgroundColor: '#007AFF', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, elevation: 4 },
  listeningChipTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  manualWrap: { alignItems: 'center', marginTop: 10 },
  manualBtn: { borderRadius: 24, overflow: 'hidden', elevation: 7 },
  manualGrad: { paddingHorizontal: 28, paddingVertical: 12 },
  manualTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  headerBlock: { alignItems: 'center', marginTop: 10, paddingHorizontal: 12 },
  hl1: { fontSize: 20, fontWeight: 'bold', color: '#E65100', marginBottom: 4, textAlign: 'center' },
  hl2: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 3, textAlign: 'center' },

  catSection: { width: '100%', alignItems: 'center' },
  catRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', paddingHorizontal: 8, marginTop: 24, paddingBottom: 6, flexWrap: 'nowrap' },
  catBtn: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginHorizontal: 3, elevation: 3 },
  catBtnTxt: { fontWeight: 'bold', color: '#fff', fontSize: 13 },

  hintBox: { marginTop: 10, backgroundColor: '#EAF4FF', paddingVertical: 9, paddingHorizontal: 16, borderRadius: 12, alignSelf: 'center', elevation: 2 },
  hintTxt: { fontSize: 13, color: '#336699', fontWeight: '500', textAlign: 'center' },

  subRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 14, paddingHorizontal: 10 },
  subBtn: { paddingVertical: 11, paddingHorizontal: 14, borderRadius: 10, marginHorizontal: 5, marginBottom: 10, alignItems: 'center', minWidth: '28%', elevation: 2 },
  subBtnTxt: { fontSize: 14, fontWeight: 'bold', color: '#fff' },

  progressWrap: { alignItems: 'center', marginVertical: 24 },
  progressTxt: { marginTop: 8, fontSize: 16, fontWeight: 'bold', color: '#333' },
});

export default AIModal;