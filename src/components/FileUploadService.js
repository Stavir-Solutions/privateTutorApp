import {Platform} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {base_url} from '../utils/store';

/**
 * Opens image picker to select an image from the device gallery
 * @param {Object} options - Options for the image picker (optional)
 * @returns {Promise<Object>} - Returns file data and uri if successful
 */
export const pickImage = async (options = {}) => {
  try {
    const defaultOptions = {
      mediaType: 'photo',
      quality: 1,
      ...options,
    };

    const result = await launchImageLibrary(defaultOptions);

    if (result.didCancel) {
      return {success: false, message: 'User cancelled image selection'};
    }

    if (!result.assets?.[0]?.uri) {
      return {success: false, message: 'No image selected'};
    }

    const selectedImage = result.assets[0];

    const fileData = {
      uri:
        Platform.OS === 'android'
          ? selectedImage.uri
          : selectedImage.uri.replace('file://', ''),
      type: selectedImage.type || 'image/jpeg',
      name: selectedImage.fileName || 'file.jpg',
    };

    const formData = new FormData();
    formData.append('file', fileData);

    return {
      success: true,
      fileData,
      uri: fileData.uri,
      formData,
    };
  } catch (error) {
    console.error('Error picking image:', error);
    return {
      success: false,
      message: 'Error selecting image',
      error,
    };
  }
};

/**
 * Uploads a file to the server and returns the URL
 * @param {FormData} formData - FormData object containing the file to upload
 * @returns {Promise<Object>} - Returns the uploaded file URL if successful
 */
export const uploadFile = async (formData, uploadType) => {
  try {
    if (!formData) {
      return {
        success: false,
        message: 'No file data provided for upload',
      };
    }

    const userId = await AsyncStorage.getItem('TeacherId');

    formData.append('userType', 'TEACHER');
    formData.append('userId', userId);
    formData.append('uploadType', uploadType);

  
    const credentials = await Keychain.getGenericPassword();
    const token = credentials.password;
    if (!token) {
      return {
        success: false,
        message: 'Authentication token not found',
      };
    }

    const url = `${base_url}uploads`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const textResponse = await response.text();

    let responseData;
    try {
      responseData = JSON.parse(textResponse);
    } catch (error) {
      console.error('Error parsing response:', error);
      return {
        success: false,
        message: 'Invalid response from server',
        rawResponse: textResponse,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: `Upload failed: ${responseData.message || 'Unknown error'}`,
        statusCode: response.status,
        responseData,
      };
    }

    return {
      success: true,
      url: responseData.url,
      responseData,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      message: 'Error during file upload',
      error: error.message,
    };
  }
};

/**
 * Combined function to pick and upload an image in one call
 * @param {Object} options - Options for the image picker (optional)
 * @returns {Promise<Object>} - Returns the uploaded file URL if successful
 */
export const pickAndUploadImage = async (options = {}, uploadType) => {
  const pickResult = await pickImage(options);

  if (!pickResult.success) {
    return pickResult;
  }

  const uploadResult = await uploadFile(pickResult.formData, uploadType);

  return {
    ...uploadResult,
    uri: pickResult.uri,
  };
};
