import AsyncStorage from '@react-native-async-storage/async-storage';
import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {getapi} from '../utils/api';
import {State} from 'react-native-gesture-handler';
import * as Keychain from 'react-native-keychain';
interface AuthState {
  isLoggedIn: boolean;
  newBatchCreated: boolean;
  token: string | null;
  refreshToken: string | null;
  batch_id: string | null;
  Teacher_id: string | null;
  Teacher_name: string | null;
  selectBatch: any | null;
  batches: any[];
  loading: boolean;
  error: string | null;
}



export const fetch_batchs = createAsyncThunk(
  'auth/fetch_batchs',
  async (_, {rejectWithValue}) => {
    try {
          const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;
      const Teacher_id = await AsyncStorage.getItem('TeacherId');

      if (!Token || !Teacher_id) {
        
        return rejectWithValue('No Token or Teacher ID found');
      }

      const url = `batches/teacher/${Teacher_id}`;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Token}`,
      };

      return new Promise((resolve, reject) => {
        getapi(
          url,
          headers,
          async res => {
         
            resolve(res || []);
          },
          error => {
          
            reject(error);
          },
        );
      });
    } catch (error) {
    
      return rejectWithValue(error.message);
    }
  },
);

const initialState: AuthState = {
  isLoggedIn: false,
  newBatchCreated: false,
  token: null,
  refreshToken: null,
  batch_id: null,
  Teacher_id: null,
  Teacher_name: null,
  selectBatch: null,
  batches: [],
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.isLoggedIn = true;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || null;
      state.Teacher_id = action.payload.Teacher_id;
      state.Teacher_name = action.payload.Teacher_name;

      // AsyncStorage.setItem('Token', action.payload.token);
      Keychain.setGenericPassword('Token',  action.payload.token);
      if (action.payload.refreshToken) {
        AsyncStorage.setItem('RefreshToken', action.payload.refreshToken);
      }
      AsyncStorage.setItem('TeacherId', action.payload.Teacher_id);
      AsyncStorage.setItem('TeacherName', action.payload.Teacher_name);
    },
    logout: state => {
      state.isLoggedIn = false;
      state.token = null;
      state.refreshToken = null;
      state.batches = [];
      state.batch_id = null;
      state.selectBatch = null;

      AsyncStorage.removeItem('Token');
      AsyncStorage.removeItem('RefreshToken');
      AsyncStorage.removeItem('TeacherId');
      AsyncStorage.removeItem('batch_id');
      AsyncStorage.removeItem('selectedBatch');
    },
    batch_id: (state, action) => {
      state.batch_id = action.payload;
      AsyncStorage.setItem('batch_id', action.payload);
    },
    selectBatch: (state, action) => {
      state.selectBatch = action.payload || {};
      AsyncStorage.setItem(
        'selectedBatch',
        JSON.stringify(action.payload || {}),
      );
    },
    setBatchCreated: (state, action) => {
      state.newBatchCreated = action.payload;
    },

    updateTokens: (state, action) => {
      state.token = action.payload.token;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
        AsyncStorage.setItem('RefreshToken', action.payload.refreshToken);
      }
      // AsyncStorage.setItem('Token', action.payload.token);
        Keychain.setGenericPassword('Token',  action.payload.token);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetch_batchs.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetch_batchs.fulfilled, (state, action) => {
        state.loading = false;
        state.batches = action.payload || [];
      })
      .addCase(fetch_batchs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.batches = [];
      })
      .addCase('Clearbatches', (state, action) => {
        state.batch_id = null;
        state.selectBatch = null;
        AsyncStorage.removeItem('batch_id');
        AsyncStorage.removeItem('selectedBatch');
      });
  },
});

export const {
  login,
  logout,
  batch_id,
  selectBatch,
  setBatchCreated,
  updateTokens,
} = authSlice.actions;
export default authSlice.reducer;
