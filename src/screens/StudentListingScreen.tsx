import {useCallback, useEffect, useState} from 'react';
import {
  TouchableOpacity,
  Image,
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  StatusBar,
  SafeAreaView,
  Pressable,
} from 'react-native';
import {useSelector} from 'react-redux';
import {getapi} from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const StudentListing = ({navigation}) => {
  const [students, setStudents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const selectedBatchString = useSelector(state => state.auth?.selectBatch);
  const selectedBatch_id = useSelector(state => state.auth?.batch_id);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);

  const students_fetch = async () => {
    setLoading(true);
    const Token = await AsyncStorage.getItem('Token');
    const Batch_id = await AsyncStorage.getItem('batch_id');
    const url = `students/batch/${Batch_id ? Batch_id : selectedBatch_id}`;
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Token}`,
    };
    const onResponse = res => {
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    students_fetch();
  }, []);

  useEffect(() => {
    students_fetch();
  }, [1]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(
        student =>
          student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.parent1Name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const renderStudentCard = ({item}) => {
    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() =>
          navigation.replace('Chat', {student: item, create: true})
        }>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#001d3d" barStyle="light-content" />

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>Students</Text>
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={24} color="#666" />
          <TextInput
            placeholder="Search Student"
            placeholderTextColor="#666"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {filteredStudents.length === 0 ? (
        <View style={styles.noStudentsContainer}>
          <FontAwesome name="user" size={48} color="#ccc" />
          <Text style={styles.noStudentsText}>
            {loading
              ? 'Loading students...'
              : searchQuery.length > 0
              ? 'No matching students found'
              : 'No students in this batch'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          renderItem={renderStudentCard}
          keyExtractor={item => item.id || item.firstName + item.lastName}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgb(255,255,255)',
  },
  screen: {
    flex: 1,
    backgroundColor: 'rgb(255,255,255)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#001d3d',
  },
  backButton: {
    padding: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerIcon: {
    marginLeft: 15,
    padding: 5,
  },
  batchInfoContainer: {
    paddingHorizontal: 20,
  },
  batchText: {
    color: 'white',
    fontSize: 14,
    fontStyle: 'italic',
  },
  searchBarContainer: {
    backgroundColor: 'white',
    paddingHorizontal: '5%',
    paddingVertical: 15,
    marginTop: -10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderColor: 'rgb(0,0,0)',
    borderWidth: 0.1,
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
  },
  searchInput: {
    marginLeft: 10,
    fontSize: 16,
    color: 'rgb(51,51,51)',
    flex: 1,
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
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  parentDtl: {
    fontSize: 12,
    color: 'rgb(162, 160, 160)',
    marginBottom: 2,
  },
  noStudentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  noStudentsText: {
    fontSize: 18,
    color: '#888',
    marginTop: 15,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  list: {
    padding: 3,
    paddingTop: 10,
    marginHorizontal: '5%',
    backgroundColor: 'white',
    paddingBottom: 20,
  },
});

export default StudentListing;
