import SignUpScreen from '../screens/SignUpScreen';
import NotesScreen from '../screens/NotesScreen';
import ChatsScreen from '../screens/ChatsScreen';
import BottomTabNavigator from '../components/BottomNavBar';
import CreateAssignment from '../screens/AssignmentCreation';
import NotificationScreen from '../screens/NotificationScreen';
import HomeScreen from '../screens/HomeScreen';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import FeesScreen from '../screens/FeesScreen';
import AssignmentsScreen from '../screens/AssignmentScreen';
import LoginScreen from '../screens/LoginScreen';
import {useSelector} from 'react-redux';
import UpdateProfileScreen from '../screens/UpdateProfileScreen';
import NoteCreateScreen from '../screens/NoteCreateScreen';
import BatchCreation from '../screens/BatchCreation';
import StudentCreation from '../screens/StudentCreation';
import StudentDetailsScreen from '../screens/StudentDetailsScreen';
import FeePaymentDetailsScreen from '../screens/FeePaymentDetailsScreen';
import AssignmentDetailsScreen from '../screens/AssignmentDetailsScreen';
import NoteDetailsScreen from '../screens/NoteDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ConversationScreen from '../screens/ConversationScreen';
import StudentListing from '../screens/StudentListingScreen';
import ForgotPassword from '../screens/ForgotPasswor';
// import ConversationScreen from '../screens/ConversationScreen';

type Props = {};

export type RootStackParamsList = {
  tabs: undefined;
};

const Rootnavigator = () => {
  const Stack = createNativeStackNavigator();
  const isLoggedIn = useSelector(state => state.auth.isLoggedIn);
  // const Token = useSelector((state) => state.auth.token);
 


  return (
    <Stack.Navigator
      initialRouteName={isLoggedIn ? 'Tabs' : 'Login'}
      screenOptions={{headerShown: false}}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Update_Profile" component={UpdateProfileScreen} />
      <Stack.Screen name="Fees" component={FeesScreen} />
      <Stack.Screen name="Fees_Detail" component={FeePaymentDetailsScreen} />
      <Stack.Screen name="Assignment" component={AssignmentsScreen} />
      <Stack.Screen name="Assignment_Creation" component={CreateAssignment} />
      <Stack.Screen
        name="Assignment_Detail"
        component={AssignmentDetailsScreen}
      />
      <Stack.Screen name="Notes" component={NotesScreen} />
      <Stack.Screen name="Note_Create" component={NoteCreateScreen} />
      <Stack.Screen name="Note_Detail" component={NoteDetailsScreen} />
      <Stack.Screen name="Chats" component={ChatsScreen} />
      <Stack.Screen name="Chat" component={ConversationScreen} />
      <Stack.Screen name="Student_Create" component={StudentCreation} />
      <Stack.Screen name="Student_Detail" component={StudentDetailsScreen} />
      <Stack.Screen name="Student_List" component={StudentListing} />
      <Stack.Screen name="Batch_Create" component={BatchCreation} />
      <Stack.Screen name="Notification" component={NotificationScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="Tabs" component={BottomTabNavigator} />

    </Stack.Navigator>
  );
};

export default Rootnavigator;
