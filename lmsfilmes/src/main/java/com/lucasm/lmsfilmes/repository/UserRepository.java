package com.lucasm.lmsfilmes.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.lucasm.lmsfilmes.model.User;

/**
 * Repositório de acesso aos usuários no MongoDB.
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {

    /**
     * Busca um usuário pelo e-mail.
     *
     * @param email e-mail do usuário.
     * @return usuário encontrado, quando existir.
     */
    Optional<User> findByEmail(String email);

    /**
     * Busca um usuário pelo nickname.
     *
     * @param nickname apelido único do usuário.
     * @return usuário encontrado, quando existir.
     */
    Optional<User> findByNickname(String nickname);

    /**
     * Retorna todos os usuários cadastrados.
     *
     * @return lista de usuários persistidos.
     */
    @SuppressWarnings("null")
    List<User> findAll();
}
