/**
 * Inicializa o banco do serviço LMS Filmes.
 *
 * Executado automaticamente no container MongoDB durante o bootstrap.
 */
db = db.getSiblingDB("lmsfilmes");

/**
 * Cria o usuário de aplicação com permissão de leitura e escrita.
 *
 * @param {string} username Nome do usuário do banco.
 * @param {string} password Senha do usuário.
 */
function createApplicationUser(username, password) {
  db.createUser({
    user: username,
    pwd: password,
    roles: [
      {
        role: "readWrite",
        db: "lmsfilmes",
      },
    ],
  });
}

/**
 * Cria índice único para garantir integridade dos dados.
 *
 * @param {string} collectionName Nome da coleção.
 * @param {Record<string, 1 | -1>} keys Campos indexados.
 */
function createUniqueIndex(collectionName, keys) {
  db[collectionName].createIndex(keys, { unique: true });
}

/**
 * Cria índice não único para otimizar consultas frequentes.
 *
 * @param {string} collectionName Nome da coleção.
 * @param {Record<string, 1 | -1>} keys Campos indexados.
 */
function createIndex(collectionName, keys) {
  db[collectionName].createIndex(keys);
}

createApplicationUser("lmsuser", "lmspass123");

createUniqueIndex("users", { email: 1 });
createUniqueIndex("users", { nickname: 1 });
createIndex("movies", { tmdbId: 1 });
createIndex("series", { tmdbId: 1 });
createIndex("favorites", { userId: 1, movieId: 1 });
createIndex("favoriteSeries", { userId: 1, serieId: 1 });

print("Banco de dados LMS Films inicializado com sucesso!");
