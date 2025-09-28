import firestore from "@react-native-firebase/firestore";

interface ARObject {
  id: string;
  name: string;
  img: any;
  obj: any;
  mtl: any;
  position: [number, number, number];
}

interface TextObject {
  id: string;
  text: string;
  position: [number, number, number];
}

type FirestoreObject = ARObject | TextObject;

export const fetchObjects = async (): Promise<FirestoreObject[]> => {
  const objectsSnapshot = await firestore()
    .collection("arObjects")
    .orderBy("timestamp", "desc")
    .limit(1)
    .get();
  return objectsSnapshot.docs.map((doc) => doc.data() as FirestoreObject);
};

export const addObject = (object: FirestoreObject): void => {
  firestore()
    .collection("arObjects")
    .add({ ...object, timestamp: firestore.FieldValue.serverTimestamp() });
};
