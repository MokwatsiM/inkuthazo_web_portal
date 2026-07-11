import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  DocumentData,
  PartialWithFieldValue,
} from 'firebase/firestore';

/**
 * Typed Firestore converter. Attach with `.withConverter(converter<T>())`
 * so reads come back as T with the document id merged in — no `as T`
 * casts at call sites — and writes strip the id automatically.
 */
export const converter = <T extends { id: string }>(): FirestoreDataConverter<T> => ({
  toFirestore: (value: PartialWithFieldValue<T>): DocumentData => {
    const { id: _id, ...data } = value as T;
    return data;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): T =>
    ({ id: snapshot.id, ...snapshot.data() } as T),
});
