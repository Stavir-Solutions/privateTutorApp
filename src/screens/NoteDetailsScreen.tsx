import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import React, {useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import dateconvert from '../components/moment';

const {width} = Dimensions.get('window');

const NoteDetailsScreen = ({route, navigation}) => {
  const note = route.params.note;
  const [downloading, setDownloading] = useState(false);

  const handleOpenAttachment = async url => {
    try {
      Linking.openURL(url);
      // const supported = await Linking.canOpenURL(url);
    
      // if (supported) {
      //   setDownloading(true);

      //   setTimeout(() => {
      //     setDownloading(false);
      //     Linking.openURL(url);
      //   }, 1500);
      // } else {
      //   Alert.alert('Error', `Cannot open URL: ${url}`);
     
      // }
    } catch (error) {
      console.error('An error occurred', error);
      Alert.alert('Error', 'Something went wrong while opening the attachment');
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor="#001d3d" barStyle="light-content" />

      <LinearGradient colors={['#001d3d', '#002855']} style={styles.header}>
        <View style={styles.appBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Note_Create', {note, update: true})
            }
            style={styles.editButton}>
            <MaterialIcons name="edit" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.noteTitle}>{note.Title}</Text>
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>
              Published: {dateconvert(note.publishDate)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content</Text>
          <LinearGradient
            colors={['#ffffff', '#f8f9ff']}
            style={styles.sectionContent}>
            <Text style={styles.contentText}>{note.content}</Text>
          </LinearGradient>
        </View>

        {note.listUrls && note.listUrls.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resources</Text>
            <View style={styles.resourcesList}>
              {note.listUrls.map((url, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.resourceCard}
                  onPress={() => handleOpenAttachment(url)}
                  disabled={downloading}>
                  <LinearGradient
                    colors={['#f8f9ff', '#ffffff']}
                    style={styles.resourceContent}>
                    <View style={styles.resourceIcon}>
                      <MaterialCommunityIcons
                        name="file-document-outline"
                        size={24}
                        color="#001d3d"
                      />
                    </View>
                    <View style={styles.resourceInfo}>
                      <Text style={styles.resourceName}>
                        Resource {index + 1}
                      </Text>
                      <Text style={styles.resourceUrl}>
                        {decodeURIComponent(url).split('/').pop()}
                      </Text>
                    </View>
                    {downloading ? (
                      <ActivityIndicator size="small" color="#001d3d" />
                    ) : (
                      <MaterialIcons
                        name="download"
                        size={24}
                        color="#001d3d"
                      />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 15,
    shadowColor: '#001d3d',
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  editButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  titleSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  dateBadge: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 5,
  },
  dateText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#001d3d',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    elevation: 15,
    shadowColor: '#001d3d',
  },
  contentText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  resourcesList: {
    gap: 12,
  },
  resourceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 15,
    overflow: 'hidden',
    shadowColor: '#001d3d',
  },
  resourceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  resourceIcon: {
    backgroundColor: '#e6f2ff',
    padding: 10,
    borderRadius: 12,
    marginRight: 16,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#001d3d',
    marginBottom: 4,
  },
  resourceUrl: {
    fontSize: 12,
    color: '#666',
  },
});

export default NoteDetailsScreen;
