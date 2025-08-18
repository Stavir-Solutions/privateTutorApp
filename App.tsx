import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import Rootnavigator from './src/utils/Rootnavigator';
import {Provider} from 'react-redux';
import store, {persistor} from './src/utils/store';
import {PersistGate} from 'redux-persist/integration/react';
import {linking} from './src/utils/Linking';
import Toast from 'react-native-toast-message';

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NavigationContainer
          style={{backgroundColor: 'transparent'}}
          linking={linking}>
          <Rootnavigator />
          <Toast />
        </NavigationContainer>
      </PersistGate>
    </Provider>
  );
};

export default App;
