import { CredentialInfo } from "@passwordless-id/webauthn/dist/esm/types";
import { persist } from "zustand/middleware";
import { createWithEqualityFn } from "zustand/traditional";

const defaults: StoreValues = {
  credential: undefined,
};

export const useAppStore = createWithEqualityFn<Store>()(
  persist(
    (set) => ({
      ...defaults,
      setStore: (vals) => set(vals),
    }),
    {
      name: "app-store",
      version: 1,
    },
  ),
  Object.is,
);

type Store = StoreValues & StoreMethods;

type StoreValues = {
  credential?: CredentialInfo;
};

type StoreMethods = {
  setStore: (vals: Partial<StoreValues>) => void;
};
