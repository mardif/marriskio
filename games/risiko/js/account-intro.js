var intro;

$(document).ready(function(){
    intro = introJs();
    intro.setOptions({
      nextLabel: 'prossimo >>',
      prevLabel: '<< indietro',
      skipLabel: 'Esci',
      doneLabel: 'Terminato',
      exitOnOverlayClick: false,
    });
    intro.onchange(function(element){
        if ( element && ( element.id === "step4" || element.id === "step5" ) ){
            $(element).find("a").trigger("click")
        }
    });
    intro.oncomplete(function(){
        $("#step3").find("a").trigger("click");
    });

    intro.setSteps = function(steps){
      if(steps.length == 16){
        intro.setOptions({
          steps: [
            {
              element: '#step1',
              intro: steps[0],
              position: 'bottom'
            },
            {
              element: '#step2',
              intro: steps[1],
              position: 'left'
            },
            {
              element: '#step3',
              intro: steps[2]
            },
            {
              element: '#step3a',
              intro: steps[3]
            },
            {
              element: '#step3b',
              intro: steps[4]
            },
            {
              element: '#step3c',
              intro: steps[5]
            },
            {
              element: '#step3d',
              intro: steps[6]
            },
            {
              element: '#step3e',
              intro: steps[7]
            },
            {
              element: '#step4',
              intro: steps[8]
            },
            {
              element: '#step4a',
              intro: steps[9]
            },
            {
              element: '#step4b',
              intro: steps[10]
            },
            {
              element: '#step4c',
              intro: steps[11]
            },
            {
              element: '#step4d',
              intro: steps[12]
            },
            {
              element: '#step5',
              intro: steps[13]
            },
            {
              element: '#steplast',
              intro: steps[14],
              position: 'left'
            },
            {
              element: '#step1',
              intro: steps[15]
            }
          ]
        });
      }
    }
});