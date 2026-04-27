/* =====================================================
   Data Store — MongoDB-backed persistence layer
   --------------------------------------------------------
   Replaces the in-memory data store with Mongoose queries
   against the MongoDB `authenticchaindb` database. Every
   function is async and ensures the DB connection is
   established before querying.
   ===================================================== */

import { connectDB } from "./mongodb";
import Profile, { IProfile } from "./models/Profile";
import BlockchainRecord, { IBlockchainRecord } from "./models/BlockchainRecord";
import type { StoredProfile, BlockchainRecord as BlockchainRecordType } from "./types";

// ---------- Helpers ----------

/** Convert a Mongoose Profile document to the app's StoredProfile shape */
function toStoredProfile(doc: IProfile): StoredProfile {
  return {
    id: doc.profileId,
    username: doc.username,
    followers: doc.followers,
    posts: doc.posts,
    accountAge: doc.accountAge,
    bio: doc.bio,
    imageHash: doc.imageHash,
    imageUrl: doc.imageUrl,
    imagePublicId: doc.imagePublicId,
    dataHash: doc.dataHash,
    riskScore: doc.riskScore,
    result: doc.result,
    blockchainTx: doc.blockchainTx,
    reasons: doc.reasons,
    analyzedBy: doc.analyzedBy,
    createdAt: doc.createdAt.toISOString(),
  };
}

// ---------- Profile CRUD ----------

export async function addProfile(profile: StoredProfile): Promise<StoredProfile> {
  await connectDB();

  // Upsert by username (case-insensitive) or imageHash
  const existing = await Profile.findOne({
    $or: [
      { username: { $regex: new RegExp(`^${profile.username}$`, "i") } },
      ...(profile.imageHash
        ? [{ imageHash: profile.imageHash }]
        : []),
    ],
  });

  if (existing) {
    // Update existing record, keeping original profileId
    Object.assign(existing, {
      username: profile.username,
      followers: profile.followers,
      posts: profile.posts,
      accountAge: profile.accountAge,
      bio: profile.bio,
      imageHash: profile.imageHash,
      imageUrl: profile.imageUrl || existing.imageUrl,
      imagePublicId: profile.imagePublicId || existing.imagePublicId,
      dataHash: profile.dataHash,
      riskScore: profile.riskScore,
      result: profile.result,
      blockchainTx: profile.blockchainTx,
      reasons: profile.reasons || [],
    });
    
    if (profile.analyzedBy && profile.analyzedBy.length > 0) {
      profile.analyzedBy.forEach((user) => {
        if (!existing.analyzedBy.includes(user)) {
          existing.analyzedBy.push(user);
        }
      });
    }

    await existing.save();
    return toStoredProfile(existing);
  }

  const doc = await Profile.create({
    profileId: profile.id,
    username: profile.username,
    followers: profile.followers,
    posts: profile.posts,
    accountAge: profile.accountAge,
    bio: profile.bio,
    imageHash: profile.imageHash,
    imageUrl: profile.imageUrl || "",
    imagePublicId: profile.imagePublicId || "",
    dataHash: profile.dataHash,
    riskScore: profile.riskScore,
    result: profile.result,
    blockchainTx: profile.blockchainTx,
    reasons: profile.reasons || [],
    analyzedBy: profile.analyzedBy || [],
  });

  return toStoredProfile(doc);
}

export async function getAllProfiles(): Promise<StoredProfile[]> {
  await connectDB();
  const docs = await Profile.find().sort({ createdAt: -1 }).lean();
  return docs.map((doc) => ({
    id: doc.profileId,
    username: doc.username,
    followers: doc.followers,
    posts: doc.posts,
    accountAge: doc.accountAge,
    bio: doc.bio,
    imageHash: doc.imageHash,
    imageUrl: doc.imageUrl,
    imagePublicId: doc.imagePublicId,
    dataHash: doc.dataHash,
    riskScore: doc.riskScore,
    result: doc.result,
    blockchainTx: doc.blockchainTx,
    reasons: doc.reasons,
    analyzedBy: doc.analyzedBy,
    createdAt: doc.createdAt.toISOString(),
  }));
}

export async function getProfileByUsername(
  username: string
): Promise<StoredProfile | undefined> {
  await connectDB();
  const doc = await Profile.findOne({
    username: { $regex: new RegExp(`^${username}$`, "i") },
  });
  return doc ? toStoredProfile(doc) : undefined;
}

export async function getProfileById(
  id: string
): Promise<StoredProfile | undefined> {
  await connectDB();
  const doc = await Profile.findOne({ profileId: id });
  return doc ? toStoredProfile(doc) : undefined;
}

export async function findProfilesByImageHash(
  imageHash: string
): Promise<{ username: string; similarity: number }[]> {
  await connectDB();
  const docs = await Profile.find({ imageHash }).select("username").lean();
  return docs.map((d) => ({ username: d.username, similarity: 1.0 }));
}

// ---------- Dashboard Stats ----------

export interface DashboardStats {
  totalProfiles: number;
  fakeCount: number;
  realCount: number;
  suspiciousCount: number;
  avgRiskScore: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await connectDB();
  const [total, fakeCount, realCount, suspiciousCount, avgAgg] = await Promise.all([
    Profile.countDocuments(),
    Profile.countDocuments({ result: "FAKE" }),
    Profile.countDocuments({ result: "REAL" }),
    Profile.countDocuments({ result: "SUSPICIOUS" }),
    Profile.aggregate([
      { $group: { _id: null, avgRisk: { $avg: "$riskScore" } } },
    ]),
  ]);

  return {
    totalProfiles: total,
    fakeCount,
    realCount,
    suspiciousCount,
    avgRiskScore: avgAgg.length > 0 ? Math.round(avgAgg[0].avgRisk) : 0,
  };
}

export async function getFilteredProfiles(options: {
  filter?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  profiles: StoredProfile[];
  totalFiltered: number;
  totalPages: number;
  page: number;
  limit: number;
}> {
  await connectDB();

  const { filter, search, page = 1, limit = 10 } = options;
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(50, Math.max(1, limit));

  // Build query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};

  if (filter && filter !== "ALL") {
    query.result = filter;
  }

  if (search) {
    query.$or = [
      { username: { $regex: search, $options: "i" } },
      { profileId: { $regex: search, $options: "i" } },
    ];
  }

  const [totalFiltered, docs] = await Promise.all([
    Profile.countDocuments(query),
    Profile.find(query)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalFiltered / safeLimit));

  return {
    profiles: docs.map((doc) => ({
      id: doc.profileId,
      username: doc.username,
      followers: doc.followers,
      posts: doc.posts,
      accountAge: doc.accountAge,
      bio: doc.bio,
      imageHash: doc.imageHash,
      imageUrl: doc.imageUrl,
      imagePublicId: doc.imagePublicId,
      dataHash: doc.dataHash,
      riskScore: doc.riskScore,
      result: doc.result,
      blockchainTx: doc.blockchainTx,
      reasons: doc.reasons,
      analyzedBy: doc.analyzedBy,
      createdAt: doc.createdAt.toISOString(),
    })),
    totalFiltered,
    totalPages,
    page: Math.min(safePage, totalPages),
    limit: safeLimit,
  };
}

// ---------- Blockchain Records ----------

export async function addBlockchainRecord(
  record: BlockchainRecordType
): Promise<void> {
  await connectDB();
  await BlockchainRecord.create(record);
}

export async function getBlockchainRecord(
  txHash: string
): Promise<BlockchainRecordType | undefined> {
  await connectDB();
  const doc = await BlockchainRecord.findOne({ txHash }).lean();
  if (!doc) return undefined;
  return {
    txHash: doc.txHash,
    dataHash: doc.dataHash,
    result: doc.result,
    timestamp: doc.timestamp,
  };
}

export async function getAllBlockchainRecords(): Promise<BlockchainRecordType[]> {
  await connectDB();
  const docs = await BlockchainRecord.find().lean();
  return docs.map((d) => ({
    txHash: d.txHash,
    dataHash: d.dataHash,
    result: d.result,
    timestamp: d.timestamp,
  }));
}
