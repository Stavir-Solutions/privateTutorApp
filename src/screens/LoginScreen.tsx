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
import LinearGradient from 'react-native-linear-gradient';
import {useDispatch} from 'react-redux';
import {postApi} from '../utils/api';
import {login} from '../utils/authslice';

const LoginScreen = ({navigation}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    username: '',
    password: '',
    general: '',
  });
  const dispatch = useDispatch();

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      username: '',
      password: '',
      general: '',
    };

    if (!username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    }
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const Teacher_Login = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({...errors, general: ''});

    const url = 'login/teacher';
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    const body = {
      userName: username.trim(),
      password: password,
    };

    const onResponse = res => {
      setLoading(false);
      console.log(res.error);
      if (res.token) {
        const userData = {
          token: `${res.token}`,
        };
        console.log(userData);
        console.log('token', res.token);
        dispatch(login(userData));
        navigation.replace('Tabs');
      } else if (res.error) {
        setErrors({...errors, general: res.error});
      } else {
        setErrors({...errors, general: 'Invalid response from server'});
      }
    };

    const onCatch = error => {
      setLoading(false);
      console.log('Error:', error);
      if (error.response?.status === 401) {
        setErrors({...errors, general: 'Invalid username or password'});
      } else {
        setErrors({
          ...errors,
          general: 'An error occurred. Please try again later',
        });
      }
    };

    try {
      await postApi(url, headers, body, onResponse, onCatch);
    } catch (error) {
      setLoading(false);
      setErrors({
        ...errors,
        general: 'Network error.',
      });
    }
  };

  const renderError = error => {
    if (!error) return null;
    return <Text style={styles.errorText}>{error}</Text>;
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
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>
              Login to your account to Continue
            </Text>

            {renderError(errors.general)}

            <View
              style={[
                styles.inputContainer,
                errors.username && styles.inputError,
              ]}>
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
                onChangeText={text => {
                  setUsername(text);
                  setErrors({...errors, username: '', general: ''});
                }}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
            {renderError(errors.username)}

            <View
              style={[
                styles.inputContainer,
                errors.password && styles.inputError,
              ]}>
              <Feather
                name="lock"
                size={20}
                color="#001d3d"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  setErrors({...errors, password: '', general: ''});
                }}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.showPasswordIcon}
                disabled={loading}>
                <Feather
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color="#001d3d"
                />
              </TouchableOpacity>
            </View>
            {renderError(errors.password)}

            <TouchableOpacity
              style={styles.forgotPassword}
              disabled={loading}
              onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={Teacher_Login}
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('SignUp')}
                disabled={loading}>
                <Text style={styles.signupLinkText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginTop: '30%',
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
    marginBottom: 8,
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
  showPasswordIcon: {
    padding: 10,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#1D49A7',
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: '#001d3d',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#001d3d',
  },
  signupLinkText: {
    color: '#1D49A7',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
