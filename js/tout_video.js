(function($) {

  var youtubeVideoProgressPoller;

  $.fn.extend({

    loadToutVideo: function(tout, opts){
      var defaultOptions = {
        width: 640,
        height: 480,
        autoplay: false,
        analyticsProperties: {},
        skipAnalytics: false
      };
      var options = $.extend({}, defaultOptions, opts || {});

      return this.each(function() {
        $(this).unloadToutVideo();

        var videoHtml = $.fn.toutVideoHtml(this, tout, options);
        $(this).html(videoHtml);
        $.fn.initializeToutVideo(this, tout, options);
      });
    },



    toutVideoHtml: function(element, tout, options){
      var videoType = tout.video.type;

      if(videoType == "native"){
        return $.fn.toutNativeVideoHtml(element, tout, options);
      } else if(videoType == "youtube"){
        return $.fn.toutYoutubeVideoHtml(element, tout, options);
      }
    },

    initializeToutVideo: function(element, tout, options) {
      var videoType = tout.video.type;

      if(videoType == "native"){
        $.fn.initializeNativeToutVideo(element, tout, options);
      } else if(videoType == "youtube"){
        $.fn.initializeYoutubeToutVideo(element, tout, options);
      }
    },




    toutNativeVideoHtml: function(element, tout, options) {
      var videoTemplate = '<div class="video-js-wrapper">' +
                            '<span class="video-js-overlay" style="width: {{ options.width }}px; height: {{ options.height }}px; display: none;"></span>' +
                            '<video id="tout_video_{{ tout.uid }}_{{ time }}" class="video-js vjs-default-skin vjs-tout-skin" width="{{ options.width }}" height="{{ options.height }}" poster="{{ tout.image.poster.http_url }}">' +
                              '<source src="{{ tout.video.mp4.http_url }}" type="video/mp4" />' +
                            '</video>' +
                          '</div>';

      return _.template(videoTemplate, {tout: tout, options: options, time: new Date().getTime()});
    },

    initializeNativeToutVideo: function(element, tout, options) {
      var $videoElement = $(".video-js", element)[0];

      // we don't want to pass all options along to videojs, so we whitelist the options we want to pass through
      var videoJsOptions = {
        "controls": true,
        "preload": "auto",
        "autoplay": options.autoplay
      };

      _V_($videoElement.id, videoJsOptions).ready(function() {
        var player = this;

        $.fn.resizePosterForVideoJs({
          player: player,
          posterWidth: tout.image.poster.width,
          posterHeight: tout.image.poster.height
        });

        player.addEvent("play", function(){
          //play event will fire if a video is paused and the user clicks play...
          if(player.currentTime() < 0.3){
            if (!options.skipAnalytics) {
              AnalyticsEvents.trackPlayUpdate(tout, options.analyticsProperties);
            }
          }
        });

        var $vjsBigPlayButton = $(".vjs-big-play-button", player.el);
        var overlayButtonsHtml = '<div class="vjs-tout-overlay-buttons">' +
                                   '<span class="play" style="display:none;"></span>' +
                                   '<span class="pause" style="display:none;"></span>' +
                                 '</div>';
        $vjsBigPlayButton.after(overlayButtonsHtml);
        var $vjsToutOverlayButtons = $("w", player.el);

        $(player.el).prev(".video-js-overlay").click(function(e){
          if (player.paused()) {
            player.play();
            if ($vjsBigPlayButton.is(":hidden")){
              $(".pause", $vjsToutOverlayButtons).hide();
              $(".play", $vjsToutOverlayButtons).show().fadeOut(1000);
            }
          } else {
            player.pause();
            if ($vjsBigPlayButton.is(":hidden")){
              $(".play", $vjsToutOverlayButtons).hide();
              $(".pause", $vjsToutOverlayButtons).show().fadeOut(1000);
            }
          }
        });

        $(".video-js-overlay").mouseover(function() { player.triggerEvent("mouseover"); });
        $(".video-js-overlay").mouseout(function() { player.triggerEvent("mouseout"); });

        // custom hooks for the client
        if(options.onPlay) { player.addEvent("play", function(){ options.onPlay(); }); }
        if(options.onEnded) { player.addEvent("ended", function(){ options.onEnded(); }); }
        if(options.onTimeUpdate) { player.addEvent("timeupdate", function(){ options.onTimeUpdate(); }); }

        // onWatch is a custom event which is triggered when half the video is watched
        if(options.onWatch){
          var watchEventTriggered = false;
          player.addEvent("timeupdate", function(){
            if(watchEventTriggered || player.duration() === 0) return;

            if(player.currentTime() > (player.duration() / 2)){
              watchEventTriggered = true;
              options.onWatch();
            }
          });
        }
      });
    },

    toutYoutubeVideoHtml: function(element, tout, options) {
      var origin = window.location.protocol + "//" + window.location.host;
      var videoTemplate = '<iframe id="youtube_video_{{ tout.uid }}" name="youtube_video_{{ tout.uid }}" type="text/html" width="{{ options.width }}"' +
                          ' height="{{ options.height }}" class="youtube_video"' +
                          ' src="http://www.youtube.com/embed/{{ tout.video.youtube.video_id }}?enablejsapi=1&controls=0&wmode=opaque&origin=' + origin + '"' +
                          ' frameborder="0">';
      
      if(window.isIos()) {
        var youtubeUrl = "http://www.youtube.com/watch?v={{ tout.video.youtube.video_id }}";
        videoTemplate = '<div class="youtube-touts-not-supported">' +
                          '<h1>Youtube Touts are not supported on iOS.</h1>' +
                          '<a href="' + youtubeUrl + '">' + youtubeUrl + '</a>' +
                        '</div>';
      }
      return _.template(videoTemplate, {tout: tout, options: options});
    },

    initializeYoutubeToutVideo: function(element, tout, options){

      if(window.isIos()){
        return;
      }

      if(!window['YT'] || !YT.Player){
        $.fn.loadYoutubeIframeApi(element, tout, options);
        return;
      }

      var $videoElement = $("iframe", element)[0];
      var youtubePlayer = new YT.Player($videoElement.id);

      var videoOffset = tout.video.youtube.start_offset;
      var firstLoad = true;

      youtubePlayer.addEventListener("onReady", function(event){
          youtubePlayer.seekTo(videoOffset, true);
          options.autoplay ? youtubePlayer.playVideo() : youtubePlayer.pauseVideo();
      }, false);


      youtubePlayer.addEventListener("onStateChange", function(event){

        if(event.data == YT.PlayerState.PLAYING){
          youtubeVideoProgressPoller = setInterval(pollVideoProgress, 1000);

          if (firstLoad) {
            if (!options.skipAnalytics) {
              AnalyticsEvents.trackPlayUpdate(tout, options.analyticsProperties);
            }
            firstLoad = false;
          }

          if(options.onPlay) { options.onPlay(); }
        } else if (event.data == YT.PlayerState.PAUSED){
          clearInterval(youtubeVideoProgressPoller);
        } else if (event.data == YT.PlayerState.ENDED){
          stopVideo();
        }

      }, false);


      // TODO: make these functions more like the new "pauseYoutubeIframe" function
      function pollVideoProgress(){
        if(youtubePlayer.getPlayerState() == YT.PlayerState.PLAYING && !playerWithinRange()){
          stopVideo();
        }
      }

      function stopVideo(){
        youtubePlayer.seekTo(videoOffset);
        youtubePlayer.pauseVideo();
        clearInterval(youtubeVideoProgressPoller);
        if(options.onEnded) { options.onEnded(); }
      }

      function playerWithinRange(){
        var endTime = tout.video.youtube.start_offset + tout.video.duration;
        return Math.floor(youtubePlayer.getCurrentTime()) < endTime;
      }

    },

    loadYoutubeIframeApi: function(element, tout, options){
      var tag = document.createElement('script');
      tag.src = "http://www.youtube.com/player_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubePlayerAPIReady = function(){
        $.fn.initializeYoutubeToutVideo(element, tout, options);
      };
    },


    unloadToutVideo: function(){
      return this.each(function() {
        var $nativeVideo = $(".video-js", this);
        var $youtubeVideo = $("iframe.youtube_video", this);

        if($nativeVideo.length > 0){
          $(this).unloadNativeToutVideo();
        }

        if($youtubeVideo.length > 0){
          $(this).unloadYoutubeToutVideo();
        }
      });
    },


    unloadNativeToutVideo: function(){
      return this.each(function() {
        var playerId = $(".video-js", this)[0].id;
        var player = _V_(playerId);

        // for html5 - clear out the src which solves a browser memory leak
        //  this workaround was found here: http://stackoverflow.com/questions/5170398/ios-safari-memory-leak-when-loading-unloading-html5-video
        if(player.techName == "html5"){
          player.tag.src = "";
          player.tech.removeTriggers();
          player.load();
        }

        // if videojs is using a flash player, but the flash player isn't ready yet - when you try to destroy it
        //   video.js will throw an error in the flashTech's destroy function when trying to remove the DOM
        try {
          player.destroy();
        } catch (error){
          console.log("tout_video plugin -- tried to destroy video player.  error occurred: " + error.message);
        }

        $(this).html("");
      });
    },

    unloadYoutubeToutVideo: function(){
      return this.each(function() {
        clearInterval(youtubeVideoProgressPoller);
        var youtubeIframe = $("iframe.youtube_video", this)[0];
        if(youtubeIframe){
          // note: we can't do a $(this).html("") because it'll repeatedly throw the following error when removing the iframe on IE9:
          //  '__flash__removecallback is undefined'.  so the best we can do is set the src of the iframe to blank and then hide it.
          youtubeIframe.src = '';
          youtubeIframe.style.display = "none";
        }
      });
    },

    playToutVideo: function(){
      return this.each(function(){
        var $nativeVideo = $(".video-js", this);
        var $youtubeVideo = $("iframe.youtube_video", this);

        if($nativeVideo.length > 0){
          $(this).playNativeToutVideo();
        }

        if($youtubeVideo.length > 0){
          console.log("this function is not supported for youtube tout videos.");
        }
      });
    },

    playNativeToutVideo: function(){
      return this.each(function() {
        var playerId = $(".video-js", this)[0].id;
        var player = _V_(playerId);
        player.play();
      });
    },


    pauseToutVideo: function(){
      return this.each(function(){
        var $nativeVideo = $(".video-js", this);
        var $youtubeVideo = $("iframe.youtube_video", this);

        if($nativeVideo.length > 0){
          $(this).pauseNativeToutVideo();
        }

        if($youtubeVideo.length > 0){
          $(this).pauseYoutubeToutVideo();
        }
      });
    },

    pauseNativeToutVideo: function(){
      return this.each(function() {
        var playerId = $(".video-js", this)[0].id;
        var player = _V_(playerId);
        player.pause();
      });
    },

    pauseYoutubeToutVideo: function(){
      return this.each(function() {
        var youtubeIframe = $("iframe.youtube_video", this)[0];
        if(youtubeIframe){
          var youtubeIframeName = youtubeIframe.name;
          $.fn.pauseYoutubeIframe(youtubeIframeName);
        }
      });
    },

    pauseYoutubeIframe: function(iframeName){
      $.fn.postMessageToYoutubeIframe(iframeName, "pauseVideo");
    },

    postMessageToYoutubeIframe: function(iframeName, functionName, args){
      var message = JSON.stringify({ "event": "command",
                                     "func": functionName,
                                     "args": args || [],
                                     "id": iframeName });
      try {
        window.frames[iframeName].postMessage(message, "*");
      } catch(err) { }
    }
    

  });
})(jQuery);
