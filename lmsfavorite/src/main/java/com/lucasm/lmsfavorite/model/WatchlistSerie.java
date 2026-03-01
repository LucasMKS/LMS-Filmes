package com.lucasm.lmsfavorite.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@Document(collection = "watchlist_series")
@CompoundIndex(name = "email_watchlist_serie_idx", def = "{'email': 1, 'serieId': 1}", unique = true)
public class WatchlistSerie {
    @Id
    private String id;
    private String email;
    private String serieId;
    private LocalDateTime addedAt = LocalDateTime.now();
}