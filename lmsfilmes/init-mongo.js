// Script de inicialização do MongoDB para o LMS Films
db = db.getSiblingDB("lmsfilmes");

// Criar usuário para a aplicação
db.createUser({
  user: "lmsuser",
  pwd: "lmspass123",
  roles: [
    {
      role: "readWrite",
      db: "lmsfilmes",
    },
  ],
});

// Criar índices para melhor performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ nickname: 1 }, { unique: true });
db.movies.createIndex({ tmdbId: 1 });
db.series.createIndex({ tmdbId: 1 });
db.favorites.createIndex({ userId: 1, movieId: 1 });
db.favoriteSeries.createIndex({ userId: 1, serieId: 1 });

print("Banco de dados LMS Films inicializado com sucesso!");
