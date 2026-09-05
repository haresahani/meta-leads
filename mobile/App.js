import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  LogBox,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import io from 'socket.io-client';
import Constants from 'expo-constants';
import styles from './styles';

// Disable development warning banners at the bottom of screen for clean UI
LogBox.ignoreAllLogs(true);

//Dynamically determine local server URL from Expo host IP or fallback environment variable.
//Expo automatically knows the host machine's IP running Metro bundler.
function getInitialServerUrl() {
  if (process.env.EXPO_PUBLIC_SERVER_URL) {
    return process.env.EXPO_PUBLIC_SERVER_URL;
  }
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) {
      return `http://${ip}:5000`;
    }
  }
  return 'http://172.16.2.75:5000';
}

//Format timestamp into relative time or localized date string
function formatTimestamp(timestampStr) {
  if (!timestampStr) return 'Unknown time';
  const date = new Date(timestampStr);
  if (isNaN(date.getTime())) return timestampStr;

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 30) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;

  return date.toLocaleString();
}

export default function App() {
  const [serverUrl, setServerUrl] = useState(getInitialServerUrl());
  const [inputUrl, setInputUrl] = useState(getInitialServerUrl());
  const [modalVisible, setModalVisible] = useState(false);

  const [leads, setLeads] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const socketRef = useRef(null);

  // Fetch initial leads from backend
  const fetchLeads = useCallback(async (targetUrl = serverUrl) => {
    try {
      const response = await fetch(`${targetUrl}/api/leads`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      }
    } catch (error) {
      console.error('Error fetching leads:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [serverUrl]);

  useEffect(() => {
    fetchLeads(serverUrl);

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    setConnectionStatus('Connecting...');
    setIsConnected(false);

    //Initialize Socket.IO connection to active serverUrl
    const socket = io(serverUrl, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`Socket.IO connected to ${serverUrl}`);
      setIsConnected(true);
      setConnectionStatus('Connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('Disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error.message);
      setIsConnected(false);
      setConnectionStatus('Connection Error');
    });

    // Real-time lead event listener
    socket.on('new_lead', (newLead) => {
      console.log('Real-time new lead received:', newLead);
      setLeads((prevLeads) => {
        if (prevLeads.some((lead) => lead.id === newLead.id)) {
          return prevLeads;
        }
        return [newLead, ...prevLeads];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [serverUrl, fetchLeads]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeads(serverUrl);
  };

  const saveServerUrl = () => {
    let cleanUrl = inputUrl.trim();
    if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `http://${cleanUrl}`;
    }
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    setServerUrl(cleanUrl);
    setModalVisible(false);
  };

  const renderLeadItem = ({ item }) => {
    const formattedDate = formatTimestamp(item.created_time);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.leadName}>{item.name || 'Anonymous Lead'}</Text>
          {item.isMock ? (
            <View style={[styles.badge, styles.mockBadge]}>
              <Text style={styles.mockBadgeText}>MOCK</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.liveBadge]}>
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          )}
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email:</Text>
          <Text style={styles.detailValue}>{item.email || 'N/A'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phone:</Text>
          <Text style={styles.detailValue}>{item.phone || 'N/A'}</Text>
        </View>

        {item.form_id ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Form ID:</Text>
            <Text style={styles.detailValue}>{item.form_id}</Text>
          </View>
        ) : null}

        {item.page_id ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Page ID:</Text>
            <Text style={styles.detailValue}>{item.page_id}</Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.leadId}>ID: {item.id}</Text>
          <Text style={styles.timeText}>{formattedDate}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Meta Lead Ads</Text>
          <Text style={styles.subtitle}>Real-time Lead Notifications</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Text style={styles.refreshBtnText}>↻ Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.configBtn}
            onPress={() => {
              setInputUrl(serverUrl);
              setModalVisible(true);
            }}
          >
            <Text style={styles.configBtnText}>⚙️ Server</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Connection Status Indicator */}
      <TouchableOpacity
        style={styles.statusContainer}
        onPress={() => {
          setInputUrl(serverUrl);
          setModalVisible(true);
        }}
      >
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isConnected ? '#10B981' : '#EF4444' },
          ]}
        />
        <Text style={[styles.statusText, { flex: 1 }]} numberOfLines={1}>
          Status: {connectionStatus} ({serverUrl})
        </Text>
        <Text style={{ fontSize: 11, color: '#1877F2', fontWeight: '600' }}>Edit</Text>
      </TouchableOpacity>

      {/* Lead Count Bar */}
      <View style={styles.countBar}>
        <Text style={styles.countText}>
          Total Leads: <Text style={styles.countHighlight}>{leads.length}</Text>
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1877F2" />
          <Text style={styles.loadingText}>Loading leads...</Text>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id || Math.random().toString()}
          renderItem={renderLeadItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1877F2']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📬</Text>
              <Text style={styles.emptyTitle}>No Leads Received Yet</Text>
              <Text style={styles.emptySub}>
                New Meta leads will appear here automatically via Socket.IO real-time stream.
              </Text>
            </View>
          }
        />
      )}

      {/* Server URL Configuration Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configure Server URL</Text>
            <Text style={styles.modalSubtitle}>
              Enter your local Wi-Fi backend URL (e.g. http://172.16.2.75:5000) or your Cloudflare / Ngrok tunnel URL.
            </Text>

            <Text style={styles.inputLabel}>Backend Server URL:</Text>
            <TextInput
              style={styles.textInput}
              value={inputUrl}
              onChangeText={setInputUrl}
              placeholder="http://172.16.2.75:5000"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveServerUrl}>
                <Text style={styles.saveBtnText}>Save & Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
