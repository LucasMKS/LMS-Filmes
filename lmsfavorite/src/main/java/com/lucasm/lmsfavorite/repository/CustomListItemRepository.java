package com.lucasm.lmsfavorite.repository;

import com.lucasm.lmsfavorite.model.CustomListItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomListItemRepository extends JpaRepository<CustomListItem, Long> {
    Optional<CustomListItem> findByCustomListIdAndMediaIdAndMediaType(Long customListId, String mediaId, String mediaType);

    @Modifying
    @Query("DELETE FROM CustomListItem item WHERE item.customList.id = :listId AND item.mediaId = :mediaId AND item.mediaType = :mediaType")
    int deleteByCustomListIdAndMediaIdAndMediaType(@Param("listId") Long listId, @Param("mediaId") String mediaId, @Param("mediaType") String mediaType);
}
