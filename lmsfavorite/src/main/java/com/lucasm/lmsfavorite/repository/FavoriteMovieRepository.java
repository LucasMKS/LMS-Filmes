package com.lucasm.lmsfavorite.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.lucasm.lmsfavorite.model.FavoriteMovie;

import java.util.List;
import java.util.Optional;

/**
 * Repositório de acesso a dados para favoritos de filmes.
 */
@Repository
public interface FavoriteMovieRepository extends MongoRepository<FavoriteMovie, String> {

    /**
     * Busca favoritos de filmes de um usuário por status de favorito.
     *
     * @param email e-mail do usuário.
     * @param favorite status de favorito a ser filtrado.
     * @return lista de filmes favoritados conforme o filtro.
     */
    List<FavoriteMovie> findByEmailAndFavorite(String email, boolean favorite);

    /**
     * Busca o registro de favorito de um filme para um usuário.
     *
     * @param movieId identificador do filme.
     * @param email e-mail do usuário.
     * @return favorito encontrado, quando existir.
     */
    Optional<FavoriteMovie> findByMovieIdAndEmail(String movieId, String email);

    /**
     * Busca filmes favoritados (status true) por lote para um usuário.
     *
     * @param email e-mail do usuário.
     * @param movieIds identificadores dos filmes.
     * @return lista de registros favoritados encontrados no lote.
     */
    List<FavoriteMovie> findByEmailAndMovieIdInAndFavorite(String email, List<String> movieIds, boolean favorite);

}
