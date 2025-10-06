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
import {currentdate} from '../components/moment';
import {base_url} from '../utils/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {postApi, putapi} from '../utils/api';
import moment from 'moment';
import Toast from 'react-native-toast-message';
import * as Keychain from 'react-native-keychain';

const NoteCreateScreen = ({navigation, route}) => {
  const isEditMode = route.params?.note ? true : false;
  const [note, setNote] = useState(
    isEditMode
      ? route.params.note
      : {
          Title: '',
          publishDate: currentdate(),
          content: '',
          listUrls: [],
          batchId: '',
        },
  );

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [attachmentList, setAttachmentList] = useState([]);
  const [attachmentsToUpload, setAttachmentsToUpload] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [removedAttachments, setRemovedAttachments] = useState([]);

  useEffect(() => {
    if (
      isEditMode &&
      route?.params?.note?.listUrls &&
      route.params.note.listUrls.length > 0
    ) {
      const mappedAttachments = route.params.note.listUrls.map(url => ({
        uri: url,
        name: url.split('/').pop(),
        size: 1.5,
        type: 'application/pdf',
        isExisting: true,
      }));

      setAttachmentList(mappedAttachments);
      setExistingAttachments(mappedAttachments);
    }
  }, [route?.params?.note?.listUrls, isEditMode]);

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

  const attachmentValidation = size => {
    const newErrors = {};
    if (size > 2 * 1024 * 1024) {
      newErrors.attachment = 'File size must be less than 2MB';
      setErrors(newErrors);

      Toast.show({
        type: 'error',
        text1: 'Invalid File',
        text2: 'File size must be less than 2MB',
      });

      return false;
    }
    return true;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!note.Title.trim()) {
      newErrors.title = 'Title is required';
    }
    // if (!note.content.trim()) {
    //   newErrors.content = 'Description is required';
    // }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      let errorMessage = '';
      // if (newErrors.title && newErrors.content) {
      //   errorMessage = 'Title and Description are required';
      // }
      if (newErrors.title) {
        errorMessage = 'Title is required';
      }
      // else if (newErrors.content) {
      //   errorMessage = 'Description is required';
      // }
      else {
        errorMessage = 'Please check the form fields';
      }

      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 3000,
      });
      return false;
    }

    return true;
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

        Toast.show({
          type: 'error',
          text1: 'Missing Information',
          text2: 'Batch ID is not available',
        });

        return;
      }

      await new Promise(resolve => {
        setNote(prev => ({
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

        const failedUploads =
          attachmentsToUpload.length - newAttachmentUrls.length;
        if (failedUploads > 0) {
          Toast.show({
            type: 'info',
            text1: 'Attachment Issue',
            text2: `${failedUploads} attachment(s) failed to upload`,
          });
        }
      }

      let currentAttachmentUrls = [];
      if (isEditMode) {
        currentAttachmentUrls = existingAttachments
          .filter(attachment => !removedAttachments.includes(attachment.uri))
          .map(attachment => attachment.uri);
      }

      const updatedNote = {
        ...note,
        batchId: Batch_id,
        listUrls: [...currentAttachmentUrls, ...newAttachmentUrls],
      };

      setNote(updatedNote);

      if (isEditMode) {
        await Note_Update(updatedNote);
      } else {
        await Note_Submit(updatedNote);
      }

      setIsSaving(false);
      setShowSuccessMessage(true);
      animateSuccess();
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error during save:', error.message);
      setIsSaving(false);

      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: error.message || 'An unexpected error occurred',
      });
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
      console.error('Document Picker Error:', error);

      Toast.show({
        type: 'error',
        text1: 'Attachment Error',
        text2: 'Failed to select documents',
      });
    }
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
      formData.append('uploadType', 'notes');

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
        console.error('Error parsing JSON response:', error);
        return undefined;
      }

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${responseData.message || 'Unknown error'}`,
        );
      }

   
      return responseData.url;
    } catch (error) {
      console.error('Error during file upload:', error.message);
      return undefined;
    }
  };

  const Note_Submit = async noteData => {
        const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;
    const url = `notes`;
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Token}`,
    };

    const body = noteData;

    const filteredData = Object.fromEntries(
      Object.entries(body).filter(
        ([_, value]) => value !== '' && value !== null && value !== undefined,
      ),
    );

    const onResponse = res => {
      setNote(res);
      Toast.show({
        type: 'success',
        text1: 'New Note',
        text2: 'Created Successfully',
        position: 'top',
        visibilityTime: 3000,
      });
      navigation.goBack();
    };

    const onCatch = res => {
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: 'Note creation failed',
        position: 'top',
        visibilityTime: 3000,
      });
 
    };

    postApi(url, headers, filteredData, onResponse, onCatch, navigation);
  };

  const Note_Update = async noteData => {
        const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;
    const url = `notes/${noteData.id}`;
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Token}`,
    };

    const payload = {
      Title: noteData.Title,
      publishDate: noteData.publishDate,
      content: noteData.content,
      listUrls: noteData.listUrls,
      batchId: noteData.batchId,
    };

    const onResponse = res => {
      setNote(res);
      Toast.show({
        type: 'success',
        text1: 'Note',
        text2: 'Updated Successfully',
        position: 'top',
        visibilityTime: 3000,
      });
      navigation.navigate('Notes');
    };

    const onCatch = res => {
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: 'Note update failed',
        position: 'top',
        visibilityTime: 3000,
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
          {isEditMode ? 'Edit Note' : 'Create Note'}
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
                value={note.Title}
                onChangeText={text => {
                  setNote(prev => ({...prev, Title: text}));
                  if (errors.title) {
                    setErrors(prev => ({...prev, title: undefined}));
                  }
                }}
                placeholder="Enter note title"
                placeholderTextColor="#9CA3AF"
              />
              {errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  errors.content && styles.inputError,
                ]}
                value={note.content}
                onChangeText={text => {
                  setNote(prev => ({...prev, content: text}));
                  if (errors.content) {
                    setErrors(prev => ({...prev, content: undefined}));
                  }
                }}
                placeholder="Enter note description"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {errors.content && (
                <Text style={styles.errorText}>{errors.content}</Text>
              )}
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
              <Text style={styles.saveButtonText}>Save Note</Text>
            )}
          </TouchableOpacity>
        </View>
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
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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

export default NoteCreateScreen;
