import { useSyncExternalStore } from "react";

function emptySubscribe() {
  return () => {};
}

export function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
