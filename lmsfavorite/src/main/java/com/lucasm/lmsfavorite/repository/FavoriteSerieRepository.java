package com.lucasm.lmsfavorite.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.lucasm.lmsfavorite.model.FavoriteSerie;

import java.util.List;
import java.util.Optional;

/**
 * Repositório de acesso a dados para favoritos de séries.
 */
@Repository
public interface FavoriteSerieRepository extends MongoRepository<FavoriteSerie, String> {

    /**
     * Lista os registros de séries favoritas de um usuário.
     *
     * @param email e-mail do usuário.
     * @return lista de registros de favoritos.
     */
    List<FavoriteSerie> findAllByEmail(String email);

    /**
     * Busca o registro de favorito de uma série para um usuário.
     *
     * @param serieId identificador da série.
     * @param email e-mail do usuário.
     * @return favorito encontrado, quando existir.
     */
    Optional<FavoriteSerie> findBySerieIdAndEmail(String serieId, String email);

    /**
     * Busca favoritos de séries de um usuário por status de favorito.
     *
     * @param email e-mail do usuário.
     * @param favorite status de favorito a ser filtrado.
     * @return lista de séries favoritadas conforme o filtro.
     */
    List<FavoriteSerie> findByEmailAndFavorite(String email, boolean favorite);

    /**
     * Busca séries favoritados (status true) por lote para um usuário.
     *
     * @param email e-mail do usuário.
     * @param serieIds identificadores das séries.
     * @return lista de registros favoritados encontrados no lote.
     */
    List<FavoriteSerie> findByEmailAndSerieIdInAndFavorite(String email, List<String> serieIds, boolean favorite);
}
