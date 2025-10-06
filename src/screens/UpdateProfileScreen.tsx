import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {putapi} from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {pickAndUploadImage} from '../components/FileUploadService';
import Toast from 'react-native-toast-message';
import * as Keychain from 'react-native-keychain';

const UpdateProfileScreen = ({navigation, route}) => {
  const isEditMode = route.params?.update ? true : false;
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState(
    isEditMode
      ? route?.params?.teacher
      : {
          firstName: '',
          lastName: '',
          age: '',
          gender: '',
          addressLine1: '',
          addressCity: '',
          addressState: '',
          pinCode: '',
          profilePicUrl: '',
          phoneNumber: route?.params?.phoneNumber
            ? route?.params?.phoneNumber
            : '',
          email: '',
          upiId: '',
          accountNumber: '',
          accountName: '',
          ifscCode: '',
        },
  );

  const lastNameRef = useRef(null);
  const ageRef = useRef(null);
  const phoneNumberRef = useRef(null);
  const emailRef = useRef(null);
  const addressLine1Ref = useRef(null);
  const addressCityRef = useRef(null);
  const addressStateRef = useRef(null);
  const pinCodeRef = useRef(null);
  const accountNumberRef = useRef(null);
  const accountNameRef = useRef(null);
  const ifscCodeRef = useRef(null);
  const upiIdRef = useRef(null);

  const [profileImage, setProfileImage] = useState();
  const [isUploading, setIsUploading] = useState(false);
  const [userId, setUserId] = useState(
    isEditMode ? route?.params?.teacher?.id : route?.params?.userId,
  );

  const [update, setUpdate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  const requiredFields = ['firstName', 'lastName', 'email', 'phoneNumber'];

  const updateRequiredFields = update ? ['userName', 'email', 'password'] : [];

  const allRequiredFields = [...requiredFields, ...updateRequiredFields];

  const handleInputChange = (field, value) => {
    if (field === 'age') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setProfileData(prev => ({
        ...prev,
        [field]: numericValue,
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value,
      }));
    }

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const genderOptions = ['male', 'female', 'do not reveal'];

  const handleGenderSelect = value => {
    setProfileData(prev => ({
      ...prev,
      gender: value,
    }));

    if (errors.gender) {
      setErrors(prev => ({
        ...prev,
        gender: null,
      }));
    }
  };

  const handleImagePicker = async () => {
    try {
      setIsUploading(true);
      const result = await pickAndUploadImage({}, 'profile');

      if (result.success) {
        setProfileImage(result.uri);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile photo uploaded',
          visibilityTime: 3000,
        });

        setProfileData(prev => ({
          ...prev,
          profilePicUrl: result.url,
        }));

        if (errors.profilePicUrl) {
          setErrors(prev => ({
            ...prev,
            profilePicUrl: null,
          }));
        }
      } else {
        console.log('Image upload failed:', result.message);
        setErrors(prev => ({
          ...prev,
          profilePicUrl: 'Failed to upload profile image. Please try again.',
        }));
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to upload image. Please try again.',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.error('Error in image picking/uploading:', error);
      setErrors(prev => ({
        ...prev,
        profilePicUrl: 'Error uploading image. Please try again.',
      }));
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to upload image. Please try again.',
        visibilityTime: 3000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    setUpdate(route?.params?.update);
  }, [route?.params?.update]);

  useEffect(() => {
    setProfileImage(route.params?.teacher?.profilePicUrl);
  }, [route.params?.teacher?.profilePicUrl]);

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    allRequiredFields?.forEach(field => {
      if (field === 'age') {
        const ageValue = profileData[field];
        if (!ageValue || isNaN(Number(ageValue))) {
          newErrors[field] = 'Please enter a valid age';
          isValid = false;
        }
        return;
      }

      const fieldValue = profileData[field];
      if (
        !fieldValue ||
        (typeof fieldValue === 'string' && fieldValue.trim() === '')
      ) {
        newErrors[field] = `${fieldToLabel(field)} is required`;
        isValid = false;
      }
    });

    if (profileData.age) {
      const ageNum = parseInt(profileData.age, 10);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
        newErrors.age = 'Age must be between 18 and 100';
        isValid = false;
      }
    }

    if (
      profileData?.phoneNumber &&
      typeof profileData.phoneNumber === 'string' &&
      profileData.phoneNumber.length < 10
    ) {
      newErrors.phoneNumber = 'Enter a valid phone number';
      isValid = false;
    }

    if (
      profileData?.pinCode &&
      typeof profileData.pinCode === 'string' &&
      profileData.pinCode.length !== 6
    ) {
      newErrors.pinCode = 'PIN code must be 6 digits';
      isValid = false;
    }

    if (
      profileData?.ifscCode &&
      typeof profileData.ifscCode === 'string' &&
      !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(profileData.ifscCode)
    ) {
      newErrors.ifscCode = 'Enter a valid IFSC code';
      isValid = false;
    }

    if (
      profileData?.email &&
      typeof profileData.email === 'string' &&
      !/\S+@\S+\.\S+/.test(profileData.email)
    ) {
      newErrors.email = 'Enter a valid email address';
      isValid = false;
    }

    if (
      update &&
      profileData.password &&
      typeof profileData.password === 'string' &&
      profileData.password.length < 6
    ) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const fieldToLabel = field => {
    const labels = {
      firstName: 'First name',
      lastName: 'Last name',
      age: 'Age',
      gender: 'Gender',
      phoneNumber: 'Phone number',
      addressLine1: 'Address',
      addressCity: 'City',
      addressState: 'State',
      pinCode: 'PIN code',
      accountNumber: 'Account number',
      accountName: 'Account holder name',
      ifscCode: 'IFSC code',
      upiId: 'UPI ID',
      userName: 'Username',
      email: 'Email',
      password: 'Password',
      profilePicUrl: 'Profile picture',
    };
    return labels[field] || field;
  };

  const handleSubmit = async () => {
    try {
      if (!validateForm()) {
        Toast.show({
          type: 'error',
          text1: 'Form Validation Error',
          text2: 'Please fill in all required fields correctly',
        });
        return;
      }

      setIsLoading(true);

          const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;
      const url = `teachers/${userId}`;

      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Token}`,
      };

      const rawPayload = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        age: profileData.age ? parseInt(profileData.age, 10) : undefined,
        gender: profileData.gender,
        addressLine1: profileData.addressLine1,
        addressCity: profileData.addressCity,
        addressState: profileData.addressState,
        pinCode: profileData.pinCode,
        profilePicUrl: profileData.profilePicUrl,
        phoneNumber: profileData.phoneNumber,
        upiId: profileData.upiId,
        accountNumber: profileData.accountNumber,
        accountName: profileData.accountName,
        ifscCode: profileData.ifscCode,
        email: profileData.email,
        userName: profileData.userName,
        password: profileData.password,
      };

      const payload = Object.fromEntries(
        Object.entries(rawPayload).filter(
          ([_, value]) => value !== '' && value !== null && value !== undefined,
        ),
      );

      const onResponse = res => {
        setIsLoading(false);
        console.log('Profile updated successfully');
        Toast.show({
          type: 'success',
          text1: 'Profile Update',
          text2: 'Profile has been successfully updated!',
        });

        navigation.reset({
          index: 0,
          routes: [{name: 'Tabs'}],
        });
      };

      const onCatch = err => {
        setIsLoading(false);

        if (err.error) {
          if (typeof err.error === 'object') {
            setErrors(err.error);
          } else {
            Toast.show({
              type: 'error',
              text1: 'Update Failed',
              text2: err.error || 'An error occurred while updating profile',
            });
          }
        } else {
          Toast.show({
            type: 'error',
            text1: 'Failed',
            text2: 'Update failed. Please try again.',
          });
        }

        console.log('Error updating profile:', err);
      };

      putapi(url, headers, payload, onResponse, onCatch, navigation);
    } catch (error) {
      setIsLoading(false);
      console.error('Error submitting profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: 'Update failed. Please try again.',
      });
    }
  };

  const renderInput = (
    icon,
    placeholder,
    field,
    keyboardType = 'default',
    ref = null,
    nextFieldRef = null,
    isRequired = allRequiredFields.includes(field),
  ) => (
    <View>
      <View
        style={[
          styles.inputContainer,
          errors[field] ? styles.inputError : null,
        ]}>
        <Feather
          name={icon}
          size={20}
          color="#001d3d"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={`${placeholder}${isRequired ? '*' : ''}`}
          placeholderTextColor="#888"
          value={profileData[field]?.toString() || ''}
          onChangeText={value => handleInputChange(field, value)}
          keyboardType={keyboardType}
          ref={ref}
          returnKeyType={nextFieldRef ? 'next' : 'done'}
          onSubmitEditing={() => {
            if (nextFieldRef && nextFieldRef.current) {
              nextFieldRef.current.focus();
            }
          }}
          blurOnSubmit={!nextFieldRef}
        />
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const RadioButton = ({label, selected, onPress}) => (
    <TouchableOpacity style={styles.radioButtonContainer} onPress={onPress}>
      <View style={styles.radioButton}>
        {selected && <View style={styles.radioButtonSelected} />}
      </View>
      <Text style={styles.radioButtonLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderGenderSelection = () => (
    <View>
      <View
        style={[
          styles.genderContainer,
          errors.gender ? styles.inputError : null,
        ]}>
        <Feather
          name="users"
          size={20}
          color="#001d3d"
          style={styles.genderIcon}
        />
        <View style={styles.radioGroup}>
          {genderOptions.map(option => (
            <RadioButton
              key={option}
              label={option}
              selected={profileData.gender === option}
              onPress={() => handleGenderSelect(option)}
            />
          ))}
        </View>
      </View>
      {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1D49A7" barStyle="light-content" />

      {isEditMode && (
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#001d3d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Complete Your Profile</Text>

          <View>
            <TouchableOpacity
              style={[
                styles.imagePickerContainer,
                errors.profilePicUrl ? styles.imageContainerError : null,
              ]}
              onPress={handleImagePicker}
              disabled={isUploading}>
              {profileImage ? (
                <Image
                  source={{uri: profileImage}}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Feather name="camera" size={40} color="#001d3d" />
                  <Text style={styles.imagePlaceholderText}>
                    {isUploading ? 'Uploading...' : 'Add Profile Photo'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {errors.profilePicUrl && (
              <Text style={[styles.errorText, styles.imageErrorText]}>
                {errors.profilePicUrl}
              </Text>
            )}
          </View>

          {update && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Login Details</Text>
              {renderInput('user', 'User Name', 'userName')}
              <View>
                <View
                  style={[
                    styles.inputContainer,
                    errors.password ? styles.inputError : null,
                  ]}>
                  <Feather
                    name="lock"
                    size={20}
                    color="#001d3d"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password*"
                    placeholderTextColor="#888"
                    secureTextEntry={!showPassword}
                    value={profileData.password}
                    onChangeText={value => handleInputChange('password', value)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.showPasswordIcon}>
                    <Feather
                      name={showPassword ? 'eye' : 'eye-off'}
                      size={20}
                      color="#001d3d"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>
            </View>
          )}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {renderInput(
              'user',
              'First Name',
              'firstName',
              'default',
              null,
              lastNameRef,
            )}
            {renderInput(
              'user',
              'Last Name',
              'lastName',
              'default',
              lastNameRef,
              ageRef,
            )}
            {renderInput(
              'calendar',
              'Age',
              'age',
              'numeric',
              ageRef,
              phoneNumberRef,
            )}
            {renderGenderSelection()}
            {renderInput(
              'phone',
              'Phone Number',
              'phoneNumber',
              'phone-pad',
              phoneNumberRef,
              emailRef,
            )}
            {renderInput(
              'mail',
              'Email',
              'email',
              'email',
              emailRef,
              addressLine1Ref,
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address Details</Text>
            {renderInput(
              'home',
              'Address Line 1',
              'addressLine1',
              'default',
              addressLine1Ref,
              addressCityRef,
            )}
            {renderInput(
              'map-pin',
              'City',
              'addressCity',
              'default',
              addressCityRef,
              addressStateRef,
            )}
            {renderInput(
              'map',
              'State',
              'addressState',
              'default',
              addressStateRef,
              pinCodeRef,
            )}
            {renderInput(
              'hash',
              'Pin Code',
              'pinCode',
              'numeric',
              pinCodeRef,
              accountNumberRef,
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Banking Details</Text>
            {renderInput(
              'credit-card',
              'Account Number',
              'accountNumber',
              'default',
              accountNumberRef,
              accountNameRef,
            )}
            {renderInput(
              'user',
              'Account Holder Name',
              'accountName',
              'default',
              accountNameRef,
              ifscCodeRef,
            )}
            {renderInput(
              'hash',
              'IFSC Code',
              'ifscCode',
              'default',
              ifscCodeRef,
              upiIdRef,
            )}
            {renderInput('smartphone', 'UPI ID', 'upiId', 'default', upiIdRef)}
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.submitButton}
            disabled={isLoading || isUploading}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.submitButtonText}>Saving...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#001d3d',
    marginLeft: 15,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: '5%',
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#001d3d',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 20,
  },
  requiredNote: {
    marginBottom: 20,
    alignItems: 'center',
  },
  requiredNoteText: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  imageErrorText: {
    marginTop: 5,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#001d3d',
    marginBottom: 15,
  },
  showPasswordIcon: {
    padding: 10,
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageContainerError: {
    borderWidth: 2,
    borderColor: '#dc3545',
    borderRadius: 60,
    padding: 2,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  imagePlaceholderText: {
    color: '#001d3d',
    marginTop: 5,
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputError: {
    borderColor: '#dc3545',
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#001d3d',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  genderIcon: {
    marginRight: 10,
  },
  radioGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 20,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  radioButton: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#001d3d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioButtonSelected: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#001d3d',
  },
  radioButtonLabel: {
    fontSize: 14,
    color: '#333',
  },
});

export default UpdateProfileScreen;
