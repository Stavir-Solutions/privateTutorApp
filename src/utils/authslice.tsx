import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoggedIn: false,
  token: null,
  batch_id:null
};

console.log(initialState.batch_id)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.isLoggedIn = true;
      state.token = action.payload.token;
      AsyncStorage.setItem("Token", action.payload.token)
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.token = null;
    },
    batch_id: (state,action) => {
      state.batch_id = action.payload
      AsyncStorage.setItem("batch_id", action.payload)
    }
  },
});

export const { login, logout,batch_id } = authSlice.actions;
export default authSlice.reducer;
