import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HeaderComponent from '../components/HeaderComponent';
import ProfileComponent from '../components/ProfileComponent';
import AIModal from '../components/AIModal';
import LinearGradient from 'react-native-linear-gradient';
import CircularRotatingItems from '../components/CircularRotatingItems';
import BoxSociogram, {
  CIRCLE_OFFICE_VALUE,
  SUB_OFFICES,
} from '../components/BoxSociogram';
import {
  CirclePieChartCountApi,
  CircleWiseBarChartApi,
} from '../Api/CircleHomeScrApi';
import BarChartComponent from '../components/BarChartComponent';
import PieChartComponent from '../components/PieChartComponent';
import ImageViewing from 'react-native-image-viewing';
import {HomeAllimageapi} from '../Api/AllImageApi';
import {GetUserProfileApi, extractProfileImage} from '../Api/ProfileAPI';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getImageUri = img => {
  let uri =
    img.imageUrl ||
    img.ImageUrl ||
    img.image ||
    img.imageBase64 ||
    (img.Image ? `data:image/jpeg;base64,${img.Image}` : null);

  if (
    uri &&
    uri.includes('cloudinary.com') &&
    uri.includes('/upload/') &&
    !uri.includes('w_')
  ) {
    uri = uri.replace('/upload/', '/upload/w_400,q_auto,f_auto/');
  }
  return uri;
};

// ─── ImageItem ────────────────────────────────────────────────────────────────

const ImageItem = ({item, onImagePress, index}) => {
  const [imageError, setImageError] = useState(false);
  const [errorType, setErrorType] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [imageKey, setImageKey] = useState(0);

  const uri = getImageUri(item);

  const handleRetry = () => {
    if (retryCount < 2) {
      setRetryCount(retryCount + 1);
      setImageError(false);
      setImageKey(prev => prev + 1);
    }
  };

  return (
    <TouchableOpacity
      onPress={() => (!imageError ? onImagePress(index) : handleRetry())}
      style={styles.imageContainer}>
      {!imageError ? (
        <Image
          key={imageKey}
          source={{
            uri,
            headers: {
              Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
              'User-Agent':
                'Mozilla/5.0 (Linux; Android 10; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0',
            },
          }}
          style={styles.image}
          resizeMethod="resize"
          resizeMode="cover"
          onError={error => {
            const errorMsg = error.nativeEvent?.error || '';
            let type = 'Error';
            if (errorMsg.includes('404') || errorMsg.includes('Not Found'))
              type = '404';
            else if (
              errorMsg.includes('timeout') ||
              errorMsg.includes('timed out')
            )
              type = 'Timeout';
            else if (
              errorMsg.includes('403') ||
              errorMsg.includes('Forbidden')
            )
              type = '403';
            setErrorType(type);
            setImageError(true);
          }}
        />
      ) : (
        <View style={[styles.image, styles.imageErrorPlaceholder]}>
          <Text style={styles.imageErrorText}>
            {errorType === '404' ? '📭' : errorType === 'Timeout' ? '⏱️' : '✕'}
          </Text>
          <Text style={styles.imageErrorType}>{errorType}</Text>
          {retryCount < 2 && (
            <Text style={styles.imageRetryText}>Tap to retry</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── ImageFooter ──────────────────────────────────────────────────────────────
// Shows काम नाव, उपविभाग, उपविभाग कार्यालय, शाखा अभियंता, उपअभियंता, ठेकेदार
// All fetched via backend JOIN on ImageGallary.Type → BudgetMaster* table

const ImageFooter = ({imageIndex, imagesCount, image}) => {
  if (!image) return null;

  // Helper: combine name + mobile if both exist
  const nameWithMobile = (name, mobile) => {
    if (!name && !mobile) return '—';
    if (name && mobile) return `${name} (${mobile})`;
    return name || mobile || '—';
  };

  const rows = [
    {
      label: 'काम नाव',
      value: image.KamacheName || '—',
    },
    {
      label: 'शाखा अभियंता',
      value: nameWithMobile(image.ShakhaAbhyantaName, image.ShakhaAbhiyantMobile),
    },
    {
      label: 'उपअभियंता',
      value: nameWithMobile(image.UpabhyantaName, image.UpAbhiyantaMobile),
    },
    {
      label: 'ठेकेदार',
      value: nameWithMobile(image.ThekedaarName, image.ThekedarMobile),
    },
  ];

  return (
    <View style={footerStyles.container}>
      {/* Counter */}
      <Text style={footerStyles.counter}>
        {imageIndex + 1} / {imagesCount}
      </Text>

      {/* Type badge */}
      {image.type ? (
        <View style={footerStyles.typeBadge}>
          <Text style={footerStyles.typeText}>{image.type}</Text>
        </View>
      ) : null}

      {/* Metadata rows */}
      {rows.map(row => (
        <View key={row.label} style={footerStyles.row}>
          <Text style={footerStyles.label}>{row.label} :</Text>
          <Text style={footerStyles.value} numberOfLines={2}>
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const SupreintendingEngienerScreen = ({navigation}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);
  const [location, setLocation] = useState(null);
  const [role, setRole] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [barChartData, setBarChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [userProfileImage, setUserProfileImage] = useState(null);

  const [groupedImages, setGroupedImages] = useState([]);
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // ✅ Stores full image objects (not just {uri}) so footer can read all metadata
  const [viewerImages, setViewerImages] = useState([]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const storedUserId   = await AsyncStorage.getItem('USER_ID');
        const storedRole     = await AsyncStorage.getItem('userRole');
        const storedUserName = await AsyncStorage.getItem('USER_NAME');
        const storedLocation = await AsyncStorage.getItem('LOCATION_ID');

        if (storedUserId)   setUserId(storedUserId);
        if (storedRole)     setRole(storedRole);
        if (storedUserName) setUserName(storedUserName);
        if (storedLocation) setLocation(storedLocation);

        const cachedImage = await AsyncStorage.getItem('PROFILE_IMAGE');
        if (cachedImage) setUserProfileImage(cachedImage);

        if (storedUserId && storedLocation) {
          const profileResult = await GetUserProfileApi({
            userId: storedUserId,
            office: storedLocation,
          });
          const serverImage = extractProfileImage(profileResult);
          if (serverImage) {
            setUserProfileImage(serverImage);
            await AsyncStorage.setItem('PROFILE_IMAGE', serverImage);
          }
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };
    fetchUserDetails();
  }, []);

  const fetchGroupedImages = useCallback(async offices => {
    setGroupedImages(offices.map(o => ({...o, images: [], loading: true})));

    const results = await Promise.all(
      offices.map(async office => {
        try {
          const response = await HomeAllimageapi({office: office.value});
          if (response?.success && Array.isArray(response.data)) {
            return {...office, images: response.data, loading: false};
          }
          return {...office, images: [], loading: false};
        } catch (error) {
          console.error(`❌ Error fetching images for ${office.label}:`, error);
          return {...office, images: [], loading: false};
        }
      }),
    );

    setGroupedImages(results);
  }, []);

  const handleCircleFocusChange = async office => {
    setSelectedLocationId(office);

    if (office === CIRCLE_OFFICE_VALUE) {
      fetchGroupedImages(SUB_OFFICES);
    } else {
      const match = SUB_OFFICES.find(o => o.value === office);
      const label = match?.label || office;
      fetchGroupedImages([{label, value: office}]);
    }

    try {
      const barData = await CircleWiseBarChartApi({office});
      if (barData?.success && Array.isArray(barData.data)) {
        const chartDataObject = barData.data?.[0] || {};
        const fixedLabels = ['Building', 'CRF', 'Annuity', 'Nabard', 'Road'];
        const allEntries = Object.entries(chartDataObject).map(
          ([label, value]) => ({label, value: Number(value)}),
        );
        const fixedData = fixedLabels.map(
          label =>
            allEntries.find(item => item.label === label) || {label, value: 0},
        );
        const remainingData = allEntries.filter(
          item => !fixedLabels.includes(item.label),
        );
        const formatLabel = label =>
          label.length > 10 ? label.slice(0, 10) + '…' : label;
        const transformed = [...fixedData, ...remainingData].map(
          ({label, value}) => ({label: formatLabel(label), value}),
        );
        setBarChartData(transformed);
      } else {
        setBarChartData([]);
      }

      const pieData = await CirclePieChartCountApi({office});
      if (pieData?.success && Array.isArray(pieData.data)) {
        const filtered = pieData.data
          .filter(item => Number(item.Count) > 0)
          .map(item => ({label: item.Head, value: Number(item.Count)}));
        const formatLabel = label =>
          label.length > 10 ? label.slice(0, 10) + '…' : label;
        setPieChartData(
          filtered.map(({label, value}) => ({
            label: formatLabel(label),
            value,
          })),
        );
      } else {
        setPieChartData([]);
      }
    } catch (error) {
      console.error('Error in focus change:', error);
      setBarChartData([]);
      setPieChartData([]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <View style={styles.container}>
        <HeaderComponent />

        <ProfileComponent
          profileImage={userProfileImage ? {uri: userProfileImage} : null}
          userName={userName}
          onProfilePress={() => navigation.navigate('ProfileScreen')}
          onNotificationPress={() => navigation.navigate('NotificationScreen')}
        />

        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <CircularRotatingItems onFocusChange={handleCircleFocusChange} />

          {barChartData?.length > 0 && (
            <BarChartComponent data={barChartData} />
          )}

          {pieChartData?.length > 0 && (
            <PieChartComponent
              data={pieChartData}
              selectedLocationId={selectedLocationId}
            />
          )}

          {selectedLocationId !== null && groupedImages.length > 0 && (
            <View style={styles.imageSection}>
              {groupedImages.map(group => (
                <View key={group.value} style={styles.officeGroup}>
                  <View style={styles.officeHeadingRow}>
                    <Text style={styles.officeHeadingText}>{group.label}</Text>
                  </View>

                  {group.loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#007bff" />
                      <Text style={styles.loadingText}>Loading images...</Text>
                    </View>
                  ) : group.images.length === 0 ? (
                    <Text style={styles.noImagesText}>No images available</Text>
                  ) : (
                    <FlatList
                      data={group.images}
                      renderItem={({item, index}) => (
                        <ImageItem
                          item={item}
                          index={index}
                          onImagePress={idx => {
                            // ✅ Store full objects so footer gets all metadata
                            setViewerImages(group.images);
                            setCurrentIndex(idx);
                            setVisible(true);
                          }}
                        />
                      )}
                      keyExtractor={(_, i) => `${group.value}-${i}`}
                      numColumns={3}
                      scrollEnabled={false}
                      contentContainerStyle={styles.imageGridContent}
                    />
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* ✅ ImageViewing with full metadata footer */}
        <ImageViewing
          images={viewerImages.map(img => ({uri: getImageUri(img) || ''}))}
          imageIndex={currentIndex}
          visible={visible}
          onRequestClose={() => setVisible(false)}
          FooterComponent={({imageIndex}) => (
            <ImageFooter
              imageIndex={imageIndex}
              imagesCount={viewerImages.length}
              image={viewerImages[imageIndex]}
            />
          )}
        />

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.aiButtonContainer}>
          <LinearGradient
            colors={['#4A90E2', '#FFC0CB', '#FFFFFF', '#87CEFA']}
            start={{x: 0.1, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.aiButton}>
            <Text style={styles.aiButtonText}>A.I</Text>
          </LinearGradient>
        </TouchableOpacity>

        <AIModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
};

// ─── Main Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {flex: 1, backgroundColor: 'white'},
  scrollViewContent: {padding: 20, paddingBottom: 100, paddingTop: 0},
  aiButtonContainer: {position: 'absolute', bottom: 80, right: 20, zIndex: 10},
  aiButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  aiButtonText: {color: 'black', fontSize: 22, fontWeight: 'bold'},
  imageSection: {marginTop: 20},
  officeGroup: {marginBottom: 28},
  officeHeadingRow: {
    backgroundColor: '#0057A0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  officeHeadingText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 80,
  },
  loadingText: {marginTop: 8, color: '#555', fontSize: 12},
  noImagesText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 12,
    fontSize: 13,
  },
  imageGridContent: {alignItems: 'center'},
  imageContainer: {margin: 10, justifyContent: 'center', alignItems: 'center'},
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'orange',
  },
  imageErrorPlaceholder: {
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#ef5350',
  },
  imageErrorText: {color: '#ef5350', fontSize: 24, fontWeight: 'bold'},
  imageErrorType: {color: '#ef5350', fontSize: 10, fontWeight: '600', marginTop: 2},
  imageRetryText: {color: '#0057A0', fontSize: 8, marginTop: 4, textAlign: 'center'},
});

// ─── Footer Styles ────────────────────────────────────────────────────────────

const footerStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 30,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  counter: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 6,
  },
  typeBadge: {
    alignSelf: 'center',
    backgroundColor: '#0057A0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 3,
    marginBottom: 10,
  },
  typeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'flex-start',
  },
  label: {
    color: '#FFD700',     // gold label
    fontSize: 12,
    fontWeight: '700',
    width: 155,
  },
  value: {
    color: '#fff',
    fontSize: 12,
    flex: 1,
  },
});

export default SupreintendingEngienerScreen;