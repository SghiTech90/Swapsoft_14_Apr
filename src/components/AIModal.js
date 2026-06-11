/**
 * AIModal.js
 *
 * Modes:
 *   menu   → Excel | Ask AI | Chat with us
 *   excel  → existing report download flow
 *   askai  → 16 budget-category buttons + voice Q&A
 *   chat   → FAQ Q&A chatbot
 */

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
import AskAIVisualizer from './AskAIVisualizer';
import {
  CHAT_WELCOME, CHAT_FAQ, ASK_AI_CATEGORIES, ASK_AI_RESPONSES,
} from '../data/aiChatFaq';

const VOICE_TEST_MODE = false;

const { width, height } = Dimensions.get('window');
const ASK_AI_BTN_WIDTH = width < 360 ? '48%' : '31.5%';
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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

const MAIN_MENU = [
  { id: 'excel', label: 'Excel', keywords: ['excel', 'report', 'download', 'एक्सेल'] },
  { id: 'askai', label: 'Ask AI', keywords: ['ask ai', 'ask', 'ai', 'एआय'] },
  { id: 'chat', label: 'Chat with us', keywords: ['chat', 'help', 'support', 'चॅट'] },
];

// ── Chat bubble helpers ───────────────────────────────────────────────────────
const BotBubble = ({ text }) => (
  <View style={styles.botRow}>
    <View style={styles.botAvatar}>
      <Text style={styles.botAvatarTxt}>AI</Text>
    </View>
    <View style={styles.botBubble}>
      <Text style={styles.botBubbleTxt}>{text}</Text>
    </View>
  </View>
);

const UserBubble = ({ text }) => (
  <View style={styles.userRow}>
    <View style={styles.userBubble}>
      <Text style={styles.userBubbleTxt}>{text}</Text>
    </View>
  </View>
);

const PillButton = ({ label, onPress }) => (
  <TouchableOpacity style={styles.pillBtn} onPress={onPress} activeOpacity={0.75}>
    <Text style={styles.pillBtnTxt}>{label}</Text>
  </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────────────────────────
const AIModal = ({ visible, onClose }) => {
  const translateY = useRef(new Animated.Value(500)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef(null);
  const chatScrollRef = useRef(null);
  const visibleRef = useRef(false);
  const phaseRef = useRef(0);
  const downloadingRef = useRef(false);
  const expandedRef = useRef(null);
  const selectedSecRef = useRef(null);
  const pendingCommandRef = useRef(null);
  const mountReadyRef = useRef(false);
  const categorySelectedRef = useRef(false);
  const activeModeRef = useRef(null);
  const selectedAskCategoryRef = useRef(null);
  const askAiMicOnRef = useRef(false);

  const [phase, setPhase] = useState(0);
  const [headerStep, setHeaderStep] = useState(0);
  const [activeMode, setActiveMode] = useState(null);
  const [location, setLocation] = useState(null);
  const [expandedButtons, setExpandedButtons] = useState(null);
  const [selectedButtonColor, setSelectedButtonColor] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [progressValue, setProgressValue] = useState(10);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedAskCategory, setSelectedAskCategory] = useState(null);
  const [showFaqQuestions, setShowFaqQuestions] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [askAiResponse, setAskAiResponse] = useState('');
  const [askAiMicOn, setAskAiMicOn] = useState(false);
  const [commandTick, setCommandTick] = useState(0);

  useEffect(() => { visibleRef.current = visible; }, [visible]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { downloadingRef.current = downloading; }, [downloading]);
  useEffect(() => { expandedRef.current = expandedButtons; }, [expandedButtons]);
  useEffect(() => { selectedSecRef.current = selectedSection; }, [selectedSection]);
  useEffect(() => { activeModeRef.current = activeMode; }, [activeMode]);
  useEffect(() => { selectedAskCategoryRef.current = selectedAskCategory; }, [selectedAskCategory]);
  useEffect(() => { askAiMicOnRef.current = askAiMicOn; }, [askAiMicOn]);

  const scrollChatToEnd = useCallback(() => {
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 120);
  }, []);

  const addChatMessage = useCallback((type, text) => {
    setChatMessages(prev => [...prev, { type, text, id: Date.now() + Math.random() }]);
    if (activeModeRef.current === 'chat') {
      scrollChatToEnd();
    }
  }, [scrollChatToEnd]);

  const stopPulse = useCallback(() => {
    if (pulseLoopRef.current) {
      pulseLoopRef.current.stop();
      pulseLoopRef.current = null;
    }
    Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
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

  const onCommandWithTick = useCallback((spoken) => {
    try {
      if (!spoken || typeof spoken !== 'string') return;
      pendingCommandRef.current = spoken.toLowerCase().trim();
      setCommandTick(t => t + 1);
    } catch (err) {
      console.log('[AIModal] onCommandWithTick error:', err?.message);
    }
  }, []);

  const { speak, startListening, stopListening, resetAll } = useAIVoice({
    visibleRef, phaseRef, downloadingRef,
    continuousListenRef: askAiMicOnRef,
    onCommand: onCommandWithTick,
    onListeningChange: setIsListening,
    onSpeakingChange: setIsSpeaking,
    onTranscript: setTranscript,
    startPulse, stopPulse,
  });

  const { download } = useAIDownload({
    location, progressAnim, setProgressValue, setDownloading, downloadingRef,
  });

  // ── Mode selection ─────────────────────────────────────────────────────────
  const handleMainMenuSelect = useCallback(async (modeId) => {
    setActiveMode(modeId);
    if (modeId === 'excel') {
      await speak('Excel selected. Please choose a report type: MPR, Headwise, All, or Abstract.');
      startListening();
    } else if (modeId === 'askai') {
      setSelectedAskCategory(null);
      setAskAiResponse('');
      await speak('Ask AI selected. Please choose a budget category.');
    } else if (modeId === 'chat') {
      setShowFaqQuestions(true);
      setChatMessages([{ type: 'bot', text: CHAT_WELCOME, id: 'welcome' }]);
      await speak('Chat with us selected. Please choose a question below.');
    }
  }, [speak, startListening, addChatMessage]);

  const handleBackToMenu = useCallback(async () => {
    resetAll();
    setIsListening(false);
    setTranscript('');
    setActiveMode(null);
    setExpandedButtons(null);
    setSelectedSection(null);
    setSelectedAskCategory(null);
    setAskAiResponse('');
    setAskAiMicOn(false);
    setIsSpeaking(false);
    setShowFaqQuestions(true);
    setChatMessages([]);
    categorySelectedRef.current = false;
    await speak('Please tap Excel, Ask AI, or Chat with us.');
  }, [speak, resetAll]);

  const handleClose = useCallback(() => {
    resetAll();
    setIsListening(false);
    setIsSpeaking(false);
    setAskAiMicOn(false);
    setTranscript('');
    onClose();
  }, [resetAll, onClose]);

  const handleAskCategoryPress = useCallback(async (category) => {
    if (askAiMicOn || isListening) {
      setAskAiMicOn(false);
      await stopListening();
    }
    setSelectedAskCategory(category);
    setAskAiResponse('');
    setTranscript('');
    await speak(`${category} selected.`);
  }, [speak, askAiMicOn, isListening, stopListening]);

  const handleAskAiMicToggle = useCallback(async () => {
    if (askAiMicOn) {
      setAskAiMicOn(false);
      await stopListening();
      return;
    }
    setAskAiMicOn(true);
    const ok = await startListening({ force: true });
    if (!ok) setAskAiMicOn(false);
  }, [askAiMicOn, startListening, stopListening]);

  const handleFaqPress = useCallback(async (faq) => {
    addChatMessage('user', faq.question);
    addChatMessage('bot', faq.answer);
    setShowFaqQuestions(false);
    await speak(faq.answer);
  }, [addChatMessage, speak]);

  const handleShowFaqQuestionsAgain = useCallback(() => {
    setShowFaqQuestions(true);
    scrollChatToEnd();
  }, [scrollChatToEnd]);

  const handleCategoryPress = useCallback(async (category) => {
    try {
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
      await download(category, sub, speak);
      await speak('Thank you for choosing Swapsoft AI. Your report has been saved to Downloads.');
      handleClose();
    } catch (err) {
      console.log('[AIModal] handleSubPress error:', err?.message);
      handleClose();
    }
  }, [download, speak, handleClose]);

  // ── Process voice commands ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      if (!pendingCommandRef.current) return;
      if (!mountReadyRef.current) {
        pendingCommandRef.current = null;
        return;
      }

      const spoken = pendingCommandRef.current;
      pendingCommandRef.current = null;
      if (VOICE_TEST_MODE) return;

      if (spoken.includes('close') || spoken.includes('exit') ||
        spoken.includes('cancel') || spoken.includes('बंद')) {
        resetAll();
        setIsListening(false);
        setTranscript('');
        onClose(); return;
      }

      if (spoken.includes('back') || spoken.includes('menu') || spoken.includes('मागे')) {
        if (activeModeRef.current) { handleBackToMenu(); return; }
      }

      const mode = activeModeRef.current;

      // Main menu voice
      if (!mode) {
        const menuMatch = MAIN_MENU.find(m =>
          spoken.includes(m.id) || m.keywords.some(k => spoken.includes(k))
        );
        if (menuMatch) { handleMainMenuSelect(menuMatch.id); return; }
        return;
      }

      // Ask AI voice
      if (mode === 'askai') {
        const catMatch = ASK_AI_CATEGORIES.find(c =>
          spoken.includes(c.label.toLowerCase()) || c.keywords.some(k => spoken.includes(k))
        );
        if (catMatch) { handleAskCategoryPress(catMatch.label); return; }
        if (selectedAskCategoryRef.current) {
          const cat = selectedAskCategoryRef.current;
          const answer = ASK_AI_RESPONSES[cat] ||
            `For ${cat}, check the Status tab for live updates or use Excel to download reports.`;
          setAskAiResponse(answer);
          speak(answer);
          return;
        }
      }

      // Chat voice — match FAQ
      if (mode === 'chat') {
        const faqMatch = CHAT_FAQ.find(f =>
          f.question.toLowerCase().split(' ').some(w => w.length > 4 && spoken.includes(w))
        );
        if (faqMatch) { handleFaqPress(faqMatch); return; }
        addChatMessage('user', spoken);
        addChatMessage('bot', 'For more help, go to Settings → Help or contact SGHI-TECH at info@sghitech.in');
        return;
      }

      // Excel voice (existing flow)
      if (mode === 'excel') {
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
          handleCategoryPress(catMatch.label); return;
        }
        if (subMatch && expandedRef.current) {
          handleSubPress(selectedSecRef.current, subMatch); return;
        }
        if (subMatch && !expandedRef.current) {
          speak('Please select a report type first.');
        }
      }
    } catch (err) {
      console.log('[AIModal] commandTick effect error:', err?.message);
    }
  }, [commandTick]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    AsyncStorage.getItem('LOCATION_ID')
      .then(v => { if (v) setLocation(v); })
      .catch(() => {});
  }, []);

  // ── Modal open / close ─────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      mountReadyRef.current = false;
      categorySelectedRef.current = false;
      setPhase(0);
      setHeaderStep(0);
      setActiveMode(null);
      setExpandedButtons(null);
      setSelectedSection(null);
      setSelectedButtonColor(null);
      setSelectedAskCategory(null);
      setAskAiResponse('');
      setAskAiMicOn(false);
      setShowFaqQuestions(true);
      setChatMessages([]);
      setTranscript('');
      setIsListening(false);
      setIsSpeaking(false);
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
        setTimeout(() => {
          mountReadyRef.current = true;
          setTimeout(() => setPhase(1), 120);
        }, 500);
      });
    } else {
      mountReadyRef.current = false;
      resetAll();
      setIsListening(false);
      setIsSpeaking(false);
      setTranscript('');
      setPhase(0);
      setHeaderStep(0);
      setActiveMode(null);
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
        await speak('Welcome to Smart Budget AI Assistant.');
        if (cancelled) return;
        setHeaderStep(1); await wait(500); if (cancelled) return;
        setHeaderStep(2); await wait(500); if (cancelled) return;
        setHeaderStep(3); await wait(600); if (cancelled) return;
        setPhase(2);
      }

      if (phase === 2 && !activeMode) {
        await speak('Please tap Excel, Ask AI, or Chat with us to continue.');
      }
    };

    run();
    return () => { cancelled = true; };
  }, [phase, visible, activeMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const showMainMenu = phase >= 2 && !activeMode && !downloading;
  const showExcelFlow = activeMode === 'excel' && phase >= 2;
  const showAskAI = activeMode === 'askai';
  const showChat = activeMode === 'chat';
  const showVoiceControls = phase >= 2 && !downloading && activeMode === 'excel';
  const askAiMicActive = askAiMicOn || isListening || isSpeaking;
  const askAiCenterText = selectedAskCategory
    ? `Ask anything about\n${selectedAskCategory}`
    : 'Select a budget\ncategory below';

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
              {activeMode ? (
                <TouchableOpacity style={styles.backBtn} onPress={handleBackToMenu}>
                  <Text style={styles.backBtnTxt}>← Menu</Text>
                </TouchableOpacity>
              ) : null}

              {showVoiceControls && (
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
              )}

              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <Text style={styles.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            {showVoiceControls && isListening && (
              <View style={styles.listeningChip}>
                <Text style={styles.listeningChipTxt}>🎙️  Listening — speak now!</Text>
              </View>
            )}

            {showVoiceControls && !isListening && (
              <View style={styles.manualWrap}>
                <TouchableOpacity style={styles.manualBtn} onPress={startListening}>
                  <LinearGradient colors={['#007AFF', '#0044CC']} style={styles.manualGrad}>
                    <Text style={styles.manualTxt}>🎙️  Tap to Speak</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Marathi header lines ───────────────────────────────── */}
            {!showAskAI && (
              <View style={styles.headerBlock}>
                {HEADER_LINES.map(({ text, step, style: s }) =>
                  headerStep >= step ? <Text key={step} style={s}>{text}</Text> : null
                )}
              </View>
            )}

            <ScrollView
              ref={chatScrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollInner}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">

              {/* ── Welcome bot message (main menu) ─────────────────── */}
              {showMainMenu && (
                <>
                  <BotBubble text="Welcome to Smart Budget. How can I help you today?" />
                  <View style={styles.pillSection}>
                    {MAIN_MENU.map(item => (
                      <PillButton
                        key={item.id}
                        label={item.label}
                        onPress={() => handleMainMenuSelect(item.id)}
                      />
                    ))}
                  </View>
                </>
              )}

              {/* ── EXCEL flow ───────────────────────────────────────── */}
              {showExcelFlow && (
                <>
                  <BotBubble text="Select a report type to download as Excel." />
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
                        : 'Tap a report type or say its name'}
                    </Text>
                  </View>
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
                </>
              )}

              {/* ── ASK AI flow ──────────────────────────────────────── */}
              {showAskAI && (
                <View style={styles.askAiSection}>
                  <AskAIVisualizer
                    isActive={askAiMicActive}
                    centerText={askAiCenterText}
                  />

                  {(askAiMicOn || isListening) && transcript ? (
                    <Text style={styles.askAiTranscript}>"{transcript}"</Text>
                  ) : null}

                  {askAiResponse ? (
                    <Text style={styles.askAiReply}>{askAiResponse}</Text>
                  ) : null}

                  {selectedAskCategory && (
                    <TouchableOpacity
                      style={styles.askAiSpeakBtn}
                      onPress={handleAskAiMicToggle}
                      disabled={isSpeaking}
                      activeOpacity={0.8}>
                      <LinearGradient
                        colors={askAiMicOn
                          ? ['#dc3545', '#c82333']
                          : ['#4A90E2', '#87CEFA', '#FFC0CB']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.askAiSpeakGrad, isSpeaking && styles.askAiSpeakDisabled]}>
                        <Text style={styles.askAiSpeakTxt}>
                          {askAiMicOn ? '⏹  Stop Mic' : '🎙️  Start Mic'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  <View style={styles.askCatGrid}>
                    {ASK_AI_CATEGORIES.map(cat => (
                      <TouchableOpacity
                        key={cat.label}
                        style={[
                          styles.askCatBtn,
                          { width: ASK_AI_BTN_WIDTH },
                          selectedAskCategory === cat.label && styles.askCatBtnSelected,
                        ]}
                        onPress={() => handleAskCategoryPress(cat.label)}
                        activeOpacity={0.75}>
                        <Text
                          style={[
                            styles.askCatBtnTxt,
                            selectedAskCategory === cat.label && styles.askCatBtnTxtSelected,
                          ]}
                          numberOfLines={3}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* ── CHAT WITH US flow ────────────────────────────────── */}
              {showChat && (
                <>
                  {chatMessages.map(msg =>
                    msg.type === 'bot'
                      ? <BotBubble key={msg.id} text={msg.text} />
                      : <UserBubble key={msg.id} text={msg.text} />
                  )}
                  <View style={styles.pillSection}>
                    {showFaqQuestions ? (
                      CHAT_FAQ.map((faq, i) => (
                        <PillButton
                          key={i}
                          label={faq.question}
                          onPress={() => handleFaqPress(faq)}
                        />
                      ))
                    ) : (
                      <PillButton
                        label="See questions again"
                        onPress={handleShowFaqQuestionsAgain}
                      />
                    )}
                  </View>
                </>
              )}

              {/* ── Download progress ────────────────────────────────── */}
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
  scrollInner: { alignItems: 'center', paddingHorizontal: 14, paddingBottom: 28 },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 14, height: 68,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, elevation: 3, zIndex: 10,
  },
  backBtnTxt: { color: '#333', fontSize: 13, fontWeight: '700' },
  closeBtn: {
    position: 'absolute', top: 14, right: 14, width: 40, height: 40,
    backgroundColor: '#FFC0CB', borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  closeTxt: { fontSize: 20, fontWeight: 'bold', color: '#333' },

  listenBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 30,
    elevation: 8, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6,
  },
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

  botRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 14, marginRight: 20, width: '100%' },
  botAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#E65100',
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  botAvatarTxt: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  botBubble: {
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 16, borderBottomLeftRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10, flex: 1,
    borderWidth: 1, borderColor: '#ddd', elevation: 2,
  },
  botBubbleTxt: { color: '#1a1a1a', fontSize: 14, lineHeight: 20, fontWeight: '500' },

  userRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, marginLeft: 40, width: '100%' },
  userBubble: {
    backgroundColor: '#FFC0CB', borderRadius: 16, borderBottomRightRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10, maxWidth: '85%',
    elevation: 2,
  },
  userBubbleTxt: { color: '#1a1a1a', fontSize: 14, lineHeight: 20, fontWeight: '500' },

  pillSection: { marginTop: 14, width: '100%', alignItems: 'center' },
  pillBtn: {
    backgroundColor: 'rgba(255,255,255,0.95)', borderWidth: 1.5, borderColor: '#1a1a1a',
    borderRadius: 24, paddingVertical: 12, paddingHorizontal: 18,
    alignItems: 'center', marginBottom: 8, width: '90%', elevation: 2,
  },
  pillBtnTxt: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', textAlign: 'center' },

  askAiSection: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 4,
  },
  askAiTranscript: {
    fontSize: 13,
    color: '#333',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 6,
    paddingHorizontal: 12,
  },
  askAiReply: {
    fontSize: 13,
    color: '#1a1a1a',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 16,
    lineHeight: 19,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 10,
    paddingVertical: 8,
    width: '95%',
  },
  askAiSpeakBtn: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 10,
    elevation: 4,
  },
  askAiSpeakGrad: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  askAiSpeakDisabled: {
    opacity: 0.45,
  },
  askAiSpeakTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  askCatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  askCatBtn: {
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    padding: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  askCatBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
    textAlign: 'center',
  },
  askCatBtnSelected: {
    backgroundColor: '#EAF4FF',
    borderColor: '#E65100',
    borderWidth: 2,
  },
  askCatBtnTxtSelected: {
    color: '#E65100',
  },

  catRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', width: '100%', paddingHorizontal: 8, marginTop: 24, paddingBottom: 6 },
  catBtn: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', marginHorizontal: 3, elevation: 3 },
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
