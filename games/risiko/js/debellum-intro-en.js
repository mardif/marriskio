var intro;
$(document).ready(function(){
    intro = introJs();
              intro.setOptions({
                nextLabel: 'next->',
                prevLabel: '<-previous',
                skipLabel: 'Exit',
                doneLabel: 'End',
                exitOnOverlayClick: false,
                showStepNumbers: false,
                steps: [
                    {
                        element: '#actions',
                        intro: "Welcome General! Let's see how to deal with this war, and maybe even be able to win it...",
                        position: 'bottom'
                    },
                    {
                        element: '#abbandonaMatch',
                        intro: "First of all, if you do not have the guts to continue, click here and leave the game: the system will take control of your troops, but it will only defend your territories against enemy attacks. If you abandon, you will be dishonorably discharged!"
                    },
                    {
                        element: '#actions',
                        intro: "The goal is simple: <h2> annihilate your enemies and conquer the world.</h2> \
                        Every turn has three phases:<br/> \
                        <ul>\
                            <li>1 - Reinforcement</li>\
                            <li>2 - Attack</li>\
                            <li>3 - Repositioning</li>\
                        </ul>\
                        During the first turn, you will only place your arms in the territories painted with your color.<br/>\
                        Then you will just follow the instructions in the top pane"
                    },
                    {
                        element: '#cards',
                        intro: "Every time you conquer <b>at least one enemy territory</b>, you will receive a <b>special card</b>, which will allow you to... <i>do not want to spoil the surprise</i>!<br/>\
                        You can use these cards during your attack turn.<br/>\
                        Click on this button to see which cards you can use."
                    },
                    {
                        element: '#continents',
                        intro: "<h2>Reinforcement phase</h2>\
                        At the beginning of your turn, you can place some reinforcement troops (clicking on your territories' marker). Their number depends on the number of your territories and the conquered continents.<br/>\
                        <b>One troop every three territories</b>\
                        <b>Every conquered continent gives some reinforcement troops, as shown in the pane below</b> (i.e. South America gives two reinforcement troops).<br/>\
                        Move the mouse its name to see its borders",
                        position: 'top'
                    },
                    {
                        element: '#actions',
                        intro: "<h2> Attack phase</h2>\
                        After the reinforcement, there is the attack phase: You can attack any number of times from any one of your territories (you can select it clicking its marker) to any adjacent territory, or connected by a sea-lane.<br/>\
                        For each attack, you roll up to three red dice, depending on your troop size. The defending player rolls the same number of green dice as the number of troops in their defending territory, with a maximum of two. <br/>\
                        One of your pieces will be removed from the attacking territory if the green die is higher or equal to its corresponding red die.<br/>\
                        One of your opponent’s pieces will be removed from the defending territory if the red die is higher to its corresponding green die.<br/>\
                        If you successfully wipe out all of the defending armies in the territory you are attacking, it will be <strong>CONQUERED</strong> and a special card will be rewarded.<br/>\
                        For each attack turn, you can collect only one special card, independently of the numbered of the conquered territories for that turn."
                    },
                    {
                        element: '#actions',
                        intro: "<h3>Repositioning phase</h3>\
                        After the attack phase, you will be permitted to move your troops from ONE territory to another. Pick one army clicking on one of our territory, then click on another territory to select its destination."
                    },
                    {
                        element: '#actions',
                        intro: "After the movement (if performed), weapons will pass on to the next opponent!"
                    },
                    {
                        element: '#users',
                        intro: "Here is the list of opponents, with its status (online, connecting)",
                        position: 'right'
                    },
                    {
                        element: '#chat',
                        intro: "Here you can interact with your opponents through the chat : sidetrack, ally, betray ... there are no limits!",
                        position: 'right'
                    },
                    {
                        element: '#actions',
                        intro: "There are other things to add, General! Remember that this upper pane is crucial to make you understand if it's your turn, the actions you can take and what your opponents are doing.<br/>\
                        <strong>Good luck!</strong>"
                    },
                ]
              });
});
