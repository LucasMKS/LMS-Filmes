package com.lucasm.lmsfavorite.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "custom_list_items", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"custom_list_id", "media_id", "media_type"})
})
public class CustomListItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "custom_list_id", nullable = false)
    private CustomList customList;

    @Column(name = "media_id", nullable = false)
    private String mediaId;

    @Column(name = "media_type", nullable = false)
    private String mediaType; // "movie" or "serie"

    @Column(name = "title")
    private String title;

    @Column(name = "poster_path")
    private String posterPath;

    @Column(name = "backdrop_path")
    private String backdropPath;

    @Column(name = "vote_average")
    private Double voteAverage;

    @Column(name = "release_year")
    private String releaseYear;

    @CreationTimestamp
    @Column(name = "added_at", updatable = false)
    private LocalDateTime addedAt;
}
