import { deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { requestMemberDeletion } from './deletionService';
import { cacheService, CacheKeys } from './cacheService';
import { CACHE } from '../constants';
import type { Member } from '../types';
import logger from '../utils/logger';

/**
 * Fetches a single member's details by ID
 * OPTIMIZED: Uses getDoc instead of fetching entire collection + caching
 */
export const fetchMemberDetails = async (memberId: string): Promise<Member | null> => {
  try {
    // Check cache first
    const cacheKey = CacheKeys.member(memberId);
    const cached = cacheService.get<Member>(cacheKey);
    if (cached) {
      return cached;
    }

    const memberRef = doc(db, 'members', memberId);
    const memberSnapshot = await getDoc(memberRef);

    if (!memberSnapshot.exists()) {
      return null;
    }

    const member = {
      id: memberSnapshot.id,
      ...memberSnapshot.data()
    } as Member;

    // Cache the result
    cacheService.set(cacheKey, member, CACHE.MEMBER_TTL);

    return member;
  } catch (error) {
    logger.error('Error fetching member details:', error);
    return null;
  }
};

/**
 * Batch fetch multiple members by their IDs
 * More efficient than individual fetchMemberDetails calls + caching
 */
export const batchFetchMembers = async (memberIds: string[]): Promise<Map<string, Member>> => {
  const membersMap = new Map<string, Member>();

  if (memberIds.length === 0) {
    return membersMap;
  }

  try {
    const uniqueIds = [...new Set(memberIds)];
    const idsToFetch: string[] = [];

    // Check cache for each member first
    uniqueIds.forEach(id => {
      const cacheKey = CacheKeys.member(id);
      const cached = cacheService.get<Member>(cacheKey);
      if (cached) {
        membersMap.set(id, cached);
      } else {
        idsToFetch.push(id);
      }
    });

    // If all members were in cache, return early
    if (idsToFetch.length === 0) {
      return membersMap;
    }

    // Firestore 'in' queries support up to 10 items, so we need to batch
    const batchSize = 10;
    const batches: string[][] = [];

    for (let i = 0; i < idsToFetch.length; i += batchSize) {
      batches.push(idsToFetch.slice(i, i + batchSize));
    }

    // Fetch all batches in parallel
    const results = await Promise.all(
      batches.map(async (batch) => {
        const promises = batch.map(id => getDoc(doc(db, 'members', id)));
        return Promise.all(promises);
      })
    );

    // Flatten results, cache them, and build map
    results.flat().forEach(snapshot => {
      if (snapshot.exists()) {
        const member = {
          id: snapshot.id,
          ...snapshot.data()
        } as Member;

        // Cache the member
        cacheService.set(CacheKeys.member(snapshot.id), member, CACHE.MEMBER_TTL);
        membersMap.set(snapshot.id, member);
      }
    });

    return membersMap;
  } catch (error) {
    logger.error('Error batch fetching members:', error);
    return membersMap;
  }
};

export const deleteMemberWithAuth = async (memberId: string, requesterId: string): Promise<void> => {
  try {
    // Fetch member details for audit log before deletion
    const member = await fetchMemberDetails(memberId);
    const targetMemberName = member?.full_name || 'Unknown Member';

    // Create deletion request instead of direct deletion
    await requestMemberDeletion(memberId, requesterId);
    
    // Log audit trail
    try {
      const { logAuditTrail } = await import('./auditService');
      
      // Fetch requester name if possible (or resolve in UI)
      const requester = await fetchMemberDetails(requesterId);
      const requesterName = requester?.full_name || 'Admin';

      await logAuditTrail(
        requesterId,
        'MEMBER_DELETE_REQUEST',
        {
          target_member_id: memberId,
          target_member_name: targetMemberName,
          timestamp: new Date().toISOString()
        },
        requesterName
      );
    } catch (auditError) {
      logger.error('Failed to log member deletion request audit trail:', auditError);
    }

    // Delete Firestore document
    const memberRef = doc(db, 'members', memberId);
    await deleteDoc(memberRef);
  } catch (error) {
    logger.error('Error deleting member:', error);
    throw error;
  }
};