import React, {useState} from 'react';
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
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import {launchImageLibrary} from 'react-native-image-picker';
import {postApi} from '../utils/api';

const UpdateProfileScreen = ({navigation, route}) => {
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    addressLine1: '',
    addressCity: '',
    addressState: '',
    pinCode: '',
    profilePicUrl: '',
    phoneNumber: '',
    upiId: '',
    accountNumber: '',
    accountName: '',
    ifscCode: '',
  });

  const [profileImage, setProfileImage] = useState(null);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImagePicker = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
    });

    if (!result.didCancel && result.assets?.[0]?.uri) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    const url = 'teachers/id';
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const body = {
      ...profileData,
      profilePicUrl: profileImage,
    };

    const onResponse = res => {
      console.log('Profile updated successfully');
      navigation.replace('Home');
    };

    const onCatch = err => {
      console.log('Error updating profile:', err);
    };

    postApi(url, headers, body, onResponse, onCatch);
  };

  const renderInput = (icon, placeholder, field, keyboardType = 'default') => (
    <View style={styles.inputContainer}>
      <Feather name={icon} size={20} color="#001d3d" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={profileData[field]}
        onChangeText={value => handleInputChange(field, value)}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1D49A7" barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Complete Your Profile</Text>

          <TouchableOpacity
            style={styles.imagePickerContainer}
            onPress={handleImagePicker}>
            {profileImage ? (
              <Image source={{uri: profileImage}} style={styles.profileImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Feather name="camera" size={40} color="#001d3d" />
                <Text style={styles.imagePlaceholderText}>
                  Add Profile Photo
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {renderInput('user', 'First Name', 'firstName')}
            {renderInput('user', 'Last Name', 'lastName')}
            {renderInput('calendar', 'Age', 'age', 'numeric')}
            {renderInput('users', 'Gender', 'gender')}
            {renderInput('phone', 'Phone Number', 'phoneNumber', 'phone-pad')}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address Details</Text>
            {renderInput('home', 'Address Line 1', 'addressLine1')}
            {renderInput('map-pin', 'City', 'addressCity')}
            {renderInput('map', 'State', 'addressState')}
            {renderInput('hash', 'Pin Code', 'pinCode', 'numeric')}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Banking Details</Text>
            {renderInput('credit-card', 'Account Number', 'accountNumber')}
            {renderInput('user', 'Account Holder Name', 'accountName')}
            {renderInput('hash', 'IFSC Code', 'ifscCode')}
            {renderInput('smartphone', 'UPI ID', 'upiId')}
          </View>

          <TouchableOpacity
            //   onPress={handleSubmit}
            onPress={() => navigation.navigate('Tabs')}
            style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Save Profile</Text>
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
    marginBottom: 20,
    marginTop: 20,
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
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
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
});

export default UpdateProfileScreen;
