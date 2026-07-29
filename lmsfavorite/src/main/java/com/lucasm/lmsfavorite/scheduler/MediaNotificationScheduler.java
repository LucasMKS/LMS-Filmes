package com.lucasm.lmsfavorite.scheduler;

import com.lucasm.lmsfavorite.model.WatchlistMovie;
import com.lucasm.lmsfavorite.repository.WatchlistMovieRepository;
import com.lucasm.lmsfavorite.service.RabbitMQProducer;
import com.lucasm.lmsfavorite.model.WatchlistStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Random;

@Component
@Slf4j
@RequiredArgsConstructor
public class MediaNotificationScheduler {

    private final WatchlistMovieRepository watchlistRepository;
    private final RabbitMQProducer rabbitMQProducer;

    /**
     * SESSÃO PIPOCA: Roda todos os dias às 18:30.
     * Sorteia um filme pendente da Watchlist para sugerir.
     */
    @Scheduled(cron = "0 30 18 * * *")
    public void suggestDailyMovie() {
        log.info("Cronjob Media: Iniciando sorteio do filme diário...");

        List<WatchlistMovie> eligibleMovies = watchlistRepository.findByStatusIn(
                List.of(WatchlistStatus.PLAN_TO_WATCH, WatchlistStatus.WATCHING)
        );
        
        if (eligibleMovies.isEmpty()) {
            log.info("Nenhum filme pendente na Watchlist para sugerir hoje.");
            return;
        }

        Random random = new Random();
        WatchlistMovie suggestedMovie = eligibleMovies.get(random.nextInt(eligibleMovies.size()));

        String myFrontLink = "https://filmes.lucasmks.com.br/filmes/" + suggestedMovie.getMovieId();

        String message = String.format(
            "🍿 <b>Sessão Pipoca!</b>\n\n" +
            "Filme escolhido da sua Watchlist para assistir hoje:\n\n" +
            "🔗 <a href='%s'>Ver Detalhes do Filme</a>\n\n",
            myFrontLink
        );

        rabbitMQProducer.sendMediaNotification(message);
    }
}
