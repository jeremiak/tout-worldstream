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



function createElement(type, cls) {
	var x = document.createElement(type);
	if (typeof cls != 'undefined') {
		x.className = cls;
	}
	return x
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

function createTout(tout) {
	tout = tout['tout'];

	like_text = 'likes go here';

	d = createElement('div', 'tout inactive');
	
	/* profile image creation */
	prof_div = createElement('div', 'span2 profile');
		prof_img_div = createElement('div', 'profile-img');
			prof_img = createElement('img');
			prof_img.src = tout['user']['avatar']['profile']['http_url'];
		prof_img_div.appendChild(prof_img);
		user_div = createElement('div', 'username');
			user_link = createElement('a');
			user_link.href = 'http://www.tout.com/u/' + tout['user']['uid'];
			user_link.textContent = tout['user']['fullname'] || tout['user']['username'];
		user_div.appendChild(user_link);    
		time_div = createElement('div', 'time');

		prof_div.appendChild(prof_img_div);
		prof_div.appendChild(user_div);
		prof_div.appendChild(time_div);

	/* video element creation */
	video_div = createElement('div', 'span6 video-container');
	video_div.setAttribute('id', tout['uid']);
		vid_img_div = createElement('div', 'vid-image');
			vid_img = createElement('img');
			vid_img.src = tout['image']['poster']['http_url'];
			vid_img.width = tout['image']['poster']['width'];

			var vid_img_margin = 0;
			width_of_source = tout['image']['poster']['width'];
			if (width_of_source < 474) {
				vid_img_margin = ( 474-width_of_source )/2;
				vid_img.style.marginLeft = vid_img_margin + 'px';
			}

		vid_img_div.appendChild(vid_img);
		vid_div = createElement('div', 'video');

	video_div.appendChild(vid_img_div);
	video_div.appendChild(vid_div);

		/* tout details element creation */
		deets_div = createElement('div', 'tout-deets');
			text_div = createElement('div', 'tout-text');
			text_div.textContent =  tout['text'];

			likes_div = createElement('div', 'tout-likes');
				likes_img = createElement('img');
				likes_img.src = 'img/thumb.png';
				likes_text = createElement('span');
				likes_text.textContent = like_text;
			likes_div.appendChild(likes_img);
			likes_div.appendChild(likes_text);

			clear_div = createElement('div', 'clear');
			clear_div.appendChild(createElement('br'));
		deets_div.appendChild(text_div);
		deets_div.appendChild(likes_div);
		deets_div.appendChild(clear_div);

	video_div.appendChild(deets_div);

	clear = createElement('div', 'clear');
	clear.appendChild(createElement('br'));

	d.appendChild(prof_div);
	d.appendChild(video_div);
	d.appendChild(clear);

	$('.vid-image').bind('click', function(e) {
		$e = $(e.target).parents('.vid-image');
		makeActive($e);
	});
	$('.span8').append(d);

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