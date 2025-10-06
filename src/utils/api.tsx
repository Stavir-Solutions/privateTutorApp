import AsyncStorage from '@react-native-async-storage/async-storage';
import store from './store';
import {logout} from './authslice';
import {useNavigation} from '@react-navigation/native';
import {Alert} from 'react-native';
import * as Keychain from 'react-native-keychain';

type Callback<T = any> = (data: T) => void;

interface FileData {
  uri: string;
  name: string;
  type: string;
}

interface RefreshTokenResponse {
  token: string;
  refreshToken?: string;
}

let base_url = 'https://zkbsgdbbhc.execute-api.us-east-1.amazonaws.com/Dev/';

export const handleLogout = async (navigation: any): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      'Token',
      'RefreshToken',
      'TeacherId',
      'batch_id',
      'selectedBatch',
    ]);

    store.dispatch(logout());

  

    if (navigation) {
      navigation.reset({
        index: 0,
        routes: [{name: 'Login'}],
      });
    }
  } catch (error) {
  
  }
};

export const refreshToken = async (): Promise<RefreshTokenResponse | null> => {

  try {
    const refreshToken = await AsyncStorage.getItem('RefreshToken');

    if (!refreshToken) {
     
      return null;
    }

    const url = 'login/refresh';
    const headers = {
      'Content-Type': 'application/json',
      'refresh-token': refreshToken,
    };

    const response = await fetch(base_url + url, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const text = await response.text();

    try {
      const fixedText = text.replace(
        /"token":\s*([^"{\[][^,}\]]*)/g,
        '"token": "$1"',
      );

      const responseJson = JSON.parse(fixedText);

      if (responseJson.token) {
        // await AsyncStorage.setItem('Token', responseJson.token);
           await Keychain.setGenericPassword('Token', responseJson.token);
     

        if (responseJson.refreshToken) {
          await AsyncStorage.setItem('RefreshToken', responseJson.refreshToken);
        }

        return {
          token: responseJson.token,
          refreshToken: responseJson.refreshToken || refreshToken,
        };
      } else {
        throw new Error('Invalid response from refresh token endpoint');
      }
    } catch (error) {
    
      throw new Error(`Invalid JSON response: ${text}`);
    }
  } catch (error) {

    return null;
  }
};

const handleTokenRefresh = async (
  requestFunction: Function,
  url: string,
  header: Record<string, string>,
  body: Record<string, any> | null,
  onResponse: Callback | null,
  onCatch: Callback | null,
  navigation?: any,
): Promise<void> => {
  try {
    const refreshResult = await refreshToken();

    if (refreshResult && refreshResult.token) {
      const newHeaders = {
        ...header,
        Authorization: `Bearer ${refreshResult.token}`,
      };

      const wrappedOnResponse = (data: any) => {
        onResponse && onResponse(data);
      };

      const wrappedOnCatch = (error: any) => {
        onCatch && onCatch(error);
      };

      await requestFunction(
        url,
        newHeaders,
        body,
        wrappedOnResponse,
        wrappedOnCatch,
      );
    } else {
      await AsyncStorage.multiRemove(['Token', 'RefreshToken', 'TeacherId']);
      // handleLogout(navigation)

      if (onCatch) {
        onCatch(new Error('Session expired. Please login again.'));
        // handleLogout(navigation)
      }
      if (navigation) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await handleLogout(navigation);
              },
            },
          ],
          {cancelable: false},
        );
      }
    }
  } catch (error) {
  
    await AsyncStorage.multiRemove(['Token', 'RefreshToken', 'TeacherId']);
    // handleLogout(navigation)
    if (onCatch) {
      onCatch(error);
    }
    if (navigation) {
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please login again.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await handleLogout(navigation);
            },
          },
        ],
        {cancelable: false},
      );
    }
  }
};

export const postApi = async (
  url: string = '',
  header: Record<string, string> = {},
  body: Record<string, any> = {},
  onResponse: Callback | null = null,
  onCatch: Callback | null = null,
  navigation?: any,
): Promise<any> => {
  try {
        const credentials = await Keychain.getGenericPassword();
            const token = credentials.password;

    const headers = {
      'Content-Type': 'application/json',
      ...header,
    };

    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }

   

    const response = await fetch(base_url + url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.status === 401) {
      await handleTokenRefresh(
        postApi,
        url,
        header,
        body,
        onResponse,
        onCatch,
        navigation,
      );
      return null;
    }

    const text = await response.text();


    let responseJson: any;
    try {
      const fixedText = text.replace(
        /"token":\s*([^"{\[][^,}\]]*)/g,
        '"token": "$1"',
      );
      responseJson = JSON.parse(fixedText);
    } catch (err) {
    

      let errorText = 'Something went wrong';
      try {
        const parsed = JSON.parse(text);
        errorText = parsed?.error || text;
      } catch {
        errorText = text;
      }
      throw new Error(errorText);
    }

    if (!response.ok) {
      const errorMessage = responseJson?.error || 'An error occurred';
      throw new Error(errorMessage);
    }

    onResponse && onResponse(responseJson);
  } catch (error: any) {
    const errorMessage =
      typeof error === 'string'
        ? error
        : error?.message || 'Something went wrong';

  
    onCatch && onCatch({error: errorMessage});
  }
};

export const getapi = async (
  url: string = '',
  header: Record<string, string> = {},
  onResponse: Callback | null = null,
  onCatch: Callback | null = null,
  navigation?: any,
): Promise<any> => {
  try {
        const credentials = await Keychain.getGenericPassword();
            const token = credentials.password;
    const headers = {
      'Content-Type': 'application/json',
      ...header,
    };

    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }

 

    const response = await fetch(base_url + url, {
      method: 'GET',
      headers: headers,
    });

    if (response.status === 401) {
      await handleTokenRefresh(
        getapi,
        url,
        header,
        null,
        onResponse,
        onCatch,
        navigation,
      );
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const responseJson = await response.json();
 

    if (onResponse) {
      onResponse(responseJson);
    }

    return responseJson;
  } catch (error) {
   

    if (onCatch) {
      onCatch(error);
    }

    return null;
  }
};

export const patchApi = async (
  url: string = '',
  header: Record<string, string> = {},
  body: Record<string, any> | null = null,
  onResponse: Callback | null = null,
  onCatch: Callback | null = null,
  navigation?: any,
): Promise<any> => {
  const headers = {
    'Content-Type': 'application/json',
    ...header,
  };

 

  try {
    const response = await fetch(base_url + url, {
      method: 'PATCH',
      headers: headers,
      body: body ? JSON.stringify(body) : null,
    });

    const text = await response.text();


    if (response.status === 401) {
      await handleTokenRefresh(
        getapi,
        url,
        header,
        null,
        onResponse,
        onCatch,
        navigation,
      );
      return null;
    }

    if (!response.ok) {
      const errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
      

      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).responseText = text;

      onCatch && onCatch(error);
      return Promise.reject(error);
    }

    try {
      const fixedText = text.replace(
        /"token":\s*([^"{\[][^,}\]]*)/g,
        '"token": "$1"',
      );

      const responseJson = JSON.parse(fixedText);
    

      onResponse && onResponse(responseJson);
      return responseJson;
    } catch (error) {
    
      const parseError = new Error(`Invalid JSON response: ${text}`);

      onCatch && onCatch(parseError);
      return Promise.reject(parseError);
    }
  } catch (e) {


    onCatch && onCatch(e);
    return Promise.reject(e);
  }
};

export const putapi = async (
  url: string = '',
  header: Record<string, string> = {},
  body: Record<string, any> = {},
  onResponse: Callback | null = null,
  onCatch: Callback | null = null,
  navigation?: any,
): Promise<any> => {
  try {
        const credentials = await Keychain.getGenericPassword();
            const token = credentials.password;
    const headers = {
      'Content-Type': 'application/json',
      ...header,
    };

    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }

 

    const response = await fetch(base_url + url, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (response.status === 401) {
      await handleTokenRefresh(
        putapi,
        url,
        header,
        body,
        onResponse,
        onCatch,
        navigation,
      );
      return null;
    }

    const text = await response.text();
  

    let responseJson: any;

    try {
      const fixedText = text.replace(
        /"token":\s*([^"{\[][^,}\]]*)/g,
        '"token": "$1"',
      );
      responseJson = JSON.parse(fixedText);
    } catch (err) {
    
      throw new Error(`Invalid JSON response: ${text}`);
    }

    if (!response.ok) {
      const errorMessage = responseJson?.error || 'An error occurred';
      throw new Error(errorMessage);
    }

    onResponse && onResponse(responseJson);
  } catch (error: any) {
  

    const errorMessage =
      typeof error === 'string'
        ? error
        : error?.message || 'Something went wrong';
  
    onCatch && onCatch({error: errorMessage});
  }
};

export const deleteapi = async (
  url: string = '',
  header: Record<string, string> = {},
  onResponse: Callback | null = null,
  onCatch: Callback | null = null,
  navigation?: any,
): Promise<any> => {
  try {
        const credentials = await Keychain.getGenericPassword();
            const token = credentials.password;
    const headers = {
      'Content-Type': 'application/json',
      ...header,
    };

    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }

    fetch(base_url + url, {
      method: 'DELETE',
      headers: headers,
    })
      .then(async response => {
        if (response.status === 401) {
          await handleTokenRefresh(
            deleteapi,
            url,
            header,
            null,
            onResponse,
            onCatch,
            navigation,
          );
          return null;
        }

        const text = await response.text();
    

        try {
          const fixedText = text.replace(
            /"token":\s*([^"{\[][^,}\]]*)/g,
            '"token": "$1"',
          );

          return JSON.parse(fixedText);
        } catch (error) {
          
          throw new Error(`Invalid JSON response: ${text}`);
        }
      })
      .then(responseJson => {
        if (responseJson) {
      
          onResponse && onResponse(responseJson);
        }
      })
      .catch(e => {
    
        onCatch && onCatch(e);
      });
  } catch (error) {
   
    onCatch && onCatch(error);
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
      const credentials = await Keychain.getGenericPassword();
            const token = credentials.password;
  return !!token;
};

export const clearAuthData = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    'Token',
    'RefreshToken',
    'TeacherId',
    'batch_id',
    'selectedBatch',
  ]);
};
