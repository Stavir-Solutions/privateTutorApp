import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Share,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import {deleteapi, getapi, patchApi, postapi, putapi} from '../utils/api';
import dateconvert from '../components/moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as Keychain from 'react-native-keychain';

const FeePaymentDetailsScreen = ({route, navigation}) => {
  const {feeRecord, name} = route.params;
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleMarkAsReceived = async () => {
    setIsSaving(true);

    Fees_update();
  };

  const isImageFile = url => {
    if (!url) return false;
    const lowerCaseUrl = url.toLowerCase();
    return (
      lowerCaseUrl.endsWith('.jpg') ||
      lowerCaseUrl.endsWith('.jpeg') ||
      lowerCaseUrl.endsWith('.png') ||
      lowerCaseUrl.endsWith('.gif')
    );
  };

  const isPdfFile = url => {
    if (!url) return false;
    return url.toLowerCase().endsWith('.pdf');
  };

  const openPdfFile = url => {
    Linking.openURL(url);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Fee Payment Details for ${feeRecord.studentName}`,
        title: 'Fee Payment Details',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share');
    }
  };

  const handleDelete = (id: any) => {
    Alert.alert(
      'Delete Fee Record',
      'Do you really want to delete?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            await Delete_FeeRecord(id);
          },
        },
      ],
      {cancelable: true},
    );
  };

  const Delete_FeeRecord = async (id: any) => {
    setLoading(true);

    // const loadingTimeout = setTimeout(() => {
    //   setLoading(false);
    // }, 10000);

        const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;
    const url = `fee-records/${id}`;
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Token}`,
    };
    const onResponse = async res => {
    
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigation.goBack();

      setLoading(false);
    };

    const onCatch = res => {
     
      setLoading(false);
    };
    deleteapi(url, headers, onResponse, onCatch, navigation);
  };

  const Fees_update = async () => {
    try {
          const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;
      if (!Token) {
        throw new Error('No token found, authentication required');
      }

      const url = `fee-records/${feeRecord.id}`;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Token}`,
      };

      const {id, batchId, createdAt, studentId, amount, ...filteredFeeRecord} =
        feeRecord;
      const body = {
        ...filteredFeeRecord,
        status: 'paid',
        notes: 'Payment received in full.',
        teacherAcknowledgement: true,
      };

      const onResponse = async res => {
        Toast.show({
          type: 'success',
          text1: 'Fees marking',
          text2: 'Fees has been successfully updated!',
          position: 'top',
          visibilityTime: 3000,
          autoHide: true,
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Alert.alert('Success', 'Fee payment marked as received');
        navigation.goBack();
      };

      const onCatch = async error => {
     
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to Marking fees!',
          position: 'top',
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Alert.alert('Success', 'Fee payment marked as received');
        navigation.goBack();
      };

      await patchApi(url, headers, body, onResponse, onCatch, navigation);
      
    } catch (error) {
     
      Alert.alert('Error', error.message);
    }
  };

  const renderAttachment = () => {
    if (!feeRecord.attachmentUrl) {
      return (
        <Text style={styles.noAttachmentText}>No payment proof available</Text>
      );
    }

    if (isImageFile(feeRecord.attachmentUrl)) {
      return (
        <View style={styles.imageContainer}>
          <Image
            source={{uri: feeRecord.attachmentUrl}}
            style={styles.paymentProofImage}
            resizeMode="contain"
          />
        </View>
      );
    } else if (isPdfFile(feeRecord.attachmentUrl)) {
      return (
        <TouchableOpacity
          style={styles.pdfContainer}
          onPress={() => openPdfFile(feeRecord.attachmentUrl)}>
          <MaterialIcons name="picture-as-pdf" size={38} color="#E53935" />
          <Text style={styles.pdfText}>View PDF Document</Text>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity
          style={styles.unknownFileContainer}
          onPress={() => Linking.openURL(feeRecord.attachmentUrl)}>
          <MaterialIcons name="insert-drive-file" size={48} color="#001d3d" />
          <Text style={styles.fileText}>View Attachment</Text>
        </TouchableOpacity>
      );
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
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fee Payment Details</Text>

          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <MaterialIcons name="share" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.statusBadge}>
            <Text
              style={[
                styles.statusText,
                {color: feeRecord.status === 'paid' ? '#43A047' : '#E53935'},
              ]}>
              {feeRecord.status.toUpperCase()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Student Name</Text>
            <Text style={styles.value}>{name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>
              ₹{feeRecord.amount.toLocaleString()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Due Date</Text>
            <Text style={styles.value}>{dateconvert(feeRecord.dueDate)}</Text>
          </View>

          {feeRecord.status === 'paid' && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Payment Date</Text>
              <Text style={styles.value}>
                {dateconvert(feeRecord.paymentDate)}
              </Text>
            </View>
          )}

          {feeRecord.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.value}>{feeRecord.notes}</Text>
            </View>
          )}

          {feeRecord.status === 'paid' && (
            <View style={styles.attachmentSection}>
              <Text style={styles.attachmentTitle}>Payment Proof</Text>
              {renderAttachment()}
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          {feeRecord.status == 'paid' &&
            feeRecord.teacherAcknowledgement !== true && (
              <TouchableOpacity
                style={[styles.button, styles.receiveButton]}
                onPress={handleMarkAsReceived}
                disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="check-circle" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Mark as Received</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={() => handleDelete(feeRecord.id)}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="delete" size={24} color="#fff" />
                <Text style={styles.buttonText}>Delete Record</Text>
              </>
            )}
          </TouchableOpacity>

          {feeRecord.status === 'paid' && feeRecord.teacherAcknowledgement && (
            <View style={styles.acknowledgedContainer}>
              <MaterialIcons name="verified" size={24} color="#43A047" />
              <Text style={styles.acknowledgedText}>Payment Acknowledged</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#001d3d',
    fontWeight: '500',
  },
  attachmentSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
  },
  attachmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#001d3d',
    marginBottom: 12,
  },
  imageContainer: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  paymentProofImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  pdfContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  pdfText: {
    fontSize: 16,
    color: '#001d3d',
    fontWeight: '500',
    marginLeft: 16,
  },
  unknownFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  fileText: {
    fontSize: 16,
    color: '#001d3d',
    fontWeight: '500',
    marginLeft: 16,
  },
  noAttachmentText: {
    color: '#666',
    fontStyle: 'italic',
    padding: 12,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  receiveButton: {
    backgroundColor: '#43A047',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#E53935',
  },
  acknowledgedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f1f8e9',
    borderWidth: 1,
    borderColor: '#c5e1a5',
    gap: 8,
  },
  acknowledgedText: {
    color: '#43A047',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FeePaymentDetailsScreen;
