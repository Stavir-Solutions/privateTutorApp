import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import BatchSelectorSheet from '../components/BatchSelectorSheet';
import {getapi} from '../utils/api';
import dateconvert from '../components/moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch, useSelector} from 'react-redux';
import {batch_id, selectBatch} from '../utils/authslice';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import {useFocusEffect} from '@react-navigation/core';
import * as Keychain from 'react-native-keychain';

interface StudentDetails {
  [studentId: string]: string;
}

interface Fees {
  id: string;
  studentId: string;
  amount: number;
  status: string;
  teacherAcknowledgement?: boolean;
}

const FeesScreen = ({navigation}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('Current Month');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [studentDetails, setStudentDetails] = useState<StudentDetails>({});
  const [fees, setFees] = useState<Fees[]>([]);
  const [totalFees, setTotalFees] = useState(0);
  const [receivedFees, setReceivedFees] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isBatchSelected, setIsBatchSelected] = useState(true);

  const selectedBatchString = useSelector(state => state.auth?.selectBatch);
  const selectedBatch_id = useSelector(state => state.auth?.batch_id);

  const dispatch = useDispatch();

  const Fees_fetch = async () => {
    setLoading(true);
    const Batch_id = await AsyncStorage.getItem('batch_id');
        const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;

    const currentBatchId = Batch_id ? Batch_id : selectedBatch_id;

    if (!currentBatchId) {
      console.log('No batch selected yet');
      setLoading(false);
      setIsBatchSelected(false);
      setFees([]);
      // setFilteredStudents([]);
      setRefreshing(false);
      return;
    }

    // setIsBatchSelected(true);

    const url = `fee-records/batches/${currentBatchId}`;
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Token}`,
    };
    const onResponse = res => {
      setIsBatchSelected(true);
      setFees(res || []);
      student_details_fetch(res);

      let totalAmount = 0;
      let receivedAmount = 0;

      res.forEach(record => {
        const amount = Number(record.amount);

        totalAmount += amount;
        if (record.status === 'paid') {
          receivedAmount += amount;
        }
      });

      setTotalFees(totalAmount);
      setReceivedFees(receivedAmount);
      setRefreshing(false);
    };

    const onCatch = res => {
      console.log('Error');
      console.log(res);
      setLoading(false);
      setRefreshing(false);
    };
    getapi(url, headers, onResponse, onCatch, navigation);
  };

  const student_details_fetch = async (records: any[]) => {
        const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;
    const studentIds = [...new Set(records.map(item => item.studentId))];

    const studentDetailsResponse = await Promise.all(
      studentIds.map(async studentId => {
        const url = `students/${studentId}`;
        const headers = {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Token}`,
        };

        return new Promise(resolve => {
          getapi(
            url,
            headers,
            res => {
              if (res && res.id) {
                resolve({
                  studentId: res.id,
                  name: `${res.firstName} ${res.lastName}`,
                });
              } else {
                resolve(null);
              }
            },
            error => {
              console.error(`Error fetching student ${studentId}:`, error);
              resolve(null);
            },
            navigation,
          );
        });
      }),
    );

    const details = studentDetailsResponse
      .filter(Boolean)
      .reduce((acc, {studentId, name}) => {
        acc[studentId] = name;
        return acc;
      }, {});
    setStudentDetails(details);
    setLoading(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Fees_fetch();
  }, []);

  useEffect(() => {
    Fees_fetch();
  }, [selectedBatchString]);

  useFocusEffect(
    useCallback(() => {
      console.log('Screen is focused');
      Fees_fetch();
      return () => {
        console.log('Screen is unfocused');
      };
    }, []),
  );

  const monthOptions = [
    'Current Month',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const filterOptions = ['All', 'Paid', 'Unpaid'];

  const refRBSheet = useRef();

  const handleBatchSelect = async batch => {
    await AsyncStorage.setItem('batch_id', batch.id.toString());
    await AsyncStorage.setItem('batch', JSON.stringify(batch));
    dispatch(batch_id(batch.id));
    dispatch(selectBatch(batch));
    await Fees_fetch();
    refRBSheet.current.close();
    setIsBatchSelected(true);
  };

  // const filteredFees = useMemo(() => {
  //   return fees.filter(record => {
  //     console.log(dateconvert(record.dueDate));
  //     const studentName = studentDetails[record.studentId] || '';
  //     const matchesSearch =
  //       searchQuery === '' ||
  //       studentName.toLowerCase().includes(searchQuery.toLowerCase());

  //     const matchesPaymentFilter =
  //       paymentFilter === 'All' ||
  //       (paymentFilter === 'Paid' && record.status === 'paid') ||
  //       (paymentFilter === 'Unpaid' && record.status !== 'paid');

  //     const matchesMonth = selectedMonth === 'Current Month' || true;

  //     return matchesSearch && matchesPaymentFilter && matchesMonth;
  //   });
  // }, [fees, searchQuery, paymentFilter, selectedMonth, studentDetails]);

  const filteredFees = useMemo(() => {
    return fees.filter(record => {
      const studentName = studentDetails[record.studentId] || '';
      const matchesSearch =
        searchQuery === '' ||
        studentName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPaymentFilter =
        paymentFilter === 'All' ||
        (paymentFilter === 'Paid' && record.status === 'paid') ||
        (paymentFilter === 'Unpaid' && record.status !== 'paid');

      const matchesMonth = (() => {
        if (selectedMonth === 'Current Month') {
          const currentDate = new Date();
          const currentMonth = currentDate.getMonth();
          const recordDate = new Date(record.dueDate);
          const recordMonth = recordDate.getMonth();
          return (
            currentMonth === recordMonth &&
            currentDate.getFullYear() === recordDate.getFullYear()
          );
        } else {
          const monthNames = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ];
          const selectedMonthIndex = monthNames.indexOf(selectedMonth);

          if (selectedMonthIndex === -1) return true;

          const recordDate = new Date(record.dueDate);
          const recordMonth = recordDate.getMonth();
          return recordMonth === selectedMonthIndex;
        }
      })();

      return matchesSearch && matchesPaymentFilter && matchesMonth;
    });
  }, [fees, searchQuery, paymentFilter, selectedMonth, studentDetails]);

  const FeeCard = ({record}) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('Fees_Detail', {
          feeRecord: record,
          name: studentDetails[record.studentId],
        })
      }
      style={styles.feeCard}>
      <View style={styles.feeCardHeader}>
        <Text style={styles.studentName}>
          {studentDetails[record.studentId] || 'Loading...'}
        </Text>

        <View style={styles.statusContainer}>
          <Text
            style={[
              styles.status,
              {color: record.status === 'paid' ? '#43A047' : '#E53935'},
            ]}>
            {record.status}
          </Text>

          {record.status === 'paid' && (
            <Text
              style={[
                styles.acknowledgement,
                {
                  color: record.teacherAcknowledgement ? '#43A047' : '#FFA000',
                  marginLeft: 5,
                },
              ]}>
              {record.teacherAcknowledgement ? 'Approved' : 'Approval Pending'}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.feeCardBody}>
        <Text style={styles.amount}>₹{record.amount.toLocaleString()}</Text>
        <Text style={styles.date}>
          {record.status === 'paid' ? 'Paid on: ' : 'Due by: '}
          {dateconvert(record.dueDate)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const BackgroundGraph = () => (
    <Svg height="100%" width="100%" style={styles.backgroundGraph}>
      <Defs>
        <SvgGradient id="graphGradient" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="rgb(105, 144, 252)" stopOpacity="0.2" />
          <Stop offset="1" stopColor="rgb(105, 144, 252)" stopOpacity="0" />
        </SvgGradient>
      </Defs>
      <Path
        d="M50,80 C100,70 150,90 200,60 C250,30 300,50 350,40"
        stroke="rgb(105, 144, 252)"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />
      <Path
        d="M50,80 C100,70 150,90 200,60 C250,30 300,50 350,40 L350,120 L50,120 Z"
        fill="url(#graphGradient)"
      />
    </Svg>
  );

  const renderNoBatchSelected = () => (
    <View style={styles.noBatchContainer}>
      <MaterialIcons name="class" size={64} color="#ccc" />
      <Text style={styles.noBatchText}>No batch selected</Text>
      <Text style={styles.noBatchSubtext}>
        Please select a batch to view fees details
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

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fee Tracker</Text>

        <TouchableOpacity
          onPress={() => refRBSheet.current?.open()}
          style={{
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: '#e0e0e0',
          }}>
          <Text style={{color: '#001d3d', fontWeight: 'bold', fontSize: 16}}>
            {selectedBatchString ? selectedBatchString.name : 'Select a Batch'}
          </Text>

          <MaterialIcons
            name="keyboard-arrow-down"
            size={20}
            color="#001d3d"
            style={{paddingLeft: 5}}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.container}>
          <ShimmerPlaceholder style={styles.feesummeryCard} />
          <View style={styles.filterSection}>
            <ShimmerPlaceholder style={styles.searchInput} />
          </View>
          {[1, 2, 3, 4, 5].map((_, index) => (
            <View key={index} style={styles.feeCard}>
              <View style={styles.feeCardHeader}>
                <ShimmerPlaceholder style={styles.studentName} />
                <ShimmerPlaceholder style={[styles.status]} />
              </View>
              <View style={styles.feeCardBody}>
                <ShimmerPlaceholder style={styles.amount} />
                <ShimmerPlaceholder style={styles.date} />
              </View>
            </View>
          ))}
        </View>
      ) : !isBatchSelected ? (
        renderNoBatchSelected()
      ) : (
        <ScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#001d3d']}
              tintColor="#001d3d"
            />
          }>
          {fees.length === 0 ? (
            <View style={styles.noFeeRecordsContainer}>
              <MaterialIcons name="money-off" size={48} color="#ccc" />
              <Text style={styles.noFeeRecordsText}>
                No fee records in this batch
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.feesummeryCard}>
                <LinearGradient
                  colors={['rgb(255,255,255)', 'rgb(229,235,252)']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.card}>
                  <BackgroundGraph />
                  <View style={styles.summaryContent}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Total Expected</Text>
                      <Text style={styles.summaryAmount}>₹{totalFees}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Received</Text>
                      <Text style={[styles.summaryAmount, {color: '#43A047'}]}>
                        ₹{receivedFees}
                      </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Balance</Text>
                      <Text style={[styles.summaryAmount, {color: '#E53935'}]}>
                        ₹{totalFees - receivedFees}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.filterSection}>
                <View style={styles.searchBar}>
                  <MaterialIcons name="search" size={24} color="#666" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by student name"
                    placeholderTextColor="#666"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterScrollView}>
                  {monthOptions.map(month => (
                    <TouchableOpacity
                      key={month}
                      onPress={() => setSelectedMonth(month)}
                      style={[
                        styles.filterChip,
                        selectedMonth === month && styles.selectedChip,
                      ]}>
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedMonth === month && styles.selectedChipText,
                        ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterScrollView}>
                  {filterOptions.map(option => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setPaymentFilter(option)}
                      style={[
                        styles.filterChip,
                        paymentFilter === option && styles.selectedChip,
                      ]}>
                      <Text
                        style={[
                          styles.filterChipText,
                          paymentFilter === option && styles.selectedChipText,
                        ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.feeList}>
                {filteredFees.length > 0 ? (
                  filteredFees.map(record => (
                    <FeeCard key={record.id} record={record} />
                  ))
                ) : (
                  <View style={styles.noResultsContainer}>
                    <MaterialIcons name="search-off" size={48} color="#ccc" />
                    <Text style={styles.noResultsText}>
                      No matching records found
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}

      <BatchSelectorSheet ref={refRBSheet} onBatchSelect={handleBatchSelect} />
    </View>
  );
};
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#001d3d',
  },
  container: {
    flex: 1,
  },
  feesummeryCard: {
    width: '90%',
    height: 130,
    backgroundColor: 'rgb(255,255,255)',
    borderRadius: 10,
    shadowColor: '#1D49A7',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 15,
    marginBottom: 20,
    marginHorizontal: '5%',
    marginTop: 20,
    overflow: 'hidden',
  },
  card: {
    height: '100%',
    borderRadius: 12,
    padding: 15,
    justifyContent: 'center',
    position: 'relative',
  },
  backgroundGraph: {
    position: 'absolute',
    right: -25,
    bottom: -20,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#001d3d',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#ddd',
  },
  filterSection: {
    padding: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderColor: 'rgb(0,0,0)',
    borderWidth: 0.1,
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 10,
    fontSize: 16,
  },
  filterScrollView: {
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  selectedChip: {
    backgroundColor: '#001d3d',
  },
  filterChipText: {
    color: '#666',
    fontWeight: '500',
  },
  selectedChipText: {
    color: '#fff',
  },
  feeList: {
    padding: 20,
  },
  feeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#1D49A7',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  feeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#001d3d',
    flex: 1,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  acknowledgement: {
    fontSize: 12,
    fontWeight: '500',
  },
  feeCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#001d3d',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  noFeeRecordsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  noFeeRecordsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
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

export default FeesScreen;
