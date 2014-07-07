$(document).ready(function(){

    $().acknowledgeinput({
            success_color: '#00FF00',
            danger_color: '#FF0000',
            update_on: 'keyup'
        });
    $("#loginForm").modal("show");
});

$(document).on("click", "#loginUser", function(){

      $.ajax({ cache: false
           , dataType: "jsonp"
           , data: $("#formLogin").serialize()
           , url: "loginAuth"
           , type: "POST"
           , error: function (err) {
               //alert("Error: "+err.responseText);
               $("#errorLogin").html(err.responseText);
             }
           , success: function(data){
               if ( data && data.length == 0 ){
                   alert("data: "+data);
               }
             }
           }
  );
});

  /*
  $.ajax({ cache: false
           , dataType: "json"
           , data: {  }
           , url: "/getMatches"
           , type: "GET"
           , error: function (err) {
               alert("Error: "+err.responseText);
             }
           , success: function(data){
               if ( data && data.length == 0 ){
                   //alert("Spiacente... siamo già al completo per questa partita! Ripassa più tardi... moooolto più tardi!");
                   $("#matchListConnectToButton").prop("disabled", true);
                   //$("#alreadyInGame").prop("disabled", true);
               }

               for(var i in data){
                   var match = data[i];
                   $("<option value='"+match.id+"'>"+match.id+": "+match.name+"</option>").appendTo($("#matchListConnectTo"));
               }
             }
           }
  );

  var validateLogin = function(){
    var nick = $("#nickInput").val();

    //dont bother the backend if we fail easy validations
    if (nick.length > 10) {
      alert("Nick too long. 10 character max.");
      return false;
    }

    //more validations
    if (/[^\w_\-^!]/.exec(nick)) {
      alert("Bad character in nick. Can only have letters, numbers, and '_', '-', '^', '!'");
      return false;
    }

	return true;

  };

  $("#connectButton").click(function () {
	if ( !validateLogin() ){
		return false;
	}

	var nick = $("#nickInput").val();

    //make the actual join request to the server
    $.ajax({ cache: false
           , dataType: "json"
           , data: { nick: nick, color: $("#color").val() }
           , url: "/join"
           , type: "GET"
           , error: function (err) {
               alert("Error: "+err.responseText);
             }
           , success: onConnect
           });
    return false;
  });

  $("#alreadyInGame").click(function(){
	  window.location.href = "/joinMap?justInGame=true";
  });

  $("#matchListConnectToButton").click(function () {
	validateLogin();

	var nick = $("#nickInput").val();

    //make the actual join request to the server
    $.ajax({ cache: false
           , dataType: "json"
           , data: { nick: nick, color: $("#color").val(), matchId: $("#matchListConnectTo").val() }
           , url: "/joinToMatch"
           , type: "GET"
           , error: function (err) {
               alert("Error: "+err.responseText);
             }
           , success: onConnect
           });
    return false;
  });


  $("#nickInput").focus();

});

function onConnect (data) {
    window.location = data.url;
}
*/