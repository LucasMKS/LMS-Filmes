export interface CustomListItem {
  id: string; // TMDB ID or string ID
  type: "movie" | "serie";
  title: string;
  posterPath: string | null;
  backdropPath?: string | null;
  voteAverage?: number;
  releaseYear?: string;
  addedAt: string;
}

export interface CustomList {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  items: CustomListItem[];
}

const EVENT_NAME = "lms-user-lists-updated";

function getStorageKey(userEmail?: string): string {
  if (!userEmail) {
    // Try to get current user from auth cookie/localStorage if available
    try {
      const userDataStr = typeof window !== "undefined" ? localStorage.getItem("user_data") : null;
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        if (userData?.email) {
          return `lms_user_lists_${userData.email}`;
        }
      }
    } catch (e) {
      // ignore
    }
    return "lms_user_lists_guest";
  }
  return `lms_user_lists_${userEmail}`;
}

export function notifyListsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT_NAME));
  }
}

export function getUserLists(userEmail?: string): CustomList[] {
  if (typeof window === "undefined") return [];
  try {
    const key = getStorageKey(userEmail);
    const data = localStorage.getItem(key);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao ler listas personalizadas:", error);
    return [];
  }
}

export function getListById(listId: string, userEmail?: string): CustomList | undefined {
  const lists = getUserLists(userEmail);
  return lists.find((l) => l.id === listId);
}

function saveUserLists(lists: CustomList[], userEmail?: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = getStorageKey(userEmail);
    localStorage.setItem(key, JSON.stringify(lists));
    notifyListsChanged();
  } catch (error) {
    console.error("Erro ao salvar listas personalizadas:", error);
  }
}

export function createList(name: string, description?: string, userEmail?: string): CustomList {
  const lists = getUserLists(userEmail);
  const newList: CustomList = {
    id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    description: description?.trim() || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [],
  };

  const updatedLists = [newList, ...lists];
  saveUserLists(updatedLists, userEmail);
  return newList;
}

export function renameList(
  listId: string,
  newName: string,
  newDescription?: string,
  userEmail?: string
): CustomList | null {
  const lists = getUserLists(userEmail);
  const index = lists.findIndex((l) => l.id === listId);
  if (index === -1) return null;

  lists[index] = {
    ...lists[index],
    name: newName.trim(),
    description: newDescription !== undefined ? newDescription.trim() : lists[index].description,
    updatedAt: new Date().toISOString(),
  };

  saveUserLists(lists, userEmail);
  return lists[index];
}

export function deleteList(listId: string, userEmail?: string): boolean {
  const lists = getUserLists(userEmail);
  const filtered = lists.filter((l) => l.id !== listId);
  if (filtered.length === lists.length) return false;

  saveUserLists(filtered, userEmail);
  return true;
}

export function addItemToList(
  listId: string,
  item: Omit<CustomListItem, "addedAt">,
  userEmail?: string
): CustomList | null {
  const lists = getUserLists(userEmail);
  const index = lists.findIndex((l) => l.id === listId);
  if (index === -1) return null;

  const currentList = lists[index];
  const itemIdStr = String(item.id);
  const exists = currentList.items.some(
    (i) => String(i.id) === itemIdStr && i.type === item.type
  );

  if (exists) return currentList;

  const newItem: CustomListItem = {
    ...item,
    id: itemIdStr,
    addedAt: new Date().toISOString(),
  };

  lists[index] = {
    ...currentList,
    updatedAt: new Date().toISOString(),
    items: [newItem, ...currentList.items],
  };

  saveUserLists(lists, userEmail);
  return lists[index];
}

export function removeItemFromList(
  listId: string,
  itemId: string,
  itemType: "movie" | "serie",
  userEmail?: string
): CustomList | null {
  const lists = getUserLists(userEmail);
  const index = lists.findIndex((l) => l.id === listId);
  if (index === -1) return null;

  const currentList = lists[index];
  const itemIdStr = String(itemId);
  const updatedItems = currentList.items.filter(
    (i) => !(String(i.id) === itemIdStr && i.type === itemType)
  );

  lists[index] = {
    ...currentList,
    updatedAt: new Date().toISOString(),
    items: updatedItems,
  };

  saveUserLists(lists, userEmail);
  return lists[index];
}

export function isItemInList(
  listId: string,
  itemId: string,
  itemType: "movie" | "serie",
  userEmail?: string
): boolean {
  const list = getListById(listId, userEmail);
  if (!list) return false;
  const itemIdStr = String(itemId);
  return list.items.some((i) => String(i.id) === itemIdStr && i.type === itemType);
}

export function getListsContainingItem(
  itemId: string,
  itemType: "movie" | "serie",
  userEmail?: string
): CustomList[] {
  const lists = getUserLists(userEmail);
  const itemIdStr = String(itemId);
  return lists.filter((l) =>
    l.items.some((i) => String(i.id) === itemIdStr && i.type === itemType)
  );
}

export function useListsListener(callback: () => void) {
  if (typeof window === "undefined") return;
  window.addEventListener(EVENT_NAME, callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
  };
}
