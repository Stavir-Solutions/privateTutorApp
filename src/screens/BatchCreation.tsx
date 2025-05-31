import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {getUserId} from '../utils/TokenDecoder';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {postApi, putapi} from '../utils/api';
import {useRoute} from '@react-navigation/core';
import {useDispatch} from 'react-redux';
import {fetch_batchs, setBatchCreated} from '../utils/authslice';

const BatchCreation = ({navigation, route}) => {
  const isEditMode = route.params?.update ? true : false;
  const [batch, setBatch] = useState(
    isEditMode
      ? route?.params?.batch
      : {
          name: '',
          course: '',
          subject: '',
          description: '',
          paymentFrequency: '',
          paymentAmount: '',
          paymentDayOfMonth: '',
        },
  );
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);

  const paymentFrequencies = ['Monthly', 'Onetime'];
  const dispatch = useDispatch();

  const validateForm = () => {
    const newErrors = {};

    if (!batch.name.trim()) newErrors.name = 'Batch name is required';
    if (!batch.course.trim()) newErrors.course = 'Course is required';
    if (!batch.subject.trim()) newErrors.subject = 'Subject is required';
    if (!batch.paymentFrequency)
      newErrors.paymentFrequency = 'Payment frequency is required';
    if (!batch.paymentAmount || isNaN(batch.paymentAmount)) {
      newErrors.paymentAmount = 'Valid payment amount is required';
    }

    if (
      batch.paymentFrequency === 'Monthly' &&
      (!batch.paymentDayOfMonth ||
        isNaN(batch.paymentDayOfMonth) ||
        batch.paymentDayOfMonth < 1 ||
        batch.paymentDayOfMonth > 31)
    ) {
      newErrors.paymentDayOfMonth = 'Valid day of month (1-31) is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    isEditMode ? Batch_update() : Batch_Creation();

    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
  };

  const handleSelectFrequency = frequency => {
    setBatch(prev => ({...prev, paymentFrequency: frequency}));
    if (errors.paymentFrequency)
      setErrors(prev => ({...prev, paymentFrequency: undefined}));
    setShowFrequencyDropdown(false);
  };

  const Batch_Creation = async () => {
    try {
      const Token = await AsyncStorage.getItem('Token');
      if (!Token) {
        throw new Error('No token found, authentication required');
      }

      const Teacherid = await getUserId(Token);
      if (!Teacherid) {
        throw new Error('Failed to fetch Teacher ID');
      }

      const url = 'batches';
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Token}`,
      };

      const body = {
        ...batch,
        teacherId: Teacherid,
      };

      const fliteredData = Object.fromEntries(
        Object.entries(body).filter(
          ([_, value]) => value !== '' && value !== null && value !== undefined,
        ),
      );

      console.log(fliteredData);

      const onResponse = async res => {
        Toast.show({
          type: 'success',
          text1: 'Batch Created',
          text2: 'Batch has been successfully created!',
          position: 'top',
          visibilityTime: 3000,
          autoHide: true,
        });

        setTimeout(() => {
          handleCreateBatch();
        }, 2000);
      };

      const onCatch = error => {
        console.error('Batch Creation Failed:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.error,
          position: 'top',
        });
      };

      await postApi(
        url,
        headers,
        fliteredData,
        onResponse,
        onCatch,
        navigation,
      );
    } catch (error) {
      console.error('Batch_Creation Error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create batch!',
        position: 'top',
      });
    }
  };

  const Batch_update = async () => {
    try {
      const Token = await AsyncStorage.getItem('Token');
      if (!Token) {
        throw new Error('No token found, authentication required');
      }

      const url = `batches/${batch.id}`;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Token}`,
      };

      const {teacherId, id, ...filteredBatch} = batch;

      const onResponse = async res => {
        Toast.show({
          type: 'success',
          text1: 'Batch Update',
          text2: 'Batch has been successfully updated!',
          position: 'top',
          visibilityTime: 3000,
          autoHide: true,
        });

        setTimeout(() => {
          handleCreateBatch();
        }, 3000);

        navigation.goBack();
      };

      const onCatch = error => {
        console.error('Batch Updation Failed:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to create batch!',
          position: 'top',
        });
      };

      await putapi(
        url,
        headers,
        filteredBatch,
        onResponse,
        onCatch,
        navigation,
      );
      console.log(filteredBatch);
    } catch (error) {
      console.error('Batch_Updation Error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create batch!',
      });
    }
  };

  const handleCreateBatch = async () => {
    dispatch(setBatchCreated(true));
    await dispatch(fetch_batchs());

    navigation.goBack();
  };

  const inputField = (
    field,
    label,
    placeholder,
    keyboardType = 'default',
    multiline = false,
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label} *</Text>
      <TextInput
        style={[
          styles.input,
          errors[field] && styles.inputError,
          multiline && styles.textArea,
        ]}
        value={batch[field]}
        onChangeText={text => {
          setBatch(prev => ({...prev, [field]: text}));
          if (errors[field]) setErrors(prev => ({...prev, [field]: undefined}));
        }}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#001d3d" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Create New Batch</Text>
        <View style={{width: 24}} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.formContainer}>
            {inputField('name', 'Batch Name', 'Enter batch name')}
            {inputField('course', 'Course', 'Enter course name')}
            {inputField('subject', 'Subject', 'Enter subject name')}
            {inputField(
              'description',
              'Description',
              'Enter batch description',
              'default',
              true,
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Payment Settings</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment Frequency *</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.dropdownButton,
                  errors.paymentFrequency && styles.inputError,
                ]}
                onPress={() => setShowFrequencyDropdown(true)}>
                <Text
                  style={
                    batch.paymentFrequency
                      ? styles.dropdownSelectedText
                      : styles.dropdownPlaceholder
                  }>
                  {batch.paymentFrequency || 'Select payment frequency'}
                </Text>
                <MaterialIcons
                  name="arrow-drop-down"
                  size={24}
                  color="#6B7280"
                />
              </TouchableOpacity>
              {errors.paymentFrequency && (
                <Text style={styles.errorText}>{errors.paymentFrequency}</Text>
              )}
            </View>

            {inputField(
              'paymentAmount',
              'Payment Amount',
              'Enter amount',
              'decimal-pad',
            )}

            {batch.paymentFrequency === 'Monthly' &&
              inputField(
                'paymentDayOfMonth',
                'Payment Day of Month',
                'Enter day (1-31)',
                'numeric',
              )}
          </View>
        </ScrollView>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditMode ? 'Update Batch' : 'Create Batch'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showFrequencyDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFrequencyDropdown(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFrequencyDropdown(false)}>
          <View style={styles.dropdownModal}>
            {paymentFrequencies.map(frequency => (
              <TouchableOpacity
                key={frequency}
                style={styles.dropdownItem}
                onPress={() => handleSelectFrequency(frequency)}>
                <Text style={styles.dropdownItemText}>{frequency}</Text>
                {batch.paymentFrequency === frequency && (
                  <MaterialIcons name="check" size={20} color="#001d3d" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  appBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#001d3d',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#001d3d',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
  },
  dropdownPlaceholder: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  dropdownSelectedText: {
    color: '#1F2937',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#001d3d',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#001d3d',
    shadowColor: '#001d3d',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
  },
  successText: {
    marginLeft: 8,
    color: '#059669',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BatchCreation;
