import { databases, ID, Permission, Role, Config } from '../appwriteConfig';

export const saveTransaction = async ({ userId, serviceType, recipient, provider, amount, status }) => {
  if (!userId) throw new Error('User ID is missing');

  const txn = await databases.createDocument(
    Config.databaseId,
    Config.txnCollectionId,
    ID.unique(),
    {
      userId,
      serviceType,
      recipient,
      provider,
      amount,
      status,
      createdAt: new Date().toISOString() // ✅ Fix: add required field
    },
    [
      Permission.read(Role.user(userId)),
      Permission.write(Role.user(userId))
    ]
  );

  return txn;
};
