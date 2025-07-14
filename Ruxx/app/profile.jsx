import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { account, databases, ID, Query, Config } from '../appwriteConfig';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';


// Cloudinary Info
const CLOUD_NAME = 'dx4o32jaz';
const UPLOAD_PRESET = 'vkdfrhb6';

// Reusable alert modal
function CustomAlert({ visible, onClose, type, title, message }) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
  };

  const bgColors = {
    success: '#D1FAE5',
    error: '#FEE2E2',
    warning: '#FEF3C7',
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={alertStyles.backdrop}>
        <View style={[alertStyles.container, { backgroundColor: bgColors[type] || '#eee' }]}>
          <Text style={alertStyles.icon}>{icons[type] || ''}</Text>
          <Text style={alertStyles.title}>{title}</Text>
          <Text style={alertStyles.message}>{message}</Text>
          <TouchableOpacity style={alertStyles.button} onPress={onClose}>
            <Text style={alertStyles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}


export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({});
  const [editingSection, setEditingSection] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertProps, setAlertProps] = useState({ type: 'success', title: '', message: '' });

  const [form, setForm] = useState({
    name: '',
    age: '',
    phone: '',
  });

  const showAlert = ({ type, title, message }) => {
    setAlertProps({ type, title, message });
    setAlertVisible(true);
  };

  const loadUserData = async () => {
    try {
      const user = await account.get();
      const res = await databases.listDocuments(Config.databaseId, Config.userCollectionId, [
        Query.equal('userId', user.$id),
      ]);

      if (res.documents.length === 0) {
        throw new Error('User document not found.');
      }

      const data = res.documents[0];
      setUserData(data);
      setForm({
        name: data.name || '',
        age: data.age || '',
        phone: data.phone || '',
      });
    } catch (error) {
      console.log(error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to load user data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSection = async () => {
    try {
      const user = await account.get();
      const res = await databases.listDocuments(Config.databaseId, Config.userCollectionId, [
        Query.equal('userId', user.$id),
      ]);

      if (res.documents.length === 0) return;
      const docId = res.documents[0].$id;

      await databases.updateDocument(Config.databaseId, Config.userCollectionId, docId, {
        name: form.name,
        age: parseFloat(form.age),
        phone: parseFloat(form.phone),
      });

      showAlert({ type: 'success', title: 'Updated', message: 'Data updated successfully' });
      setEditingSection(null);
      loadUserData();
    } catch (error) {
      console.log(error);
      showAlert({ type: 'error', title: 'Error', message: 'Update failed. Try again.' });
    }
  };

  const pickAndUploadImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert({
        type: 'warning',
        title: 'Permission Denied',
        message: 'Please allow photo access to continue.',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      try {
        const localUri = result.assets[0].uri;
        const formData = new FormData();
        formData.append('file', {
          uri: localUri,
          type: 'image/jpeg',
          name: 'upload.jpg',
        });
        formData.append('upload_preset', UPLOAD_PRESET);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await response.json();
        if (data.secure_url) {
          const user = await account.get();
          const res = await databases.listDocuments(Config.databaseId, Config.userCollectionId, [
            Query.equal('userId', user.$id),
          ]);

          if (res.documents.length === 0) return;

          const docId = res.documents[0].$id;

          await databases.updateDocument(Config.databaseId, Config.userCollectionId, docId, {
            profilePic: data.secure_url,
          });

          showAlert({
            type: 'success',
            title: 'Success',
            message: 'Profile picture updated!',
          });
          loadUserData();
        } else {
          throw new Error('Image upload failed');
        }
      } catch (error) {
        console.error(error);
        showAlert({
          type: 'error',
          title: 'Upload Failed',
          message: 'Failed to upload image. Try again.',
        });
      }
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4ADE80" />
      </View>
    );
  }

  const handleLogout = async () => {
  try {
    await account.deleteSession('current');
    router.replace('/login'); // Redirect to login screen
  } catch (err) {
    showAlert({
      type: 'error',
      title: 'Logout Failed',
      message: err.message || 'Could not log out. Try again.',
    });
  }
};


return (
  <SafeAreaView style={styles.page}>
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.imageSection}>
        <TouchableOpacity onPress={pickAndUploadImage}>
          <Image
            source={{
              uri: userData.profilePic || 'https://placehold.co/120x120?text=Profile',
            }}
            style={styles.profileImage}
          />
          <Text style={styles.imageText}>Tap to change profile picture</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Information</Text>
        {editingSection === 'user' ? (
          <>
            <TextInput
              placeholder="Name"
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              style={styles.input}
            />
            <TextInput
              placeholder="Age"
              keyboardType="numeric"
              value={form.age}
              onChangeText={(text) => setForm({ ...form, age: text })}
              style={styles.input}
            />
            <TextInput
              placeholder="Phone"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(text) => setForm({ ...form, phone: text })}
              style={styles.input}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={updateSection}>
              <Text style={styles.saveText}>Save Info</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text>Name: {userData.name}</Text>
            <Text>Age: {userData.age}</Text>
            <Text>Phone: {userData.phone}</Text>
            <Text>Email: {userData.email}</Text>
            <TouchableOpacity style={styles.updateBtn} onPress={() => setEditingSection('user')}>
              <Text style={styles.updateText}>View & Update</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>

    <View style={styles.logoutWrapper}>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>

    <CustomAlert
      visible={alertVisible}
      onClose={() => setAlertVisible(false)}
      type={alertProps.type}
      title={alertProps.title}
      message={alertProps.message}
    />
  </SafeAreaView>
);



}

const alertStyles = StyleSheet.create({
  
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  icon: { fontSize: 40, marginBottom: 10 },
  title: { fontWeight: '700', fontSize: 18, marginBottom: 8 },
  message: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 15 },
  button: {
    backgroundColor: '#4ADE80',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    minWidth: 100,
  },
  buttonText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
});



const styles = StyleSheet.create({
   page: {
  flex: 1,
  backgroundColor: '#fff',
},

scrollContent: {
  padding: 20,
  paddingBottom: 40,
},

  container: {
    padding: 15,
    paddingBottom: 50,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#4ADE80',
  },
  imageText: {
    marginTop: 8,
    color: '#4ADE80',
    fontWeight: '600',
  },
  section: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    marginVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4ade80',
  },
  saveBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  saveText: {
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
  },
  updateBtn: {
    marginTop: 10,
    backgroundColor: '#22c55e',
    paddingVertical: 8,
    borderRadius: 6,
  },
  updateText: {
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

logoutWrapper: {
  padding: 16,
  borderTopWidth: 1,
  borderColor: '#e5e7eb',
  backgroundColor: '#fff',
},

logoutBtn: {
  backgroundColor: '#ef4444',
  paddingVertical: 12,
  borderRadius: 6,
  alignSelf: 'center',
  width: '100%',
},

logoutText: {
  color: '#fff',
  fontWeight: '700',
  textAlign: 'center',
},

});
