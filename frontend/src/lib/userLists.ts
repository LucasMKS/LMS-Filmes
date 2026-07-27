import Cookies from "js-cookie";
import { customListsApi } from "./api";

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

export function isAuthenticated(): boolean {
  return !!Cookies.get("auth_token");
}

let memoryListsCache: CustomList[] | null = null;

// Synchronous local storage read/write for guest or fast fallback
export function getLocalUserLists(userEmail?: string): CustomList[] {
  if (typeof window === "undefined") return memoryListsCache || [];
  try {
    const key = getStorageKey(userEmail);
    const data = localStorage.getItem(key);
    if (!data) return memoryListsCache || [];
    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao ler listas locais:", error);
    return memoryListsCache || [];
  }
}

export function saveLocalUserLists(lists: CustomList[], userEmail?: string): void {
  memoryListsCache = lists;
  if (typeof window === "undefined") return;
  try {
    const key = getStorageKey(userEmail);
    localStorage.setItem(key, JSON.stringify(lists));
    notifyListsChanged();
  } catch (error) {
    console.error("Erro ao salvar listas locais:", error);
  }
}

/**
 * Carrega listas personalizadas do Backend (DB) se autenticado, ou do localStorage se convidado.
 */
export async function fetchUserLists(userEmail?: string): Promise<CustomList[]> {
  if (isAuthenticated()) {
    try {
      // Check if there are local guest lists to sync into backend database
      const localGuestLists = getLocalUserLists("guest");
      if (localGuestLists.length > 0) {
        try {
          const syncPayload = localGuestLists.map((l) => ({
            name: l.name,
            description: l.description,
            items: l.items.map((i) => ({
              id: i.id,
              type: i.type,
              title: i.title,
              posterPath: i.posterPath,
              backdropPath: i.backdropPath,
              voteAverage: i.voteAverage,
              releaseYear: i.releaseYear,
            })),
          }));
          const synced = await customListsApi.syncLocalLists(syncPayload);
          // Clear local guest cache after successful DB sync
          if (typeof window !== "undefined") {
            localStorage.removeItem("lms_user_lists_guest");
          }
          saveLocalUserLists(synced, userEmail);
          return synced;
        } catch (e) {
          console.warn("Falha ao sincronizar listas locais com o backend:", e);
        }
      }

      const lists = await customListsApi.getUserLists();
      saveLocalUserLists(lists, userEmail);
      return lists;
    } catch (error) {
      console.error("Erro ao buscar listas do backend:", error);
      return getLocalUserLists(userEmail);
    }
  }

  return getLocalUserLists(userEmail);
}

/**
 * Retorna as listas de forma síncrona usando o cache mais recente.
 */
export function getUserLists(userEmail?: string): CustomList[] {
  return getLocalUserLists(userEmail);
}

export function getListById(listId: string, userEmail?: string): CustomList | undefined {
  const lists = getUserLists(userEmail);
  return lists.find((l) => String(l.id) === String(listId));
}

/**
 * Cria uma nova lista no Backend (se autenticado) e no cache.
 */
export async function createCustomList(
  name: string,
  description?: string,
  userEmail?: string
): Promise<CustomList> {
  if (isAuthenticated()) {
    try {
      const created = await customListsApi.createList({ name, description });
      const currentLists = getLocalUserLists(userEmail);
      const updated = [created, ...currentLists.filter((l) => String(l.id) !== String(created.id))];
      saveLocalUserLists(updated, userEmail);
      return created;
    } catch (error) {
      console.error("Erro ao criar lista no backend:", error);
    }
  }

  // Fallback local
  return createListLocal(name, description, userEmail);
}

export function createList(name: string, description?: string, userEmail?: string): CustomList {
  return createListLocal(name, description, userEmail);
}

function createListLocal(name: string, description?: string, userEmail?: string): CustomList {
  const lists = getLocalUserLists(userEmail);
  const newList: CustomList = {
    id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    description: description?.trim() || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [],
  };

  const updatedLists = [newList, ...lists];
  saveLocalUserLists(updatedLists, userEmail);
  return newList;
}

/**
 * Renomeia/atualiza uma lista no Backend (se autenticado) e no cache.
 */
export async function updateCustomList(
  listId: string,
  newName: string,
  newDescription?: string,
  userEmail?: string
): Promise<CustomList | null> {
  if (isAuthenticated() && !listId.startsWith("list_")) {
    try {
      const updated = await customListsApi.updateList(listId, {
        name: newName,
        description: newDescription,
      });
      const currentLists = getLocalUserLists(userEmail);
      const idx = currentLists.findIndex((l) => String(l.id) === String(listId));
      if (idx !== -1) {
        currentLists[idx] = updated;
        saveLocalUserLists([...currentLists], userEmail);
      }
      return updated;
    } catch (error) {
      console.error("Erro ao atualizar lista no backend:", error);
    }
  }

  return renameListLocal(listId, newName, newDescription, userEmail);
}

export function renameList(
  listId: string,
  newName: string,
  newDescription?: string,
  userEmail?: string
): CustomList | null {
  return renameListLocal(listId, newName, newDescription, userEmail);
}

function renameListLocal(
  listId: string,
  newName: string,
  newDescription?: string,
  userEmail?: string
): CustomList | null {
  const lists = getLocalUserLists(userEmail);
  const index = lists.findIndex((l) => String(l.id) === String(listId));
  if (index === -1) return null;

  lists[index] = {
    ...lists[index],
    name: newName.trim(),
    description: newDescription !== undefined ? newDescription.trim() : lists[index].description,
    updatedAt: new Date().toISOString(),
  };

  saveLocalUserLists(lists, userEmail);
  return lists[index];
}

/**
 * Exclui uma lista no Backend (se autenticado) e no cache.
 */
export async function deleteCustomList(listId: string, userEmail?: string): Promise<boolean> {
  if (isAuthenticated() && !listId.startsWith("list_")) {
    try {
      await customListsApi.deleteList(listId);
      const currentLists = getLocalUserLists(userEmail);
      const filtered = currentLists.filter((l) => String(l.id) !== String(listId));
      saveLocalUserLists(filtered, userEmail);
      return true;
    } catch (error) {
      console.error("Erro ao deletar lista no backend:", error);
    }
  }

  return deleteListLocal(listId, userEmail);
}

export function deleteList(listId: string, userEmail?: string): boolean {
  return deleteListLocal(listId, userEmail);
}

function deleteListLocal(listId: string, userEmail?: string): boolean {
  const lists = getLocalUserLists(userEmail);
  const filtered = lists.filter((l) => String(l.id) !== String(listId));
  if (filtered.length === lists.length) return false;

  saveLocalUserLists(filtered, userEmail);
  return true;
}

/**
 * Adiciona um item a uma lista no Backend (se autenticado) e no cache.
 */
export async function addItemToCustomList(
  listId: string,
  item: Omit<CustomListItem, "addedAt">,
  userEmail?: string
): Promise<CustomList | null> {
  if (isAuthenticated() && !listId.startsWith("list_")) {
    try {
      const updated = await customListsApi.addItemToList(listId, {
        id: String(item.id),
        type: item.type,
        title: item.title,
        posterPath: item.posterPath,
        backdropPath: item.backdropPath,
        voteAverage: item.voteAverage,
        releaseYear: item.releaseYear,
      });
      const currentLists = getLocalUserLists(userEmail);
      const idx = currentLists.findIndex((l) => String(l.id) === String(listId));
      if (idx !== -1) {
        currentLists[idx] = updated;
        saveLocalUserLists([...currentLists], userEmail);
      } else {
        saveLocalUserLists([updated, ...currentLists], userEmail);
      }
      return updated;
    } catch (error) {
      console.error("Erro ao adicionar item à lista no backend:", error);
    }
  }

  return addItemToListLocal(listId, item, userEmail);
}

export function addItemToList(
  listId: string,
  item: Omit<CustomListItem, "addedAt">,
  userEmail?: string
): CustomList | null {
  return addItemToListLocal(listId, item, userEmail);
}

function addItemToListLocal(
  listId: string,
  item: Omit<CustomListItem, "addedAt">,
  userEmail?: string
): CustomList | null {
  const lists = getLocalUserLists(userEmail);
  const index = lists.findIndex((l) => String(l.id) === String(listId));
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

  saveLocalUserLists(lists, userEmail);
  return lists[index];
}

/**
 * Remove um item de uma lista no Backend (se autenticado) e no cache.
 */
export async function removeItemFromCustomList(
  listId: string,
  itemId: string,
  itemType: "movie" | "serie",
  userEmail?: string
): Promise<CustomList | null> {
  if (isAuthenticated() && !listId.startsWith("list_")) {
    try {
      const updated = await customListsApi.removeItemFromList(listId, String(itemId), itemType);
      const currentLists = getLocalUserLists(userEmail);
      const idx = currentLists.findIndex((l) => String(l.id) === String(listId));
      if (idx !== -1) {
        currentLists[idx] = updated;
        saveLocalUserLists([...currentLists], userEmail);
      }
      return updated;
    } catch (error) {
      console.error("Erro ao remover item da lista no backend:", error);
    }
  }

  return removeItemFromListLocal(listId, itemId, itemType, userEmail);
}

export function removeItemFromList(
  listId: string,
  itemId: string,
  itemType: "movie" | "serie",
  userEmail?: string
): CustomList | null {
  return removeItemFromListLocal(listId, itemId, itemType, userEmail);
}

function removeItemFromListLocal(
  listId: string,
  itemId: string,
  itemType: "movie" | "serie",
  userEmail?: string
): CustomList | null {
  const lists = getLocalUserLists(userEmail);
  const index = lists.findIndex((l) => String(l.id) === String(listId));
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

  saveLocalUserLists(lists, userEmail);
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
