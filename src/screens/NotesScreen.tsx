import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {getapi} from '../utils/api';
import dateconvert from '../components/moment';
import BatchSelectorSheet from '../components/BatchSelectorSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotesScreen = ({navigation}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState([]);

  const [selectedBatch, setSelectedBatch] = useState({
    subject: 'Algebra',
    name: 'Math 1012',
    id: '212e46a9-9a1d-4906-a27e-5ef03e989955',
  });

  const refRBSheet = useRef();

  const handleBatchSelect = batch => {
    setSelectedBatch(batch);
    refRBSheet.current.close();
  };

  const Notes_fetch = async () => {
    const Token = await AsyncStorage.getItem('Token');
    const url = '/notes/batch/123e4567-e89b-12d3-a456-426614174000';
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Token}`,
    };
    const onResponse = res => {
      console.log('hiii');
      console.log(res);
      setNotes(res);
    };

    const onCatch = res => {
      console.log('Error');
      console.log(res);
    };
    getapi(url, headers, onResponse, onCatch);
  };

  useEffect(() => {
    Notes_fetch();
    console.log(notes);
    console.log('notes fetch');
  }, [1]);

  const NoteCard = ({item}) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('NoteDetails', {note: item})}
      style={styles.noteCard}>
      <View style={styles.noteTypeIcon}>
        <MaterialIcons name="description" size={24} color="#FF9800" />
      </View>
      <View style={styles.noteDetailsContainer}>
        <Text style={styles.noteTitle} numberOfLines={1}>
          {item.Title}
        </Text>
        <View style={styles.noteDetails}>
          <Text style={styles.noteContent} numberOfLines={2}>
            {item.content}
          </Text>
          <Text style={styles.noteDate}>{dateconvert(item.publishDate)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notes</Text>

        <TouchableOpacity
          onPress={() => refRBSheet.current.open()}
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
            {selectedBatch.name}
          </Text>

          <MaterialIcons
            name="keyboard-arrow-down"
            size={20}
            color="#001d3d"
            style={{paddingLeft: 5}}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={24} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search notes"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('Note_Create')}>
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={notes}
          renderItem={({item}) => <NoteCard item={item} />}
          keyExtractor={item => item.id.toString()}
          scrollEnabled={false}
          style={styles.notesList}
        />
      </ScrollView>
      <BatchSelectorSheet
        ref={refRBSheet}
        selectedBatch={selectedBatch}
        onBatchSelect={handleBatchSelect}
      />
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
  batchSelector: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  batchButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: '5%',
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  batchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#001d3d',
  },
  batchSubject: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  batchIcon: {
    marginLeft: 10,
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderColor: 'rgb(0,0,0)',
    borderWidth: 0.1,
    borderRadius: 25,
    paddingHorizontal: 15,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 10,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#001d3d',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginLeft: 10,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  notesList: {
    paddingVertical: 20,
    paddingHorizontal: '5%',
  },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#1D49A7',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  noteDetailsContainer: {
    flex: 1,
    paddingRight: 5,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F1F4B',
    marginBottom: 4,
  },
  noteDetails: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  noteContent: {
    flex: 1,
    color: '#666',
    fontSize: 12,
    marginRight: 8,
    lineHeight: 16,
  },
  noteDate: {
    fontSize: 10,
    color: '#666',
    flexShrink: 0,
    marginTop: 2,
  },
});

export default NotesScreen;
