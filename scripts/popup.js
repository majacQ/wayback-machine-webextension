global_url="";

function remove_port(url){
    if(url.substr(-4)==':80/'){
        url=url.substring(0,url.length-4);
    }
    return url;
}

function remove_wbm(url){
    var pos=url.indexOf('/http');
    if(pos!=-1){
        var new_url=url.substring(pos+1);
    }else{
        var pos=url.indexOf('/www');
        var new_url=url.substring(pos+1);
    }
    return remove_port(new_url);
}

function remove_alexa(url){
    var pos=url.indexOf('/siteinfo/');
    var new_url=url.substring(pos+10);
    return remove_port(new_url);
}

function remove_whois(url){
    var pos=url.indexOf('/whois/');
    var new_url=url.substring(pos+7);
    return remove_port(new_url);
}
/* Common method used everywhere to retrieve cleaned up URL */
function retrieve_url(){
    var search_term = document.getElementById('search_input').value;
    if(search_term == ""){
        var url=global_url;
    }else{
        var url=search_term;
    }
    return url;
}

function get_clean_url() {
    var url=retrieve_url();
    if (url.includes('web.archive.org')) {
        url=remove_wbm(url);
    } else if (url.includes('www.alexa.com')) {
        url=remove_alexa(url);
    } else if (url.includes('www.whois.com')) {
        url=remove_whois(url);
    }
    return url;
}

function save_now(){
	  chrome.runtime.sendMessage({message: "openurl",
                                wayback_url: "https://web.archive.org/save/",
                                page_url: get_clean_url(),
                                method:'save' }).then(handleResponse, handleError);
}

function recent_capture(){
	  chrome.runtime.sendMessage({message: "openurl",
                                wayback_url: "https://web.archive.org/web/2/",
                                page_url: get_clean_url(),
                                method:'recent'});
}

function first_capture(){
	  chrome.runtime.sendMessage({message: "openurl",
                                wayback_url: "https://web.archive.org/web/0/",
                                page_url: get_clean_url(),
                                method:'first'});
}

function view_all(){
	  chrome.runtime.sendMessage({message: "openurl",
                                wayback_url: "https://web.archive.org/web/*/",
                                page_url: get_clean_url(),
                                method:'viewall'});
}

function get_url(){
    chrome.tabs.query({active: true,currentWindow:true},function(tabs){
        global_url=tabs[0].url;
    });
    autoArchiveUrl();
}

function social_share(eventObj){
    var parent=eventObj.target.parentNode;
    var id=parent.getAttribute('id');
    var sharing_url="";
    var url=retrieve_url();
    var overview_url="https://web.archive.org/web/*/";
    if (url.includes('web.archive.org')){
        sharing_url=url; //If the user is already at a playback page,share that URL
    }
    else{
        sharing_url=overview_url+get_clean_url(); //When not on a playback page,share the overview version of that URL
    }
    var open_url="";
    if(!(url.includes('chrome://') || url.includes('chrome-extension://'))){ //Prevents sharing some unnecessary page 
        if(id.includes('fb')){
            open_url="https://www.facebook.com/sharer/sharer.php?u="+sharing_url; //Share the wayback machine's overview of the URL
        }else if(id.includes('twit')){
            open_url="https://twitter.com/home?status="+sharing_url;
        }else if(id.includes('gplus')){
            open_url="https://plus.google.com/share?url="+sharing_url;
        }else if(id.includes('linkedin')){
            open_url="https://www.linkedin.com/shareArticle?url="+sharing_url;
        }
        window.open(open_url, 'newwindow', 'width=800, height=280,left=0');
    }
}

function alexa_statistics(eventObj){
    var open_url="http://www.alexa.com/siteinfo/" + get_clean_url();
    window.open(open_url, 'newwindow', 'width=1000, height=1000,left=0');
}

function whois_statistics(eventObj){
    var open_url="https://www.whois.com/whois/" + get_clean_url();
    window.open(open_url, 'newwindow', 'width=1000, height=1000,left=0');
}

function search_tweet(eventObj){
    var url = get_clean_url();
    if(url.includes('http://')){
        url=url.substring(7);
    }else if(url.includes('https://')){
        url=url.substring(8);
    }
    if(url.slice(-1)=='/') url=url.substring(0,url.length-1);
    var open_url="https://twitter.com/search?q="+url;
    window.open(open_url, 'newwindow', 'width=1000, height=1000,left=0');
}

function display_list(key_word){
    $sbox = document.getElementById('suggestion-box');
    $sbox.style.display='none';
    $sbox.innerHTML="";
    var xhr = new XMLHttpRequest();
    xhr.open('GET', "https://web.archive.org/__wb/search/host?q="+key_word, true);
    xhr.onload=function(){
        $sbox.style.display='none';
        $sbox.innerHTML="";
        var data=JSON.parse(xhr.response);
        var n=data.hosts.length;
        if(n>0 && document.getElementById('search_input').value!=''){
            $sbox.style.display='block';
            for(var i=0;i<n;i++){
                var a=document.createElement('a');
                a.onclick=function(event){
                    document.getElementById('search_input').value=event.target.innerHTML;
                    $sbox.style.display='none';
                    $sbox.innerHTML="";
                };
                a.setAttribute('role','button');
                a.innerHTML=data.hosts[i].display_name;
                var li=document.createElement('li');
                li.appendChild(a);
                $sbox.appendChild(li);
            }
        }
    };
    xhr.send(null);
}

function display_suggestions(e){
    document.getElementById('suggestion-box').style.display='none';
    document.getElementById('suggestion-box').innerHTML="";
    if(e.keyCode==13){
        e.preventDefault();
    }else {
        //setTimeout is used to get the text in the text field after key has been pressed
        window.setTimeout(function(){
            var len=document.getElementById('search_input').value.length;
            if((len)>=3){
                display_list(document.getElementById('search_input').value);
            }else{
                document.getElementById('suggestion-box').style.display='none';
                document.getElementById('suggestion-box').innerHTML="";
            }
        },0.1);
    }
}

function about_support(){
    window.open('about.html', 'newwindow', 'width=1000, height=700,left=0').focus();
}

function makeModal(){
    var url = get_clean_url();
    console.log("Making RT for "+url);
    chrome.runtime.sendMessage({message: "makemodal",rturl:url});
}

function settings(){
    window.open('settings.html','newwindow', 'width=500, height=500,left=0');
}

function autoArchiveUrl(){
    var tab_url=""
    chrome.tabs.query({active: true,currentWindow:true},function(tabs){
        tab_url=get_clean_url();
        console.log(tab_url);
        chrome.runtime.sendMessage({message:"checkurl",url:tab_url});
        console.log("Message Sent 1");
    });
}

/** Disabled code for the autosave feature **/
//function restoreSettings() {
//  chrome.storage.sync.get({
//    as:false
//  }, function(items) {
//    document.getElementById('as').checked = items.as;  
//      if(items.as){
//          chrome.runtime.sendMessage({message: "start_as"}, function(response) {});
//      }
//     });
//}
//
//function saveSettings(){
//    var as = document.getElementById('as').checked;
//      chrome.storage.sync.set({
//      as: as
//  });
//}
//function showSettings(eventObj){
//    var target=eventObj.target;
//    if(target.getAttribute('toggle')=='off'){
//        document.getElementById('settings_btn').setAttribute('toggle','on');
//    document.getElementById('settings_div').style.display="block";
//    }else{
//        document.getElementById('settings_btn').setAttribute('toggle','off');
//        document.getElementById('settings_div').style.display="none";
//    }
//}
//restoreSettings();
//document.getElementById('settings_div').style.display="none";

window.onload=get_url;
document.getElementById('save_now').onclick = save_now;
document.getElementById('recent_capture').onclick = recent_capture;
document.getElementById('first_capture').onclick = first_capture;
document.getElementById('fb_share').onclick =social_share;
document.getElementById('twit_share').onclick =social_share;
document.getElementById('gplus_share').onclick =social_share;
document.getElementById('linkedin_share').onclick =social_share;
document.getElementById('alexa_statistics').onclick =alexa_statistics;
document.getElementById('whois_statistics').onclick =whois_statistics;
document.getElementById('search_tweet').onclick =search_tweet;
document.getElementById('about_support_button').onclick = about_support;
document.getElementById('settings_button').onclick =settings;

document.getElementById('overview').onclick = view_all;
//document.getElementById('settings_btn').onclick=showSettings;
//document.getElementById('settings_save_btn').onclick=saveSettings;
document.getElementById('make_modal').onclick=makeModal;
document.getElementById('search_input').addEventListener('keydown',display_suggestions);
chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){
  if(message.message=='urlnotfound'){
  	alert("URL not found in wayback archives!");
  }
  else if(message.message='showbutton'){
    var url=message.url;
    document.getElementById("display_").style.display="block";
    document.getElementById("display_").onclick= function(){
        chrome.runtime.sendMessage({message: "openurl",
                                wayback_url: "https://web.archive.org/save/",
                                page_url: url,
                                method:'save' }).then(handleResponse, handleError);
    }
  }
});
