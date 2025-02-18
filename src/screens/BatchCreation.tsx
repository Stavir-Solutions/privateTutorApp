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
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const BatchCreation = ({navigation}) => {
  const [batch, setBatch] = useState({
    name: '',
    course: '',
    subject: '',
    description: '',
    paymentFrequency: '',
    paymentAmount: '',
    paymentDayOfMonth: '',
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const paymentFrequencies = ['Weekly', 'Monthly', 'Quarterly', 'Yearly'];

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

  const validateForm = () => {
    const newErrors = {};

    if (!batch.name.trim()) newErrors.name = 'Batch name is required';
    if (!batch.course.trim()) newErrors.course = 'Course is required';
    if (!batch.subject.trim()) newErrors.subject = 'Subject is required';
    if (!batch.paymentAmount || isNaN(batch.paymentAmount)) {
      newErrors.paymentAmount = 'Valid payment amount is required';
    }
    if (
      !batch.paymentDayOfMonth ||
      isNaN(batch.paymentDayOfMonth) ||
      batch.paymentDayOfMonth < 1 ||
      batch.paymentDayOfMonth > 31
    ) {
      newErrors.paymentDayOfMonth = 'Valid day of month (1-31) is required';
    }

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
          {showSuccessMessage && (
            <Animated.View style={[styles.successMessage, {opacity: fadeAnim}]}>
              <MaterialIcons name="check-circle" size={24} color="#059669" />
              <Text style={styles.successText}>Batch created successfully</Text>
            </Animated.View>
          )}

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
              <View style={[styles.input, styles.pickerContainer]}>
                {/* Frequency Picker */}
              </View>
            </View>

            {inputField(
              'paymentAmount',
              'Payment Amount',
              'Enter amount',
              'decimal-pad',
            )}

            {inputField(
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
              <Text style={styles.saveButtonText}>Create Batch</Text>
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
  pickerContainer: {
    padding: 0,
    height: 56,
  },
  picker: {
    height: 56,
    width: '100%',
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
