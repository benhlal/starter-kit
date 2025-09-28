// src/state/atoms.ts
import { atom } from "recoil";

export const selectedObjectState = atom<any | null>({
  key: "selectedObjectState",
  default: null,
});

export const textObjectState = atom<{
  id: string;
  text: string;
  position: [number, number, number];
} | null>({
  key: "textObjectState",
  default: null,
});

export const scaleState = atom<[number, number, number]>({
  key: "scaleState",
  default: [0.05, 0.05, 0.05],
});

export const objectsState = atom<any[]>({
  key: "objectsState",
  default: [],
});
