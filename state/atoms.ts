import { atom } from "recoil";

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

export const selectedObjectState = atom<ARObject | null>({
  key: "selectedObjectState",
  default: null,
});

export const textObjectState = atom<TextObject | null>({
  key: "textObjectState",
  default: null,
});

export const scaleState = atom<[number, number, number]>({
  key: "scaleState",
  default: [0.05, 0.05, 0.05],
});

export const objectsState = atom<ARObject[]>({
  key: "objectsState",
  default: [],
});
