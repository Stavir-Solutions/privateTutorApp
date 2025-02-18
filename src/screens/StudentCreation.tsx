import React, {useState} from 'react';
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
  Image,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'react-native-image-picker';

const StudentCreation = ({navigation}) => {
  const [student, setStudent] = useState({
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
    username: '',
    password: '',
    profilePic: null,
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

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

  const validateEmail = email => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = phone => {
    return /^\d{10}$/.test(phone);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!student.firstName.trim())
      newErrors.firstName = 'First name is required';
    if (!student.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!student.age || isNaN(student.age))
      newErrors.age = 'Valid age is required';
    if (!student.addressLine1.trim())
      newErrors.addressLine1 = 'Address is required';
    if (!student.addressCity.trim()) newErrors.addressCity = 'City is required';
    if (!student.addressState.trim())
      newErrors.addressState = 'State is required';
    if (!student.pinCode || !/^\d{6}$/.test(student.pinCode))
      newErrors.pinCode = 'Valid 6-digit pincode required';
    if (!student.gender) newErrors.gender = 'Gender is required';

    if (!student.parent1Name.trim())
      newErrors.parent1Name = 'Parent 1 name is required';
    if (!validatePhone(student.parent1Phone))
      newErrors.parent1Phone = 'Valid 10-digit phone required';
    if (!validateEmail(student.parent1Email))
      newErrors.parent1Email = 'Valid email required';

    if (!student.username.trim()) newErrors.username = 'Username is required';
    if (student.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    // API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    setShowSuccessMessage(true);
    animateSuccess();
    setTimeout(() => {
      setShowSuccessMessage(false);
      navigation.goBack();
    }, 2000);
  };

  const handleImagePicker = () => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      response => {
        if (response.didCancel) return;
        if (response.assets && response.assets[0]) {
          setStudent(prev => ({
            ...prev,
            profilePic: response.assets[0],
          }));
        }
      },
    );
  };

  const renderInput = (
    field,
    label,
    placeholder,
    keyboardType = 'default',
    isSecure = false,
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}{' '}
        {field !== 'parent2Name' &&
          field !== 'parent2Phone' &&
          field !== 'parent2Email' &&
          '*'}
      </Text>
      <TextInput
        style={[styles.input, errors[field] && styles.inputError]}
        value={student[field]}
        onChangeText={text => {
          setStudent(prev => ({...prev, [field]: text}));
          if (errors[field]) setErrors(prev => ({...prev, [field]: undefined}));
        }}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        secureTextEntry={isSecure}
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
        <Text style={styles.appBarTitle}>Add New Student</Text>
        <View style={{width: 24}} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {showSuccessMessage && (
            <Animated.View style={[styles.successMessage, {opacity: fadeAnim}]}>
              <MaterialIcons name="check-circle" size={24} color="#059669" />
              <Text style={styles.successText}>Student added successfully</Text>
            </Animated.View>
          )}

          <View style={styles.formContainer}>
            <View style={styles.profilePicContainer}>
              <TouchableOpacity
                onPress={handleImagePicker}
                style={styles.profilePicButton}>
                {student.profilePic ? (
                  <Image
                    source={{uri: student.profilePic.uri}}
                    style={styles.profilePic}
                  />
                ) : (
                  <>
                    <MaterialIcons
                      name="add-a-photo"
                      size={32}
                      color="#6B7280"
                    />
                    <Text style={styles.profilePicText}>
                      Add Profile Picture
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {renderInput('firstName', 'First Name', 'Enter first name')}
            {renderInput('lastName', 'Last Name', 'Enter last name')}
            {renderInput('age', 'Age', 'Enter age', 'numeric')}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.genderContainer}>
                {['male', 'female', 'other'].map(gender => (
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
            {renderInput('parent1Name', 'Name', 'Enter parent name')}
            {renderInput(
              'parent1Phone',
              'Phone',
              'Enter 10-digit phone number',
              'phone-pad',
            )}
            {renderInput(
              'parent1Email',
              'Email',
              'Enter email address',
              'email-address',
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
            {renderInput('username', 'Username', 'Enter username')}
            {renderInput(
              'password',
              'Password',
              'Enter password',
              'default',
              true,
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
              <Text style={styles.saveButtonText}>Add Student</Text>
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
    fontSize: 14,
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
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
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
