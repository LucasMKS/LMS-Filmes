package com.lucasm.lmsfavorite.controller;

import com.lucasm.lmsfavorite.dto.*;
import com.lucasm.lmsfavorite.service.CustomListService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Expõe endpoints REST para gerenciamento de listas personalizadas do usuário autenticado.
 */
@RestController
@RequestMapping("/custom-lists")
public class CustomListController {

    private final CustomListService customListService;

    public CustomListController(CustomListService customListService) {
        this.customListService = customListService;
    }

    private String getCurrentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    /**
     * Retorna todas as listas personalizadas do usuário autenticado.
     */
    @GetMapping
    public ResponseEntity<List<CustomListResponseDTO>> getUserLists() {
        return ResponseEntity.ok(customListService.getUserLists(getCurrentUserEmail()));
    }

    /**
     * Retorna uma lista personalizada pelo seu ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<CustomListResponseDTO> getListById(@PathVariable Long id) {
        return ResponseEntity.ok(customListService.getListById(id, getCurrentUserEmail()));
    }

    /**
     * Cria uma nova lista personalizada para o usuário.
     */
    @PostMapping
    public ResponseEntity<CustomListResponseDTO> createList(@Valid @RequestBody CreateCustomListDTO dto) {
        return ResponseEntity.ok(customListService.createList(getCurrentUserEmail(), dto));
    }

    /**
     * Atualiza o nome e/ou descrição de uma lista.
     */
    @PutMapping("/{id}")
    public ResponseEntity<CustomListResponseDTO> updateList(@PathVariable Long id,
                                                            @Valid @RequestBody UpdateCustomListDTO dto) {
        return ResponseEntity.ok(customListService.updateList(id, getCurrentUserEmail(), dto));
    }

    /**
     * Exclui uma lista personalizada.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteList(@PathVariable Long id) {
        boolean deleted = customListService.deleteList(id, getCurrentUserEmail());
        return ResponseEntity.ok(Map.of("success", deleted));
    }

    /**
     * Adiciona um item a uma lista personalizada.
     */
    @PostMapping("/{id}/items")
    public ResponseEntity<CustomListResponseDTO> addItemToList(@PathVariable Long id,
                                                               @Valid @RequestBody AddCustomListItemDTO dto) {
        return ResponseEntity.ok(customListService.addItemToList(id, getCurrentUserEmail(), dto));
    }

    /**
     * Remove um item de uma lista personalizada.
     */
    @DeleteMapping("/{id}/items")
    public ResponseEntity<CustomListResponseDTO> removeItemFromList(@PathVariable Long id,
                                                                    @RequestParam String mediaId,
                                                                    @RequestParam String mediaType) {
        return ResponseEntity.ok(customListService.removeItemFromList(id, getCurrentUserEmail(), mediaId, mediaType));
    }

    /**
     * Sincroniza listas locais do frontend com o banco de dados.
     */
    @PostMapping("/sync")
    public ResponseEntity<List<CustomListResponseDTO>> syncLocalLists(@RequestBody List<SyncCustomListDTO> dtos) {
        return ResponseEntity.ok(customListService.syncLocalLists(getCurrentUserEmail(), dtos));
    }
}
