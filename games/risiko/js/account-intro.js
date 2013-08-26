var intro;
$(document).ready(function(){
    intro = introJs();
              intro.setOptions({
                nextLabel: 'prossimo->',
                prevLabel: '<-indietro',
                skipLabel: 'Esci',
                doneLabel: 'Terminato',
                exitOnOverlayClick: false,
                steps: [
                  {
                    element: '#step1',
                    intro: "Benvenuto! Questo piccolo tour ti permetterà di conoscere le funzionalità della tua pagina principale",
                    position: 'bottom'
                  },
                  {
                      element: '#step2',
                      intro: "Con questo pulsante potrai creare una tua partita pubblica ed attendere che altri utenti si uniscano alla tua partita.<br/>Puoi scegliere il nome della partita, il tuo colore ed il numero di partecipanti",
                      position: 'left'
                  },
                  {
                      element: '#step3',
                      intro: "In questo tab troverai le partite a cui partecipi. <br/>Per ognuna potrai:"
                  },
                  {
                      element: '#step3a',
                      intro: "<ul><li>Invitare utenti registrati e nuovi amici alla tua partita</li><li>Decidere di non partecipare più alla partita</li><li>Se sei il creatore della partita, puoi cancellarla</li></ul>"
                  },
                  {
                      element: '#step3b',
                      intro: "Sapere quando è stata creata ed eventualmente sapere quando è stata salvata l'ultima volta (nel caso di partite lunghissime)"
                  },
                  {
                      element: '#step3c',
                      intro: "Sapere quale utente ha creato questa partita"
                  },
                  {
                      element: '#step3d',
                      intro: "Sapere quanti e quali giocatori hanno aderito alla partita <img src='/seatBusy' border='0'> e quanti posti liberi sono ancora disponibili <img src='/seatFree' border='0'>"
                  },
                  {
                      element: '#step3e',
                      intro: "Sapere lo stato della partita:<br/><ul><li><b>In attesa di giocatori</b>: la partita potrà iniziare solo quando tutti gli slot saranno occupati</li><li><b>Pronto a giocare</b>: cliccando sul pulsante <img src='/play' border='0'> sarà possibile avviare/ripristinare la partita</li></ul>"
                  },
                  {
                      element: '#step4',
                      intro: "Qui troverai tutte le partite a cui potrai partecipare<br/>Per ognuna potrai:"
                  },
                  {
                      element: '#step4a',
                      intro: "Sapere quando è stata creata la partita"
                  },
                  {
                      element: '#step4b',
                      intro: "Sapere quale utente ha creato questa partita"
                  },
                  {
                      element: '#step4c',
                      intro: "Sapere quanti e quali giocatori hanno aderito alla partita <img src='/seatBusy' border='0'> e quanti posti liberi sono ancora disponibili <img src='/seatFree' border='0'>"
                  },
                  {
                      element: '#step4d',
                      intro: "Sapere lo stato della partita. Se vorrai partecipare, ti basterà cliccare sul pulsate \"Partecipa\"!"
                  },
                  {
                      element: '#step5',
                      intro: "Qui invece potrai vedere le partite che hai terminato, ed inoltre, cliccando sull'icona <img src='/play' border='0'> potrai rivedere la situazione finale della partita"
                  },
                  {
                      element: '#steplast',
                      intro: 'Se proprio vuoi uscire da Debellum, allora clicca qui!',
                      position: 'left'
                  },
                  {
                      element: '#step1',
                      intro: "Questo è tutto, semplice no?<br/><strong>Buon divertimento!</strong>"
                  }
                ]
              });
    intro.onchange(function(element){
        if ( element && ( element.id === "step4" || element.id === "step5" ) ){
            $(element).find("a").trigger("click")
        }
    });
    intro.oncomplete(function(){
        $("#step3").find("a").trigger("click");
    });

    //intro.start();
});
