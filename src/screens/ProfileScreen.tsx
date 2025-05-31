import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import React, {useEffect, useState, useRef} from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {fetch_batchs, logout} from '../utils/authslice';
import {useDispatch} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getapi, deleteapi} from '../utils/api';
import {getUserId} from '../utils/TokenDecoder';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';

const ConfirmationDialog = ({
  visible,
  onCancel,
  onConfirm,
  title,
  message,
  icon,
  confirmText,
  confirmColor,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible}>
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              opacity: opacityAnim,
              transform: [{scale: scaleAnim}],
            },
          ]}>
          <View
            style={[
              styles.modalIconContainer,
              {backgroundColor: `${confirmColor}20`},
            ]}>
            <MaterialIcons name={icon} size={40} color={confirmColor} />
          </View>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, {backgroundColor: confirmColor}]}
              onPress={onConfirm}>
              <Text style={styles.deleteButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const ProfileScreen = ({navigation, item}) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [deletingBatch, setDeletingBatch] = useState(null);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  const defaultTeacher = {
    id: '',
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    age: 0,
    addressLine1: '',
    addressCity: '',
    addressState: '',
    pinCode: '',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    profilePicUrl: '',
  };

  const [teacher, setTeacher] = useState(defaultTeacher);

  const dispatch = useDispatch();

  const showToast = (message, type = 'success') => {
    Toast.show({
      type: type,
      text1: type === 'success' ? 'Success' : 'Error',
      text2: message,
    });
  };

  const TeacherDetails = async () => {
    try {
      setLoading(true);

      const Token = await AsyncStorage.getItem('Token');
      if (!Token) {
        throw new Error('No token found, authentication required');
      }

      const Teacherid = await getUserId(Token);
      if (!Teacherid) {
        throw new Error('Failed to fetch Teacher ID');
      }

      const url = `teachers/${Teacherid}`;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Token}`,
      };

      const onResponse = res => {
        if (res) {
          setTeacher(prevTeacher => ({
            ...prevTeacher,
            ...res,
          }));
        }
        setLoading(false);
      };

      const onCatch = error => {
        console.error('API Error:', error);
        setLoading(false);
      };

      getapi(url, headers, onResponse, onCatch, navigation);

      const batchesUrl = `batches/teacher/${Teacherid}`;
      const batchesHeaders = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Token}`,
      };

      console.log('Batches fetching apiii');

      const onBatchesResponse = res => {
        if (res) {
          setBatches(res);
        }
      };

      const onBatchesCatch = error => {
        console.error('Batches API Error:', error);
      };

      getapi(
        batchesUrl,
        batchesHeaders,
        onBatchesResponse,
        onBatchesCatch,
        navigation,
      );
    } catch (error) {
      console.error('TeacherDetails Error:', error.message);
      setLoading(false);
    }
  };

  const handleDeleteBatch = batch => {
    setDeletingBatch(batch);
    setConfirmDialogVisible(true);
  };

  const confirmDeleteBatch = async () => {
    try {
      const Token = await AsyncStorage.getItem('Token');
      const url = `batches/${deletingBatch.id}`;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Token}`,
      };
      const onResponse = async res => {
        setBatches(prevBatches =>
          prevBatches.filter(batch => batch.id !== deletingBatch.id),
        );

        dispatch(fetch_batchs());
        dispatch({
          type: 'Clearbatches',
        });

        setConfirmDialogVisible(false);
        showToast(`${deletingBatch.name} deleted successfully`, 'success');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
      };

      const onCatch = res => {
        console.error('Delete Batch Error:', res);
        setConfirmDialogVisible(false);
        showToast('Failed to delete batch', 'error');
      };

      deleteapi(url, headers, onResponse, onCatch, navigation);
    } catch (error) {
      console.error('Delete Batch Error:', error);
      setConfirmDialogVisible(false);
      showToast('Failed to delete batch', 'error');
    }
  };

  const handleLogout = () => {
    setLogoutDialogVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutDialogVisible(false);
    navigation.reset({
      index: 0,
      routes: [{name: 'Login'}],
    });
    dispatch(logout());
    await AsyncStorage.removeItem('Token');
  };

  useEffect(() => {
    TeacherDetails();
  }, []);

  const InfoSection = ({icon, title, value}) => (
    <View style={styles.infoSection}>
      <View style={styles.infoIcon}>
        <MaterialIcons name={icon} size={20} color="#0F1F4B" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  const Section = ({title, children}) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="rgb(0,0,0)" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Profile</Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Update_Profile', {teacher, update: true})
          }>
          <MaterialIcons name="edit" size={24} color="#0F1F4B" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={
                !teacher.profilePicUrl
                  ? require('../resources/user.png')
                  : {uri: teacher.profilePicUrl}
              }
              style={styles.profileImage}
            />
          </View>
          <Text style={styles.profileName}>
            {teacher.firstName} {teacher.lastName}
          </Text>
          <Text style={styles.profileUsername}>@{teacher.userName}</Text>
        </View>

        <View
          style={{
            borderBottomWidth: 1,
            borderColor: '#E5E7EB',
            marginBottom: 20,
          }}></View>

        <Section title="Personal Information">
          <InfoSection icon="phone" title="Phone" value={teacher.phoneNumber} />
          <InfoSection icon="email" title="Email" value={teacher.email} />
          <InfoSection icon="person" title="Gender" value={teacher.gender} />
          <InfoSection icon="cake" title="Age" value={teacher.age.toString()} />
        </Section>

        <Section title="Address">
          <InfoSection
            icon="home"
            title="Street"
            value={teacher.addressLine1}
          />
          <InfoSection
            icon="location-city"
            title="City"
            value={teacher.addressCity}
          />
          <InfoSection icon="map" title="State" value={teacher.addressState} />
          <InfoSection
            icon="pin-drop"
            title="Pin Code"
            value={teacher.pinCode.toString()}
          />
        </Section>

        <Section title="Payment Information">
          <InfoSection
            icon="account-balance"
            title="Account Name"
            value={teacher.accountName}
          />
          <InfoSection
            icon="credit-card"
            title="Account Number"
            value={`XXXX XXXX ${teacher.accountNumber.slice(-4)}`}
          />
          <InfoSection
            icon="receipt"
            title="IFSC Code"
            value={teacher.ifscCode}
          />
          <InfoSection icon="payment" title="UPI ID" value={teacher.upiId} />
        </Section>

        <View style={styles.section}>
          <View style={styles.batchHeader}>
            <Text style={styles.sectionTitle}>My Batches</Text>
          </View>
          <View style={styles.batchList}>
            {batches.length > 0 ? (
              batches.map((batch, index) => (
                <View key={index} style={styles.batchCard}>
                  <LinearGradient
                    colors={['#f8f9ff', '#ffffff']}
                    style={styles.batchContent}>
                    <View style={styles.batchInfo}>
                      <Text style={styles.batchName}>{batch.name}</Text>
                      <Text style={styles.batchId}>{batch.subject}</Text>
                    </View>
                    <View style={styles.batchActions}>
                      <TouchableOpacity
                        style={styles.editBatchButton}
                        onPress={() =>
                          navigation.navigate('Batch_Create', {
                            batch,
                            update: true,
                          })
                        }>
                        <MaterialIcons name="edit" size={24} color="#0F1F4B" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBatchButton}
                        onPress={() => handleDeleteBatch(batch)}>
                        <MaterialIcons
                          name="delete"
                          size={24}
                          color="#DC2626"
                        />
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              ))
            ) : (
              <View style={{justifyContent: 'center', alignItems: 'center'}}>
                <Text
                  style={{fontSize: 15, fontWeight: '500', color: '#0F1F4B'}}>
                  No Batches Available
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmationDialog
        visible={confirmDialogVisible}
        onCancel={() => setConfirmDialogVisible(false)}
        onConfirm={confirmDeleteBatch}
        icon="delete-forever"
        title="Delete Batch"
        message={`Are you sure you want to delete ${deletingBatch?.name}? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="#EF4444"
      />

      <ConfirmationDialog
        visible={logoutDialogVisible}
        onCancel={() => setLogoutDialogVisible(false)}
        onConfirm={confirmLogout}
        icon="logout"
        title="Logout"
        message="Are you sure you want to logout from your account?"
        confirmText="Logout"
        confirmColor="#0F1F4B"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  appBar: {
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  appBarTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: 'rgb(15, 31, 75)',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0F1F4B',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F1F4B',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F1F4B',
    marginBottom: 16,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: 'rgb(105, 144, 252)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#0F1F4B',
    fontWeight: '500',
  },
  batchList: {
    gap: 12,
  },
  batchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 15,
    overflow: 'hidden',
    shadowColor: '#0F1F4B',
  },
  batchContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  batchInfo: {
    flex: 1,
  },
  batchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F1F4B',
    marginBottom: 4,
  },
  batchId: {
    fontSize: 12,
    color: '#666',
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addBatchButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  batchActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editBatchButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 12,
  },
  deleteBatchButton: {
    padding: 8,
    borderRadius: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#DC2626',
    marginHorizontal: 20,
    marginVertical: 30,
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F1F4B',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    borderRadius: 12,
    padding: 12,
    minWidth: '45%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
