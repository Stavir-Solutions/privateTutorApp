import {
  FlatList,
  Image,
  Keyboard,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getapi, patchApi, postApi } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pick } from '@react-native-documents/picker';
import { base_url } from '../utils/store';
import * as Keychain from 'react-native-keychain';

const ConversationScreen = ({ route, navigation }) => {
  const { deeplink, conversationId } = route?.params;
  const [createmessage, setcreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [TeacherName, setTeacherName] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [formData, setFormData] = useState(null);
  const [conversationData, setConversationData] = useState(null);
  const [student, setstudent] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);

  const loadUserData = async () => {
    try {
      const id = (await AsyncStorage.getItem('TeacherId')) || '';
      const username = (await AsyncStorage.getItem('TeacherName')) || '';
      setTeacherId(id);
      setTeacherName(username);
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data');
    }
  };

  useEffect(() => {
    let messagePolling;

    if (conversationId) {
      messagePolling = setInterval(() => {
        if (!loading && !sendingMessage) {
          refreshMessages();
        }
      }, 5000);
    }

    return () => {
      if (messagePolling) clearInterval(messagePolling);
    };
  }, [conversationId, loading, sendingMessage]);

  useEffect(() => {
    const studentData = route?.params?.student;
    const create = route?.params?.create;
    setstudent(studentData);
    setcreate(create);
    TeacherDetails();
  }, [route?.params?.create && route?.params?.student]);

  useEffect(() => {
    loadUserData();
    if (conversationId) {
   
      getMessageById(conversationId);
    } else {
      setError('No conversation data provided');
    }

    if (flatListRef.current && messages.length > 0) {
      if (Platform.OS === 'android') {
        flatListRef.current.scrollToOffset({
          offset: 99999,
          animated: false,
        });
      } else {
        flatListRef.current.scrollToEnd({ animated: false });
      }
    }
  }, [conversationId]);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        if (Platform.OS === 'android') {
          flatListRef.current.scrollToOffset({
            offset: 99999,
            animated: true,
          });
        } else {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    }
  }, [messages]);

  const refreshMessages = async () => {
    try {
          const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;
      const url = `/messages/${conversationId}`;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Token}`,
      };

      const onResponse = res => {
        if (res) {
          setConversationData(res);

          const originalMessage = {
            id: res.id,
            sender: res.sender,
            senderName: res.senderName,
            senderType: res.senderType,
            content: res.content,
            timestamp: res.timestamp,
            attachmentUrls: res.attachmentUrls || [],
            isOriginal: true,
          };

          const replies = res.replies.map(reply => ({
            id: reply.id || `reply-${Math.random()}`,
            sender: reply.sender,
            senderName: reply.senderName,
            senderType: reply.senderType,
            content: reply.content,
            timestamp: reply.timestamp,
            attachmentUrls: reply.attachmentUrls || [],
            isOriginal: false,
          }));

          const allMessages = [originalMessage, ...replies];
          allMessages.sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
          );

          const currentMessagesIds = new Set(messages.map(msg => msg.id));
          const hasNewMessages = allMessages.some(
            msg => !currentMessagesIds.has(msg.id),
          );

          if (hasNewMessages) {
        
            setMessages(allMessages);

            setTimeout(() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToEnd({ animated: true });
              }
            }, 100);
          }
        }
      };

      const onCatch = err => {
        console.error('Error refreshing messages:', err);
      };

      getapi(url, headers, onResponse, onCatch, navigation);
    } catch (err) {
      console.error('Exception when refreshing messages:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshMessages();
    setRefreshing(false);
  };

  const getMessageById = async id => {
    setLoading(true);
    setError(null);

    try {
          const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;
      const url = `/messages/${id}`;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Token}`,
      };

      const onResponse = res => {
        if (res) {
          setConversationData(res);

          const originalMessage = {
            id: res.id,
            sender: res.sender,
            senderName: res.senderName,
            senderType: res.senderType,
            content: res.content,
            timestamp: res.timestamp,
            attachmentUrls: res.attachmentUrls || [],
            isOriginal: true,
          };

          const replies = res.replies.map(reply => ({
            id: reply.id || `reply-${Math.random()}`,
            sender: reply.sender,
            senderName: reply.senderName,
            senderType: reply.senderType,
            content: reply.content,
            timestamp: reply.timestamp,
            attachmentUrls: reply.attachmentUrls || [],
            isOriginal: false,
          }));

          const allMessages = [originalMessage, ...replies];

          allMessages.sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
          );

          setMessages(allMessages);
        } else {
          setError('Failed to load conversation');
        }
        setLoading(false);
      };

      const onCatch = err => {
        console.error('Error fetching messages:', err);
        setError('Failed to load conversation. Please try again.');
        setLoading(false);
      };

      getapi(url, headers, onResponse, onCatch, navigation);
    } catch (err) {
      console.error('Exception when fetching messages:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const formatTime = dateString => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const groupMessagesByDate = () => {
    const groupedMessages = [];
    let currentDate = null;

    messages.forEach(message => {
      const messageDate = new Date(message.timestamp).toDateString();

      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groupedMessages.push({
          type: 'date',
          date: message.timestamp,
          id: `date-${message.timestamp}`,
        });
      }

      groupedMessages.push({
        type: 'message',
        ...message,
        id: message.id || `message-${message.timestamp}-${Math.random()}`,
      });
    });

    return groupedMessages;
  };

  const isFromCurrentUser = sender => {
    return sender === teacherId;
  };

  const handleAttachment = async () => {
    try {
      const result = await pick({
        type: ['*/*'],
        allowMultiSelection: true,
      });

      if (result && result.length > 0) {
    

        const fileDataArray = result.map(selectedFile => ({
          uri:
            Platform.OS === 'android'
              ? selectedFile.uri
              : selectedFile.uri.replace('file://', ''),
          type: selectedFile.type || 'application/pdf',
          name: selectedFile.name || 'file.pdf',
          size: selectedFile.size,
        }));

        setSelectedAttachments(prevAttachments => [
          ...prevAttachments,
          ...fileDataArray,
        ]);

        setFormData({});
      }
    } catch (err) {
    
      if (err.code !== 'DOCUMENT_PICKER_CANCELED') {
        console.error('Error picking document:', err);
        Alert.alert('Error', 'Failed to select attachment');
      }
    }
  };

  const uploadAttachment = async () => {
    if (!formData || selectedAttachments.length === 0) {
    
      return null;
    }

    try {
   

          const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;
      const fileData = selectedAttachments[0];

      const formDataToUpload = new FormData();
      formDataToUpload.append('file', fileData);

      const url = `${base_url}uploads`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formDataToUpload,
      });

     

      const textResponse = await response.text();
     

      let responseData;
      try {
        responseData = JSON.parse(textResponse);
      } catch (error) {
        console.error('Error parsing response:', error);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${responseData.message || 'Unknown error'}`,
        );
      }

   
      return responseData.url;
    } catch (error) {
      console.error('Error during file upload:', error.message);
      Alert.alert('Error', 'Failed to upload attachment');
      return null;
    }
  };

  const uploadAttachments = async () => {
    if (!formData || selectedAttachments.length === 0) {
   
      return [];
    }

    try {
   

          const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;
      const userId = await AsyncStorage.getItem('TeacherId');
      const uploadPromises = selectedAttachments.map(async fileData => {
        const formDataToUpload = new FormData();
        formDataToUpload.append('file', fileData);
        formDataToUpload.append('userType', 'TEACHER');
        formDataToUpload.append('userId', userId);
        formDataToUpload.append('uploadType', 'messages');

        const url = `${base_url}uploads`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${Token}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formDataToUpload,
        });

      

        const textResponse = await response.text();
    

        let responseData;
        try {
          responseData = JSON.parse(textResponse);
        } catch (error) {
          console.error('Error parsing response:', error);
          throw new Error('Invalid response from server');
        }

        if (!response.ok) {
          throw new Error(
            `Upload failed: ${responseData.message || 'Unknown error'}`,
          );
        }

      
        return responseData.url;
      });

      const attachmentUrls = await Promise.all(uploadPromises);
      return attachmentUrls;
    } catch (error) {
      console.error('Error during file upload:', error.message);
      Alert.alert('Error', 'Failed to upload attachments');
      return [];
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim() === '' && selectedAttachments.length === 0) return;

    setSendingMessage(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const attachmentUrls = await uploadAttachments();

      const newMessageObj = {
        sender: teacherId,
        senderName:
          conversationData?.sender === teacherId
            ? conversationData?.senderName
            : conversationData?.receiverName,
        senderType: 'TEACHER',
        content: messageContent,
        timestamp: new Date().toISOString(),
        attachmentUrls: attachmentUrls,
      };

      setMessages(prevMessages => [...prevMessages, newMessageObj]);

      setSelectedAttachments([]);
      setFormData(null);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    

          const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;
      const url = `messages/${conversationId}/reply`;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Token}`,
      };

      const data = {
        content: messageContent,
        sender: teacherId,
        senderName:
          conversationData?.sender === teacherId
            ? conversationData?.senderName
            : conversationData?.receiverName,
        senderType: 'TEACHER',
        timestamp: new Date().toISOString(),
        attachmentUrls: attachmentUrls,
      };

      const fliteredData = Object.fromEntries(
        Object.entries(data).filter(
          ([_, value]) => value !== '' && value !== null && value !== undefined,
        ),
      );

      const onResponse = res => {
     
        setSendingMessage(false);

        setTimeout(() => {
          refreshMessages();
        }, 500);
      };

      const onCatch = err => {
        console.error('Error sending message:', err);
        setSendingMessage(false);

        Alert.alert('Error', 'Failed to send message. Please try again.');

        setMessages(prevMessages =>
          prevMessages.filter(msg => msg !== newMessageObj),
        );
        setNewMessage(messageContent);
      };

      patchApi(url, headers, fliteredData, onResponse, onCatch, navigation);
    } catch (error) {
      console.error('Exception when sending message:', error);
      setSendingMessage(false);
      Alert.alert(
        'Error',
        'An unexpected error occurred while sending message.',
      );
    }
  };

  const TeacherDetails = async () => {
    try {
      setLoading(true);

          const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;
      const Tid = await AsyncStorage.getItem('TeacherId');
      if (!Token) {
        throw new Error('No token found, authentication required');
      }

      const url = `teachers/${Tid}`;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Token}`,
      };

      const onResponse = res => {
        if (res) {
          setTeacherName(res.firstName + ' ' + res.lastName);
      
        }
        setLoading(false);
      };

      const onCatch = error => {
        console.error('API Error:', error);
        setLoading(false);
      };

      getapi(url, headers, onResponse, onCatch, navigation);
    } catch (error) {
      console.error('TeacherDetails Error:', error.message);
      setLoading(false);
    }
  };

  const Create_message = async () => {
  

    if (newMessage.trim() === '' && selectedAttachments.length === 0) return;

    setSendingMessage(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const attachmentUrls = await uploadAttachments();

      const Batch_id = await AsyncStorage.getItem('batch_id');

      const newMessageObj = {
        subject: 'just chat',
        sender: teacherId,
        senderName: TeacherName,
        senderType: 'TEACHER',
        content: messageContent,
        timestamp: new Date().toISOString(),
        attachmentUrls: attachmentUrls,
        receiverName: student?.firstName ? student?.firstName + student?.lastName : student?.userName,
        receiverType: 'STUDENT',
        receiver: student.id,
        batchId: Batch_id,
      };

      setMessages(prevMessages => [...prevMessages, newMessageObj]);

      setSelectedAttachments([]);
      setFormData(null);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

          const credentials = await Keychain.getGenericPassword();
            const Token = credentials.password;
      const url = `messages`;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Token}`,
      };

      const data = {
        subject: 'just chat',
        sender: teacherId,
        senderName: TeacherName,
        senderType: 'TEACHER',
        content: messageContent,
        timestamp: new Date().toISOString(),
        attachmentUrls: attachmentUrls,
        receiverName: student?.firstName ? student?.firstName +" " + student?.lastName : student?.userName,
        receiverType: 'STUDENT',
        receiver: student.id,
        batchId: Batch_id,
      };

      const onResponse = res => {
      
        setSendingMessage(false);

        setShowSuccess(true);

        if (res && res.id) {
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg === newMessageObj ? { ...msg, id: res.id } : msg,
            ),
          );

          setTimeout(() => {
            navigation.replace('Chat', {
              conversationId: res.id,
              student: student,
              create: false,
            });
          }, 1500);
        }

        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      };

      const onCatch = err => {
        console.error('Error sending message:', err);
        setSendingMessage(false);

        Alert.alert('Error', 'Failed to send message. Please try again.');

        setMessages(prevMessages =>
          prevMessages.filter(msg => msg !== newMessageObj),
        );
        setNewMessage(messageContent);
      };
    
      postApi(url, headers, data, onResponse, onCatch, navigation);
    } catch (error) {
      console.error('Exception when sending message:', error);
      setSendingMessage(false);
      Alert.alert(
        'Error',
        'An unexpected error occurred while sending message.',
      );
    }
  };

  const handleOpenAttachment = url => {
   
    Alert.alert(
      'Attachment',
      typeof url === 'string' ? url.split('/').pop() : url.name || 'Attachment',
      [
        { text: 'Download', onPress: () => Linking.openURL(url) },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const handleRemoveAttachment = index => {
    const newAttachments = [...selectedAttachments];
    newAttachments.splice(index, 1);
    setSelectedAttachments(newAttachments);

    if (newAttachments.length === 0) {
      setFormData(null);
    }
  };
  

  const renderItem = ({ item }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
        </View>
      );
    }

    const isCurrentUser = isFromCurrentUser(item.sender);
       const getFilenameFromUrl = url => {
      try {
        const decodedUrl = decodeURIComponent(url);
        const filename = decodedUrl.split('/').pop();
        if (filename && filename.includes('.') && filename.length > 2) {
          return filename;
        }
        const fileExtension = url.split('.').pop().toLowerCase();
        const fileTypes = {
          pdf: 'PDF Document',
          doc: 'Word Document',
          docx: 'Word Document',
          xls: 'Excel Spreadsheet',
          xlsx: 'Excel Spreadsheet',
          ppt: 'PowerPoint',
          pptx: 'PowerPoint',
          txt: 'Text File',
          zip: 'Zip Archive',
          rar: 'RAR Archive',
          mp3: 'Audio File',
          mp4: 'Video File',
        };
        return fileTypes[fileExtension] || `File.${fileExtension}`;
      } catch (e) {
        return 'Attachment';
      }
    };

    const getFileIcon = url => {
      const fileExtension = url.split('.').pop().toLowerCase();
      switch (fileExtension) {
        case 'pdf':
          return (
            <MaterialIcons
              name="picture-as-pdf"
              size={20}
              color={isCurrentUser ? '#fff' : '#5C6BC0'}
            />
          );
        case 'doc':
        case 'docx':
          return (
            <MaterialIcons
              name="description"
              size={20}
              color={isCurrentUser ? '#fff' : '#5C6BC0'}
            />
          );
        case 'xls':
        case 'xlsx':
          return (
            <MaterialIcons
              name="table-chart"
              size={20}
              color={isCurrentUser ? '#fff' : '#5C6BC0'}
            />
          );
        case 'ppt':
        case 'pptx':
          return (
            <MaterialIcons
              name="slideshow"
              size={20}
              color={isCurrentUser ? '#fff' : '#5C6BC0'}
            />
          );
        case 'zip':
        case 'rar':
          return (
            <MaterialIcons
              name="folder-zip"
              size={20}
              color={isCurrentUser ? '#fff' : '#5C6BC0'}
            />
          );
        case 'mp3':
        case 'wav':
        case 'ogg':
          return (
            <MaterialIcons
              name="audiotrack"
              size={20}
              color={isCurrentUser ? '#fff' : '#5C6BC0'}
            />
          );
        case 'mp4':
        case 'mov':
        case 'avi':
          return (
            <MaterialIcons
              name="movie"
              size={20}
              color={isCurrentUser ? '#fff' : '#5C6BC0'}
            />
          );
        default:
          return (
            <MaterialIcons
              name="insert-drive-file"
              size={20}
              color={isCurrentUser ? '#fff' : '#5C6BC0'}
            />
          );
      }
    };


    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser
            ? styles.userMessageContainer
            : styles.otherMessageContainer,
        ]}>
        <View
          style={[
            styles.messageBubble,
            isCurrentUser
              ? styles.userMessageBubble
              : styles.otherMessageBubble,
          ]}>
          <Text style={styles.messageContent}>{item.content}</Text>

          {item.attachmentUrls && item.attachmentUrls.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {item.attachmentUrls.map((url, index) => (
                <TouchableOpacity
                  key={index}
                  // disabled={url.match(/\.(jpeg|jpg|gif|png)$/) ? true : false}
                  style={styles.attachment}
                  onPress={() => handleOpenAttachment(url)}>
                  {url.match(/\.(jpeg|jpg|gif|png)$/) ? (
                    <Image
                      source={{ uri: url }}
                      style={styles.attachmentImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.fileAttachmentContainer}>
                      {getFileIcon(url)}
                      <Text
                        style={[
                          styles.attachmentText,
                          isCurrentUser
                            ? styles.userAttachmentText
                            : styles.otherAttachmentText,
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="middle">
                        {getFilenameFromUrl(url)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#001d3d" />
        </TouchableOpacity>
        <View style={styles.appBarTitle}>
          <Text style={styles.conversationSubject}>
            {createmessage
              ? student?.firstName ? student?.firstName +" " + student?.lastName : student?.userName
              : conversationData?.sender === teacherId
                ? conversationData?.receiverName
                : conversationData?.senderName}
          </Text>
        </View>
        <TouchableOpacity onPress={}>
          <MaterialIcons name="more-vert" size={28} color="#001d3d" />
        </TouchableOpacity>
      </View>

      {showSuccess && (
        <View style={styles.successNotification}>
          <MaterialIcons name="check-circle" size={24} color="#fff" />
          <Text style={styles.successNotificationText}>
            Message sent successfully
          </Text>
          <TouchableOpacity onPress={() => setShowSuccess(false)}>
            <MaterialIcons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#001d3d" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      ) : createmessage ? (
        <FlatList
          ref={flatListRef}
          data={messages.length > 0 ? groupMessagesByDate() : []}
          renderItem={renderItem}
          keyExtractor={item => item.id || `temp-${Math.random()}`}
          contentContainerStyle={styles.messagesList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#001d3d']}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyConversationContainer}>
              <MaterialCommunityIcons
                name="chat-outline"
                size={60}
                color="#bdbdbd"
              />
              <Text style={styles.emptyConversationText}>
                Start a conversation with {student?.firstName ? student?.firstName +" " + student?.lastName : student?.userName}
              </Text>
              <Text style={styles.emptyConversationSubtext}>
                Send a message to begin chatting
              </Text>
            </View>
          )}
          onLayout={() => {
            if (messages.length > 0 && flatListRef.current) {
              flatListRef.current.scrollToEnd({ animated: false });
            }
          }}
        />
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#d32f2f" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() =>
              conversationId ? getMessageById(conversationId) : null
            }>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={groupMessagesByDate()}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#001d3d']}
            />
          }
          onContentSizeChange={() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToEnd({ animated: true });
            }
          }}
        />
      )}

      {selectedAttachments.length > 0 && (
        <View style={styles.selectedAttachmentsContainer}>
          <FlatList
            data={selectedAttachments}
            horizontal
            renderItem={({ item, index }) => (
              <View style={styles.selectedAttachment}>
                <Text style={styles.selectedAttachmentText} numberOfLines={1}>
                  {item.name ||
                    (typeof item === 'string'
                      ? item.split('/').pop()
                      : 'Attachment')}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveAttachment(index)}>
                  <Ionicons name="close-circle" size={20} color="#001d3d" />
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item, index) => `attachment-${index}`}
          />
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={handleAttachment}>
          <Ionicons name="attach" size={24} color="#666" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            ((newMessage.trim() === '' && selectedAttachments.length === 0) ||
              sendingMessage) &&
            styles.sendButtonDisabled,
          ]}
          disabled={
            (newMessage.trim() === '' && selectedAttachments.length === 0) ||
            sendingMessage
          }
          onPress={() => (createmessage ? Create_message() : sendMessage())}>
          {sendingMessage ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ConversationScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  appBar: {
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  appBarTitle: {
    flex: 1,
    marginHorizontal: 15,
  },
  conversationSubject: {
    fontSize: 18,
    fontWeight: '700',
    color: '#001d3d',
  },
  conversationInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: '#d32f2f',
    textAlign: 'center',
    fontSize: 16,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#001d3d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  messagesList: {
    padding: 10,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 10,
    borderRadius: 18,
    maxWidth: '100%',
  },
  userMessageBubble: {
    backgroundColor: 'rgb(229,235,252)',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#001d3d',
    marginBottom: 3,
  },
  messageContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#e5ebfc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  attachmentsContainer: {
    marginTop: 8,
    minWidth: 150,
  },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 29, 61, 0.1)',
    padding: 6,
    borderRadius: 8,
    marginVertical: 2,
    width: '100%',
  },
  attachmentText: {
    fontSize: 12,
    color: '#001d3d',
    marginLeft: 5,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxHeight: 100,
    marginHorizontal: 8,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#001d3d',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#999',
  },
  selectedAttachmentsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectedAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5ebfc',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    maxWidth: 200,
  },
  selectedAttachmentText: {
    fontSize: 12,
    color: '#001d3d',
    marginRight: 5,
    maxWidth: 150,
  },
  emptyConversationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    minHeight: 300,
  },
  emptyConversationText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#001d3d',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyConversationSubtext: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
    textAlign: 'center',
  },
  successNotification: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  successNotificationText: {
    color: '#fff',
    flex: 1,
    marginLeft: 10,
    fontWeight: '500',
  },
  attachmentImage: {
    width: 100,
    height: 100,
    borderRadius: 4,
  },
    fileAttachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },

  userAttachmentText: {
    color: '#fff',
  },
  otherAttachmentText: {
    color: '#5C6BC0',
  },
});
