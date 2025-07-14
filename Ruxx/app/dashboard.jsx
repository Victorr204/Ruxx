import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { account, databases, Config } from '../appwriteConfig';
import { Query } from 'appwrite';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({});
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
  try {
    // 1. Get the current user
    const currentUser = await account.get();
    console.log("Current user:", currentUser);
    setUser(currentUser);

    // 2. Fetch user document
    const userDocs = await databases.listDocuments(
      Config.databaseId,
      Config.userCollectionId,
      [Query.equal('userId', currentUser.$id)]
    );

    // 3. Fetch KYC status
    const kycDocs = await databases.listDocuments(
      Config.databaseId,
      Config.kycCollectionId,
      [Query.equal('userId', currentUser.$id)] 
    );

    if (kycDocs.total > 0) {
      const status = (kycDocs.documents[0].status || '').toLowerCase();
      const validStatuses = ['verified', 'rejected', 'pending', 'submitted'];
      setKycStatus(validStatuses.includes(status) ? status : 'pending');
    } else {
      setKycStatus(null);
    }

    if (!userDocs.total) throw new Error('User data not found');
    const doc = userDocs.documents[0];
    console.log("Fetched userData:", doc);
    setUserData(doc);
  } catch (error) {
    console.log('Appwrite error:', JSON.stringify(error, null, 2));
    Alert.alert('Error', error.message || 'An unexpected error occurred');
  } finally {
    setLoading(false);
  }
};
    fetchUser();
  }, []);
  

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4ADE80" />
      </View>
    );
  } 

  if (!user || !userData) {
    return (
      <View style={styles.center}>
        <Text>User not found.</Text>
      </View>
    );
  }

  const services = [
    { id: '1', name: 'Airtime', route: '/airtimePage' },
    { id: '2', name: 'Data', route: '/dataPage' },
    { id: '3', name: 'TV Subscription', route: '/TVPage' },
    { id: '4', name: 'Electricity', route: '/ElectricityPage' },
    { id: '4', name: 'betting', route: '/BettingPage' },
    { id: '4', name: 'Education', route: '/electricity' },
  ];

  const renderKycBadge = () => {
    if (kycStatus === 'verified') {
      return <Text style={styles.verifiedBadge}>✔ Verified</Text>;
    }

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {kycStatus === 'rejected' && <Text style={styles.rejectedBadge}>❌ Rejected</Text>}
        {kycStatus === 'pending' && <Text style={styles.pendingBadge}>⏳ Pending</Text>}
        {kycStatus === null && <Text style={styles.pendingBadge}>❗ Not Submitted</Text>}

        <TouchableOpacity style={styles.kycButton} onPress={() => router.push('/verify')}>
          <Text style={styles.kycButtonText}>Complete KYC</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <FlatList
      data={services}
      numColumns={2}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
      ListHeaderComponent={
        <>
          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={() => router.push('/profile')}>
              <Image
                source={
                  userData.profilePic
                    ? { uri: userData.profilePic }
                    : require('../assets/images/profile.png')
                }
                style={styles.profileImage}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.headerRow}>
            <Text style={styles.greeting}>
              Welcome, {userData.name ? userData.name.split(' ')[0] : user.email}
            </Text>
            {renderKycBadge()}
          </View>

          <View style={styles.balanceContainer}>
            <View style={styles.balanceRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.balanceLabel}>Balance</Text>
                <TouchableOpacity onPress={() => setShowBalance(!showBalance)} style={{ marginLeft: 6 }}>
                  <Ionicons
                    name={showBalance ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => router.push('/TransactionHistory')}>
                <Text style={styles.transactionText}>Transaction History</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.balanceAmount}>
              {showBalance ? `₦${parseFloat(userData.balance || 0).toFixed(2)}` : '••••••'}
            </Text>
            <View style={styles.buttonRowSingle}>
  <TouchableOpacity style={styles.fundButtonSingle} onPress={() => router.push('/fund')}>
    <Text style={styles.buttonText}>Fund</Text>
  </TouchableOpacity>
</View>



          </View>

          <Text style={styles.sectionTitle}>Services</Text>
        </>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.serviceItem}
          onPress={() => router.push(item.route)}
        >
          <Text style={styles.serviceText}>{item.name}</Text>
        </TouchableOpacity>
      )}

      

      ListFooterComponent={
        userData.role === 'admin' ? (
          <TouchableOpacity
            onPress={() => router.push('/AdminScreen')}
            style={styles.adminButton}
          >
            <Text style={styles.adminButtonText}>Go to Admin Panel</Text>
          </TouchableOpacity>
        ) : null
      }
    />
  );
}


const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  greeting: { fontSize: 22, fontWeight: 'bold' },
  profileImageContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 90,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  kycButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#000',
    borderRadius: 6,
    marginLeft: 10,
    marginTop: 4,
  },
  kycButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  verifiedBadge: {
    color: 'green',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 14,
    paddingTop: 4,
  },
  rejectedBadge: {
    color: 'red',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 14,
    paddingTop: 4,
  },
  pendingBadge: {
    color: '#FF8C00',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 14,
    paddingTop: 4,
  },
  balanceContainer: {
    backgroundColor: '#4ADE80',
    padding: 20,
    borderRadius: 12,
    marginVertical: 15,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  transactionText: {
    color: '#fff',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'left',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 15,
    width: '100%',
    justifyContent: 'space-between',
  },

  buttonRowSingle: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  marginTop: 15,
},

fundButtonSingle: {
  backgroundColor: '#fff',
  paddingVertical: 10,
  paddingHorizontal: 25,
  borderRadius: 8,
  alignItems: 'center',
},

  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
  serviceItem: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  serviceText: { fontSize: 16, fontWeight: '500' },
  adminButton: {
    marginTop: 20,
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
