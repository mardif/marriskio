var util = require("util");
var readFile = require("fs").readFile;
var engine = require("./engine");
var email = require("emailjs");
var cryo = require("cryo");

var common = exports;

common.colours = [];
common.colours.push( {name: 'verde', color: "#26ad1f"} );
common.colours.push( {name: 'blu', color: "#003fff"} );
common.colours.push( {name: 'arancio', color: "#cca226"} );
common.colours.push( {name: 'celeste', color: "#10d3d0"} );
common.colours.push( {name: 'viola', color: "#b967e5"} );
common.colours.push( {name: 'rosso', color: "#ff0000"} );

function extname (path) {
  var index = path.lastIndexOf(".");
  return index < 0 ? "" : path.substring(index);
}

common.staticHandler = function (filename) {
  var body, headers;
  var content_type = mime.lookupExtension(extname(filename));

  function loadResponseData(callback) {
    if (body && headers) {
      callback();
      return;
    }

    //util.puts("loading " + filename + "...");
    readFile(filename, function (err, data) {
      if (err) {
        util.puts(" -+-+-+-+-+-+-+- Error loading " + filename);
      } else {
        body = data;
        headers = { "Content-Type": content_type,
                    "Content-Length": body.length
                  };
        //if (!DEBUG) headers["Cache-Control"] = "public";
        //util.puts("static file " + filename + " loaded");
        callback();
      }
    });
  }

  return function (req, res) {
    loadResponseData(function () {
      res.writeHead(200, headers);
      res.end(req.method === "HEAD" ? "" : body);
    });
  };
};


common.simpleJSON = function (res, code, obj) {
          var body = new Buffer(JSON.stringify(obj));
          res.writeHead(code, { "Content-Type": "text/json"
                              , "Content-Length": body.length
                              });
          res.end(body);
};



var mime = {
  // returns MIME type for extension, or fallback, or octet-steam
  lookupExtension : function(ext, fallback) {
    return mime.TYPES[ext.toLowerCase()] || fallback || 'application/octet-stream';
  },

  // List of most common mime-types, stolen from Rack.
  TYPES : { ".3gp"   : "video/3gpp"
          , ".a"     : "application/octet-stream"
          , ".ai"    : "application/postscript"
          , ".aif"   : "audio/x-aiff"
          , ".aiff"  : "audio/x-aiff"
          , ".asc"   : "application/pgp-signature"
          , ".asf"   : "video/x-ms-asf"
          , ".asm"   : "text/x-asm"
          , ".asx"   : "video/x-ms-asf"
          , ".atom"  : "application/atom+xml"
          , ".au"    : "audio/basic"
          , ".avi"   : "video/x-msvideo"
          , ".bat"   : "application/x-msdownload"
          , ".bin"   : "application/octet-stream"
          , ".bmp"   : "image/bmp"
          , ".bz2"   : "application/x-bzip2"
          , ".c"     : "text/x-c"
          , ".cab"   : "application/vnd.ms-cab-compressed"
          , ".cc"    : "text/x-c"
          , ".chm"   : "application/vnd.ms-htmlhelp"
          , ".class"   : "application/octet-stream"
          , ".com"   : "application/x-msdownload"
          , ".conf"  : "text/plain"
          , ".cpp"   : "text/x-c"
          , ".crt"   : "application/x-x509-ca-cert"
          , ".css"   : "text/css"
          , ".csv"   : "text/csv"
          , ".cxx"   : "text/x-c"
          , ".deb"   : "application/x-debian-package"
          , ".der"   : "application/x-x509-ca-cert"
          , ".diff"  : "text/x-diff"
          , ".djv"   : "image/vnd.djvu"
          , ".djvu"  : "image/vnd.djvu"
          , ".dll"   : "application/x-msdownload"
          , ".dmg"   : "application/octet-stream"
          , ".doc"   : "application/msword"
          , ".dot"   : "application/msword"
          , ".dtd"   : "application/xml-dtd"
          , ".dvi"   : "application/x-dvi"
          , ".ear"   : "application/java-archive"
          , ".eml"   : "message/rfc822"
          , ".eps"   : "application/postscript"
          , ".exe"   : "application/x-msdownload"
          , ".f"     : "text/x-fortran"
          , ".f77"   : "text/x-fortran"
          , ".f90"   : "text/x-fortran"
          , ".flv"   : "video/x-flv"
          , ".for"   : "text/x-fortran"
          , ".gem"   : "application/octet-stream"
          , ".gemspec" : "text/x-script.ruby"
          , ".gif"   : "image/gif"
          , ".gz"    : "application/x-gzip"
          , ".h"     : "text/x-c"
          , ".hh"    : "text/x-c"
          , ".htm"   : "text/html"
          , ".html"  : "text/html"
          , ".ico"   : "image/vnd.microsoft.icon"
          , ".ics"   : "text/calendar"
          , ".ifb"   : "text/calendar"
          , ".iso"   : "application/octet-stream"
          , ".jar"   : "application/java-archive"
          , ".java"  : "text/x-java-source"
          , ".jnlp"  : "application/x-java-jnlp-file"
          , ".jpeg"  : "image/jpeg"
          , ".jpg"   : "image/jpeg"
          , ".js"    : "application/javascript"
          , ".json"  : "application/json"
          , ".log"   : "text/plain"
          , ".m3u"   : "audio/x-mpegurl"
          , ".m4v"   : "video/mp4"
          , ".man"   : "text/troff"
          , ".mathml"  : "application/mathml+xml"
          , ".mbox"  : "application/mbox"
          , ".mdoc"  : "text/troff"
          , ".me"    : "text/troff"
          , ".mid"   : "audio/midi"
          , ".midi"  : "audio/midi"
          , ".mime"  : "message/rfc822"
          , ".mml"   : "application/mathml+xml"
          , ".mng"   : "video/x-mng"
          , ".mov"   : "video/quicktime"
          , ".mp3"   : "audio/mpeg"
          , ".mp4"   : "video/mp4"
          , ".mp4v"  : "video/mp4"
          , ".mpeg"  : "video/mpeg"
          , ".mpg"   : "video/mpeg"
          , ".ms"    : "text/troff"
          , ".msi"   : "application/x-msdownload"
          , ".odp"   : "application/vnd.oasis.opendocument.presentation"
          , ".ods"   : "application/vnd.oasis.opendocument.spreadsheet"
          , ".odt"   : "application/vnd.oasis.opendocument.text"
          , ".ogg"   : "application/ogg"
          , ".p"     : "text/x-pascal"
          , ".pas"   : "text/x-pascal"
          , ".pbm"   : "image/x-portable-bitmap"
          , ".pdf"   : "application/pdf"
          , ".pem"   : "application/x-x509-ca-cert"
          , ".pgm"   : "image/x-portable-graymap"
          , ".pgp"   : "application/pgp-encrypted"
          , ".pkg"   : "application/octet-stream"
          , ".pl"    : "text/x-script.perl"
          , ".pm"    : "text/x-script.perl-module"
          , ".png"   : "image/png"
          , ".pnm"   : "image/x-portable-anymap"
          , ".ppm"   : "image/x-portable-pixmap"
          , ".pps"   : "application/vnd.ms-powerpoint"
          , ".ppt"   : "application/vnd.ms-powerpoint"
          , ".ps"    : "application/postscript"
          , ".psd"   : "image/vnd.adobe.photoshop"
          , ".py"    : "text/x-script.python"
          , ".qt"    : "video/quicktime"
          , ".ra"    : "audio/x-pn-realaudio"
          , ".rake"  : "text/x-script.ruby"
          , ".ram"   : "audio/x-pn-realaudio"
          , ".rar"   : "application/x-rar-compressed"
          , ".rb"    : "text/x-script.ruby"
          , ".rdf"   : "application/rdf+xml"
          , ".roff"  : "text/troff"
          , ".rpm"   : "application/x-redhat-package-manager"
          , ".rss"   : "application/rss+xml"
          , ".rtf"   : "application/rtf"
          , ".ru"    : "text/x-script.ruby"
          , ".s"     : "text/x-asm"
          , ".sgm"   : "text/sgml"
          , ".sgml"  : "text/sgml"
          , ".sh"    : "application/x-sh"
          , ".sig"   : "application/pgp-signature"
          , ".snd"   : "audio/basic"
          , ".so"    : "application/octet-stream"
          , ".svg"   : "image/svg+xml"
          , ".svgz"  : "image/svg+xml"
          , ".swf"   : "application/x-shockwave-flash"
          , ".t"     : "text/troff"
          , ".tar"   : "application/x-tar"
          , ".tbz"   : "application/x-bzip-compressed-tar"
          , ".tcl"   : "application/x-tcl"
          , ".tex"   : "application/x-tex"
          , ".texi"  : "application/x-texinfo"
          , ".texinfo" : "application/x-texinfo"
          , ".text"  : "text/plain"
          , ".tif"   : "image/tiff"
          , ".tiff"  : "image/tiff"
          , ".torrent" : "application/x-bittorrent"
          , ".tr"    : "text/troff"
          , ".txt"   : "text/plain"
          , ".vcf"   : "text/x-vcard"
          , ".vcs"   : "text/x-vcalendar"
          , ".vrml"  : "model/vrml"
          , ".war"   : "application/java-archive"
          , ".wav"   : "audio/x-wav"
          , ".wma"   : "audio/x-ms-wma"
          , ".wmv"   : "video/x-ms-wmv"
          , ".wmx"   : "video/x-ms-wmx"
          , ".wrl"   : "model/vrml"
          , ".wsdl"  : "application/wsdl+xml"
          , ".xbm"   : "image/x-xbitmap"
          , ".xhtml"   : "application/xhtml+xml"
          , ".xls"   : "application/vnd.ms-excel"
          , ".xml"   : "application/xml"
          , ".xpm"   : "image/x-xpixmap"
          , ".xsl"   : "application/xml"
          , ".xslt"  : "application/xslt+xml"
          , ".yaml"  : "text/yaml"
          , ".yml"   : "text/yaml"
          , ".zip"   : "application/zip"
          }
};

/* FUNZIONE RANDOM */
common.random = function(min, max) {
    min = min-1;
    max = max+1;
    return Math.floor(max + (1+min-max)*Math.random());
}

common.inArray = function (array, value)
// Returns true if the passed value is found in the
// array. Returns false if it is not.
{
    var i;
    for (i=0; i < array.length; i++) {
        if (array[i] === value) {
            return true;
        }
    }
    return false;
};

var mailServer = email.server.connect({
           //user:    "mardifoto",
           //password:"martina2010",
           //host:    "smtp.gmail.com",
           user: "debellum.net",
           password: "eewaashu",
           host:    "mail.debellum.net",
           ssl:     false,
           tls:     true
        });

common.sendEmail = function(headers){
    var message = email.message.create(headers);
    util.log("invio della email in corso...");
    message.attach_alternative(headers.text);
    mailServer.send(message, function(err, message) {
        if (err) {
            console.log("error sending email: "+err);
            return;
        };
        console.log("mail sending OK: "+util.inspect(message, true));
    });
}

common.getHeaderMailTemplate = function(){
  return "<html>\
                <body>\
                    <div style='width:600px;background: url(http://www.debellum.net/logo) no-repeat right center;'>\
                        <div style='height:50px;background-color:#2a333c;border-radius:5px 5px 0 0;border:1px solid #99999;width:100%;color:#999999;font-size:30pt;padding-left:42px;opacity:0.5;filter:alpha(opacity=50);'>DEBELLUM</div>\
                        <div style='border:1px solid #999999;display:inline-block;padding-top:10px;padding-bottom:10px;padding-left:40px;width:100%;'>";
}

common.getFooterMailTemplate = function(){
  return "              </div>\
                        <div style='height:50px;background-color:#2a333c;border-radius:0 0 5px 5px;border:1px solid #99999;padding-left:42px;width:100%;opacity:0.5;filter:alpha(opacity=50);'>&nbsp;</div>\
                    </div>\
                </body>\
            </html>";

}

var propertiesToRetrieve = [
    "initialTroupes",
    "troupesToAdd",
    "cards",
    "applyingTurnCards",
    "applyingVolatileCard",
    "sabotaged",
    "alliances",
    "states",
    "haveDefensiveCard",
    "turno",
    "AIActivated",
    "nick",
    "color",
    "_id"
];

common.setSessionPropsFromDb = function(mySession, match){
    var masterPlayer = match.getBean().masterPlayer;
    //util.log("Player is master? "+(masterPlayer.toString() == mySession.id ? "SI" : "NO"));
    mySession.setMaster( masterPlayer.toString() == mySession.id ? true : false  );
    
    for(var i=0; i< match.getBean().players.length; i++){
      var player = match.getBean().players[i];
      //util.log("playerid: "+player.player+" - mySessionId: "+mySession.id);
      if ( player.player.id == mySession.id ){
        mySession.color = player.color;
        //util.log("Color set "+mySession.color);
        break;
      }
    }
    
    /*
    Se il match è stato ripristinato, provvedo a ricaricare le proprietà della sessione (carte giocate, carte attive, etc)
    */
    //util.log("match "+match+" - restoremap: "+match.getRestoredSessionsMap());
    if ( match && match.getRestoredSessionsMap() !== undefined ){
        var map = match.getRestoredSessionsMap();
        if ( map[mySession.id] !== undefined ){
            var m = cryo.parse(map[mySession.id]);//JSON.parse(map[mySession.id]);
            //util.log("");
            //util.log(" -------------------------------- ");
            for(var idx in propertiesToRetrieve){
                var prop = propertiesToRetrieve[idx];
                //util.log("chiave "+prop);
                //util.log("valore in sessione: "+mySession[prop]);
                //util.log("valore da db: "+m[prop]);
                //util.log("");
                mySession[prop] = m[prop];
            }
            //util.log(" -------------------------------- ");
        }
        
        //Già che ci sono, aggiungo in lista le sessioni abbandonate
        /*
        //NON SERVE PIU: GLI UTENTI VENGONO PRE-INSERITI IN FASE DI CREAZIONE DELLA PARTITA
        for(var prp in map){
            var sess = cryo.parse(map[prp]); //JSON.parse(map[prp]);
            if ( sess.AIActivated === true && !this.checkUserExists(sess.nick) && sess.id != mySession.id ){
                var mySession = new Session({_id: sess.id, nick: sess.nick, color: sess.color, email: sess.email});
                mySession.setMatchId(match.getId());
                for(var idx in propertiesToRetrieve){
                    var prop = propertiesToRetrieve[idx];
                    mySession[prop] = sess[prop];
                }                
                match.getEngine().addSessionToEngine(mySession);
            }
        }
        */
    }    
    
  };
