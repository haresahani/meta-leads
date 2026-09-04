import { StyleSheet, Platform, StatusBar } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1877F2',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  testBtn: {
    backgroundColor: '#1877F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  testBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  countBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  countText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  countHighlight: {
    fontWeight: '700',
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leadName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mockBadge: {
    backgroundColor: '#FEF3C7',
  },
  mockBadgeText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '700',
  },
  liveBadge: {
    backgroundColor: '#D1FAE5',
  },
  liveBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    width: 70,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  cardFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leadId: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default styles;
