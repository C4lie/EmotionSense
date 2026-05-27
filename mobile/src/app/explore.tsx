import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sessionService } from '../services/api';
import { BottomTabInset } from '@/constants/theme';

export default function PracticeScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Live telemetry mock simulation
  const [liveConfidence, setLiveConfidence] = useState(75);
  const [liveFeedback, setLiveFeedback] = useState('Position your face in the camera frame.');
  const [report, setReport] = useState<any>(null);

  // Auto-tick timer and simulate AI telemetry when recording
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setTimer((prev) => {
          const next = prev + 1;
          // Simulate some random confidence value updates
          const confChange = Math.floor(Math.random() * 15) - 7; // -7 to +7
          setLiveConfidence((curr) => {
            const nextConf = Math.min(100, Math.max(30, curr + confChange));
            // Log frame to backend
            if (activeSession?.id && next % 3 === 0) {
              const mockEmotions = ['happy', 'neutral', 'surprise'];
              const randomEmo = mockEmotions[Math.floor(Math.random() * mockEmotions.length)];
              sessionService.addFrame(activeSession.id, randomEmo, nextConf).catch(err => {
                console.error("Frame upload failed:", err);
              });
            }
            return nextConf;
          });

          // Suggestion update triggers
          if (next === 5) setLiveFeedback('Great eye contact! Maintain this posture.');
          if (next === 10) setLiveFeedback('Speaking volume is optimal. Rhythm is clear.');
          if (next === 15) setLiveFeedback('Pace is slightly fast. Take a deep breath.');
          if (next === 20) setLiveFeedback('Volume envelope is stable. Excellent stability.');

          return next;
        });
      }, 1000);
    } else {
      setTimer(0);
      setLiveConfidence(75);
      setLiveFeedback('Position your face in the camera frame.');
    }
    return () => clearInterval(interval);
  }, [isRecording, activeSession]);

  const handleStartSession = async () => {
    setLoading(true);
    setReport(null);
    try {
      const session = await sessionService.startSession('speaking');
      setActiveSession(session);
      setIsRecording(true);
    } catch (err: any) {
      Alert.alert('Session Error', err.message || 'Make sure backend is online');
    } finally {
      setLoading(false);
    }
  };

  const handleStopSession = async () => {
    if (!activeSession) return;
    setLoading(true);
    setIsRecording(false);
    try {
      const closed = await sessionService.closeSession(activeSession.id);
      setReport(closed);
      setActiveSession(null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save session report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Practice Studio</Text>
        <Text style={styles.subtitle}>AI Interactive webcam & audio analysis</Text>

        {/* CAMERA PREVIEW CONTAINER */}
        <View style={[styles.cameraContainer, isRecording && styles.recordingBorder]}>
          {isRecording ? (
            <View style={styles.cameraOverlay}>
              <View style={styles.recordingDotContainer}>
                <View style={styles.recordingDot} />
                <Text style={styles.timerText}>{timer}s</Text>
              </View>

              <View style={styles.liveScoreCard}>
                <Text style={styles.liveScoreLabel}>CONFIDENCE RATING</Text>
                <Text style={styles.liveScoreValue}>{liveConfidence}%</Text>
              </View>

              <View style={styles.feedbackBanner}>
                <Text style={styles.feedbackBannerText}>💡 {liveFeedback}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Text style={styles.placeholderIcon}>📷</Text>
              <Text style={styles.placeholderText}>Camera lens is ready</Text>
              <Text style={styles.placeholderDesc}>Start a session to begin live visual scoring</Text>
            </View>
          )}
        </View>

        {/* CONTROLS */}
        <View style={styles.controlsWrapper}>
          {loading ? (
            <ActivityIndicator size="large" color="#6366f1" />
          ) : isRecording ? (
            <TouchableOpacity style={styles.btnStop} onPress={handleStopSession}>
              <Text style={styles.btnText}>Finish Session</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btnStart} onPress={handleStartSession}>
              <Text style={styles.btnText}>Start Speaking Practice</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SESSION REPORT DIALOG */}
        {report && (
          <View style={styles.reportCard}>
            <Text style={styles.reportHeader}>📊 SESSION REPORT SUMMARY</Text>
            <View style={styles.reportRow}>
              <Text style={styles.reportLabel}>Dominant expression:</Text>
              <Text style={styles.reportValue}>{report.dominant_emotion || 'neutral'}</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={styles.reportLabel}>Overall Confidence:</Text>
              <Text style={styles.reportValue}>{Math.round(report.confidence_score || report.average_confidence || 0)}%</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={styles.reportLabel}>Stability Rating:</Text>
              <Text style={styles.reportValue}>{Math.round(report.stability_score || 0)}%</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={styles.reportLabel}>Vocal Energy:</Text>
              <Text style={styles.reportValue}>{Math.round(report.speaking_energy || 0)}%</Text>
            </View>
            <Text style={styles.reportTip}>
              💡 Tip: Maintain structured eye contact and pace your speech during pauses.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b10',
  },
  scroll: {
    padding: 20,
    paddingBottom: BottomTabInset + 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
    marginBottom: 20,
  },
  cameraContainer: {
    height: 320,
    backgroundColor: '#11131e',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f2235',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingBorder: {
    borderColor: '#ef4444',
  },
  cameraPlaceholder: {
    alignItems: 'center',
    padding: 20,
  },
  placeholderIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  placeholderDesc: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 6,
    textAlign: 'center',
  },
  cameraOverlay: {
    flex: 1,
    width: '100%',
    height: '100%',
    padding: 20,
    justifyContent: 'space-between',
  },
  recordingDotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  timerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  liveScoreCard: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 12,
    alignSelf: 'center',
    alignItems: 'center',
  },
  liveScoreLabel: {
    color: '#9ca3af',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  liveScoreValue: {
    color: '#6366f1',
    fontSize: 32,
    fontWeight: '900',
  },
  feedbackBanner: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
  },
  feedbackBannerText: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  controlsWrapper: {
    marginTop: 20,
    marginBottom: 20,
  },
  btnStart: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnStop: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  reportCard: {
    backgroundColor: '#11131e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2235',
  },
  reportHeader: {
    fontSize: 12,
    color: '#a5b4fc',
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2235',
    paddingBottom: 10,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  reportLabel: {
    color: '#9ca3af',
    fontSize: 13,
  },
  reportValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  reportTip: {
    marginTop: 15,
    color: '#a5b4fc',
    fontSize: 11,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 10,
    borderRadius: 8,
    lineHeight: 16,
  },
});
