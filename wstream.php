<!doctype html>
<html>
    <head>
        <title>WSJ World Stream -- Prototype</title>
        <link rel="stylesheet" href="http://twitter.github.com/bootstrap/assets/css/bootstrap.css" type="text/css">
        <link href="http://vjs.zencdn.net/c/video-js.css" rel="stylesheet" type="text/css">
        <link href='http://fonts.googleapis.com/css?family=Open+Sans:400,800' rel='stylesheet' type='text/css'>
    
        <link rel="stylesheet" href="css/styles.css" />

        <script src="/lib/jquery.js"></script>
        <script src="http://vjs.zencdn.net/c/video.js"></script>

<script type="text/javascript">
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
    }

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
    }

    function makeActive(eventTarget) {
        var height = $(eventTarget).siblings('.video').children().attr('height');
        var playerId = $(eventTarget).siblings('.video').children().children().attr('id');

        $(eventTarget).parents('.tout').removeClass('inactive');
        $(eventTarget).parents('.tout').addClass('active');
        $(eventTarget).siblings('.video').animate({
                display: 'block',
                height: height
            }, 600);

        ensureOneActive(playerId);

        var player = _V_(playerId);
        /*        player.volume(0);     */
        player.play();
        
        player.addEvent('ended', function() {
            endPlayback(playerId);
        });
    }

    function callAjax(startPage) {
        console.log('http://localhost/ba-simple-proxy.php?url=http://www.tout.com/api/v1/latest.json?page='+ startPage);
        var ajax_url = 'http://www.tout.com/api/v1/latest.json?' + encodeURIComponent('per_page=15&page='+startPage);
        var result="";
        $.ajax({
            url:ajax_url,
            async: false,
            crossDomain: true,
            success:function(data) {
             result = data; 
            }
       });
       return result;
    }

    function createElement(type, cls) {
        var x = document.createElement(type);
        if (typeof cls != 'undefined') {
            x.className = cls;
        }
        return x
    }

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

        /* actual video element creation */
        video_div = createElement('div', 'span6 video-container');
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
                vid = createElement('video', 'video-js vjs-default-skin');
                vid.id = tout['uid'];
                vid.setAttribute('preload', 'auto');
                    source = createElement('source');
                    source.src = tout['video']['mp4']['http_url'];
                    source.setAttribute('type', 'video/mp4');
                vid.appendChild(source);    

            vid_div.appendChild(vid);

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

        console.log(d);
        $('.vid-image').bind('click', function(e) {
            $e = $(e.target).parents('.vid-image');
            makeActive($e);
        });
        $('.span8').append(d);

    }

    function loadMoreTouts(startPage) {
        var t = callAjax(startPage);

        while(t['status']['http_code'] != 200) {
            console.log('waiting on ajax call');
        }
        
        var touts = t['contents']['touts'];
        for(var i=0; i<touts.length; i++) {
            createTout(touts[i]);
        }
            
    }

    function endlessScroll() {
        var st = $(document).scrollTop();
        var dh = $(document).height();
        var r = st/dh;
    
        if (r>.59) {
                loadMoreTouts(3);
            }
    }

    $(document).ready(function(){
        console.log('doc ready');
        $('.vid-image').bind('click', function(e) {
            $e = $(e.target).parents('.vid-image');
            makeActive($e);
        });

        $(document).scroll(function() { 
            endlessScroll();    
        });

    });
</script>
    </head>
    <body>
        <?php
            // pull in "latest" for now to display different users
            $rest_url = "http://www.tout.com/api/v1/latest.json?per_page=25";
            $results = json_decode(file_get_contents($rest_url));
            $touts = $results->touts;
            $pagination = $results->pagination;

            function tout_mainstream($tout) {
                date_default_timezone_set('America/Los_Angeles');
                $cur_time = time();

                $profile_img_src = $tout->tout->user->avatar->profile->http_url;
                $fullname = $tout->tout->user->fullname;
                $uid = $tout->tout->user->uid;

                if ($fullname=='') {
                    $fullname=$uid;
                }

                $likes = $tout->tout->likes_count;
                
                $likes_text = ' likes';
                if ($likes == 1) {
                    $likes_text = ' like';
                }

                $tout_text = $tout->tout->text;
                $video_img_src = $tout->tout->image->poster->http_url;
                $video_img_width = $tout->tout->image->poster->width;

                
                if ($video_img_width < 474) {
                    $video_img_margin = (474-$video_img_width)/2;
                }
                else {
                    $video_img_margin = 0;
                }

                $video_src = $tout->tout->video->mp4->http_url;
                $video_create_time = strtotime($tout->tout->recorded_at);
                $time_diff = round(($cur_time-$video_create_time) / 60, 0);

                $time_text = $time_diff . ' minutes ago';
                if ($time_diff == 1) {
                    $time_text = $time_diff . ' minute ago';
                } elseif ($time_diff == 0) {
                    $time_text = 'Just now';
                }

                $time_diff = $video_create_time;

                $tout_width = 400;
                $tout_height = ($tout_width * $tout->tout->video->mp4->height) / ($tout->tout->video->mp4->width);
        ?>
            <div class="tout inactive">
                <div class="span2 profile">
                    <div class="profile-img">
                        <img src="<?php print $profile_img_src; ?>" />
                    </div>
                    <div class="username"><a href="http://www.tout.com/u/<?php print $uid; ?>"><?php print $fullname; ?></a></div>
                    <div class="time"><?php echo $time_text; ?></div>    
                </div>
                <div class="span6 video-container">
                    <div class="vid-image">
                        <img style="margin-left: <?php print $video_img_margin ?>px;" src="<?php print $video_img_src; ?>">
                        <div class="play-button">.
                        </div>
                    </div>
                    <div class="video">
                        <video id="<?php print $tout->tout->uid; ?>" class="video-js vjs-default-skin" controls preload="auto" width="<?php print $tout_width; ?>px" height="<?php print $tout_height; ?>px" poster="<?php print $video_img_src; ?>" data-setup="{}">
                            <source src="<?php print $video_src; ?>" type='video/mp4'>
                        </video>
                    </div>
                    <div class="tout-deets">
                        <div class="tout-text">
                            <?php print $tout_text; ?>
                        </div>
                        <div class="tout-likes">
                            <img src="img/thumb.png" /><span><?php print $likes . $likes_text; ?></span>
                        </div>
                        <div class="clear"><br /></div>
                    </div>
                </div>
                <div class="clear"><br />
                </div>    
            </div>
<?php
            }
?>
        <div class="black-back">
            <div class="logo"><img src="img/wsj-banner.png" /></div>
        </div>
        <div class="container">
            <div class="row">
                <div class="span12"><h1 class="uppercase">Real time Tout updates from across the Globe</h1></div>
            </div>
            <div class="row">
                <div class="span8"><h2 class="uppercase">World Stream</h2>
                    <?php
                        foreach($touts as $tout) {
                            tout_mainstream($tout);    
                        }
                    ?>
                        <!--
                        <div class="load-more">
                            <span class="load-more-touts"><a href="#" id="show-more-link" onClick="loadMoreTouts(<?php print 2; ?>)">Show More</a></span><span class="tout-count"><?php print "Showing " . ($pagination->current_page * $pagination->per_page) . " of " . ($pagination->total_entries) . " touts"; ?></span>
                            <div class="clear">&nbsp;</div>
                        </div>
                        -->
                </div>
                <div class="span4">
                    <div id="trending-today">
                        <h2 class="uppercase">Trending Today</h2>
                        <?php
                            $rest_url = "http://www.tout.com/api/v1/search/touts.json?q=wsj&per_page=3";
                            $results = json_decode(file_get_contents($rest_url));
                            $touts = $results->touts;
                            $num = 0;

                            foreach($touts as $tout) {
                                $profile_img_src = $tout->tout->user->avatar->profile->http_url;
                                $fullname = $tout->tout->user->fullname;
                                $uid = $tout->tout->user->uid;
                                
                                $tout_text = $tout->tout->text;
                                $video_img_src = $tout->tout->image->thumbnail->http_url;
                                $video_src = $tout->tout->video->mp4->http_url;
                                $video_create_date = date('m/d/Y',strtotime($tout->tout->recorded_at));


                                $tout_width = 124;
                                $tout_height = ($tout_width * $tout->tout->video->mp4->height) / ($tout->tout->video->mp4->width);    
                        ?>
                        <div class="tout">
                            <div class="trending-video">
                                <div class="video">
                                    <video id="<?php print $tout->tout->uid ?>" class="video-js vjs-default-skin" preload="auto" width="<?php print $tout_width; ?>px" height="<?php print $tout_height; ?>px" poster="<?php print $video_img_src; ?>" data-setup="{}">
                                        <source src="<?php print $video_src; ?>" type='video/mp4'>
                                        <div class="vjs-big-play-button"></div>
                                    </video>
                                </div> 
                            </div>
                            <div class="trending-video-info">
                                <span class="trending-text"><p><?php print $tout_text; ?></p></span>
                                <span class="trending-create-date"><p><?php print $video_create_date; ?></p></span> 
                                <span class="trending-touter">By: <a class="uppercase" href="http://www.tout.com/u/<?php print $uid;  ?>"><?php print $fullname; ?></a></span>
                            </div>
                            <div class="clear"><br /></div>    
                        </div>
<?php
                                $num++;
                            }
                        ?>
                    </div>
                    <div id="touts-sections">
                        <h2 class="uppercase">Touts by Section</h2>
                        <div class="ul-container"> 
                            <h3 class="uppercase">Global Markets</h3>
                            <ul class="touts-section">
                                <?php
                                    $rest_url = "http://www.tout.com/api/v1/search/touts.json?q=shaq&per_page=10";
                                    $results = json_decode(file_get_contents($rest_url));
                                    $touts = $results->touts;
                                    $num = 0;
                                    foreach($touts as $tout) {
                                        if($num<5){
                                            $video_img_src = $tout->tout->image->thumbnail->http_url;
                                            $video_src = $tout->tout->video->mp4->http_url;

                                            $tout_width = 110;
                                            $tout_height = ($tout_width * $tout->tout->video->mp4->height) / ($tout->tout->video->mp4->width);    
                                            
                                            if ($tout_height < 84 && $tout_height > 80) { 
                                    ?>
                                        <li class="tout-in-section">
                                           <div class="video">
                                                <video id="<?php print $tout->tout->uid ?>" class="video-js vjs-default-skin" preload="auto" width="<?php print $tout_width; ?>px" height="<?php print $tout_height; ?>px" poster="<?php print $video_img_src; ?>" data-setup="{}">
                                                    <source src="<?php print $video_src; ?>" type='video/mp4'>
                                                </video>
                                            </div> 
                                        </li>
                                    <?php
                                            }
                                            $num+=1;
                                        }    
                                    }
                                ?>
                            </ul>
                        </div>
                        <div class="ul-container"> 
                            <h3 class="uppercase">Personal Finance</h3>
                            <ul class="touts-section">
                                <?php
                                    $rest_url = "http://www.tout.com/api/v1/search/touts.json?q=tout&per_page=10";
                                    $results = json_decode(file_get_contents($rest_url));
                                    $touts = $results->touts;
                                    $num = 0;

                                    foreach($touts as $tout) {
                                        $video_img_src = $tout->tout->image->thumbnail->http_url;
                                        $video_src = $tout->tout->video->mp4->http_url;

                                        $tout_width = 110;
                                        $tout_height = ($tout_width * $tout->tout->video->mp4->height) / ($tout->tout->video->mp4->width);    
                                        
                                        if ($tout_height < 84 && $tout_height > 80 && $num<5) { 
                                ?>
                                    <li class="tout-in-section">
                                       <div class="video">
                                            <video id="<?php print $tout->tout->uid ?>" class="video-js vjs-default-skin" preload="auto" width="<?php print $tout_width; ?>px" height="<?php print $tout_height; ?>px" poster="<?php print $video_img_src; ?>" data-setup="{}">
                                                <source src="<?php print $video_src; ?>" type='video/mp4'>
                                            </video>
                                        </div> 
                                    </li>
                                <?php
                                        $num++;
                                        }    
                                    }
                                ?>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>

</html>
