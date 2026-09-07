import { create } from "zustand";

interface ProductFilterStore {
  search: string;
  collection: string;
  sort: string;

  setSearch: (
    value: string
  ) => void;

  setCollection: (
    value: string
  ) => void;

  setSort: (
    value: string
  ) => void;

  reset: () => void;
}

export const useProductFilterStore =
  create<ProductFilterStore>((set) => ({
    search: "",

    collection: "",

    sort: "featured",

    setSearch: (search: string) =>
  set({ search }),
   
setCollection: (collection: string) =>
  set({ collection }),

 setSort: (sort: string) =>
  set({ sort }),

    reset: () =>
      set({
        search: "",
        collection: "",
        sort: "featured",
      }),
  }));