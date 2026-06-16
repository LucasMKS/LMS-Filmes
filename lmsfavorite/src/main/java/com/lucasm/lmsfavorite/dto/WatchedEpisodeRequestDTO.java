package com.lucasm.lmsfavorite.dto;

import lombok.Data;

@Data
public class WatchedEpisodeRequestDTO {
    private String serieId;
    private int seasonNumber;
    private int episodeNumber;
}
