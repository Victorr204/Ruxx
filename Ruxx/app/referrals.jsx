// app/referrals.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  FlatList,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../context/ThemeContext";
import { account, databases, Config } from "../appwriteConfig";
import { Query } from "appwrite";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReferralsScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [referralDoc, setReferralDoc] = useState(null);
  const [invites, setInvites] = useState([]);
  const [totalReward, setTotalReward] = useState(0);
  const [pendingReward, setPendingReward] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch or create referral code
  const fetchOrCreateReferral = useCallback(async () => {
    const user = await account.get();

    const existing = await databases.listDocuments(
      Config.databaseId,
      Config.referralsCollectionId,
      [Query.equal("ownerId", user.$id)]
    );

    if (existing.total > 0) {
      setReferralDoc(existing.documents[0]);
      return existing.documents[0];
    }

    const res = await fetch("https://ruxx-paystack.vercel.app/api/referrals/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.$id }),
    });

    if (!res.ok) throw new Error(`Referral create failed: ${res.status}`);
    const doc = await res.json();
    setReferralDoc(doc);
    return doc;
  }, []);

  // Fetch invites and compute rewards
  const fetchInvites = useCallback(async (refDoc) => {
    const list = await databases.listDocuments(
      Config.databaseId,
      Config.invitesCollectionId,
      [Query.equal("referralId", refDoc.$id)]
    );

    // normalize numeric fields so rendering is safe
    const normalized = list.documents.map((invite) => ({
      ...invite,
      rewardPaid: Number(invite.rewardPaid) || 0,
      rewardPending: Number(invite.rewardPending) || 0,
    }));

    setInvites(normalized);

    let released = 0;
    let pending = 0;

    normalized.forEach((invite) => {
      const paid = invite.rewardPaid;
      const pend = invite.rewardPending;
      if (paid > 0) released += paid;
      else if (pend > 0) pending += pend;
    });

    setTotalReward(released);
    setPendingReward(pending);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setErrorMsg(null);
        const doc = await fetchOrCreateReferral();
        await fetchInvites(doc);
      } catch (err) {
        console.error("Referral fetch error:", err);
        setErrorMsg("Unable to load referral data. Please check your internet connection.");
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchOrCreateReferral, fetchInvites]);

  // Pull-to-refresh handler for the screen
  const refreshAll = async () => {
    try {
      setRefreshing(true);
      setErrorMsg(null);
      const doc = await fetchOrCreateReferral();
      await fetchInvites(doc);
    } catch (err) {
      console.error("Refresh error:", err);
      setErrorMsg("Failed to refresh referral data.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopy = async () => {
    if (!referralDoc?.code) return;
    await Clipboard.setStringAsync(referralDoc.code);
    Alert.alert("Copied!", `Referral code ${referralDoc.code} copied.`);
  };

  const handleShare = async () => {
    if (!referralDoc?.code) return;
    // include a referral link where possible (backend may map code to link)
    const link = `https://ruxx.app/ref/${referralDoc.code}`;
    await Share.share({
      message: `Join RuxxPay using my referral code: ${referralDoc.code}\n${link}`,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Referral & Rewards</Text>
      {errorMsg ? (
        <Text style={[styles.errorText, { color: '#d9534f' }]}>{errorMsg}</Text>
      ) : null}
      <Text style={[styles.paragraph, { color: theme.text }]}>
        Invite friends and earn <Text style={{ fontWeight: "bold" }}>1%</Text> of
        their first ₦10,000+ spend. Max 500 invites.
      </Text>

      {referralDoc?.code ? (
        <>
          <View style={styles.codeBox}>
            <Text style={[styles.code, { color: theme.text }]}>{referralDoc.code}</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleCopy}>
            <Text style={styles.buttonText}>Copy Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#4CAF50" }]}
            onPress={handleShare}
          >
            <Text style={styles.buttonText}>Share Code</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={{ color: theme.subtitle, marginVertical: 10 }}>
          No referral code available.
        </Text>
      )}

      <Text style={[styles.subtitle, { color: theme.text }]}>
        Invited Friends ({invites.length}/500)
      </Text>
      <FlatList
        data={invites}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 4 }}>
                <Text style={{ color: theme.text }}>
                  {item.inviteeName} -{" "}
                  {item.rewardPaid > 0
                    ? `Reward ₦${item.rewardPaid.toFixed(2)} released`
                    : item.rewardPending > 0
                    ? `Reward ₦${item.rewardPending.toFixed(2)} pending`
                    : "No reward yet"}
                </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ color: theme.subtitle, marginTop: 8 }}>
            No invites yet.
          </Text>
        }
        refreshing={refreshing}
        onRefresh={refreshAll}
      />

      <Text style={[styles.reward, { color: theme.text }]}>
        Total Released Reward: ₦{totalReward.toFixed(2)}
      </Text>
      {pendingReward > 0 && (
        <Text style={[styles.reward, { color: theme.text }]}>
          Pending Reward: ₦{pendingReward.toFixed(2)}
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  paragraph: { textAlign: "center", marginBottom: 20, fontSize: 16 },
  codeBox: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  code: { fontSize: 20, fontWeight: "bold" },
  button: {
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 10,
    marginVertical: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  subtitle: { fontSize: 18, marginTop: 20, marginBottom: 10, fontWeight: "600" },
  reward: { marginTop: 20, fontSize: 18, fontWeight: "bold" },
  errorText: { textAlign: 'center', marginBottom: 10 },
});
