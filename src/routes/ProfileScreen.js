import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {launchImageLibrary} from 'react-native-image-picker';
import {uploadToCloudinary} from '../utils/cloudinary';
import {
  UpdateProfileImageApi,
  GetUserProfileApi,
  extractProfileImage,
} from '../Api/ProfileAPI';

const ProfileScreen = ({navigation}) => {
  const [profileImage, setProfileImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [userInfo, setUserInfo] = useState({
    userId: '',
    userName: '',
    roleId: '',
    office: '',
    mobileNo: '',
    email: '',
  });

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userId   = await AsyncStorage.getItem('USER_ID');
        const userName = await AsyncStorage.getItem('USER_NAME');
        const roleId   = await AsyncStorage.getItem('ROLE_ID');
        const office   = await AsyncStorage.getItem('LOCATION_ID');
        const mobileNo = await AsyncStorage.getItem('USER_MOBILE');
        const email    = await AsyncStorage.getItem('USER_EMAIL');

        setUserInfo({
          userId:   userId   || '',
          userName: userName || '',
          roleId:   roleId   || '',
          office:   office   || '',
          mobileNo: mobileNo || '',
          email:    email    || '',
        });

        // Step 1 — show cached image instantly
        const cachedImage = await AsyncStorage.getItem('PROFILE_IMAGE');
        if (cachedImage) {
          setProfileImage(cachedImage);
        }

        // Step 2 — fetch latest from server using actual LOCATION_ID
        if (userId && office) {
          const profileResult = await GetUserProfileApi({
            userId: userId,
            office: office,
          });

          // ✅ Uses helper that reads the correct `Image` key
          const serverImage = extractProfileImage(profileResult);

          if (serverImage) {
            setProfileImage(serverImage);
            await AsyncStorage.setItem('PROFILE_IMAGE', serverImage);
          }
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserDetails();
  }, []);

  const handlePickImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: true,
      selectionLimit: 1,
    };

    launchImageLibrary(options, async response => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to open gallery');
        return;
      }

      const asset = response.assets?.[0];
      if (!asset || !asset.base64) {
        Alert.alert('Error', 'Could not read image. Please try again.');
        return;
      }

      try {
        setUploading(true);
        const contentType   = asset.type || 'image/jpeg';
        const cloudinaryUrl = await uploadToCloudinary(asset.base64, contentType);

        const result = await UpdateProfileImageApi({
          userId:   userInfo.userId,
          office:   userInfo.office,
          imageURL: cloudinaryUrl,
        });

        setProfileImage(cloudinaryUrl);
        await AsyncStorage.setItem('PROFILE_IMAGE', cloudinaryUrl);

        if (result) {
          Alert.alert('Success', 'Profile photo updated successfully!');
        } else {
          Alert.alert('Warning', 'Image uploaded but failed to save on server.');
        }
      } catch (error) {
        console.error('Profile image upload error:', error);
        Alert.alert('Error', 'Failed to upload image. Please try again.');
      } finally {
        setUploading(false);
      }
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1}}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="black" />

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Icon name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.profileContainer}>
          {loadingProfile ? (
            <View style={styles.profileImagePlaceholder}>
              <ActivityIndicator size="large" color="#999" />
            </View>
          ) : (
            <Image
              source={
                profileImage
                  ? {uri: profileImage}
                  : {
                      uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        userInfo.userName || 'User',
                      )}&background=cccccc&color=333333&size=120`,
                    }
              }
              style={styles.profileImage}
            />
          )}

          <TouchableOpacity
            style={styles.cameraIcon}
            onPress={handlePickImage}
            disabled={uploading || loadingProfile}>
            {uploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Icon name="camera-alt" size={18} color="white" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>User ID</Text>
          <TextInput style={styles.input} value={userInfo.userId} editable={false} />

          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={userInfo.userName} editable={false} />

          <Text style={styles.label}>Designation</Text>
          <TextInput style={styles.input} value={userInfo.roleId} editable={false} />

          <Text style={styles.label}>Office</Text>
          <TextInput style={styles.input} value={userInfo.office} editable={false} />

          <Text style={styles.label}>Mobile No</Text>
          <TextInput
            style={styles.input}
            value={userInfo.mobileNo}
            editable={false}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={userInfo.email}
            editable={false}
            keyboardType="email-address"
          />

          <TouchableOpacity style={styles.updateButton}>
            {/* <Text style={styles.updateButtonText}>Update</Text> */}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: 'black'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: 'black',
  },
  backButton: {padding: 5},
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 15,
  },
  profileContainer: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 25,
    right: 130,
    backgroundColor: 'black',
    borderRadius: 15,
    padding: 5,
  },
  scrollContainer: {padding: 20, backgroundColor: '#f5f5f5'},
  label: {fontSize: 16, fontWeight: '600', marginBottom: 5, color: '#333'},
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    color: 'black',
  },
  updateButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  updateButtonText: {color: 'white', fontSize: 16, fontWeight: 'bold'},
});

export default ProfileScreen;