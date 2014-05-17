var intro;
$(document).ready(function(){
    intro = introJs();
    intro.setOptions({
        nextLabel: 'prossimo >>',
        prevLabel: '<< indietro',
        skipLabel: 'Esci',
        doneLabel: 'Terminato',
        exitOnOverlayClick: false,
        showStepNumbers: false
    });
/*   
    intro.setSteps = function(steps){
        if(steps.length == 11){
            intro.setOptions({
                steps: [
                    {
                        element: '#actions',
                        intro: "Benvenuto Generale! Vediamo come affrontare questa guerra, e magari riuscire anche a vincerla...",
                        position: 'bottom'
                    },
                    {
                        element: '#abbandonaMatch',
                        intro: "Prima di tutto, se non hai il fegato di continuare, clicca qui ed abbandona la partita: ci penserà il sistema a prendere il controllo delle tue truppe, ma provvederà solo a difendersi dagli attacchi nemici. Se abbandonerai, sarai congedato con disonore!"
                    },
                    {
                        element: '#actions',
                        intro: "Lo scopo è semplice: <h2>annientare i tuoi nemici e conquistare il mondo.</h2> \
                        Il turno di ogni giocatore si compone di 3 parti:<br/> \
                        <ul>\
                            <li>1 - rinforzo</li>\
                            <li>2 - attacco</li>\
                            <li>3 - spostamento</li>\
                        </ul>\
                        Nel primo turno di gioco, dovrai posizionare solo delle armate nei territori del tuo stesso colore.<br/>\
                        Poi ti basterà seguire le istruzioni nel riquadro in alto per poter proseguire senza intoppi"
                    },
                    {
                        element: '#cards',
                        intro: "Ogni volta che conquisterai <b>almeno un territorio nemico</b>, avrai diritto ad una <b>carta speciale</b>, che ti permetterà di ... <i>non voglio rovinarti la sorpresa</i>!<br/>\
                        Potrai usare queste carte ad ogni tuo turno di attacco.<br/>\
                        Per vedere quelle a tua disposizione, clicca su questo pulsante."
                    },
                    {
                        element: '#continents',
                        intro: "<h2>Fase di rinforzo</h2>\
                        All'inizio del tuo turno, avrai a disposizione delle truppe da posizionare (cliccando sui marker dei propri stati) in base al numero di territori ed ai continenti conquistati.<br/>\
                        <b>Ogni 3 territori, hai diritto ad 1 rinforzo</b>\
                        <b>Ogni continente posseduto dà diritto al numero di rinforzi indicato nel riquadro in basso</b> (es: se si possiede l'America del Sud, si avrà diritto a 2 truppe supplementari ).<br/>\
                        Passando con il mouse sopra i nomi dei continenti potrai verificare i confini dei continenti",
                        position: 'top'
                    },
                    {
                        element: '#actions',
                        intro: "<h2>Fase di attacco</h2>\
                        Una volta rinforzati, si passa alla fase di attacco: basterà selezionare il marker del proprio territorio da cui attaccare e successivamente il marker del territorio che si vuole conquistare.<br/>\
                        Ad ogni attacco, verranno lanciati dei dadi: ogni dado di attacco (rossi) che supera il dado di difesa (verdi) equivale ad una truppa nemica eliminata.<br/>\
                        Attento però che per ogni dado di attacco con valore minore o uguale dal dado di difesa, viene eliminata una truppa di attacco!<br/>\
                        Quando non ci saranno più truppe nel territorio nemico, questo sarà dichiarato come <strong>CONQUISTATO</strong> e si avrà diritto ad una carta speciale.<br/>\
                        Possono essere lanciati più di un attacco, ma la carta speciale sarà sempre una per turno."
                    },
                    {
                        element: '#actions',
                        intro: "<h3>Fase di spostamento</h3>\
                        Una volta dichiarata la fine della fase di attacco, sarà possibile effettuare un solo ed unico spostamento delle proprie truppe, cliccando sul proprio territorio da cui spostare le truppe e poi cliccando sul terriorio dove si intende farle arrivare: ogni click corrisponde allo spostamento di una truppa!"
                    },
                    {
                        element: '#actions',
                        intro: "Terminato l'eventuale spostamento, le armi passeranno al prossimo avversario!"
                    },
                    {
                        element: '#users',
                        intro: "Qui trovi l'elenco degli avversari<br/>\
                        Accanto ad ogni nome, è visibile lo status di connessione: connesso o in connessione",
                        position: 'right'
                    },
                    {
                        element: '#chat',
                        intro: "Qui potrai interagire con i tuoi avversari tramite la chat: depista, allèati, tradisci... non ci sono limiti!",
                        position: 'right'
                    },
                    {
                        element: '#actions',
                        intro: "Non ci sono altre cose da aggiungere, Generale! Ricordati che questo riquadro in alto è fondamentale per farti capire a che punto sei del tuo turno, delle azioni che puoi eseguire e cosa stanno facendo i tuoi avversari.<br/>\
                        <strong>Buona Fortuna!</strong>"
                    },
                ]
            });
        }
    }*/   
});