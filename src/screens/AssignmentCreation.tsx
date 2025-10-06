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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {pick} from '@react-native-documents/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {base_url} from '../utils/store';
import {postApi, putapi} from '../utils/api';
import {currentdate} from '../components/moment';
import moment from 'moment';
import Toast from 'react-native-toast-message';
import * as Keychain from 'react-native-keychain';

const CreateAssignment = ({navigation, route}) => {
  const isEditMode = route.params?.assignment ? true : false;
  const [assignment, setAssignment] = useState(
    isEditMode
      ? route.params.assignment
      : {
          publishDate: currentdate(),
          title: '',
          submissionDate: new Date(),
          attachmentUrls: [],
          batchId: '',
          details: '',
        },
  );

  const [submissionDate, setSubmitdate] = useState(new Date());
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [attachmentsToUpload, setAttachmentsToUpload] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [attachmentList, setAttachmentList] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [removedAttachments, setRemovedAttachments] = useState([]);

  useEffect(() => {
   
    const date = route?.params?.assignment?.submissionDate;

    if (date instanceof Date || typeof date === 'string') {
      const dateObject = new Date(date);
      if (!isNaN(dateObject.getTime())) {
        setSubmitdate(dateObject);
      } else {
       
      }
    }

    if (isEditMode && route?.params?.assignment?.attachmentUrls) {
      const mappedAttachments = route?.params?.assignment?.attachmentUrls.map(
        url => ({
          uri: url,
          name: url.split('/').pop(),
          size: 1.5,
          type: 'application/pdf',
          isExisting: true,
        }),
      );

      setAttachmentList(mappedAttachments);
      setExistingAttachments(mappedAttachments);
    }
  }, [route?.params?.assignment?.attachmentUrls, isEditMode]);

  const animateSuccess = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getDateObject = date => {
    if (!date) return new Date();
    return typeof date === 'string' ? new Date(date) : date;
  };

  const attachmentValidation = size => {
    
    const newErrors = {};
   
    if (size > 2 * 1024 * 1024) {
      newErrors.attachment = 'File size must be less than 2MB';
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!assignment.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!assignment.submissionDate) {
      newErrors.submissionDate = 'Submission date is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);

      const Batch_id = await AsyncStorage.getItem('batch_id');
      if (!Batch_id) {
        console.warn('Batch_id is not available!');
        setIsSaving(false);
        return;
      }

      await new Promise(resolve => {
        setAssignment(prev => ({
          ...prev,
          batchId: Batch_id,
        }));
        resolve();
      });

      let newAttachmentUrls = [];
      if (attachmentsToUpload.length > 0) {
        newAttachmentUrls = await Promise.all(
          attachmentsToUpload.map(attachment => uploadSingleFile(attachment)),
        );

        newAttachmentUrls = newAttachmentUrls.filter(url => url !== undefined);
      }

      let currentAttachmentUrls = [];
      if (isEditMode) {
        currentAttachmentUrls = existingAttachments
          .filter(attachment => !removedAttachments.includes(attachment.uri))
          .map(attachment => attachment.uri);
      }

      const updatedAssignment = {
        ...assignment,
        batchId: Batch_id,
        attachmentUrls: [...currentAttachmentUrls, ...newAttachmentUrls],
      };

      setAssignment(updatedAssignment);

      if (isEditMode) {
        await Assignment_Update(updatedAssignment);
      } else {
        await Assignment_Submit(updatedAssignment);
      }

      setIsSaving(false);

      setShowSuccessMessage(true);
      animateSuccess();
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
     

      setIsSaving(false);
    }
  };

  const handleAttachments = async () => {
    try {
      const result = await pick({
        allowMultiSelection: true,
        type: ['*/*'],
      });

      if (result && result.length > 0) {
     

        const newFiles = result
          .map(file => ({
            uri:
              Platform.OS === 'android'
                ? file.uri
                : file.uri.replace('file://', ''),
            type: file.type || 'application/pdf',
            name: file.name || 'file.pdf',
            size: file.size,
            isExisting: false,
          }))
          .filter(file => attachmentValidation(file.size));

        if (newFiles.length === 0) {
          return;
        }

        setAttachmentList(prev => [...prev, ...newFiles]);
        setAttachmentsToUpload(prev => [...prev, ...newFiles]);

        Toast.show({
          type: 'success',
          text1: 'Attachments Added',
          text2: `${newFiles.length} file(s) ready to upload`,
          visibilityTime: 2000,
        });
      }
    } catch (error) {
      
    }
  };

  const uploadMultipleFiles = async files => {
    const uploadedUrls = [];

    for (const file of files) {
      const uploadedUrl = await uploadSingleFile(file);
      if (uploadedUrl) {
        uploadedUrls.push(uploadedUrl);
      }
    }

    return uploadedUrls;
  };

  const uploadSingleFile = async fileData => {
    try {
     

        const credentials = await Keychain.getGenericPassword();
    const Token = credentials.password;

      const formData = new FormData();
      formData.append('file', fileData);

      const userId = await AsyncStorage.getItem('TeacherId');

      formData.append('userType', 'TEACHER');
      formData.append('userId', userId);
      formData.append('uploadType', 'assignments');

      const url = `${base_url}uploads`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

    

      const textResponse = await response.text();
    

      let responseData;
      try {
        responseData = JSON.parse(textResponse);
      } catch (error) {
      
        return undefined;
      }

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${responseData.message || 'Unknown error'}`,
        );
      }

     
      return responseData.url;
    } catch (error) {
     
      return undefined;
    }
  };

  const Assignment_Submit = async assignmentData => {
    try {
     
           const credentials = await Keychain.getGenericPassword();
    const Token = credentials.password;

      if (!Token) {
        throw new Error('Authentication token is missing.');
      }

      const uploadedUrls = await uploadMultipleFiles(attachmentsToUpload);

      const url = `assignments`;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Token}`,
      };

      const body = {
        ...assignmentData,
        attachmentUrls: uploadedUrls,
      };

      const fliteredData = Object.fromEntries(
        Object.entries(body).filter(
          ([_, value]) => value !== '' && value !== null && value !== undefined,
        ),
      );

   

      const onResponse = res => {
        setAssignment(res);
        Toast.show({
          type: 'success',
          text1: 'New Assignment',
          text2: 'Created Succecssfully',
        });
        navigation.goBack();
      };

      const onCatch = error => {
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: 'Assigment creation failed',
        });
    
      };

      postApi(url, headers, fliteredData, onResponse, onCatch, navigation);
   
    } catch (error) {
    
    }
  };

  const Assignment_Update = async assignmentData => {
    
         const credentials = await Keychain.getGenericPassword();
    const Token = credentials.password;

    const url = `assignments/${assignmentData.id}`;
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Token}`,
    };

    const payload = {
      publishDate: assignmentData.publishDate,
      title: assignmentData.title,
      submissionDate: assignmentData.submissionDate,
      attachmentUrls: assignmentData.attachmentUrls,
      batchId: assignmentData.batchId,
      details: assignmentData.details,
    };

    const onResponse = res => {
      setAssignment(res);
      Toast.show({
        type: 'success',
        text1: 'Assignment',
        text2: 'Updated Succecssfully',
      });
      navigation.navigate('Assignment');
    };

    const onCatch = res => {
   
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: 'Assigment update failed',
      });
   
    };

    putapi(url, headers, payload, onResponse, onCatch, navigation);
   
  };

  const handleRemoveAttachment = (index, item) => {
    if (item.isExisting) {
      setRemovedAttachments(prev => [...prev, item.uri]);
    } else {
      setAttachmentsToUpload(prev =>
        prev.filter(attachment => attachment.uri !== item.uri),
      );
    }

    setAttachmentList(prev => prev.filter((_, i) => i !== index));

    Toast.show({
      type: 'info',
      text1: 'Attachment Removed',
      text2: item.name,
      visibilityTime: 2000,
    });
  };

  const renderAttachmentItem = (item, index) => (
    <View style={styles.attachmentItem} key={index}>
      <MaterialIcons name="attachment" size={20} color="#6B7280" />
      <Text style={styles.attachmentName} numberOfLines={1}>
        {item.name}
      </Text>
      <TouchableOpacity
        onPress={() => handleRemoveAttachment(index, item)}
        style={styles.removeAttachment}>
        <MaterialIcons name="close" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#001d3d" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>
          {isEditMode ? 'Edit Assignment' : 'Create Assignment'}
        </Text>
        <View style={{width: 24}} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                value={assignment.title}
                onChangeText={text => {
                  setAssignment(prev => ({...prev, title: text}));
                  if (errors.title)
                    setErrors(prev => ({...prev, title: undefined}));
                }}
                placeholder="Enter assignment title"
                placeholderTextColor="#9CA3AF"
              />
              {errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Submission Date *</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateText}>
                  {submissionDate.toLocaleDateString()}
                </Text>
                <MaterialIcons
                  name="calendar-today"
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
              {errors.submissionDate && (
                <Text style={styles.errorText}>{errors.submissionDate}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={assignment.details}
                onChangeText={text =>
                  setAssignment(prev => ({...prev, details: text}))
                }
                placeholder="Enter assignment description"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Attachments</Text>
              <TouchableOpacity
                style={styles.attachmentButton}
                onPress={handleAttachments}>
                <MaterialIcons name="attach-file" size={24} color="#6B7280" />
                <Text style={styles.attachmentButtonText}>Add Attachments</Text>
              </TouchableOpacity>
              <View style={styles.attachmentsList}>
                {attachmentList.map((item, index) =>
                  renderAttachmentItem(item, index),
                )}
                {errors.attachment && (
                  <Text style={styles.errorText}>{errors.attachment}</Text>
                )}
              </View>
            </View>
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
              <Text style={styles.saveButtonText}>Save Assignment</Text>
            )}
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={getDateObject(assignment?.submissionDate || submissionDate)}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              const formattedDate = moment(selectedDate)
                .set({hour: 23, minute: 59, second: 59, millisecond: 999}) // local end of day
                .toDate(); // JS Date object (local)

              const finalDateUtc = moment(formattedDate)
                .utc()
                .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');

              if (selectedDate) {
                setAssignment(prev => ({
                  ...prev,
                  submissionDate: finalDateUtc,
                }));
                setSubmitdate(selectedDate);
            
              }
            }}
          />
        )}
      </KeyboardAvoidingView>
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
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  dateText: {
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  attachmentButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6B7280',
  },
  attachmentsList: {
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  attachmentName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
  },
  removeAttachment: {
    padding: 4,
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

export default CreateAssignment;
