import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {getapi} from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch, useSelector} from 'react-redux';
import {batch_id, fetch_batchs, selectBatch} from '../utils/authslice';

const BatchItem = ({item, selectedBatch, onSelect}) => (
  <TouchableOpacity
    style={[
      styles.batchItem,
      selectedBatch?.id === item.id && styles.selectedBatchItem,
    ]}
    onPress={() => onSelect(item)}>
    <View style={styles.batchItemContent}>
      <View style={styles.batchItemLeft}>
        <View
          style={[
            styles.batchIcon,
            selectedBatch?.id === item.id && {backgroundColor: '#1A3366'},
          ]}>
          <MaterialCommunityIcons
            name="book-education"
            size={24}
            color={selectedBatch?.id === item.id ? '#FFFFFF' : '#0F1F4B'}
          />
        </View>
        <View style={styles.batchInfo}>
          <Text
            style={[
              styles.batchName,
              selectedBatch?.id === item.id && styles.selectedText,
            ]}>
            {item.name}
          </Text>
          <Text
            style={[
              styles.batchSubject,
              selectedBatch?.id === item.id && styles.selectedSubText,
            ]}>
            {item.subject}
          </Text>
        </View>
      </View>
      <View style={styles.batchItemRight}>
        {selectedBatch?.id === item.id && (
          <MaterialIcons name="check-circle" size={24} color="#fff" />
        )}
      </View>
    </View>
  </TouchableOpacity>
);

const BatchSelectorSheet = React.forwardRef(
  ({onBatchSelect, navigation}, ref) => {
    const dispatch = useDispatch();
    const batchs = useSelector(state => state.auth.batches) || [];
    const reduxSelectedBatch = useSelector(state => state.auth.selectBatch);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBatch, setSelectedBatch] = useState(null);

    const refreshBatches = useCallback(() => {
      console.log('enetring from home screen');
      return dispatch(fetch_batchs())
        .then(response => {
          if (response.payload && response.payload.length > 0) {
            if (!selectedBatch && !reduxSelectedBatch) {
              handleBatchSelect(response.payload[0]);
            }
          }
          return response;
        })
        .catch(error => {
          console.error('Error refreshing batches:', error);
        });
    }, [dispatch, selectedBatch, reduxSelectedBatch]);

    useEffect(() => {
      if (ref && typeof ref === 'object') {
        ref.current = {
          ...ref.current,
          refreshBatches,
        };
      }
    }, [ref, refreshBatches]);

    const handleBatchSelect = useCallback(
      async batch => {
        if (!batch) return;

        setSelectedBatch(batch);

        await AsyncStorage.setItem('batch_id', batch.id.toString());
        await AsyncStorage.setItem('batch', JSON.stringify(batch));

        dispatch(batch_id(batch.id));
        dispatch(selectBatch(batch));

        if (onBatchSelect) {
          onBatchSelect(batch);
        }
      },
      [dispatch, onBatchSelect],
    );

    const handleNavigateToBatchCreate = () => {
      if (navigation) {
        if (ref && ref.current) {
          ref.current.close();
        }

        navigation.navigate('Batch_Create', {update: false});
      }
    };

    useEffect(() => {
      if (reduxSelectedBatch && typeof reduxSelectedBatch === 'object') {
        setSelectedBatch(reduxSelectedBatch);
      } else if (reduxSelectedBatch && typeof reduxSelectedBatch === 'string') {
        try {
          const parsedBatch = JSON.parse(reduxSelectedBatch);
          setSelectedBatch(parsedBatch);
        } catch (error) {
          console.error('Error parsing batch:', error);
        }
      }
    }, [reduxSelectedBatch]);

    useEffect(() => {
      refreshBatches();
    }, []);

    const filteredBatches = batchs.filter(batch => {
      const searchLower = searchQuery.toLowerCase();
      return (
        batch.name.toLowerCase().includes(searchLower) ||
        batch.subject.toLowerCase().includes(searchLower)
      );
    });

    return (
      <RBSheet
        ref={ref}
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={500}
        customStyles={{
          wrapper: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          },
          container: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          },
          draggableIcon: {
            backgroundColor: '#D1D5DB',
            width: 60,
          },
        }}>
        <View style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>Select Batch</Text>
          <View style={styles.searchBarSheet}>
            <Ionicons name="search" size={20} color="rgb(153,153,153)" />
            <TextInput
              placeholder="Search batches"
              style={styles.searchInputSheet}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color="rgb(153,153,153)"
                />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={filteredBatches}
            renderItem={({item}) => (
              <BatchItem
                item={item}
                selectedBatch={selectedBatch}
                onSelect={handleBatchSelect}
              />
            )}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.batchList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              searchQuery ? (
                <Text style={styles.emptyText}>No matching batches found </Text>
              ) : (
                <View style={{justifyContent: 'center', alignItems: 'center'}}>
                  <Text style={styles.emptyText}>No batches available</Text>
                  <TouchableOpacity
                    style={styles.selectBatchButton}
                    onPress={handleNavigateToBatchCreate}>
                    <Text style={styles.selectBatchButtonText}>
                      Create Batch
                    </Text>
                  </TouchableOpacity>
                </View>
              )
            }
          />
        </View>
      </RBSheet>
    );
  },
);

const styles = StyleSheet.create({
  bottomSheetContent: {
    flex: 1,
    padding: 20,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F1F4B',
    marginBottom: 16,
  },
  searchBarSheet: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderColor: 'rgb(0,0,0)',
    borderWidth: 0.1,
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  searchInputSheet: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 10,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 20,
    fontStyle: 'italic',
  },
  batchList: {
    paddingBottom: 20,
  },
  batchItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedBatchItem: {
    backgroundColor: '#0F1F4B',
    borderColor: '#0F1F4B',
  },
  batchItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  batchItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  batchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  batchInfo: {
    flex: 1,
  },
  batchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F1F4B',
    marginBottom: 4,
  },
  batchSubject: {
    fontSize: 14,
    color: '#666',
  },
  batchItemRight: {
    alignItems: 'flex-end',
  },
  selectedText: {
    color: '#fff',
  },
  selectedSubText: {
    color: '#E5E7EB',
  },
  selectBatchButton: {
    width: '50%',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectBatchButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BatchSelectorSheet;
