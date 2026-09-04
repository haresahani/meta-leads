import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import io from 'socket.io-client';
import styles from './styles';

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:5000';

//format timestamp into relative time or localized date string
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
  const [leads, setLeads] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch initial leads from backend
  const fetchLeads = useCallback(async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/leads`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();

    // Initialize Socket.IO connection
    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected to server');
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
        // Prevent duplicate leads by ID
        if (prevLeads.some((lead) => lead.id === newLead.id)) {
          return prevLeads;
        }
        return [newLead, ...prevLeads];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchLeads]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeads();
  };

  // Helper to trigger test lead from mobile app
  const triggerTestLead = async () => {
    try {
      await fetch(`${SERVER_URL}/api/test-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Failed to trigger test lead:', error);
    }
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
          <TouchableOpacity style={styles.testBtn} onPress={triggerTestLead}>
            <Text style={styles.testBtnText}>+ Test Lead</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Connection Status Indicator */}
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isConnected ? '#10B981' : '#EF4444' },
          ]}
        />
        <Text style={styles.statusText}>
          Status: {connectionStatus} ({SERVER_URL})
        </Text>
      </View>

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
              <TouchableOpacity style={styles.emptyActionBtn} onPress={triggerTestLead}>
                <Text style={styles.emptyActionBtnText}>Create Test Lead</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
