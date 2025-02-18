import React, {useEffect, useState} from 'react';
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

const BatchItem = ({item, selectedBatch, onSelect}) => (
  <TouchableOpacity
    style={[
      styles.batchItem,
      selectedBatch.id === item.id && styles.selectedBatchItem,
    ]}
    onPress={() => onSelect(item)}>
    <View style={styles.batchItemContent}>
      <View style={styles.batchItemLeft}>
        <View style={styles.batchIcon}>
          <MaterialCommunityIcons
            name="book-education"
            size={24}
            color={'#0F1F4B'}
          />
        </View>
        <View style={styles.batchInfo}>
          <Text
            style={[
              styles.batchName,
              selectedBatch.id === item.id && styles.selectedText,
            ]}>
            {item.name}
          </Text>
          <Text
            style={[
              styles.batchSubject,
              selectedBatch.id === item.id && styles.selectedSubText,
            ]}>
            {item.subject}
          </Text>
        </View>
      </View>
      <View style={styles.batchItemRight}>
        {selectedBatch.id === item.id && (
          <MaterialIcons name="check-circle" size={24} color="#fff" />
        )}
      </View>
    </View>
  </TouchableOpacity>
);

const BatchSelectorSheet = React.forwardRef(
  ({selectedBatch, onBatchSelect}, ref) => {
    const [batchs, setBatchs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const fetch_batchs = async () => {
      const Token = await AsyncStorage.getItem("Token")
      const url = 'batches/teacher/660e8400-e29b-41d4-a716-446655440001';
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Token}`
      };
      const onResponse = res => {
        console.log(res);
        setBatchs(res);
      };
      const onCatch = res => {
        console.log('Error');
        console.log(res);
      };
      getapi(url, headers, onResponse, onCatch);
    };

    useEffect(() => {
      fetch_batchs();
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
                onSelect={onBatchSelect}
              />
            )}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.batchList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'No matching batches found'
                  : 'No batches available'}
              </Text>
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
});

export default BatchSelectorSheet;
