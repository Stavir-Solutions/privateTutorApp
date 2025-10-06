import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
  Animated,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {notificationz} from '../dumyDb';
import {getapi, patchApi} from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const NotificationScreen = ({navigation}) => {
  const [notifications, setNotifications] = useState();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const animateSuccess = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNotificationPress = notification => {
    const updatedNotifications = notifications.map(item =>
      item.id === notification.id ? {...item, seen: true} : item,
    );
   
    Notification_marking(notification.id);
    setNotifications(updatedNotifications);

    if (notification.deeplink && notification.type) {
      const urlParts = notification.deeplink.split('/');
      const objectId = urlParts[urlParts.length - 1];

      switch (notification.type) {
        case 'MESSAGE':
          navigation.navigate('Chat', {
            conversationId: objectId,
            deeplink: true,
          });
          break;
        case 'ASSIGNMENT':
          navigation.navigate('Assignment_Detail', {
            assignmentId: objectId,
            deeplink: true,
          });
          break;
        case 'NOTE':
          navigation.navigate('Note_Detail', {
            noteId: objectId,
            deeplink: true,
          });
          break;
        case 'FEE':
          navigation.navigate('Fees_Detail', {feeId: objectId, deeplink: true});
          break;
        case 'STUDENT':
          navigation.navigate('Student_Detail', {
            studentId: objectId,
            deeplink: true,
          });
          break;
        default:
          const path = urlParts[urlParts.length - 2];
          if (path === 'messages') {
            navigation.navigate('Chat', {
              conversationId: objectId,
              deeplink: true,
            });
          }

          break;
      }
    }
  };

  const Notification_marking = async (notification_id: any) => {
    try {
          const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;

      const url = `/notifications/${notification_id}/seen`;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Token}`,
      };

      const onResponse = res => {
        setShowSuccessMessage(true);
        animateSuccess;
     
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 2000);
      };

      const onCatch = error => {
    
        Alert.alert('Error', 'Failed to mark notification. Please try again.', [
          {text: 'OK'},
        ]);
      };

      patchApi(url, headers, null, onResponse, onCatch, navigation);
    } catch (error) {
     
      Alert.alert('Error', 'Failed to mark notification. Please try again.', [
        {text: 'OK'},
      ]);
    }
  };

  const Notification_fetch = async () => {
        const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;
    const Teacher_id = await AsyncStorage.getItem('TeacherId');

    const url = `notifications/teachers/${Teacher_id}`;
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Token}`,
    };
    const onResponse = res => {
   
      setNotifications(res);
    };

    const onCatch = res => {
  
    };
    getapi(url, headers, onResponse, onCatch, navigation);
  };

  useEffect(() => {
    Notification_fetch();
  }, [1]);

  const renderNotificationCard = ({item}) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.isRead && styles.unreadNotification,
      ]}
      onPress={() => handleNotificationPress(item)}>
      <View
        style={[
          styles.iconContainer,
          {backgroundColor: `${item.iconColor}15`},
        ]}>
        {item.type === 'MESSAGE' ? (
          <MaterialIcons name="message" size={24} color="#4CAF50" />
        ) : item.type === 'FEE_PAID' ? (
          <MaterialIcons name="payments" size={24} color="#FF9800" />
        ) : (
          <MaterialCommunityIcons
            name="account-plus-outline"
            size={24}
            color="#2196F3"
          />
        )}
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>
            {item.type === 'MESSAGE'
              ? 'NEW MESSAGE'
              : item.type === 'FEE_PAID'
              ? 'FEE PAID'
              : 'NEW STUDENT'}
          </Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
        <Text style={styles.notificationDescription}>{item.title}</Text>
      </View>
      {!item.seen && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="rgb(0,0,0)" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Notifications</Text>
        <MaterialIcons name="arrow-back" size={24} color="rgba(0, 0, 0, 0)" />
      </View>
      {showSuccessMessage && (
        <Animated.View style={[styles.successMessage, {opacity: fadeAnim}]}>
          <MaterialIcons name="check-circle" size={24} color="#059669" />
          <Text style={styles.successText}>{'Notification read marked'}</Text>
        </Animated.View>
      )}

      {notifications && notifications?.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotificationCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.notificationList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.noNotificationContainer}>
          <Text style={styles.noNotificationText}>
            No notifications in this batch
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'rgb(255,255,255)',
  },
  appBar: {
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  appBarTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: 'rgb(15, 31, 75)',
  },
  notificationList: {
    padding: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: 'rgb(105, 144, 252)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 12,
  },
  unreadNotification: {
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F1F4B',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  notificationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F1F4B',
    position: 'absolute',
    top: 16,
    right: 16,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
  },
  successText: {
    marginLeft: 8,
    color: '#059669',
    fontSize: 16,
    fontWeight: '600',
  },
  noNotificationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noNotificationText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
  },
});

export default NotificationScreen;
