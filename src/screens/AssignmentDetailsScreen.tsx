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

const AssignmentDetailsScreen = ({route, navigation}) => {
  const assignment = route.params.assignment;
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

  const isExpired = new Date() > new Date(assignment.submissionDate);

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
              navigation.navigate('Assignment_Creation', {
                assignment,
                update: true,
              })
            }
            style={styles.editButton}>
            <MaterialIcons name="edit" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.assignmentTitle}>{assignment.title}</Text>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: isExpired ? '#ffb5a7' : '#E8F5E9'},
            ]}>
            <Text
              style={[
                styles.statusText,
                {color: isExpired ? '#e53935' : '#43A047'},
              ]}>
              {isExpired ? 'Expired' : 'Active'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.container}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Published</Text>
            <Text style={styles.statValue}>
              {dateconvert(assignment.publishDate)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Due Date</Text>
            <Text style={styles.statValue}>
              {dateconvert(assignment.submissionDate)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <LinearGradient
            colors={['#ffffff', '#f8f9ff']}
            style={styles.sectionContent}>
            <Text style={styles.detailsText}>{assignment.details}</Text>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attachments</Text>
          <View style={styles.attachmentsList}>
            {assignment.attachmentUrls.map((url, index) => (
              <TouchableOpacity
                key={index}
                style={styles.attachmentCard}
                onPress={() => handleOpenAttachment(url)}
                disabled={downloading}>
                <LinearGradient
                  colors={['#f8f9ff', '#ffffff']}
                  style={styles.attachmentContent}>
                  <View style={styles.attachmentIcon}>
                    <MaterialCommunityIcons
                      name="file-pdf-box"
                      size={24}
                      color="#001d3d"
                    />
                  </View>
                  <View style={styles.attachmentInfo}>
                    <Text style={styles.attachmentName}>
                      Attachment {index + 1}
                    </Text>
                    <Text style={styles.attachmentUrl}>
                      {decodeURIComponent(url).split('/').pop()}
                    </Text>
                  </View>
                  {downloading ? (
                    <ActivityIndicator size="small" color="#001d3d" />
                  ) : (
                    <MaterialIcons name="download" size={24} color="#001d3d" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  assignmentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: width * 0.44,
    elevation: 15,
    shadowColor: '#001d3d',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#001d3d',
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
  detailsText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  attachmentsList: {
    gap: 12,
  },
  attachmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 15,
    overflow: 'hidden',
    shadowColor: '#001d3d',
  },
  attachmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  attachmentIcon: {
    backgroundColor: '#f0f3ff',
    padding: 10,
    borderRadius: 12,
    marginRight: 16,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#001d3d',
    marginBottom: 4,
  },
  attachmentUrl: {
    fontSize: 12,
    color: '#666',
  },
});

export default AssignmentDetailsScreen;
