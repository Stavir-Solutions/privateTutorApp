import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../screens/HomeScreen';
import FeesScreen from '../screens/FeesScreen';
import AssignmentScreen from '../screens/AssignmentScreen';
import ChatsScreen from '../screens/ChatsScreen';
import NotesScreen from '../screens/NotesScreen';
export type BottomTabParamsList = {
  Home: undefined;
  Fee: undefined;
  Assignment: undefined;
  Chats: undefined;
  Notes: undefined;
};

const BottomTabNavigator = () => {
  const Tab = createBottomTabNavigator();

  const TabBarBackground = focused => (
    <View
      style={{
        backgroundColor: focused ? '#1D49A7' : 'transparent',
        padding: 50,
        borderRadius: 50,
      }}></View>
  );
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarButton: props => (
          <TouchableOpacity activeOpacity={0.7} {...props} />
        ),
        tabBarIcon: ({focused, color, size}) => {
          TabBarBackground(focused);
          if (route.name === 'Home') {
            return (
              <Ionicons
                name={'home-outline'}
                size={24}
                color={focused ? '#1D49A7' : '#666'}
              />
            );
          } else if (route.name == 'Fee') {
            return (
              <Ionicons
                name={'receipt-outline'}
                size={24}
                color={focused ? '#1D49A7' : '#666'}
              />
            );
          } else if (route.name == 'Assignment') {
            return (
              <Ionicons
                name={'clipboard-outline'}
                size={24}
                color={focused ? '#1D49A7' : '#666'}
              />
            );
          } else if (route.name == 'Notes') {
            return (
              <Ionicons
                name={'book-outline'}
                size={24}
                color={focused ? '#1D49A7' : '#666'}
              />
            );
          } else if (route.name == 'Chats') {
            return (
              <Ionicons
                name={'chatbubbles-outline'}
                size={24}
                color={focused ? '#1D49A7' : '#666'}
              />
            );
          }
        },
        tabBarStyle: {
          position: 'absolute',
          width: '90%',
          height: 60,
          bottom: 20,
          marginHorizontal: '5%',
          borderRadius: 50,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgb(229,235,252)',
          elevation: 20,
          shadowColor: '#000',
          shadowOpacity: 1,
          shadowRadius: 12,
        },

        tabBarActiveTintColor: '#1D49A7',
        tabBarIconStyle: {marginTop: 10},
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Fee" component={FeesScreen} />
      <Tab.Screen name="Assignment" component={AssignmentScreen} />
      <Tab.Screen name="Notes" component={NotesScreen} />
      <Tab.Screen name="Chats" component={ChatsScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '70%',
    alignItems: 'center',
  },
  navigationBar: {
    width: '90%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgb(241, 240, 250)',
    borderRadius: 50,
    paddingVertical: 15,
    shadowColor: '#000',
    elevation: 20,
  },
});

export default BottomTabNavigator;
