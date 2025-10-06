import {
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import BottomNavigation from '../components/BottomNavBar';
import RBSheet from 'react-native-raw-bottom-sheet';
import {useFocusEffect, useRoute} from '@react-navigation/native';
import {getapi} from '../utils/api';
import BatchSelectorSheet from '../components/BatchSelectorSheet';
import {useDispatch, useSelector} from 'react-redux';
import {
  batch_id,
  fetch_batchs,
  logout,
  selectBatch,
  setBatchCreated,
} from '../utils/authslice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import {getUserId} from '../utils/TokenDecoder';
import * as Keychain from 'react-native-keychain';

const HomeScreen = ({navigation}) => {
  const refRBSheet = useRef();
  const selectedBatchString = useSelector(state => state.auth?.selectBatch);
  const selectedBatch_id = useSelector(state => state.auth?.batch_id);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [profilePicUrl, setProfileImage] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isBatchSelected, setIsBatchSelected] = useState(true);
  const dispatch = useDispatch();

  const students_fetch = async () => {
    setLoading(true);
        const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;
    const Batch_id = await AsyncStorage.getItem('batch_id');

    const currentBatchId = Batch_id ? Batch_id : selectedBatch_id;

    if (!currentBatchId) {
  
      setLoading(false);
      setIsBatchSelected(false);
      setStudents([]);
      setFilteredStudents([]);
      setRefreshing(false);
      return;
    }

    const url = `students/batch/${currentBatchId}`;
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Token}`,
    };
    const onResponse = res => {
      setIsBatchSelected(true);
      setStudents(res || []);
      setFilteredStudents(res || []);
      setLoading(false);
      setRefreshing(false);
    };

    const onCatch = res => {
      console.error('Error fetching students:', res);
      setLoading(false);
      setStudents([]);
      setFilteredStudents([]);
      setRefreshing(false);
    };
    getapi(url, headers, onResponse, onCatch, navigation);
  };

  const TeacherDetails = async () => {
        const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;
    if (!Token) {
      throw new Error('No token found, authentication required');
    }

    const Teacherid = await getUserId(Token);
    if (!Teacherid) {
      throw new Error('Failed to fetch Teacher ID');
    }

    const url = `teachers/${Teacherid}`;
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Token}`,
    };

    const onResponse = res => {
      if (res) {
        setProfileImage(res?.profilePicUrl);
      }
      setLoading(false);
    };

    const onCatch = error => {
      console.error('API Error:', error);
      setLoading(false);
    };

    getapi(url, headers, onResponse, onCatch, navigation);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    students_fetch();
    setSearchText('');
  }, []);

  const handleBatchSelect = async batch => {
    await AsyncStorage.setItem('batch_id', batch.id.toString());
    await AsyncStorage.setItem('batch', JSON.stringify(batch));
    dispatch(batch_id(batch.id));
    dispatch(selectBatch(batch));
    setSearchText('');
    setIsBatchSelected(true);
    await students_fetch();
    refRBSheet.current.close();
  };

  const handleSearch = text => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => {
        const fullName =
          `${student.firstName} ${student.lastName}`.toLowerCase();
        const searchQuery = text.toLowerCase();
        const parentName = (student.parent1Name || '').toLowerCase();
        const parentPhone = (student.parent1Phone || '').toLowerCase();

        return (
          fullName.includes(searchQuery) ||
          parentName.includes(searchQuery) ||
          parentPhone.includes(searchQuery)
        );
      });
      setFilteredStudents(filtered);
    }
  };

  const clearSearch = () => {
    setSearchText('');
    setFilteredStudents(students);
  };

  useEffect(() => {
    const checkBatchSelection = async () => {
      const Batch_id = await AsyncStorage.getItem('batch_id');
      if (!Batch_id && !selectedBatch_id) {
        setIsBatchSelected(false);
      } else {
        setIsBatchSelected(true);
      }
    };

    checkBatchSelection();
    students_fetch();
    TeacherDetails();
    fetch_batchs();
  }, []);

  useFocusEffect(
    useCallback(() => {
    
      students_fetch();
      TeacherDetails();
      dispatch(fetch_batchs());
      return () => {
       
      };
    }, []),
  );

  const renderStudentCard = ({item}) => {
    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => navigation.navigate('Student_Detail', {student: item})}>
        {item.profilePicUrl != null ? (
          <Image source={{uri: item.profilePicUrl}} style={styles.profilePic} />
        ) : (
          <View style={styles.noPicContainer}>
            <Image
              source={require('../resources/user.png')}
              style={styles.noPic}
            />
          </View>
        )}
        <View style={{flexDirection: 'column'}}>
          <Text style={styles.studentName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.parentDtl}>Parent: {item.parent1Name}</Text>
          <Text style={styles.parentDtl}>Phone No: {item.parent1Phone}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNoBatchSelected = () => (
    <View style={styles.noBatchContainer}>
      <MaterialIcons name="class" size={64} color="#ccc" />
      <Text style={styles.noBatchText}>No batch selected</Text>
      <Text style={styles.noBatchSubtext}>
        Please select a batch to view students
      </Text>
      <TouchableOpacity
        style={styles.selectBatchButton}
        onPress={() => refRBSheet.current.open()}>
        <Text style={styles.selectBatchButtonText}>Select Batch</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Image
            source={
              !profilePicUrl
                ? require('../resources/user.png')
                : {uri: profilePicUrl ? profilePicUrl : ''}
            }
            style={styles.avatarImg}
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
      {loading ? (
        <View style={styles.container}>
          <ShimmerPlaceholder style={styles.batchCard} />
          <View style={styles.searchContainer}>
            <ShimmerPlaceholder style={styles.searchInput} />
            <ShimmerPlaceholder style={styles.addButton} />
          </View>
          {[1, 2, 3, 4, 5].map((_, index) => (
            <View key={index} style={styles.listCard}>
              <View style={styles.profilePicPlaceholder} />
              <View>
                <ShimmerPlaceholder style={styles.studentName} />
                <ShimmerPlaceholder style={styles.parentDetail} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.batchCard}>
            <LinearGradient
              colors={['rgb(255,255,255)', 'rgb(229,235,252)']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.card}>
              <TouchableOpacity
                onPress={() => refRBSheet.current.open()}
                style={styles.hexagonWrapper}>
                <LinearGradient
                  colors={['rgb(255,255,255)', 'rgb(247,248,252)']}
                  style={styles.hexagon}>
                  <MaterialIcons
                    name="change-circle"
                    size={24}
                    color="#001d3d"
                    style={styles.hexagonIcon}
                  />
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.batchCardTitle}>
                {isBatchSelected && selectedBatchString
                  ? selectedBatchString.name
                  : 'Select a batch'}
              </Text>
              <Text style={styles.batchCardSubtitle}>
                {isBatchSelected && selectedBatchString
                  ? selectedBatchString.subject
                  : 'No batch selected'}
              </Text>
              <Text style={styles.batchCardCount}>
                {isBatchSelected ? students.length : 0}
              </Text>
              <View style={styles.createBatch}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('Batch_Create', {update: false})
                  }
                  style={styles.createBatchButton}>
                  <Text style={styles.createBatchButtonText}>
                    Create New Batch
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {!isBatchSelected ? (
            renderNoBatchSelected()
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={24} color="#666" />
                  <TextInput
                    placeholder="Search Student"
                    placeholderTextColor="#666"
                    style={styles.searchInput}
                    value={searchText}
                    onChangeText={handleSearch}
                  />
                  {searchText ? (
                    <TouchableOpacity onPress={clearSearch}>
                      <Ionicons name="close-circle" size={24} color="#666" />
                    </TouchableOpacity>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.addStudentButton}
                  accessibilityLabel="Add new student"
                  onPress={() =>
                    navigation.navigate('Student_Create', {update: false})
                  }>
                  <Text style={styles.addStudentButtonText}>Add Student</Text>
                </TouchableOpacity>
              </View>

              {filteredStudents.length === 0 ? (
                <View style={styles.noStudentsContainer}>
                  <FontAwesome name="user" size={48} color="#ccc" />
                  <Text style={styles.noStudentsText}>
                    {searchText
                      ? 'No matching students found'
                      : 'No students in this batch'}
                  </Text>
                  {searchText ? (
                    <TouchableOpacity
                      style={styles.clearSearchButton}
                      onPress={clearSearch}>
                      <Text style={styles.clearSearchText}>Clear Search</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <FlatList
                  data={filteredStudents}
                  renderItem={renderStudentCard}
                  keyExtractor={(item, index) => `${item.firstName}-${index}`}
                  contentContainerStyle={styles.list}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      colors={['#001d3d']}
                      tintColor="#001d3d"
                    />
                  }
                />
              )}
            </>
          )}
        </View>
      )}
      <BatchSelectorSheet
        ref={refRBSheet}
        onBatchSelect={handleBatchSelect}
        navigation={navigation}
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
    paddingTop: 10,
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
    shadowOffset: {width: 0, height: 2},
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
    height: '100%',
    borderRadius: 12,
    padding: 15,
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#1D49A7',
    shadowOffset: {width: 0, height: 4},
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
    transform: [{rotate: '45deg'}, {translateX: -10}, {translateY: -10}],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D49A7',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 20,
  },
  hexagonIcon: {
    paddingTop: 10,
    paddingRight: 5,
    transform: [{rotate: '-45deg'}],
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
    flex: 1,
  },
  addStudentButton: {
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
    flexGrow: 1,
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
    shadowOffset: {width: 0, height: 2},
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
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  addButton: {
    width: 1000 * 0.3,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E5EBFC',
  },
  profilePicPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5EBFC',
    marginRight: 16,
  },
  parentDetail: {width: 80, height: 12, backgroundColor: '#E5EBFC'},
  noStudentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noStudentsText: {
    fontSize: 18,
    color: '#888',
    marginTop: 12,
  },
  clearSearchButton: {
    marginTop: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  clearSearchText: {
    color: '#1D49A7',
    fontWeight: '500',
  },
  noBatchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noBatchText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  noBatchSubtext: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  selectBatchButton: {
    backgroundColor: '#001d3d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 24,
    shadowColor: '#1D49A7',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  selectBatchButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
