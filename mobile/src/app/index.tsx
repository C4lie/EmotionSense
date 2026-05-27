import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { authService, challengeService, streakService, subscriptionService } from '../services/api';
import { BottomTabInset } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Dashboard Data
  const [user, setUser] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [challenge, setChallenge] = useState<any>(null);
  const [subStatus, setSubStatus] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Sync / Load Dashboard Data
  const loadDashboardData = async () => {
    setDashboardLoading(true);
    try {
      const u = await authService.getMe();
      const s = await streakService.getStatus();
      const c = await challengeService.getToday();
      const sub = await subscriptionService.getStatus();
      setUser(u);
      setStreak(s);
      setChallenge(c);
      setSubStatus(sub);
    } catch (err) {
      console.error(err);
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setAuthLoading(true);
    try {
      if (isLogin) {
        await authService.login(email, password);
      } else {
        await authService.register(name, email, password);
      }
      setIsAuthenticated(true);
    } catch (err: any) {
      Alert.alert('Auth Failed', err.message || 'Incorrect credentials');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleActivatePremium = async () => {
    try {
      await subscriptionService.activate();
      Alert.alert('Success', 'Premium Mode Activated!');
      loadDashboardData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to activate premium');
    }
  };

  const handleUseFreeze = async () => {
    try {
      await streakService.freeze();
      Alert.alert('Success', 'Streak Freeze applied!');
      loadDashboardData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Streak freeze is premium-only');
    }
  };

  // ──── RENDER AUTHENTICATION FORM ────
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <ScrollView contentContainerStyle={styles.authScroll}>
          <Text style={styles.heroTitle}>EmotionSense AI</Text>
          <Text style={styles.heroSubtitle}>Communication & Confidence Coach</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
            
            {!isLogin && (
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.btnPrimary} onPress={handleAuth} disabled={authLoading}>
              {authLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchAuth}>
              <Text style={styles.switchAuthText}>
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ──── RENDER DASHBOARD ────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Hello, {user?.name || 'User'}</Text>
          <Text style={styles.subtext}>Ready for today's confidence exercises?</Text>
        </View>

        {dashboardLoading ? (
          <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* STREAK PANEL */}
            {streak && (
              <View style={styles.streakCard}>
                <View style={styles.streakHeader}>
                  <Text style={styles.emojiText}>🔥</Text>
                  <View>
                    <Text style={styles.streakCount}>{streak.current_streak} Day Streak</Text>
                    <Text style={styles.longestStreak}>Personal Best: {streak.longest_streak} Days</Text>
                  </View>
                </View>
                {!streak.practiced_today ? (
                  <View style={styles.streakWarning}>
                    <Text style={styles.streakWarningText}>You haven't practiced today yet!</Text>
                    {subStatus?.is_premium && (
                      <TouchableOpacity style={styles.btnFreeze} onPress={handleUseFreeze}>
                        <Text style={styles.btnFreezeText}>❄️ Use Streak Freeze</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <Text style={styles.streakSuccessText}>✅ You are safe for today!</Text>
                )}
              </View>
            )}

            {/* DAILY CHALLENGE CARD */}
            {challenge && (
              <View style={styles.card}>
                <Text style={styles.cardHeaderBadge}>🎯 TODAY'S DAILY CHALLENGE</Text>
                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                <Text style={styles.challengeDesc}>{challenge.description}</Text>
                <Text style={styles.challengeTarget}>Target score: {challenge.target_score}%</Text>
                
                {challenge.completed ? (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>🎉 COMPLETED</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.btnPrimary} 
                    onPress={() => router.push('/explore')}
                  >
                    <Text style={styles.btnText}>Start Recording</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* SUBSCRIPTION MANAGEMENT */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Membership Tier</Text>
              <Text style={styles.subTierText}>
                Plan: {subStatus?.is_premium ? '🌟 PREMIUM ACCESS' : 'Free Account'}
              </Text>
              {!subStatus?.is_premium && (
                <TouchableOpacity style={styles.btnPremium} onPress={handleActivatePremium}>
                  <Text style={styles.btnText}>👑 Upgrade to Premium ($9/mo)</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity 
              style={styles.btnSignOut} 
              onPress={() => setIsAuthenticated(false)}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </>
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
  authContainer: {
    flex: 1,
    backgroundColor: '#0a0b10',
    justifyContent: 'center',
  },
  authScroll: {
    padding: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'System',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6366f1',
    textAlign: 'center',
    marginBottom: 40,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  header: {
    marginBottom: 25,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  subtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#11131e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1f2235',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 15,
  },
  cardHeaderBadge: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  challengeDesc: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 12,
  },
  challengeTarget: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#1a1d30',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2e334e',
  },
  btnPrimary: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  btnPremium: {
    backgroundColor: '#fbbf24',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  switchAuth: {
    marginTop: 15,
    alignItems: 'center',
  },
  switchAuthText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  streakCard: {
    backgroundColor: '#1f1512',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3c2317',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  emojiText: {
    fontSize: 32,
  },
  streakCount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ff6b00',
  },
  longestStreak: {
    fontSize: 12,
    color: '#ff983d',
    marginTop: 2,
  },
  streakWarning: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#3c2317',
    pt: 12,
    paddingTop: 12,
  },
  streakWarningText: {
    color: '#ff983d',
    fontSize: 12,
    fontWeight: '600',
  },
  btnFreeze: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnFreezeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  streakSuccessText: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 12,
  },
  completedBadge: {
    backgroundColor: '#064e3b',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  completedBadgeText: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '800',
  },
  subTierText: {
    fontSize: 15,
    color: '#9ca3af',
    marginBottom: 10,
  },
  btnSignOut: {
    alignItems: 'center',
    padding: 15,
    marginTop: 10,
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
});
