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
  KeyboardAvoidingView,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getApi, patchApi, postApi, putapi} from '../utils/api';
import {pickAndUploadImage} from '../components/FileUploadService';
import Feather from 'react-native-vector-icons/Feather';
import Toast from 'react-native-toast-message';
import {base_url} from '../utils/store';
import * as Keychain from 'react-native-keychain';

const StudentCreation = ({navigation, route}) => {
  const isEditMode = route.params?.student ? true : false;

  const [student, setStudent] = useState(
    isEditMode
      ? route?.params?.student
      : {
          id: '',
          firstName: '',
          lastName: '',
          age: '',
          addressLine1: '',
          addressCity: '',
          addressState: '',
          pinCode: '',
          gender: '',
          parent1Name: '',
          parent1Phone: '',
          parent1Email: '',
          parent2Name: '',
          parent2Phone: '',
          parent2Email: '',
          userName: '',
          password: '',
          confirmPassword: '',
          email: '',
          profilePicUrl: '',
        },
  );

  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [update, setUpdate] = useState(false);
  const [errors, setErrors] = useState({});
  const [jsonError, setJsonError] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(false);

  const validateEmail = email => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = phone => {
    return /^\d{10}$/.test(phone);
  };

  const checkUsernameAvailability = async username => {
    if (!username.trim()) {
      setUsernameChecked(false);
      return false;
    }

    setIsCheckingUsername(true);
    setUsernameChecked(false);

    try {
          const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;
      const url = `${base_url}/students/userName/${username}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Token}`,
        },
      });

      if (response.status === 200) {
        Toast.show({
          type: 'error',
          text1: 'Username Error',
          text2: 'Username is already taken',
        });
        setErrors(prev => ({
          ...prev,
          userName: 'Username is already taken',
        }));
        setIsCheckingUsername(false);
        setUsernameChecked(true);
        setUsernameAvailable(false);
        return false;
      } else if (response.status === 404) {
        setErrors(prev => ({...prev, userName: ''}));
        setIsCheckingUsername(false);
        setUsernameChecked(true);
        setUsernameAvailable(true);
        return true;
      } else {
       
        Toast.show({
          type: 'error',
          text1: 'Username Error',
          text2: 'Could not verify username availability',
        });
        setErrors(prev => ({
          ...prev,
          userName: 'Could not verify username availability',
        }));
        setIsCheckingUsername(false);
        setUsernameChecked(false);
        return false;
      }
    } catch (error) {
     
      Toast.show({
        type: 'error',
        text1: 'Username Error',
        text2: 'Could not verify username availability',
      });
      setErrors(prev => ({
        ...prev,
        userName: 'Could not verify username availability',
      }));
      setIsCheckingUsername(false);
      setUsernameChecked(false);
      return false;
    }
  };

  const handleUsernameChange = text => {
    setStudent(prev => ({...prev, userName: text}));

    setErrors(prev => ({...prev, userName: ''}));
    setUsernameChecked(false);
  };

  const handleUsernameBlur = () => {
    if (student.userName.trim() && !isEditMode) {
      checkUsernameAvailability(student.userName);
    }
  };

  const validateForm = async () => {
    let isValid = true;
    const newErrors = {...errors};

    if (!student.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'First name is required',
      });
      isValid = false;
    }

    if (!student.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Last name is required',
      });
      isValid = false;
    }

    if (!isEditMode) {
      if (!student.email) {
        newErrors.email = 'Email is required';
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Email is required',
        });
        isValid = false;
      } else if (!validateEmail(student.email)) {
        newErrors.email = 'Valid email required';
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Valid email address is required',
        });
        isValid = false;
      }
    }

    if (!student.parent1Name) {
      newErrors.parent1Name = 'Primary parent name is required';
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Primary parent name is required',
      });
      isValid = false;
    }

    if (!student.parent1Phone) {
      newErrors.parent1Phone = 'Primary parent phone is required';
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Primary parent phone is required',
      });
      isValid = false;
    } else if (!validatePhone(student.parent1Phone)) {
      newErrors.parent1Phone = 'Valid 10-digit phone required';
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Parent phone must be 10 digits',
      });
      isValid = false;
    }

    if (!student.parent1Email) {
      newErrors.parent1Email = 'Primary parent email is required';
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Primary parent email is required',
      });
      isValid = false;
    } else if (!validateEmail(student.parent1Email)) {
      newErrors.parent1Email = 'Valid email required';
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Valid parent email address is required',
      });
      isValid = false;
    }

    if (!student.userName.trim()) {
      newErrors.userName = 'Username is required';
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Username is required',
      });
      isValid = false;
    } else if (!isEditMode) {
      const isUsernameAvailable = await checkUsernameAvailability(
        student.userName,
      );
      if (!isUsernameAvailable) {
        isValid = false;
      }
    }

    if (!isEditMode) {
      if (!student.password) {
        newErrors.password = 'Password is required';
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Password is required',
        });
        isValid = false;
      } else if (student.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Password must be at least 6 characters',
        });
        isValid = false;
      }

      if (student.password !== student.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Passwords do not match',
        });
        isValid = false;
      }
    }

    if (student.age && isNaN(student.age)) {
      newErrors.age = 'Age must be a number';
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Age must be a number',
      });
      isValid = false;
    }

    if (student.pinCode && !/^\d{6}$/.test(student.pinCode)) {
      newErrors.pinCode = 'Valid 6-digit pincode required';
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Pin code must be 6 digits',
      });
      isValid = false;
    }

    if (student.parent2Phone && !validatePhone(student.parent2Phone)) {
      newErrors.parent2Phone = 'Valid 10-digit phone required';
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Secondary parent phone must be 10 digits',
      });
      isValid = false;
    }

    if (student.parent2Email && !validateEmail(student.parent2Email)) {
      newErrors.parent2Email = 'Valid email required';
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Valid secondary parent email is required',
      });
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'email':
        if (value && !validateEmail(value)) {
          Toast.show({
            type: 'error',
            text1: 'Validation Error',
            text2: 'Please enter a valid email address',
          });
          return false;
        }
        return true;
      case 'parent1Email':
      case 'parent2Email':
        if (value && !validateEmail(value)) {
          Toast.show({
            type: 'error',
            text1: 'Validation Error',
            text2: 'Please enter a valid email address',
          });
          return false;
        }
        return true;
      case 'parent1Phone':
      case 'parent2Phone':
        if (value && !validatePhone(value)) {
          Toast.show({
            type: 'error',
            text1: 'Validation Error',
            text2: 'Phone number must be 10 digits',
          });
          return false;
        }
        return true;
      case 'age':
        if (value && isNaN(value)) {
          Toast.show({
            type: 'error',
            text1: 'Validation Error',
            text2: 'Age must be a number',
          });
          return false;
        }
        return true;
      case 'pinCode':
        if (value && !/^\d{6}$/.test(value)) {
          Toast.show({
            type: 'error',
            text1: 'Validation Error',
            text2: 'Pin code must be 6 digits',
          });
          return false;
        }
        return true;
      case 'password':
        if (value && value.length < 6) {
          Toast.show({
            type: 'error',
            text1: 'Validation Error',
            text2: 'Password must be at least 6 characters',
          });
          return false;
        }
        return true;
      case 'confirmPassword':
        if (value && value !== student.password) {
          Toast.show({
            type: 'error',
            text1: 'Validation Error',
            text2: 'Passwords do not match',
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleImagePicker = async () => {
    try {
      setIsUploading(true);

      const result = await pickAndUploadImage({}, 'profile');

      if (result.success) {
        setProfileImage(result.uri);

        setProfileImageUrl(result.url);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile picture uploaded successfully',
        });
      } else {
        if (result.message !== 'User cancelled image selection') {
          Toast.show({
            type: 'error',
            text1: 'Image Upload Error',
            text2: result.message || 'Failed to upload image',
          });
        }
      }
    } catch (error) {
   
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An unexpected error occurred while uploading image',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const updatestudent = async () => {
    if (!(await validateForm())) return;

    setIsSaving(true);

    try {
      const rawPayload = {
        firstName: student.firstName,
        lastName: student.lastName,
        age: student.age ? parseInt(student.age) : null,
        userName: student.userName,
        password: student.password,
        // email: student.email,
        addressLine1: student.addressLine1 || null,
        addressCity: student.addressCity || null,
        addressState: student.addressState || null,
        pinCode: student.pinCode ? parseInt(student.pinCode) : null,
        profilePicUrl: profileImageUrl || null,
        gender: student.gender || null,
        parent1Name: student.parent1Name,
        parent1Phone: student.parent1Phone,
        parent1Email: student.parent1Email,
        parent2Name: student.parent2Name || null,
        parent2Phone: student.parent2Phone || null,
        parent2Email: student.parent2Email || null,
      };

      const payload = Object.fromEntries(
        Object.entries(rawPayload).filter(
          ([_, value]) => value !== '' && value !== null && value !== undefined,
        ),
      );

          const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;

      const url = `students/${student.id}`;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Token}`,
      };

      const onResponse = res => {
     
        Toast.show({
          type: 'success',
          text1: 'Student',
          text2: 'Student updated successfully',
        });
        navigation.goBack();
      };

      const onCatch = err => {
        setJsonError(err?.error || 'Something went wrong');
     
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to update student. Please try again.',
        });
      };

      putapi(url, headers, payload, onResponse, onCatch, navigation);
    } catch (error) {
    
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update student. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!(await validateForm())) return;

    setIsSaving(true);

    try {
      const rawPayload = {
        firstName: student.firstName,
        lastName: student.lastName,
        age: student.age ? parseInt(student.age) : null,
        userName: student.userName,
        password: student.password,
        email: student.email,
        addressLine1: student.addressLine1 || null,
        addressCity: student.addressCity || null,
        addressState: student.addressState || null,
        pinCode: student.pinCode ? parseInt(student.pinCode) : null,
        profilePicUrl: profileImageUrl || null,
        gender: student.gender || null,
        parent1Name: student.parent1Name,
        parent1Phone: student.parent1Phone,
        parent1Email: student.parent1Email,
        parent2Name: student.parent2Name || null,
        parent2Phone: student.parent2Phone || null,
        parent2Email: student.parent2Email || null,
      };

      const payload = Object.fromEntries(
        Object.entries(rawPayload).filter(
          ([_, value]) => value !== '' && value !== null && value !== undefined,
        ),
      );

          const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;

      const url = 'students';
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Token}`,
      };

      const onResponse = res => {
        addToBatch(res.id);
        if (res.ok) {
      
        }
        navigation.goBack();
      };

      const onCatch = err => {
        setJsonError(err?.error || 'Something went wrong');
     
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to create student. Please try again.',
        });
      };

      postApi(url, headers, payload, onResponse, onCatch, navigation);
    } catch (error) {
    
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create student. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    setProfileImage(route.params?.student?.profilePicUrl),
      setProfileImageUrl(route.params?.student?.profilePicUrl);
  }, [route.params?.student?.profilePicUrl]);

  useEffect(() => {
    setUpdate(route?.params?.update);
  }, [route?.params?.update]);

  const addToBatch = async student => {
    try {
          const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;
      const Batch_id = await AsyncStorage.getItem('batch_id');

      const url = `/batches/${Batch_id}/student/${student}`;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Token}`,
      };

      const onResponse = res => {
      
        Toast.show({
          type: 'success',
          text1: 'New Student',
          text2: 'Student added successfully',
        });
      };

      const onCatch = error => {
     
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to add student to batch. Please try again.',
        });
      };

      patchApi(url, headers, null, onResponse, onCatch, navigation);
    } catch (error) {
    
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add student to batch. Please try again.',
      });
    }
  };

  const renderError = error => {
    if (!error) return null;
    return <Text style={styles.errorText1}>{jsonError}</Text>;
  };

  const renderUsernameIndicator = () => {
    if (isCheckingUsername) {
      return (
        <ActivityIndicator
          size="small"
          color="#1D49A7"
          style={styles.usernameCheckIndicator}
        />
      );
    } else if (usernameChecked && !isEditMode) {
      if (usernameAvailable) {
        return (
          <Feather
            name="check-circle"
            size={20}
            color="#28a745"
            style={styles.usernameStatusIcon}
          />
        );
      } else {
        return (
          <Feather
            name="x-circle"
            size={20}
            color="#dc3545"
            style={styles.usernameStatusIcon}
          />
        );
      }
    }
    return null;
  };

  const renderInput = (
    field,
    label,
    placeholder,
    keyboardType = 'default',
    isSecure = false,
    required = false,
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const isReadOnly = isEditMode && field === 'email';

    const isRequired =
      required ||
      field === 'email' ||
      field === 'parent1Name' ||
      field === 'parent1Phone' ||
      field === 'parent1Email';

    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          {label} {isRequired && '*'}
          {isReadOnly && ' (cannot be changed)'}
        </Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, errors[field] && styles.inputError]}
            value={
              field === 'age' ? student[field]?.toString() : student[field]
            }
            onChangeText={text => {
              if (isReadOnly) return;

              if (field === 'userName') {
                handleUsernameChange(text);
              } else {
                setStudent(prev => ({...prev, [field]: text}));
                if (errors[field])
                  setErrors(prev => ({...prev, [field]: undefined}));
              }
            }}
            onBlur={() => {
              if (isReadOnly) return;

              if (field === 'userName') {
                handleUsernameBlur();
              } else {
                validateField(field, student[field]);
              }
            }}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            keyboardType={keyboardType}
            secureTextEntry={isSecure && !showPassword}
            editable={!isReadOnly}
          />
          {isSecure && (
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color="#001d3d"
              />
            </TouchableOpacity>
          )}
          {field === 'userName' && renderUsernameIndicator()}
        </View>
        {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
        {field === 'userName' &&
          usernameChecked &&
          usernameAvailable &&
          !isEditMode && (
            <Text style={styles.availableText}>Username available</Text>
          )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#001d3d" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>
          {isEditMode ? 'Edit Student' : 'Add New Student'}
        </Text>
        <View style={{width: 24}} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.formContainer}>
            <View style={styles.profilePicContainer}>
              <TouchableOpacity
                onPress={handleImagePicker}
                style={styles.profilePicButton}
                disabled={isUploading}>
                {isUploading ? (
                  <ActivityIndicator size="large" color="#001d3d" />
                ) : profileImage ? (
                  <Image
                    source={{uri: profileImage}}
                    style={styles.profilePic}
                  />
                ) : (
                  <>
                    <MaterialIcons
                      name="add-a-photo"
                      size={28}
                      color="#6B7280"
                    />
                    <Text style={styles.profilePicText}>
                      Add Profile Picture
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {renderInput(
              'firstName',
              'First Name',
              'Enter first name',
              'default',
              false,
              true,
            )}
            {renderInput(
              'lastName',
              'Last Name',
              'Enter last name',
              'default',
              false,
              true,
            )}
            {renderInput('age', 'Age', 'Enter age', 'numeric')}
            {renderInput(
              'email',
              'Email',
              'Enter email address',
              'email-address',
              false,
              true,
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderContainer}>
                {['male', 'female', 'do not disclose'].map(gender => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderButton,
                      student.gender === gender && styles.genderButtonSelected,
                    ]}
                    onPress={() => setStudent(prev => ({...prev, gender}))}>
                    <Text
                      style={[
                        styles.genderButtonText,
                        student.gender === gender &&
                          styles.genderButtonTextSelected,
                      ]}>
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.gender && (
                <Text style={styles.errorText}>{errors.gender}</Text>
              )}
            </View>

            {renderInput('addressLine1', 'Address Line 1', 'Enter address')}
            {renderInput('addressCity', 'City', 'Enter city')}
            {renderInput('addressState', 'State', 'Enter state')}
            {renderInput(
              'pinCode',
              'Pin Code',
              'Enter 6-digit pin code',
              'numeric',
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Primary Parent/Guardian</Text>
            </View>
            {renderInput(
              'parent1Name',
              'Name',
              'Enter parent name',
              'default',
              false,
              true,
            )}
            {renderInput(
              'parent1Phone',
              'Phone',
              'Enter 10-digit phone number',
              'phone-pad',
              false,
              true,
            )}
            {renderInput(
              'parent1Email',
              'Email',
              'Enter email address',
              'email-address',
              false,
              true,
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Secondary Parent/Guardian (Optional)
              </Text>
            </View>
            {renderInput('parent2Name', 'Name', 'Enter parent name')}
            {renderInput(
              'parent2Phone',
              'Phone',
              'Enter 10-digit phone number',
              'phone-pad',
            )}
            {renderInput(
              'parent2Email',
              'Email',
              'Enter email address',
              'email-address',
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Login Credentials</Text>
            </View>
            {renderInput(
              'userName',
              'Username',
              'Enter username',
              'default',
              false,
              true,
            )}
            {renderInput(
              'password',
              'Password',
              'Enter password',
              'default',
              true,
              true,
            )}
            {!isEditMode &&
              renderInput(
                'confirmPassword',
                'Confirm Password',
                'Confirm your password',
                'default',
                true,
                true,
              )}
          </View>
        </ScrollView>

        {renderError(jsonError)}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isSaving || isUploading}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              (isSaving || isUploading) && styles.saveButtonDisabled,
            ]}
            onPress={() => (update ? updatestudent() : handleSave())}
            disabled={isSaving || isUploading}>
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditMode ? 'Update Student' : 'Add Student'}
              </Text>
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
  profilePicContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePicButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  profilePic: {
    width: '100%',
    height: '100%',
  },
  profilePicText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
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
    color: '#dc3545',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  availableText: {
    color: '#059669',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  errorText1: {
    color: '#dc3545',
    fontSize: 15,
    marginBottom: 20,
    marginLeft: 20,
  },
  passwordContainer: {
    position: 'relative',
  },
  toggleButton: {
    position: 'absolute',
    right: 12,
    top: 15,
  },
  usernameCheckIndicator: {
    position: 'absolute',
    right: 12,
    top: 15,
  },
  usernameStatusIcon: {
    position: 'absolute',
    right: 12,
    top: 15,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderButtonSelected: {
    backgroundColor: '#001d3d',
    borderColor: '#001d3d',
  },
  genderButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  genderButtonTextSelected: {
    color: '#FFFFFF',
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

export default StudentCreation;
