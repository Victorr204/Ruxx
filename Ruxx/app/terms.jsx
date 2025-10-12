// screens/terms.jsx
import React from "react";
import { Text, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function TermsScreen() {
  const { theme } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.mainTitle, { color: theme.text }]}>
        Ruxx Pay Terms of Service
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        1. Introduction
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        These Terms of Service govern your use of Ruxx Pay, a mobile application
        provided by Ruxx Digital Services. By downloading, installing, or using
        Ruxx Pay, you agree to comply with and be bound by these Terms.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        2. Definitions
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        “App” means Ruxx Pay. “Company” means Ruxx Digital Services. “User”
        means any individual or entity who registers for or uses the App.
        “Services” include airtime & data top-up, TV subscriptions, betting
        facilitation, gift cards, and Netflix subscriptions.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        3. Account Registration & Virtual Account
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        To use Ruxx Pay, you must register and provide accurate personal
        information. Upon registration, we create a Paystack Permanent Virtual
        Account (PVA) unique to you. You authorize us to map deposits made to
        your PVA to your in-app wallet.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        4. Services Offered
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        Ruxx Pay enables you to:
        {"\n"}• Top up airtime and mobile data  
        {"\n"}• Subscribe to DStv, GOtv, StarTimes, and other TV packages  
        {"\n"}• Fund bets with partnered bookmakers  
        {"\n"}• Purchase and redeem gift cards  
        {"\n"}• Subscribe to Netflix plans  
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        5. Fees and Pricing
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        Standard transaction fees may apply depending on the service. A
        non-refundable 5% processing fee is charged on all gift card purchases.
        All other fees (airtime, data, TV, betting, Netflix) are displayed at
        checkout before you confirm payment.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        6. Payment Authorization
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        By initiating a transaction, you authorize Ruxx Digital Services and
        Paystack to process payments on your behalf. You confirm that you are
        the rightful owner of the payment method and that all provided
        information is accurate.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        7. Gift Cards & Netflix Subscriptions
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        Gift cards and Netflix subscription codes are delivered instantly
        within the app. Redemption and validity are subject to third-party
        issuer terms. We are not responsible for issues arising from misuse or
        non-acceptance by the issuer.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        8. Betting Transactions
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        Betting services are facilitated through licensed partners. You
        acknowledge the risks of wagering and agree to comply with all
        applicable laws. Users under 18 years old are strictly prohibited from
        using the betting feature.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        9. Refunds & Cancellations
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        All sales are final. Refunds or cancellations are granted only in case
        of technical failures on our end. To request a review, contact support
        within 24 hours of your transaction.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        10. User Responsibilities
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        You agree to:
        {"\n"}• Provide accurate account information  
        {"\n"}• Keep your login credentials secure  
        {"\n"}• Use Services only for lawful purposes  
        {"\n"}• Not impersonate others or tamper with the App  
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        11. Intellectual Property
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        All content and branding in Ruxx Pay are owned by Ruxx Digital Services
        or its licensors. You may not reproduce, distribute, or create
        derivative works without our express written consent.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        12. Disclaimers & Limitation of Liability
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        The App is provided “as is.” We disclaim all warranties, express or
        implied. To the fullest extent permitted by law, Ruxx Digital Services
        is not liable for any indirect, incidental, or consequential damages.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        13. Privacy & Data Protection
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        Our Privacy Policy governs data collection, use, and sharing. By using
        the App, you consent to our collection and processing of your personal
        information as described at ruxxdigital.com/privacy.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        14. Changes to Terms
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        We may update these Terms at any time. We will notify you of material
        changes via the App or email. Continued use after notice constitutes
        acceptance.
      </Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        15. Governing Law & Contact
      </Text>
      <Text style={[styles.paragraph, { color: theme.text }]}>
        These Terms is governed by the laws of Nigeria. For
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