

var Tout = Backbone.Model.extend({
	initialize: function() {
		var vidHeight = ( (474*this.attributes.video.mp4.height) / this.attributes.video.mp4.width)
		this.set('vidheight', vidHeight);
	},

});

var Stream = Backbone.Collection.extend({
	model: Tout
});

var ToutView = Backbone.View.extend({
	render: function () {
		$(this.el).html(this.template(this.model.toJSON()));
    	return this;
	}
});

var MainToutView = ToutView.extend({
	tagName: 'div',
	className: 'tout inactive',
	template:  _.template($('#main-template').html()),
	
	events: {
		'click': 'togglePlay'
	},
	
	togglePlay: function() {
		var active = this.model.attributes.uid == app.active;
		var x = $('#'+this.model.attributes.uid);
		
		if (active==false) {
			
			// check to see if no videos are currently playing
			if (app.active != '') {
				// super hacky and definitely shouldn't be in a single tout view but gotta gooo
				// pause active video
				_V_(app.active).pause();
				
				// remove video player
				$('#' + app.active).children('.video-player').remove();
				var y = $('#'+app.active);
				var children = y.children();
				for (var i=0; i<children.length; i++) {
					$(children[i]).show();
				}
				// end of shite
			}
			
			// apply the video data to the video template
			var v = _.template($('#video-player').html(), this.model.toJSON());
			x.prepend(v);
			
			// hide the poster image as well as the tout details
			var children = x.children();
			for (var i=0; i<children.length; i++) {
				$(children[i]).hide();
			}
			
			// add the video player
			
			
			// when the video player is ready, set to zero and then play
			var self = this;
			setTimeout(function() {
			var myPlayer = _V_(self.model.attributes.uid);
			myPlayer.ready(function() {
				myPlayer.currentTime(0);
				myPlayer.play();
			});
			}, 0);
			
			// make sure the global scope knows which video is currently active
			app.active = this.model.attributes.uid; 
		}
		else if(active==true) {
			var children = x.children();
			
			_V_(this.model.attributes.uid).pause();
			$('video#' + this.model.get('uid')).parents('.video-player').remove();
			var children = x.children();
			for (var i=0; i<children.length; i++) {
				$(children[i]).show();
			}
			
			app.active = '';
		}
	}
});

var TrendingToutView = ToutView.extend({
	tagName: 'li',
	template: _.template($('#upper-right-template').html())
});

var SectionToutView = ToutView.extend({
	template: _.template($('#lower-right-template').html())
});
var app = {
	active: '',				// holds the currently playing so its available in the global scope
	paginationState: 1,		// holds the current page for the main stream to enable endless scrolling
	streamID: {
		main: '579h3s',
		trending: '579h3s',
		section1: '579h3s',
		section2: '579h3s'
		},
	
	callAjax: function (streamID, startPage, perPage) {
		if (perPage == null) {
			perPage = 15;
		}
		
	//	var ajax_url = 'http://staging.kicktag.com/api/v1/streams/'+streamID+'/touts.json?' + encodeURIComponent('per_page=15&page='+startPage);
		var ajax_url = 'http://api.tout.com/api/v1/latest.json?' + encodeURIComponent('per_page='+perPage+'&page='+startPage);
		var result="";
		$.ajax({
			url:'http://localhost/ba-simple-proxy.php?url=' + ajax_url,
			async: false,
			success:function(data) {
				result = data; 
			}
	   });
	   return result;
	},
	
	loadMoreTouts: function (stream, streamID, startPage, perPage) {
		var t = this.callAjax(streamID, startPage, perPage);
	
		while(t['status']['http_code'] != 200) {
			console.log('waiting on ajax call');
		}
		
		var touts = t['contents']['touts'];
		
		for(var i=0; i<touts.length; i++) {
			var tout = new Tout(touts[i]['tout']);
			stream.add(tout);
		}
	},
	
	createBoundStream: function (view, target) {
		var s = new Stream();
		s.on('add', function(tout) {
			var v = new view({model: tout});
			$(target).append(v.render().$el);
		});
		
		return s;
	},
	
	endlessScroll: function (stream) {
		p = app['paginationState'];
		
		var st = $(document).scrollTop();
		var dh = $(document).height();
		var r = st/dh;
	
		if (r>.59 && r<.61) {
			console.log(p);
			app.loadMoreTouts(stream, '579h3s', p);
			app['paginationState']++;
		}
	}
};