import { 
  Account,
  Client,
  Databases,
  Storage,
  ID as AppwriteID, 
  Query as AppwriteQuery,
  Permission as AppwritePermission,
  Role as AppwriteRole,
} from 'react-native-appwrite';

export const Config = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  Platform: 'com.victor.Ruxx',
  projectId: '684055920027597e8f4f',
  databaseId: '684067040021a0f7b59a',
  userCollectionId: '6840684e001b7e2a3190',
  kycCollectionId: '6866ca550022ff21e9dc',
  storageBucketId: '6866c562003d56c841dd',
  txnCollectionId: '6866caf00030b1c752a0',
  balanceCollectionId: '688485f60013ffff20c6',
  notificationsCollectionId: '68850246002c9fb90a96',
  adminNotificationsCollectionId: '68c23c640015cc5d8c6f',
  referralsCollectionId: '68cfd195001fa1fc4300',
  invitesCollectionId: '68cfd5460031b4150d41',
  userProfilesID: '68d3c059003931e5e6f4',
};

const client = new Client();
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const ID = AppwriteID;
export const Query = AppwriteQuery;
export const Permission = AppwritePermission;
export const Role = AppwriteRole;
export const subscribe = (...args) => client.subscribe(...args);

client
  .setEndpoint(Config.endpoint)
  .setProject(Config.projectId)
  .setPlatform(Config.Platform);

// ✅ Create user & session
export const createUser = async ({ name, email, password, phone}) => {
  try {
    // 1. Register new account
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      name,
    );

    if (!newAccount) throw new Error('Account creation failed');

    // 2. Immediately create a session
    await account.createEmailPasswordSession(email, password);

    // 3. Send verification email
    await account.createVerification('https://ruxx-paystack.vercel.app/api/verify-complete');

    // 4. Create user doc in DB
    const newUser = await databases.createDocument(
      Config.databaseId,
      Config.userCollectionId,
      newAccount.$id,
      {
        userId: newAccount.$id, 
        name,
        email,
        phone,
        role: 'user',
      },
    );



    // 5. ✅ Create in-app notification
await databases.createDocument(
  Config.databaseId,
  Config.notificationsCollectionId,
  ID.unique(),
  {
    userId: newAccount.$id, 
    title: "🎉 Welcome to RuxxPay",
    message: `Hey ${name}, thanks for joining us! Explore your dashboard to get started 🚀`,
    type: "info",
    read: false,
    createdAt: new Date().toISOString(),
  }
);


    // 7. ✅ Send custom welcome email (via your backend API)
    // Call your API route that sends emails with Nodemailer/Resend/SendGrid
    await fetch("https://ruxx-paystack.vercel.app/api/welcome/welcome-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name,
      }),
    });

    return { accountId: newAccount.$id, newAccount, newUser };
  } catch (error) {
    console.log('CreateUser Error:', error);
    throw new Error(error.message || 'Something went wrong');
  }
};

// ✅ Sign in
export const signIn = async (email, password) => {
  try {
    //  fetch user
    const user = await account.get();

     // Create session 
    const session = await account.createEmailPasswordSession(email, password);

    if (!user.emailVerification) {
      // Kill session if email not verified
      await account.deleteSession(session.$id); // ✅ pass real session ID
      throw new Error('Please verify your email.');
    }

    return { session, user };
  } catch (error) {
    throw new Error(error.message || 'Login failed');
  }
};
