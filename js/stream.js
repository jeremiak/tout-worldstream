
var app = (function () {
	var active, paginationState, streamID, models, collections, callAjax, loadMoreTouts, createBoundStream, endlessScroll;
	active = { // holds the currently playing so its available in the global scope
		id: '',
		state: ''
	};			
	paginationState = 1;		// holds the current page for the main stream to enable endless scrolling
	streamID =  {
		main: 'a0vs6c',
		trending: 'iuyhdd',
		section1: 'e5x9z2',
		section2: '3pm1sf',
		section3: 'z9q9rx',
		section4: '',
		section5: ''
		};
	
	models = {
		Tout: Backbone.Model.extend({
			initialize: function() {
				var vidHeight = ( (474*this.attributes.video.mp4.height) / this.attributes.video.mp4.width)
                // account for the different orientations of video, and set the playbutton accordingly
                if (vidHeight > 600) {
                    this.set('playbtn', 'vertical');
                }
                else {
                    this.set('playbtn', 'horizontal');
                }
			}
		})
	};
	
	collections = {
		Stream: Backbone.Collection.extend({
			model: models.Tout
		})
	};
	
	views = {};
	views.ToutView = Backbone.View.extend({
		render: function () {
			$(this.el).html(this.template(this.model.toJSON()));
			return this;
		}
	});
		
	views.MainToutView = views.ToutView.extend({
		active: active,
		tagName: 'div',
		className: 'tout inactive',
		template:  _.template($('#main-template').html()),
		
		events: {
			'click': 'makeActive',
			'mouseenter': 'showShareBar',
			'mouseleave': 'hideShareBar',
			'cleanupVideo': 'cleanup'
		},
		
		showShareBar: function() {
			this.$el.find('.share-bar').animate({marginTop: '0'}, 'fast');
		},
		
		hideShareBar: function() {
			this.$el.find('.share-bar').animate({marginTop: '45px'}, 'fast');
		},
		
		cleanup: function() {
			// pause video
			_V_(this.model.attributes.uid).pause();
					
			// remove video player
			this.$el.find('.video-player').remove();
			
			// but show the poster and Tout details
			this.$el.find('.vid-image').show();
            this.$el.find('.share-bar-container').show();
			this.$el.find('.tout-deets').show();
		},
		
		makeActive: function() {
			var isActive = this.model.attributes.uid === app.active.id,
			state = active.state;
			console.log(self);
			console.log(this.model.attributes.uid + ' + ' + active.id);
			
			if (isActive === true) {
				var myPlayer = _V_(this.model.attributes.uid);
				console.log(myPlayer);
				if (state=='paused') {
					myPlayer.play();
					active.state = 'playing';
				}
				else if (state=='playing') {
					var timeLeft = myPlayer.duration() - myPlayer.currentTime();
				
					if (timeLeft != 0) {
						myPlayer.pause();
						active.state = 'paused';
					}
				}
			}
			else if (isActive === false) {
				if (active.id != '' ) {
					$('#vid-' + active.id).parents('.tout').trigger('cleanupVideo');	
				}
			
				// apply the video data to the video template
				var v = _.template($('#video-player').html(), this.model.toJSON()), 
				parentDiv = $('#vid-'+this.model.attributes.uid),
				self = this;
	
				// add the video player
				parentDiv.prepend(v);
				
				// when the video player is ready, set to zero and then play
				_V_(this.model.attributes.uid).ready(function() {
					var top = $(parentDiv).position().top, 
					$vidPlayer = parentDiv.find('.video-player');
					
					console.log(top-20);
					$(document).scrollTop(top-20);
					
					parentDiv.find('.vid-image').hide();
					parentDiv.find('.tout-deets').hide();
					parentDiv.find('.share-bar-container').hide();
					
					$vidPlayer.css('visibility', 'visible');
					$vidPlayer.animate({height: 300}, 'fast');
								
					this.addEvent('ended', function(e) {
						var $next = $('#' + e.target.id).parents('.tout').next();
						active.state = 'ended';
						
						self.$el.trigger('cleanupVideo');
						$next.trigger('click');
					});
					
					this.play();
					active.state = 'playing';
					
				});
				
				// make sure the global scope knows which video is currently active
				active.id = this.model.attributes.uid;
			}
		}
	});
	
	views.SectionToutView = views.ToutView.extend({
		template: _.template($('#right-template').html())
	});
	
	callAjax = function (streamID, startPage, perPage) {
		if (perPage == undefined) {
			perPage = 15;
		}
		
		var result='', ajax_url = 'https://staging.kicktag.com/api/v1/streams/'+streamID+'/touts.json?access_token=4bfe906789a873eb7d9218af99ed864dfa3e11acd213bf0dabb372103872c996&per_page='+perPage+'&page='+startPage;
        
        $.ajax({
            url: ajax_url,
			async: false,
			success:function(data) {
				result = data; 
			}
	   });
	   return result;
	};
	
	loadMoreTouts = function (stream, streamID, startPage, perPage) {
		var t = this.callAjax(streamID, startPage, perPage), touts='';
		
        touts = t['touts'];
		
		for(var i=0; i<touts.length; i++) {
			var tout = new app.models.Tout(touts[i]['tout']);
			stream.add(tout);
		}
	};
	
	createBoundStream = function (view, target) {
		var s = new app.collections.Stream();
		s.on('add', function(tout) {
			var v = new view({model: tout});
			$(target).append(v.render().$el);
		});
		
		return s;
	};
	
	endlessScroll = function (stream) {
		p = app['paginationState'];
		
		var st = $(document).scrollTop();
		var dh = $(document).height();
		var r = st/dh;
	
		if (r>.59 && r<.61) {
			console.log(p);
			app.loadMoreTouts(stream, app.streamID['main'], p);
			app['paginationState']++;
		}
	};
	
	return {
		active: active,
		paginationState: paginationState,
		streamID: streamID,
		models: models,
		collections: collections,
		views: views,
		callAjax: callAjax,
		loadMoreTouts: loadMoreTouts,
		createBoundStream: createBoundStream,
		endlessScroll: endlessScroll
	}
})();
