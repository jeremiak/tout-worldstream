var Tout = Backbone.Model.extend({
	
	initialize: function(tout) {
		var k = _.keys(tout['tout']);
		for (var i=0; i<k.length; i++) {
			this.set(k[i], tout['tout'][k[i]]);
			this.set('active', false);
		}
	}

});

var Stream = Backbone.Collection.extend({
	model: Tout
});

var s = new Stream();

function BBcallAjax(startPage) {
//	console.log('http://localhost/ba-simple-proxy.php?url=http://www.tout.com/api/v1/latest.json?page='+ startPage);
	var ajax_url = 'http://www.tout.com/api/v1/latest.json?' + encodeURIComponent('per_page=15&page='+startPage);
	var result="";
	$.ajax({
		url:'http://localhost/ba-simple-proxy.php?url=' + ajax_url,
		async: false,
		success:function(data) {
		 result = data; 
		}
   });
   return result;
};

function BBloadMoreTouts(startPage) {
	var t = BBcallAjax(startPage);

	while(t['status']['http_code'] != 200) {
		console.log('waiting on ajax call');
	}
	
	var touts = t['contents']['touts'];
	for(var i=0; i<touts.length; i++) {
	   s.add(new Tout(touts[i]));
	}
		
};

BBloadMoreTouts(2);


// above be backbone


var videoHandler = {};
function endPlayback(playerId) {
	var player = _V_(playerId);
	player.pause();
	console.log(playerId + ' playback has ended');
	pid = playerId.split('_')[0];
	$('#'+pid).parents('.video').animate({
			display: 'none',
			height: 0
		}, 1000);
	$('#'+pid).parents('.tout').removeClass('active');
	$('#'+pid).parents('.tout').addClass('inactive').animate(2);
};

function ensureOneActive(activeTarget) {
	activeTarget = activeTarget.split('_')[0];
	var a = $('.active');
	for (var i=0; i<a.length; i++) {
		var vidID = $(a[i]).children('.video-container').children('.video').children('.video-js').attr('id');
		console.log('vidID: ' + vidID + ' / activeTarget: ' + activeTarget); 
		if (vidID != activeTarget) {
			endPlayback(vidID);
		}
	}
};

function makeActive(eventTarget) {
	var tid = $(eventTarget).parents('.video-container').attr('tout-id');
	
	//$("...").unloadToutVideo();
	
	var tout = _.filter(touts, function(){});
	$().loadToutVideo(tout);

	ensureOneActive(playerId);

	var player = _V_(playerId);
	/*        player.volume(0);     */
	player.play();
	
	player.addEvent('ended', function() {
		endPlayback(playerId);
	});
};

function callAjax(startPage) {
	console.log('http://localhost/ba-simple-proxy.php?url=http://www.tout.com/api/v1/latest.json?page='+ startPage);
	var ajax_url = 'http://www.tout.com/api/v1/latest.json?' + encodeURIComponent('per_page=15&page='+startPage);
	var result="";
	$.ajax({
		url:'http://localhost/ba-simple-proxy.php?url=' + ajax_url,
		async: false,
		success:function(data) {
		 result = data; 
		}
   });
   return result;
};

function loadMoreTouts(startPage) {
	var t = callAjax(startPage);

	while(t['status']['http_code'] != 200) {
		console.log('waiting on ajax call');
	}
	
	var touts = t['contents']['touts'];
	for(var i=0; i<touts.length; i++) {
		createTout(touts[i]);
	}
		
};

function endlessScroll(paginationState) {
	var st = $(document).scrollTop();
	var dh = $(document).height();
	var r = st/dh;

	if (r>.59) {
			loadMoreTouts(paginationState);
			console.log(paginationState);
		}
	
	paginationState++;  
}