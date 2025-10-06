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
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import {base_url} from '../utils/store';

const ForgotPassword = ({navigation}) => {
  const [username, setUsername] = useState('');
  const [userType, setUserType] = useState('TEACHER');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateForm = () => {
    if (!username.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Username is required',
        visibilityTime: 3000,
      });
      return false;
    }
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const url = `${base_url}login/new-password/${username.trim()}/${userType}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      const contentType = response.headers.get('Content-Type');
      const rawText = await response.text();
     

     

      // if (!response.ok) {
      //   // throw new Error(`HTTP error! Status: ${response.status}`);

      // }

      // if (!contentType || !contentType.includes('application/json')) {
      //   throw new Error('Unexpected response type. Expected JSON.');
      // }

      const data = JSON.parse(rawText);
      setLoading(false);

      if (response.ok) {
        setEmailSent(true);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Password reset link sent to your email!',
          visibilityTime: 3000,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data.error || 'Failed to process your request',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Please check your connection and try again',

        visibilityTime: 3000,
      });
      console.error('Reset password error:', error);
    }
  };

  return (
    <LinearGradient
      colors={['#1D49A7', '#1D49A7', '#FFF']}
      style={styles.container}>
      <StatusBar backgroundColor="#1D49A7" barStyle="light-content" />
      <View style={styles.logoContainer}>
        <Image style={styles.logo} source={require('../resources/logo.png')} />
        <Text style={styles.logotitle}>Smart Teacher</Text>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          <View style={styles.glassContainer}>
            {emailSent ? (
              <View style={styles.successContainer}>
                <Text style={styles.title}>Email Sent!</Text>
                <Text style={styles.successMessage}>
                  A password reset link has been sent to your email address.
                  Please check your inbox and follow the instructions.
                </Text>
                <TouchableOpacity
                  style={styles.returnButton}
                  onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.returnButtonText}>Return to Login</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.title}>Forgot Password</Text>
                <Text style={styles.subtitle}>
                  Enter your username and we'll send a password reset link to
                  your email address
                </Text>

                <View style={styles.inputContainer}>
                  <Feather
                    name="user"
                    size={20}
                    color="#001d3d"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="#888"
                    value={username}
                    onChangeText={text => setUsername(text)}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleResetPassword}
                  style={[
                    styles.resetButton,
                    loading && styles.resetButtonDisabled,
                  ]}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.resetButtonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                  disabled={loading}>
                  <Text style={styles.backButtonText}>Back to Login</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '20%',
  },
  logo: {
    width: 100,
    height: 100,
  },
  logotitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffff',
    textAlign: 'center',
    paddingTop: 12,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 0.5,
    justifyContent: 'center',
    paddingHorizontal: '5%',
  },
  glassContainer: {
    backgroundColor: '#ffff',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#1D49A7',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#001d3d',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#001d3d',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 20,
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
  resetButton: {
    backgroundColor: '#001d3d',
    borderRadius: 10,
    padding: 15,
    marginTop: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  resetButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    alignItems: 'center',
  },
  backButtonText: {
    color: '#1D49A7',
    textDecorationLine: 'underline',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successMessage: {
    fontSize: 14,
    color: '#001d3d',
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 20,
  },
  returnButton: {
    backgroundColor: '#001d3d',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  returnButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ForgotPassword;
