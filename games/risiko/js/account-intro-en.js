var intro;
$(document).ready(function(){
    intro = introJs();
              intro.setOptions({
                nextLabel: 'next->',
                prevLabel: '<-previous',
                skipLabel: 'Exit',
                doneLabel: 'End',
                exitOnOverlayClick: false,
                steps: [
                  {
                    element: '#step1',
                    intro: "Hi! This tour will show you the key features of your main page",
                    position: 'bottom'
                  },
                  {
                      element: '#step2',
                      intro: "Create a new match with this button, then wait other players to join it.<br/>Choose the match name, your color and the player number",
                      position: 'left'
                  },
                  {
                      element: '#step3',
                      intro: "Here you can find the matches you take part in. <br/>For each match you can:"
                  },
                  {
                      element: '#step3a',
                      intro: "<ul><li>Invite registered players or new friend to join the match</li><li>Leave the match</li><li>If you created the match, you can delete it</li><li>You can send a reminder to all the players</li></ul>"
                  },
                  {
                      element: '#step3b',
                      intro: "Get the information about the match (creation date, last saved date)"
                  },
                  {
                      element: '#step3c',
                      intro: "See who creates the match"
                  },
                  {
                      element: '#step3d',
                      intro: "Discover who joined the match <img src='/seatBusy' border='0'> and how many seats are still available  <img src='/seatFree' border='0'>"
                  },
                  {
                      element: '#step3e',
                      intro: "See the match status:<br/><ul><li><b>Waiting for players</b>: the match can start when all the slots are busy</li><li><b>Ready to play</b>: clicking on the <img src='/play' border='0'> button you can start/resume the match</li></ul>"
                  },
                  {
                      element: '#step4',
                      intro: "Here you can find the matches tou can join<br/>For each match you can:"
                  },
                  {
                      element: '#step4a',
                      intro: "Get the creation date"
                  },
                  {
                      element: '#step4b',
                      intro: "See who creates the match"
                  },
                  {
                      element: '#step4c',
                      intro: "Discover who joined the match <img src='/seatBusy' border='0'> and how many seats are still available <img src='/seatFree' border='0'>"
                  },
                  {
                      element: '#step4d',
                      intro: "See the match status. If you want to join the match, click on the \"Join\" button!"
                  },
                  {
                      element: '#step5',
                      intro: "Here you can find your history and see the final state of each match, clicking on the <img src='/play' border='0'> button"
                  },
                  {
                      element: '#steplast',
                      intro: 'If you want to sign out from Debellum, then click here!',
                      position: 'left'
                  },
                  {
                      element: '#step1',
                      intro: "That's all, it is simple, isn't it?<br/><strong>Have fun with Debellum!</strong>"
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
