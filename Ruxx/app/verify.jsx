import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../context/ThemeContext";
import { account, databases, Config, ID, Query } from "../appwriteConfig";

export default function Verify() {
  const { theme } = useTheme();

  const [idType, setIdType] = useState("");
  const [user, setUser] = useState(null);
  const [idDetails, setIdDetails] = useState({
    fullName: "",
    idNumber: "",
    dob: "",
    passportNumber: "",
    passportRegistrationDate: "",
    passportExpiration: "",
    passportCountry: "Nigeria",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await account.get();
        setUser(u);
        setIdDetails((prev) => ({ ...prev, fullName: u.name || "" }));
      } catch (error) {
        console.log("User not logged in:", error.message);
        setMessage("⚠️ You must be logged in to verify your identity.");
      }
    };
    fetchUser();
  }, []);

  const handleInputChange = (name, value) => {
    setIdDetails((prev) => ({ ...prev, [name]: value }));
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
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event.type === "dismissed") return;
    if (selectedDate && datePickerField) {
      setIdDetails((prev) => ({
        ...prev,
        [datePickerField]: formatDate(selectedDate),
      }));
      setDatePickerField(null);
    }
  };

  const showPicker = (fieldName) => {
    setDatePickerField(fieldName);
    setShowDatePicker(true);
  };

  const handleSubmit = async () => {
    setMessage("");
    if (!user) {
      setMessage("⚠️ Please log in to continue.");
      return;
    }
    if (!idType || !file) {
      setMessage("Please select an ID type and upload an image.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: Platform.OS === "ios" ? file.uri.replace("file://", "") : file.uri,
        type: "image/jpeg",
        name: "kyc_doc.jpg",
      });
      formData.append("upload_preset", "vkdfrhb6");
      formData.append("folder", "kyc_docs");
      formData.append("tags", "kyc_verification");

      const cloudRes = await fetch(
        "https://api.cloudinary.com/v1_1/dx4o32jaz/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const cloudData = await cloudRes.json();
      if (!cloudRes.ok)
        throw new Error(cloudData.error?.message || "Cloudinary upload failed");

      let idPayload = {};
      if (idType === "local_id_nin") {
        idPayload = {
          fullName: idDetails.fullName,
          ninNumber: idDetails.idNumber,
        };
      } else if (idType === "national_id_card") {
        idPayload = {
          fullName: idDetails.fullName,
          idNumber: idDetails.idNumber,
          dob: idDetails.dob,
        };
      } else if (idType === "international_passport") {
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
        fullName: idDetails.fullName,
        idType,
        idDetails: JSON.stringify(idPayload),
        imageUrl: cloudData.secure_url,
        status: "pending",
        verified: false,
        submittedAt: new Date().toISOString(),
      };

      const existing = await databases.listDocuments(
        Config.databaseId,
        Config.kycCollectionId,
        [Query.equal("userId", user.$id)]
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

      setMessage("✅ Verification submitted successfully!");
      setIdType("");
      setIdDetails({
        fullName: user.name || "",
        idNumber: "",
        dob: "",
        passportNumber: "",
        passportRegistrationDate: "",
        passportExpiration: "",
        passportCountry: "Nigeria",
      });
      setFile(null);
    } catch (error) {
      console.error("Submission error:", error);
      setMessage("Error: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: theme.background },
        ]}
      >
        <Text style={[styles.title, { color: theme.text }]}>
          KYC Verification
        </Text>

        <Text style={[styles.label, { color: theme.label }]}>
          Select ID Type:
        </Text>
        <View
          style={[
            styles.pickerContainer,
            { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground },
          ]}
        >
          <Picker
            selectedValue={idType}
            onValueChange={(value) => setIdType(value)}
            style={{ color: theme.text }}
            dropdownIconColor={theme.text}
          >
            <Picker.Item label="-- Select --" value="" />
            <Picker.Item label="Local ID (NIN)" value="local_id_nin" />
            <Picker.Item label="National ID Card" value="national_id_card" />
            <Picker.Item
              label="International Passport"
              value="international_passport"
            />
          </Picker>
        </View>

        {idType && (
          <TextInput
            placeholder="Full Name"
            placeholderTextColor={theme.placeholder}
            value={idDetails.fullName}
            editable={false}
            style={[
              styles.input,
              {
                borderColor: theme.inputBorder,
                backgroundColor: theme.inputBackground,
                color: theme.text,
              },
            ]}
          />
        )}

        {idType === "local_id_nin" && (
          <TextInput
            placeholder="NIN Number"
            placeholderTextColor={theme.placeholder}
            value={idDetails.idNumber}
            onChangeText={(text) => handleInputChange("idNumber", text)}
            style={[
              styles.input,
              {
                borderColor: theme.inputBorder,
                backgroundColor: theme.inputBackground,
                color: theme.text,
              },
            ]}
          />
        )}

        {idType === "national_id_card" && (
          <>
            <TextInput
              placeholder="ID Number"
              placeholderTextColor={theme.placeholder}
              value={idDetails.idNumber}
              onChangeText={(text) => handleInputChange("idNumber", text)}
              style={[
                styles.input,
                {
                  borderColor: theme.inputBorder,
                  backgroundColor: theme.inputBackground,
                  color: theme.text,
                },
              ]}
            />
            <TouchableOpacity onPress={() => showPicker("dob")}>
              <TextInput
                placeholder="Date of Birth (DD/MM/YYYY)"
                placeholderTextColor={theme.placeholder}
                value={idDetails.dob}
                editable={false}
                style={[
                  styles.input,
                  {
                    borderColor: theme.inputBorder,
                    backgroundColor: theme.inputBackground,
                    color: theme.text,
                  },
                ]}
              />
            </TouchableOpacity>
          </>
        )}

        {idType === "international_passport" && (
          <>
            <TextInput
              placeholder="Passport Number"
              placeholderTextColor={theme.placeholder}
              value={idDetails.passportNumber}
              onChangeText={(text) => handleInputChange("passportNumber", text)}
              style={[
                styles.input,
                {
                  borderColor: theme.inputBorder,
                  backgroundColor: theme.inputBackground,
                  color: theme.text,
                },
              ]}
            />
            <TouchableOpacity onPress={() => showPicker("dob")}>
              <TextInput
                placeholder="Date of Birth (DD/MM/YYYY)"
                placeholderTextColor={theme.placeholder}
                value={idDetails.dob}
                editable={false}
                style={[
                  styles.input,
                  {
                    borderColor: theme.inputBorder,
                    backgroundColor: theme.inputBackground,
                    color: theme.text,
                  },
                ]}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => showPicker("passportRegistrationDate")}>
              <TextInput
                placeholder="Registration Date (DD/MM/YYYY)"
                placeholderTextColor={theme.placeholder}
                value={idDetails.passportRegistrationDate}
                editable={false}
                style={[
                  styles.input,
                  {
                    borderColor: theme.inputBorder,
                    backgroundColor: theme.inputBackground,
                    color: theme.text,
                  },
                ]}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => showPicker("passportExpiration")}>
              <TextInput
                placeholder="Expiration Date (DD/MM/YYYY)"
                placeholderTextColor={theme.placeholder}
                value={idDetails.passportExpiration}
                editable={false}
                style={[
                  styles.input,
                  {
                    borderColor: theme.inputBorder,
                    backgroundColor: theme.inputBackground,
                    color: theme.text,
                  },
                ]}
              />
            </TouchableOpacity>
            <TextInput
              placeholder="Country"
              placeholderTextColor={theme.placeholder}
              value={idDetails.passportCountry}
              editable={false}
              style={[
                styles.input,
                {
                  borderColor: theme.inputBorder,
                  backgroundColor: theme.inputBackground,
                  color: theme.text,
                },
              ]}
            />
          </>
        )}

        {idType && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={pickImage}
          >
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>
              {file ? "Change Uploaded Image" : "Upload Image"}
            </Text>
          </TouchableOpacity>
        )}

        {file && (
          <Text style={[styles.infoText, { color: theme.text }]}>
            Selected Image: {file.uri.split("/").pop()}
          </Text>
        )}

        {uploading ? (
          <ActivityIndicator
            size="large"
            color={theme.primary}
            style={styles.loading}
          />
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleSubmit}
          >
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>
              Submit Verification
            </Text>
          </TouchableOpacity>
        )}

        {message ? (
          <Text
            style={[
              styles.message,
              {
                color: message.startsWith("Error") ? theme.danger : theme.primary,
              },
            ]}
          >
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  label: { marginTop: 10, fontSize: 16, fontWeight: "500" },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 5,
    marginTop: 5,
  },
  input: {
    marginTop: 10,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
  },
  button: {
    marginTop: 20,
    padding: 15,
    alignItems: "center",
    borderRadius: 5,
  },
  buttonText: { fontWeight: "bold" },
  infoText: { marginTop: 10 },
  loading: { marginTop: 20 },
  message: { marginTop: 20, fontSize: 14 },
});
