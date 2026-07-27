package com.lucasm.lmsfavorite.service;

import com.lucasm.lmsfavorite.dto.*;
import com.lucasm.lmsfavorite.model.CustomList;
import com.lucasm.lmsfavorite.model.CustomListItem;
import com.lucasm.lmsfavorite.repository.CustomListItemRepository;
import com.lucasm.lmsfavorite.repository.CustomListRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CustomListService {

    private final CustomListRepository customListRepository;
    private final CustomListItemRepository customListItemRepository;
    private final UserLookupService userLookupService;

    @PersistenceContext
    private EntityManager entityManager;

    public CustomListService(CustomListRepository customListRepository,
                             CustomListItemRepository customListItemRepository,
                             UserLookupService userLookupService) {
        this.customListRepository = customListRepository;
        this.customListItemRepository = customListItemRepository;
        this.userLookupService = userLookupService;
    }

    @Transactional(readOnly = true)
    public List<CustomListResponseDTO> getUserLists(String userEmail) {
        Long userId = userLookupService.getUserIdByEmail(userEmail);
        List<CustomList> lists = customListRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        return lists.stream().map(CustomListResponseDTO::new).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CustomListResponseDTO getListById(Long listId, String userEmail) {
        Long userId = userLookupService.getUserIdByEmail(userEmail);
        CustomList list = customListRepository.findByIdAndUserId(listId, userId)
                .orElseThrow(() -> new RuntimeException("Lista não encontrada ou sem permissão."));
        return new CustomListResponseDTO(list);
    }

    @Transactional
    public CustomListResponseDTO createList(String userEmail, CreateCustomListDTO dto) {
        Long userId = userLookupService.getUserIdByEmail(userEmail);
        CustomList list = new CustomList();
        list.setUserId(userId);
        list.setName(dto.getName().trim());
        list.setDescription(dto.getDescription() != null ? dto.getDescription().trim() : "");

        CustomList saved = customListRepository.save(list);
        entityManager.flush();
        entityManager.clear();

        CustomList fresh = customListRepository.findByIdAndUserId(saved.getId(), userId).orElse(saved);
        return new CustomListResponseDTO(fresh);
    }

    @Transactional
    public CustomListResponseDTO updateList(Long listId, String userEmail, UpdateCustomListDTO dto) {
        Long userId = userLookupService.getUserIdByEmail(userEmail);
        CustomList list = customListRepository.findByIdAndUserId(listId, userId)
                .orElseThrow(() -> new RuntimeException("Lista não encontrada ou sem permissão."));

        list.setName(dto.getName().trim());
        if (dto.getDescription() != null) {
            list.setDescription(dto.getDescription().trim());
        }

        CustomList saved = customListRepository.save(list);
        entityManager.flush();
        entityManager.clear();

        CustomList fresh = customListRepository.findByIdAndUserId(saved.getId(), userId).orElse(saved);
        return new CustomListResponseDTO(fresh);
    }

    @Transactional
    public boolean deleteList(Long listId, String userEmail) {
        Long userId = userLookupService.getUserIdByEmail(userEmail);
        CustomList list = customListRepository.findByIdAndUserId(listId, userId).orElse(null);
        if (list == null) return false;
        customListRepository.delete(list);
        return true;
    }

    @Transactional
    public CustomListResponseDTO addItemToList(Long listId, String userEmail, AddCustomListItemDTO dto) {
        Long userId = userLookupService.getUserIdByEmail(userEmail);
        CustomList list = customListRepository.findByIdAndUserId(listId, userId)
                .orElseThrow(() -> new RuntimeException("Lista não encontrada ou sem permissão."));

        String mediaIdStr = String.valueOf(dto.getId());
        String mediaTypeStr = dto.getType() != null ? dto.getType().toLowerCase() : "movie";

        Optional<CustomListItem> existing = customListItemRepository
                .findByCustomListIdAndMediaIdAndMediaType(listId, mediaIdStr, mediaTypeStr);

        if (existing.isEmpty()) {
            CustomListItem item = new CustomListItem();
            item.setCustomList(list);
            item.setMediaId(mediaIdStr);
            item.setMediaType(mediaTypeStr);
            item.setTitle(dto.getTitle());
            item.setPosterPath(dto.getPosterPath());
            item.setBackdropPath(dto.getBackdropPath());
            item.setVoteAverage(dto.getVoteAverage());
            item.setReleaseYear(dto.getReleaseYear());
            customListItemRepository.save(item);

            list.setUpdatedAt(LocalDateTime.now());
            customListRepository.save(list);

            entityManager.flush();
            entityManager.clear();
        }

        // Re-fetch clean instance from DB after flushing L1 persistence context
        CustomList updatedList = customListRepository.findByIdAndUserId(listId, userId)
                .orElseThrow(() -> new RuntimeException("Lista não encontrada após adicionar item."));
        return new CustomListResponseDTO(updatedList);
    }

    @Transactional
    public CustomListResponseDTO removeItemFromList(Long listId, String userEmail, String mediaId, String mediaType) {
        Long userId = userLookupService.getUserIdByEmail(userEmail);
        CustomList list = customListRepository.findByIdAndUserId(listId, userId)
                .orElseThrow(() -> new RuntimeException("Lista não encontrada ou sem permissão."));

        String mediaIdStr = String.valueOf(mediaId);
        String mediaTypeStr = mediaType != null ? mediaType.toLowerCase() : "movie";

        customListItemRepository.deleteByCustomListIdAndMediaIdAndMediaType(listId, mediaIdStr, mediaTypeStr);
        list.setUpdatedAt(LocalDateTime.now());
        customListRepository.save(list);

        entityManager.flush();
        entityManager.clear();

        // Re-fetch clean instance from DB after flushing L1 persistence context
        CustomList updatedList = customListRepository.findByIdAndUserId(listId, userId)
                .orElseThrow(() -> new RuntimeException("Lista não encontrada após remover item."));
        return new CustomListResponseDTO(updatedList);
    }

    @Transactional
    public List<CustomListResponseDTO> syncLocalLists(String userEmail, List<SyncCustomListDTO> localLists) {
        Long userId = userLookupService.getUserIdByEmail(userEmail);
        List<CustomList> existingUserLists = customListRepository.findByUserIdOrderByUpdatedAtDesc(userId);

        if (localLists != null && !localLists.isEmpty()) {
            for (SyncCustomListDTO localDto : localLists) {
                if (localDto.getName() == null || localDto.getName().isBlank()) continue;

                Optional<CustomList> matchingList = existingUserLists.stream()
                        .filter(l -> l.getName().equalsIgnoreCase(localDto.getName().trim()))
                        .findFirst();

                CustomList listToPopulate;
                if (matchingList.isPresent()) {
                    listToPopulate = matchingList.get();
                } else {
                    listToPopulate = new CustomList();
                    listToPopulate.setUserId(userId);
                    listToPopulate.setName(localDto.getName().trim());
                    listToPopulate.setDescription(localDto.getDescription() != null ? localDto.getDescription().trim() : "");
                    listToPopulate = customListRepository.save(listToPopulate);
                }

                if (localDto.getItems() != null) {
                    for (AddCustomListItemDTO itemDto : localDto.getItems()) {
                        String mId = String.valueOf(itemDto.getId());
                        String mType = itemDto.getType() != null ? itemDto.getType().toLowerCase() : "movie";
                        Optional<CustomListItem> existingItem = customListItemRepository
                                .findByCustomListIdAndMediaIdAndMediaType(listToPopulate.getId(), mId, mType);

                        if (existingItem.isEmpty()) {
                            CustomListItem item = new CustomListItem();
                            item.setCustomList(listToPopulate);
                            item.setMediaId(mId);
                            item.setMediaType(mType);
                            item.setTitle(itemDto.getTitle());
                            item.setPosterPath(itemDto.getPosterPath());
                            item.setBackdropPath(itemDto.getBackdropPath());
                            item.setVoteAverage(itemDto.getVoteAverage());
                            item.setReleaseYear(itemDto.getReleaseYear());
                            customListItemRepository.save(item);
                        }
                    }
                }
            }
        }

        entityManager.flush();
        entityManager.clear();

        List<CustomList> finalLists = customListRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        return finalLists.stream().map(CustomListResponseDTO::new).collect(Collectors.toList());
    }
}
