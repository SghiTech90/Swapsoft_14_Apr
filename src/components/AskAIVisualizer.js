import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const BAR_COUNT = 48;
const AI_COLORS = ['#4A90E2', '#FFC0CB', '#87CEFA', '#007AFF', '#E65100', '#14b8a6'];
const DEFAULT_SIZE = 220;
const INNER_RADIUS = 62;
const MAX_BAR = 40;
const BAR_WIDTH = 4;
const IDLE_BAR = 10;
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

const AskAIVisualizer = ({ isActive, centerText, size = DEFAULT_SIZE }) => {
  const bars = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.1)),
  ).current;
  const timerRef = useRef(null);
  const glowOpacity = useRef(new Animated.Value(0.15)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const micDotScale = useRef(new Animated.Value(1)).current;
  const outerRingOpacity = useRef(new Animated.Value(0.3)).current;
  const centerGlow = useRef(new Animated.Value(0)).current;
  const pulseLoopRef = useRef(null);
  const dotLoopRef = useRef(null);
  const outerLoopRef = useRef(null);
  const center = size / 2;
  const innerSize = INNER_RADIUS * 1.75;

  useEffect(() => {
    [pulseLoopRef, dotLoopRef, outerLoopRef].forEach(ref => {
      if (ref.current) {
        ref.current.stop();
        ref.current = null;
      }
    });

    if (isActive) {
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.45, duration: 450, useNativeDriver: true }),
        ]),
      );
      pulseLoopRef.current.start();

      outerLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(outerRingOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(outerRingOpacity, { toValue: 0.5, duration: 500, useNativeDriver: true }),
        ]),
      );
      outerLoopRef.current.start();

      dotLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(micDotScale, { toValue: 1.5, duration: 400, useNativeDriver: true }),
          Animated.timing(micDotScale, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
      );
      dotLoopRef.current.start();

      Animated.parallel([
        Animated.spring(ringScale, { toValue: 1.04, friction: 5, useNativeDriver: true }),
        Animated.timing(centerGlow, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(glowOpacity, { toValue: 0.12, duration: 350, useNativeDriver: true }),
        Animated.timing(outerRingOpacity, { toValue: 0.2, duration: 350, useNativeDriver: true }),
        Animated.spring(ringScale, { toValue: 1, friction: 8, useNativeDriver: true }),
        Animated.timing(micDotScale, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(centerGlow, { toValue: 0, duration: 350, useNativeDriver: true }),
        ...bars.map(bar =>
          Animated.timing(bar, { toValue: 0.08 + Math.random() * 0.05, duration: 300, useNativeDriver: false }),
        ),
      ]).start();
    }

    return () => {
      [pulseLoopRef, dotLoopRef, outerLoopRef].forEach(ref => {
        if (ref.current) ref.current.stop();
      });
    };
  }, [isActive, bars, glowOpacity, ringScale, micDotScale, outerRingOpacity, centerGlow]);

  useEffect(() => {
    const tick = () => {
      if (!isActive) return;
      const anims = bars.map(bar =>
        Animated.timing(bar, {
          toValue: 0.25 + Math.random() * 0.95,
          duration: 50 + Math.random() * 70,
          useNativeDriver: false,
        }),
      );
      Animated.parallel(anims).start();
    };

    if (isActive) {
      tick();
      timerRef.current = setInterval(tick, 75);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, bars]);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {/* Outer glow halo */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          opacity: glowOpacity,
          transform: [{ scale: ringScale }],
        }}>
        <LinearGradient
          colors={isActive
            ? ['#FF80AB', '#87CEFA', '#4A90E2', '#FFC0CB']
            : ['#E0E0E0', '#F5F5F5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.glowRing, {
            width: size,
            height: size,
            borderRadius: size / 2,
          }]}
        />
      </Animated.View>

      {/* Animated outer ring border */}
      <Animated.View
        style={[styles.outerRing, {
          width: size - 4,
          height: size - 4,
          borderRadius: (size - 4) / 2,
          left: 2,
          top: 2,
          opacity: outerRingOpacity,
          borderColor: isActive ? '#4A90E2' : '#D0D0D0',
          borderWidth: isActive ? 3 : 1.5,
        }]}
      />

      {bars.map((barAnim, i) => {
        const deg = (i / BAR_COUNT) * 360;
        const height = barAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [IDLE_BAR, MAX_BAR],
        });
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: center,
              top: center,
              width: 0,
              height: 0,
              transform: [{ rotate: `${deg}deg` }],
              zIndex: 2,
            }}>
            <Animated.View
              style={{
                width: BAR_WIDTH,
                height,
                backgroundColor: isActive
                  ? AI_COLORS[i % AI_COLORS.length]
                  : '#B0BEC5',
                marginLeft: INNER_RADIUS,
                borderRadius: 2,
                opacity: isActive ? 1 : 0.5,
              }}
            />
          </View>
        );
      })}

      <Animated.View
        style={{
          position: 'absolute',
          left: center - innerSize / 2 - 6,
          top: center - innerSize / 2 - 6,
          width: innerSize + 12,
          height: innerSize + 12,
          borderRadius: (innerSize + 12) / 2,
          backgroundColor: '#4A90E2',
          opacity: centerGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }),
          zIndex: 3,
        }}
      />

      {isActive ? (
        <AnimatedGradient
          colors={['#FFE4F0', '#E3F2FD', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.centerDisc, {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            left: center - innerSize / 2,
            top: center - innerSize / 2,
            borderColor: '#007AFF',
            borderWidth: 3,
            zIndex: 4,
          }]}>
          <Animated.View
            style={[styles.micDot, { transform: [{ scale: micDotScale }] }]}
          />
          <Text style={[styles.centerText, styles.centerTextActive]}>
            {centerText}
          </Text>
          <Text style={styles.listeningLabel}>● Listening…</Text>
        </AnimatedGradient>
      ) : (
        <View
          style={[styles.centerDisc, {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            left: center - innerSize / 2,
            top: center - innerSize / 2,
            borderColor: '#D0D0D0',
            borderWidth: 1.5,
            zIndex: 4,
          }]}>
          <Text style={styles.centerText}>{centerText}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    marginVertical: 8,
  },
  glowRing: {
    opacity: 1,
  },
  outerRing: {
    position: 'absolute',
  },
  centerDisc: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    elevation: 8,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  micDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E53935',
    marginBottom: 6,
  },
  centerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E9AAF',
    textAlign: 'center',
    lineHeight: 18,
  },
  centerTextActive: {
    color: '#007AFF',
    fontWeight: '700',
  },
  listeningLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E53935',
    marginTop: 4,
    letterSpacing: 0.3,
  },
});

export default AskAIVisualizer;
