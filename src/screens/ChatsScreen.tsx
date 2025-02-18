import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import BottomNavigation from '../components/BottomNavBar';

const ChatsScreen = ({navigation}) => {
  return (
    <View style={styles.chatsScreen}>
      <Text>ChatsScreen</Text>
      {/* <BottomNavigation navigation={navigation} /> */}
    </View>
  );
};

export default ChatsScreen;

const styles = StyleSheet.create({
  chatsScreen: {flex: 1},
});
