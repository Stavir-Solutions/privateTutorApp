import {
  Alert,
  FlatList,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import BottomNavigation from '../components/BottomNavBar';
import RBSheet from 'react-native-raw-bottom-sheet';
import { getapi } from '../utils/api';
import BatchSelectorSheet from '../components/BatchSelectorSheet';
import { useDispatch, useSelector } from 'react-redux';
import { batch_id, logout } from '../utils/authslice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = ({ navigation }) => {
  const refRBSheet = useRef();
  const Batch_id = useSelector(state => state.auth.batch_id);
  const [selectedBatch, setSelectedBatch] = useState({
    subject: 'Algebra',
    paymentFrequency: 'Monthly',
    course: 'Mathematics',
    teacherId: '660e8400-e29b-41d4-a716-446655440001',
    description:
      'An introductory course to Algebra covering basic concepts and problem-solving techniques.',
    id: '212e46a9-9a1d-4906-a27e-5ef03e989955',
    paymentAmount: 150,
    name: 'Math 1012',
    paymentDayOfMonth: 15,
  });
  const [students, setStudents] = useState([]);
  // var codesPostal: CodePostal[] = []
  const dispatch = useDispatch();

  const students_fetch = async () => {
    const Token = await AsyncStorage.getItem("Token")
    const Batch_id = await AsyncStorage.getItem("batch_id")
    console.log('Tokens',Token)
    const url = `students/batch/${Batch_id}`;
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Token}`
    };
    const onResponse = res => {
      console.log('hiii');
      console.log(batch_id);
      setStudents(res);
    };

    const onCatch = res => {
      console.log('Error');
      console.log(res);
    };
    getapi(url, headers, onResponse, onCatch);
  };

  const handle_logout = () => {
    dispatch(logout());
    navigation.replace('Login');
  };

  useEffect(() => {
    students_fetch();
    console.log(students);
    console.log('mo');
  }, [1]);

  // // Function to Open Bottom Sheet
  // const handleOpenBottomSheet = useCallback(() => {
  //   bottomSheetRef.current?.expand();
  // }, []);

  const renderStudentCard = ({ item }) => {
    console.log(item.age);
    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => navigation.navigate('Student_Detail', { student: item })}>
        {item.profilePicUrl != null ? (
          <Image source={{ uri: item.profilePicUrl }} style={styles.profilePic} />
        ) : (
          <View style={styles.noPicContainer}>
            <Image
              source={require('../resources/logo.png')}
              style={styles.noPic}
            />
          </View>
        )}
        <View style={{ flexDirection: 'column' }}>
          <Text style={styles.studentName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.parentDtl}>Parent: {item.parent1Name}</Text>
          <Text style={styles.parentDtl}>Phone No: {item.parent1Phone}</Text>
        </View>
        {/* <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="message" size={20} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="visibility" size={20} color="#2196F3" />
        </TouchableOpacity>
      </View> */}
      </TouchableOpacity>
    );
  };

  const handleBatchSelect = async (batch) => {
    await AsyncStorage.removeItem('batch_id');
    setSelectedBatch(batch);
    console.log(batch.id)
    dispatch(batch_id(batch.id)),
      refRBSheet.current.close();
    await students_fetch()
  };

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => handle_logout()}>
          <Image
            style={styles.avatarImg}
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/512/5310/5310895.png',
            }}
          />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Smart Teacher</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notification')}>
          <View style={styles.notificationIcon}>
            <Ionicons
              name="notifications-outline"
              size={30}
              color="rgb(0,0,0)"
            />
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <View style={styles.batchCard}>
          <LinearGradient
            colors={['rgb(255,255,255)', 'rgb(229,235,252)']} // Light gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}>
            <TouchableOpacity
              onPress={() => refRBSheet.current.open()}
              style={styles.hexagonWrapper}>
              <LinearGradient
                colors={['rgb(255,255,255)', 'rgb(247,248,252)']} // Same as card to blend in
                style={styles.hexagon}>
                <MaterialIcons
                  name="change-circle"
                  size={24}
                  color="#001d3d"
                  style={styles.hexagonIcon}
                />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.batchCardTitle}>{selectedBatch.name}</Text>
            <Text style={styles.batchCardSubtitle}>
              {selectedBatch.subject}
            </Text>
            <Text style={styles.batchCardCount}>{students.length}</Text>
            <View style={styles.createBatch}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Batch_Create')}
                style={styles.createBatchButton}>
                <Text style={styles.createBatchButtonText}>
                  Create New Batch
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
        <View style={styles.header}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={24} color="#666" />
            <TextInput
              placeholder="Search Student"
              placeholderTextColor="#666"
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity
            style={styles.addStudentButton}
            accessibilityLabel="Add new student"
            onPress={() => navigation.navigate('Student_Create')}>
            <Text style={styles.addStudentButtonText}>Add Student</Text>
          </TouchableOpacity>
        </View>
        {/* <Text style={styles.listTitle}>Students In Batch</Text> */}

        <FlatList
          data={students}
          renderItem={renderStudentCard}
          keyExtractor={item => item.firstName}
          contentContainerStyle={styles.list}
        />
      </View>
      <BatchSelectorSheet
        ref={refRBSheet}
        selectedBatch={selectedBatch}
        onBatchSelect={handleBatchSelect}
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'rgb(255,255,255)',
  },
  appBar: {
    // paddingTop: Platform.OS === 'ios' ? 40 : StatusBar.currentHeight + 10,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    // paddingVertical: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  appBarTitle: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#001d3d',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgb(216, 224, 247)',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  batchCard: {
    width: '90%',
    height: 100,
    backgroundColor: 'rgb(255,255,255)',
    borderRadius: 10,
    shadowColor: '#1D49A7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    marginBottom: 20,
    marginHorizontal: '5%',
  },
  batchCardTitle: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
    paddingLeft: 20,
  },
  batchCardSubtitle: {
    fontSize: 14,
    color: '#888',
    paddingLeft: 20,
  },
  batchCardCount: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 3,
    paddingLeft: 20,
  },
  card: {
    // width: 150,
    height: '100%',
    borderRadius: 12,
    padding: 15,
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#1D49A7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 15,
    overflow: 'hidden',
  },
  hexagonWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
  },
  hexagon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    transform: [{ rotate: '45deg' }, { translateX: -10 }, { translateY: -10 }],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D49A7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 20,
  },
  hexagonIcon: {
    paddingTop: 10,
    paddingRight: 5,
    transform: [{ rotate: '-45deg' }],
  },
  createBatch: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    color: 'white',
  },
  createBatchButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderColor: '#1D49A7',
  },
  createBatchButtonText: {
    fontSize: 12,
    color: '#1D49A7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: '5%',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderColor: 'rgb(0,0,0)',
    borderWidth: 0.1,
    borderRadius: 25,
    paddingHorizontal: 15,
    flex: 1,
  },
  searchInput: {
    marginLeft: 10,
    fontSize: 16,
    color: 'rgb(51,51,51)',
  },
  addStudentButton: {
    // backgroundColor: 'rgb(53, 104, 244)',
    // backgroundColor: 'rgb(34, 78, 200)',
    backgroundColor: '#001d3d',
    padding: 10,
    borderRadius: 20,
    shadowColor: '#1D49A7',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    marginLeft: 10,
  },
  addStudentButtonText: {
    color: '#FFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgb(0,0,0)',
    marginBottom: 10,
  },
  list: {
    padding: 3,
    marginHorizontal: '5%',
  },
  listCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1D49A7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  noPicContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgb(229,235,252)',
  },
  noPic: {
    width: 30,
    height: 30,

    opacity: 0.5,
  },
  studentName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  parentDtl: {
    fontSize: 12,
    color: 'rgb(162, 160, 160)',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 12,
  },
});
