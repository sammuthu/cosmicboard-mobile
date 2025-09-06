import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { colors } from '../styles/colors';
import { Media } from '../models';

interface Props {
  media: Media;
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function PDFViewer({ media, visible, onClose }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);

  const handleLoadComplete = (numberOfPages: number) => {
    setTotalPages(numberOfPages);
    setLoading(false);
  };

  const handlePageChanged = (page: number) => {
    setCurrentPage(page);
  };

  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.5, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.5, 0.5));
  };

  const handleDownload = () => {
    // In a real app, you would implement download functionality here
    Alert.alert('Download', 'Download functionality would be implemented here');
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[colors.background.secondary, 'rgba(0,0,0,0.8)']}
          style={styles.header}
        >
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <X color="white" size={24} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {media.name}
            </Text>
            <Text style={styles.headerSubtitle}>
              Page {currentPage} of {totalPages}
            </Text>
          </View>
          
          <TouchableOpacity onPress={handleDownload} style={styles.headerButton}>
            <Download color="white" size={24} />
          </TouchableOpacity>
        </LinearGradient>

        {/* PDF Viewer */}
        <View style={styles.pdfContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.cosmic.purple} />
              <Text style={styles.loadingText}>Loading PDF...</Text>
            </View>
          )}
          
          <Pdf
            source={{ uri: media.url }}
            onLoadComplete={handleLoadComplete}
            onPageChanged={handlePageChanged}
            onError={(error) => {
              console.error('PDF Error:', error);
              Alert.alert('Error', 'Failed to load PDF');
              setLoading(false);
            }}
            style={[styles.pdf, { transform: [{ scale }] }]}
            horizontal={false}
            spacing={10}
            enablePaging={true}
            renderActivityIndicator={() => (
              <ActivityIndicator size="large" color={colors.cosmic.purple} />
            )}
          />
        </View>

        {/* Controls */}
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', colors.background.secondary]}
          style={styles.controls}
        >
          <View style={styles.controlsRow}>
            {/* Navigation */}
            <View style={styles.navigationControls}>
              <TouchableOpacity
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                style={[styles.controlButton, currentPage === 1 && styles.controlButtonDisabled]}
                disabled={currentPage === 1}
              >
                <ChevronLeft color={currentPage === 1 ? colors.text.muted : 'white'} size={24} />
              </TouchableOpacity>
              
              <Text style={styles.pageIndicator}>
                {currentPage} / {totalPages}
              </Text>
              
              <TouchableOpacity
                onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                style={[styles.controlButton, currentPage === totalPages && styles.controlButtonDisabled]}
                disabled={currentPage === totalPages}
              >
                <ChevronRight color={currentPage === totalPages ? colors.text.muted : 'white'} size={24} />
              </TouchableOpacity>
            </View>

            {/* Zoom Controls */}
            <View style={styles.zoomControls}>
              <TouchableOpacity
                onPress={handleZoomOut}
                style={[styles.controlButton, scale <= 0.5 && styles.controlButtonDisabled]}
                disabled={scale <= 0.5}
              >
                <ZoomOut color={scale <= 0.5 ? colors.text.muted : 'white'} size={24} />
              </TouchableOpacity>
              
              <Text style={styles.scaleIndicator}>
                {Math.round(scale * 100)}%
              </Text>
              
              <TouchableOpacity
                onPress={handleZoomIn}
                style={[styles.controlButton, scale >= 3.0 && styles.controlButtonDisabled]}
                disabled={scale >= 3.0}
              >
                <ZoomIn color={scale >= 3.0 ? colors.text.muted : 'white'} size={24} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    zIndex: 1,
  },
  loadingText: {
    color: colors.text.primary,
    marginTop: 16,
    fontSize: 16,
  },
  pdf: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
  controls: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingBottom: 34, // Extra padding for home indicator
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navigationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  controlButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  pageIndicator: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
  },
  scaleIndicator: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
  },
});