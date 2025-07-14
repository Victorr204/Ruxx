import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Platform, ScrollView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import {
  account,
  databases,
  Config,
  ID,
  Query
} from '../appwriteConfig';

export default function Verify() {
  const [idType, setIdType] = useState('');
  const [user, setUser] = useState(null);
  const [idDetails, setIdDetails] = useState({
    fullName: '',
    idNumber: '',
    dob: '',
    passportNumber: '',
    passportRegistrationDate: '',
    passportExpiration: '',
    passportCountry: 'Nigeria',
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await account.get();
        setUser(u);
        setIdDetails(prev => ({ ...prev, fullName: u.name || '' }));
      } catch (error) {
        console.log('User not logged in:', error.message);
        setMessage('⚠️ You must be logged in to verify your identity.');
      }
    };
    fetchUser();
  }, []);

  const handleInputChange = (name, value) => {
    setIdDetails(prev => ({ ...prev, [name]: value }));
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setFile(result.assets[0]);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event.type === 'dismissed') return;
    if (selectedDate && datePickerField) {
      setIdDetails(prev => ({ ...prev, [datePickerField]: formatDate(selectedDate) }));
      setDatePickerField(null);
    }
  };

  const showPicker = (fieldName) => {
    setDatePickerField(fieldName);
    setShowDatePicker(true);
  };

  const handleSubmit = async () => {
    setMessage('');
    if (!user) {
      setMessage('⚠️ Please log in to continue.');
      return;
    }
    if (!idType || !file) {
      setMessage('Please select an ID type and upload an image.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
        type: 'image/jpeg',
        name: 'kyc_doc.jpg',
      });
      formData.append('upload_preset', 'vkdfrhb6');
      formData.append('folder', 'kyc_docs');
      formData.append('tags', 'kyc_verification');

      const cloudRes = await fetch('https://api.cloudinary.com/v1_1/dx4o32jaz/image/upload', {
        method: 'POST',
        body: formData,
      });

      const cloudData = await cloudRes.json();
      if (!cloudRes.ok) throw new Error(cloudData.error?.message || 'Cloudinary upload failed');

      let idPayload = {};
      if (idType === 'local_id_nin') {
        idPayload = {
          fullName: idDetails.fullName,
          ninNumber: idDetails.idNumber,
        };
      } else if (idType === 'national_id_card') {
        idPayload = {
          fullName: idDetails.fullName,
          idNumber: idDetails.idNumber,
          dob: idDetails.dob,
        };
      } else if (idType === 'international_passport') {
        idPayload = {
          passportNumber: idDetails.passportNumber,
          fullName: idDetails.fullName,
          dob: idDetails.dob,
          passportRegistrationDate: idDetails.passportRegistrationDate,
          passportExpiration: idDetails.passportExpiration,
          passportCountry: idDetails.passportCountry,
        };
      }

      const payload = {
  userId: user.$id,
  fullName: idDetails.fullName, // ✅ add this at top-level
  idType,
  idDetails: JSON.stringify(idPayload),
  imageUrl: cloudData.secure_url,
  status: 'pending',
  verified: false,
  submittedAt: new Date().toISOString(),
};


      const existing = await databases.listDocuments(
        Config.databaseId,
        Config.kycCollectionId,
        [Query.equal('userId', user.$id)]
      );

      if (existing.total > 0) {
        await databases.updateDocument(
          Config.databaseId,
          Config.kycCollectionId,
          existing.documents[0].$id,
          payload
        );
      } else {
        await databases.createDocument(
          Config.databaseId,
          Config.kycCollectionId,
          ID.unique(),
          payload
        );
      }

      setMessage('✅ Verification submitted successfully!');
      setIdType('');
      setIdDetails({
        fullName: user.name || '',
        idNumber: '',
        dob: '',
        passportNumber: '',
        passportRegistrationDate: '',
        passportExpiration: '',
        passportCountry: 'Nigeria',
      });
      setFile(null);
    } catch (error) {
      console.error('Submission error:', error);
      setMessage('Error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const inputStyle = {
    marginTop: 10,
    borderWidth: 1,
    padding: 10,
    borderColor: '#2e7d32',
    borderRadius: 5,
  };

  const greenButton = {
    marginTop: 20,
    backgroundColor: '#2e7d32',
    padding: 15,
    alignItems: 'center',
    borderRadius: 5,
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#2e7d32' }}>KYC Verification</Text>

      <Text style={{ marginTop: 10 }}>Select ID Type:</Text>
      <Picker
        selectedValue={idType}
        onValueChange={(value) => setIdType(value)}
        style={{ height: 50, width: '100%', color: '#2e7d32' }}
      >
        <Picker.Item label="-- Select --" value="" />
        <Picker.Item label="Local ID (NIN)" value="local_id_nin" />
        <Picker.Item label="National ID Card" value="national_id_card" />
        <Picker.Item label="International Passport" value="international_passport" />
      </Picker>

      {idType && (
        <TextInput
          placeholder="Full Name"
          value={idDetails.fullName}
          editable={false}
          style={[inputStyle, { backgroundColor: '#f0f0f0' }]}
        />
      )}

      {idType === 'local_id_nin' && (
        <TextInput
          placeholder="NIN Number"
          value={idDetails.idNumber}
          onChangeText={(text) => handleInputChange('idNumber', text)}
          style={inputStyle}
        />
      )}

      {idType === 'national_id_card' && (
        <>
          <TextInput
            placeholder="ID Number"
            value={idDetails.idNumber}
            onChangeText={(text) => handleInputChange('idNumber', text)}
            style={inputStyle}
          />
          <TouchableOpacity onPress={() => showPicker('dob')}>
            <TextInput
              placeholder="Date of Birth (DD/MM/YYYY)"
              value={idDetails.dob}
              editable={false}
              style={inputStyle}
            />
          </TouchableOpacity>
        </>
      )}

      {idType === 'international_passport' && (
        <>
          <TextInput
            placeholder="Passport Number"
            value={idDetails.passportNumber}
            onChangeText={(text) => handleInputChange('passportNumber', text)}
            style={inputStyle}
          />
          <TouchableOpacity onPress={() => showPicker('dob')}>
            <TextInput
              placeholder="Date of Birth (DD/MM/YYYY)"
              value={idDetails.dob}
              editable={false}
              style={inputStyle}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => showPicker('passportRegistrationDate')}>
            <TextInput
              placeholder="Registration Date (DD/MM/YYYY)"
              value={idDetails.passportRegistrationDate}
              editable={false}
              style={inputStyle}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => showPicker('passportExpiration')}>
            <TextInput
              placeholder="Expiration Date (DD/MM/YYYY)"
              value={idDetails.passportExpiration}
              editable={false}
              style={inputStyle}
            />
          </TouchableOpacity>
          <TextInput
            placeholder="Country"
            value={idDetails.passportCountry}
            editable={false}
            style={[inputStyle, { backgroundColor: '#f0f0f0' }]}
          />
        </>
      )}

      {idType && (
        <TouchableOpacity style={greenButton} onPress={pickImage}>
          <Text style={{ color: 'white' }}>{file ? 'Change Uploaded Image' : 'Upload Image'}</Text>
        </TouchableOpacity>
      )}

      {file && (
        <Text style={{ marginTop: 10, color: '#2e7d32' }}>
          Selected Image: {file.uri.split('/').pop()}
        </Text>
      )}

      {uploading ? (
        <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 20 }} />
      ) : (
        <TouchableOpacity style={greenButton} onPress={handleSubmit}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Submit Verification</Text>
        </TouchableOpacity>
      )}

      {message ? (
        <Text style={{ marginTop: 20, color: message.startsWith('Error') ? 'red' : 'green' }}>
          {message}
        </Text>
      ) : null}

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={onChangeDate}
          maximumDate={new Date()}
        />
      )}
    </ScrollView>
  );
}
