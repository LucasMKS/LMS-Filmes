package com.lucasm.lmsrating.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lucasm.lmsrating.dto.MediaBalanceDTO;
import com.lucasm.lmsrating.service.MediaStatsService;

@RestController
@RequestMapping("/stats")
public class MediaStatsController {

    private final MediaStatsService statsService;

    public MediaStatsController(MediaStatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping("/balance")
    public ResponseEntity<List<MediaBalanceDTO>> getMediaBalance(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(statsService.getMediaBalance(email));
    }
}