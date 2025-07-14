import { 
  Account,
  Client,
  Databases,
  Storage,
  ID as AppwriteID,
  Query as AppwriteQuery,
  Permission as AppwritePermission,
  Role as AppwriteRole,} from 'react-native-appwrite';

export const Config = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  Platform: 'com.victor.Ruxx',
  projectId: '684055920027597e8f4f',
  databaseId: '684067040021a0f7b59a',
  userCollectionId: '6840684e001b7e2a3190',
  kycCollectionId: '6866ca550022ff21e9dc',
  storageBucketId: '6866c562003d56c841dd',
  txnCollectionId: '6866caf00030b1c752a0',
};


const client = new Client();
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const ID = AppwriteID;
export const Query = AppwriteQuery;
export const Permission = AppwritePermission;
export const Role = AppwriteRole;

client
  .setEndpoint(Config.endpoint)
  .setProject(Config.projectId)
  .setPlatform(Config.Platform);



export const createUser = async ({ name, email, password }) => {
  try {
    // 1. Register new account
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      name
    );

    if (!newAccount) throw new Error('Account creation failed');


    await account.createEmailPasswordSession(email, password);

     // Manually trigger sending verification email
    await account.createVerification("https://fra.cloud.appwrite.io/v1");


    // 2. Create user document in DB — include the required "userId" field
    const newUser = await databases.createDocument(
      Config.databaseId,
      Config.userCollectionId,
      newAccount.$id,
      {
        userId: newAccount.$id, 
        name: name,
        email,
        balance: 0,
        role: 'user'
      },
      
    );

    return {
      newUser, newAccount
    };
  } catch (error) {
    console.log('CreateUser Error:', error);
    throw new Error(error.message || 'Something went wrong');
  }
};

// ✅ Sign in 
export const signIn = async (email, password) => {
  try {
    const user = await account.get();

    const session = await account.createEmailPasswordSession(email, password);
    
    if (!user.emailVerification) {
      await account.deleteSession('current');
      throw new Error('Please verify your email.');
    }

    return {session, user};

    
  } catch (error) {
    throw new Error(error.message || 'Login failed');
  }
};


