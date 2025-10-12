// screens/privacy.jsx
import React from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function PrivacyScreen() {
  const { theme } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.mainTitle, { color: theme.text }]}>
        Privacy Policy
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        1. Introduction
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        Ruxx Digital Services (“we,” “us,” or “our”) operates the Ruxx Pay
        mobile app. We respect your privacy and are committed to protecting
        your personal data. This Policy explains how we collect, use,
        disclose, and safeguard your information when you use Ruxx Pay.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        2. Information We Collect
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        • Registration Data: name, email, phone number, date of birth.  
        {"\n"}• Transaction Data: airtime/data top-ups, subscription details,
        gift card purchases, betting activity.  
        {"\n"}• Payment Data: bank account or card details via Paystack
        Permanent Virtual Account.  
        {"\n"}• Technical Data: device identifiers, IP address, OS version,
        app usage logs.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        3. How We Use Your Information
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        • To create and manage your account and virtual account.  
        {"\n"}• To process transactions, refunds, and VAS requests.  
        {"\n"}• To improve our app’s functionality and user experience.  
        {"\n"}• To communicate updates, promotions, and security alerts.  
        {"\n"}• To comply with legal and regulatory obligations.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        4. Information Sharing & Disclosure
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        We may share your data with:  
        {"\n"}• Paystack and other payment processors for transaction
        authorization.  
        {"\n"}• Network and TV providers, betting partners, gift card issuers
        to fulfill your orders.  
        {"\n"}• Regulators, law enforcement, or courts when required by law.  
        {"\n"}• Service providers who support app operations under NDA.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        5. Cookies & Tracking
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        We do not use browser cookies. We collect technical and analytics data
        via secure SDKs to optimize performance and diagnose issues.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        6. Data Security
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        We implement industry-standard measures (encryption, secure servers,
        access controls) to protect your data. Despite our efforts, no method
        of transmission or storage is 100% secure—use strong credentials and
        report suspicious activity.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        7. Data Retention
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        We retain your personal and transaction data as long as necessary to
        provide services, comply with legal obligations, resolve disputes, and
        enforce our agreements.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        8. Your Rights
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        You may:  
        {"\n"}• Access or correct your personal information in-app.  
        {"\n"}• Request data deletion (subject to legal retention).  
        {"\n"}• Opt out of promotional communications.  
        {"\n"}• Lodge a complaint with a supervisory authority.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        9. Children’s Privacy
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        Ruxx Pay is not directed to children under 18. We do not knowingly
        collect data from minors. If you believe we have, contact us to
        remove that information.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        10. Changes to This Policy
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        We may update this Policy from time to time. Significant changes will
        be communicated in-app or via email. Your continued use of Ruxx Pay
        after notice indicates your acceptance.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        11. Governing Law & Contact
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        This Policy is governed by the laws of Nigeria. For
        questions, requests, or to exercise your rights, email us at
        info@ruxxdigital.name.ng
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  content: {
    paddingVertical: 24,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
});