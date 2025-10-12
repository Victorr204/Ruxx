import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert 
} from "react-native";
import { createUser } from "../appwriteConfig"; 
import { router } from "expo-router";
import Icon from 'react-native-vector-icons/Feather';


export default function Register() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState("");


 const handleRegister = async () => {
    if (!name || !phone || !email || !password) {
      return Alert.alert("Missing Field", "Please fill in all fields.");
    }

    // basic Nigerian phone validation
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
    if (!phoneRegex.test(phone.trim())) {
      return Alert.alert(
        "Invalid Phone",
        "Please enter a valid Nigerian phone number."
      );
    }

    if (!agreed) {
      return Alert.alert(
        "Agreement Required",
        "You must agree to the Terms of Service and Privacy Policy."
      );
    }

    setLoading(true);
    try {
      // ✅ pass phone to createUser
      const result = await createUser({ name, email, password, phone });

       // If user entered a referral code, record the invite
    if (referralCode.trim()) {
  await fetch("https://ruxx-paystack.vercel.app/api/referrals/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: referralCode.trim(),
      inviteeId: result.accountId,
      inviteeName: name,
      inviteeEmail: email,
      inviteePhone: phone,
    }),
  });
}

      setLoading(false);
      if (result) setModalVisible(true);
    } catch (error) {
      setLoading(false);
      console.error("Registration error:", error);
      Alert.alert("Registration Error", error.message || "Unknown error");
    }
  };


  


  const closeModal = () => {
    setModalVisible(false);
    router.replace("/login"); // redirect after closing modal
  };

return (
    <View style={styles.container}>
      <Text style={styles.title}>Create an Account</Text>

      <TextInput
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholderTextColor="#000"
      />

      {/* ✅ Phone input */}
      <TextInput
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
        placeholderTextColor="#000"
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#000"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.passwordInput}
          secureTextEntry={!showPassword}
          placeholderTextColor="#000"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon name={showPassword ? "eye-off" : "eye"} size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <TextInput
   placeholder="Referral Code (optional)"
   value={referralCode}
   onChangeText={setReferralCode}
   style={styles.input}
   autoCapitalize="characters"
   placeholderTextColor="#000"
    />



      {/* ✅ Terms & Privacy Agreement */}
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setAgreed(!agreed)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, agreed && styles.checkedBox]}>
          {agreed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxText}>
          I agree to the{" "}
          <Text style={styles.link} onPress={() => router.push("/terms")}>
            Terms of Service
          </Text>{" "}
          and{" "}
          <Text style={styles.link} onPress={() => router.push("/privacy")}>
            Privacy Policy
          </Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, !agreed && { backgroundColor: "#999" }]}
        onPress={handleRegister}
        disabled={loading || !agreed}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/login")}>
        <Text style={styles.loginLink}>Already have an account? Login</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Verify Your Email</Text>
            <Text style={styles.modalText}>
              A verification link has been sent to your email. Please verify
              before logging in.
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={closeModal}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5", // light neutral background for black text
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000", // black text
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#000", // black border
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#fff",
    color: "#000", // black text inside input
  },

  passwordContainer: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#000",
  borderRadius: 8,
  paddingHorizontal: 12,
  marginBottom: 15,
  backgroundColor: "#fff",
},
passwordInput: {
  flex: 1,
  paddingVertical: 12,
  color: "#000",
},
eyeIcon: {
  fontSize: 18,
  paddingHorizontal: 8,
  color: "#000",
},

  button: {
    backgroundColor: "#000", // black button
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff", // white text on black button
    fontWeight: "bold",
  },
  loginLink: {
    textAlign: "center",
    color: "#000", // black link
    textDecorationLine: "underline",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingRight: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#000", // black border for checkbox
    borderRadius: 6,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedBox: {
    backgroundColor: "#000", // black when checked
  },
  checkmark: {
    color: "#fff", // white checkmark
    fontWeight: "bold",
    fontSize: 14,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: "#222", // nearly black, readable
  },
  link: {
    color: "#000", // black link
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#000", // black modal title
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 25,
    color: "#222", // nearly black
  },
  modalButton: {
    backgroundColor: "#000", // black modal button
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  modalButtonText: {
    color: "#fff", // white modal button text
    fontWeight: "bold",
    fontSize: 16,
  },
});
