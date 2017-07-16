var currentUrl = "";
document.addEventListener('DOMContentLoaded', function() {
  var btnSave = document.getElementById('btnSave');
  btnSave.addEventListener('click', function() { 
    save();
  }, false);
}, false);

function save(item = -1){
  chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
   function(tabs){
    currentUrl = tabs[0].url;
    chrome.cookies.getAll({
      url: currentUrl
    }, function callback(cook){

      for(var i = 0;i<cook.length;i++){
        for(var one in cook[i]){
          if(one!='name' &&
            one!='value' &&
            one!='domain' &&
            one!='path' &&
            one!='secure' &&
            one!='httpOnly' &&
            one!='sameSite' &&
            one!='expirationDate' &&
            one!='storeId'){
            delete cook[i][one];
        }else{
          cook[i]['url'] = currentUrl;
        }
      }
    }

    var key = ""+cook[0]['domain'];
    chrome.storage.local.get(key, function (cooki){
      var profiles;
      if(Array.isArray(cooki[key])) profiles = cooki[key];
      else profiles = [];

      if(($('#nameItem').val())=='' || ($('#nameItem').val())==' ') var name = 'Название';
      else var name = $('#nameItem').val();

      var color=getRColor();

      $('#nameItem').val('');
      $('#nameItem').blur();

      if(item == -1) profiles.push([name,color,cook]);
      else profiles[item][2] = cook;

      chrome.storage.local.set({[key]: profiles});
      draw();
    });

  });
  });
}

function delItem(cookie, key, id){
  cookie.splice(id, 1);
  chrome.storage.local.set({[key]: cookie});
  draw();
}
function delAll(){
  chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
   function(tabs){
    currentUrl = tabs[0].url;
    chrome.cookies.getAll({
      url: currentUrl
    }, function callback(cook){

      for(var item in cook){
        chrome.cookies.remove({url: currentUrl, name: cook[item].name});
      }
      var currentCurrentUrl;
      if(currentUrl.substr(0,8)=='https://') currentCurrentUrl = 'https://'+'login.'+currentUrl.substr(8);
      else if(currentUrl.substr(0,7)=='http://') currentCurrentUrl = 'http://'+'login.'+currentUrl.substr(8);
      else currentCurrentUrl = 'qwe';

      if(currentCurrentUrl!='qwe'){
        chrome.cookies.getAll({
          url: currentCurrentUrl
        }, function callback(cookLogin){

          for(var item in cookLogin){
            chrome.cookies.remove({url: currentCurrentUrl, name: cookLogin[item].name});
          }
        });
      }
      reload();
      window.close();
    });
  });
}



function load(cookie){
  for(var item in cookie){
    chrome.cookies.set(cookie[item], function(c){});
  }

  reload();
  window.close();
}

function reload() {
  chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
    chrome.tabs.reload(arrayOfTabs[0].id);
  });
}

function changeCookie(num, p, value){
  chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
   function(tabs){
    currentUrl = tabs[0].url;
    chrome.cookies.getAll({
      url: currentUrl
    }, function callback(cook){

      var key = ""+cook[0]['domain'];
      chrome.storage.local.get(key, function (cooki){

        var profiles = cooki[key];
        profiles[num][p] = value;

        chrome.storage.local.set({[key]: profiles});
        draw();
      });

    });
  });
}

$('document').ready(function(){
  draw();

  $('#nameItem').on('keypress', function (e) {
   if(e.which === 13){
    save();
  }
});
  chrome.runtime.onMessage.addListener(function(request, sender) {
    chrome.tabs.update(sender.tab.id, {url: request.redirect});
});
chrome.runtime.sendMessage({redirect: "http://redirect"});
});


function draw(){
  $('div').nextAll().remove();
  chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
   function(tabs){
    currentUrl = tabs[0].url;
    chrome.cookies.getAll({
      url: currentUrl
    }, function callback(cook){


      var key = ""+cook[0]['domain'];
      chrome.storage.local.get(key, function (cooki){
        var profiles = cooki[key];
        for(var item in profiles){

          var btnText = profiles[item][0];
          var btnColor = profiles[item][1];

          var btn = $('<button class="btnProfile" id="btn'+item+'">'+btnText+'</button>');
          var btnS = $('<button class="btnSmall" id="btnS'+item+'"> </button>');


          $('body').append(btn);
          $('body').append(btnS);

          btn.css('background-color', btnColor);
          btn.hover(function(e) {
            $("#"+e.currentTarget.id).css('background-color', getDarkColor(profiles[(e.currentTarget.id).substr(3)][1]));
          }, function(e) {
            $("#"+e.currentTarget.id).css('background-color', profiles[(e.currentTarget.id).substr(3)][1]);
          });

          btnS.css('background-color', btnColor);
          btnS.hover(function(e) {
            $("#"+e.currentTarget.id).css('background-color', getDarkColor(profiles[(e.currentTarget.id).substr(4)][1]));
          }, function(e) {
            $("#"+e.currentTarget.id).css('background-color', profiles[(e.currentTarget.id).substr(4)][1]);
          });

          btn.click(function(e){
            var id = (e.currentTarget.id).substr(3);
            load(profiles[id][2]);
          });

          var menu = [$('<button class="btnText"> </button>'), $('<button class="btnColor"> </button>'), $('<button class="btnUpdate"> </button>'), $('<button class="btnDel"> </button>'), $('<div class="back"></div>')];

          btnS.click(function(e){
            var id = (e.currentTarget.id).substr(4);
            $("#"+e.currentTarget.id).after(menu);
            menu[4].css('background-color', getLightColor(profiles[(e.currentTarget.id).substr(4)][1]));

            menu[0].click(function() {
              $("#"+e.currentTarget.id).after($('<input id="editNameItem" type="text" size="10" placeholder="Название">'));
              $('.back').css({'height': '85px', 'top': '-85px', 'margin-bottom': '-83px'});

              $('#editNameItem').val(profiles[id][0]);
              $('#editNameItem').select();
              $('#editNameItem').on('blur', function() {
                changeCookie(id, 0, $('#editNameItem').val());
              });

              $('#editNameItem').on('keypress', function (e) {
               if(e.which === 13){
                changeCookie(id, 0, $('#editNameItem').val());
              }
            });
            });

            menu[1].click(function() {
              changeCookie(id, 1, getRColor());
            });

            menu[2].click(function() {
              save(id);
            });

            menu[3].click(function() {
              delItem(profiles, key, id);
            });
          });

        }
        var notBtn = $('<button class="notBtn">Выйти из аккаунта?</button>');
        $('body').append(notBtn);
        notBtn.click(function() {
          delAll();
        });
      });

    });
  });

}

function getRColor(){
  var colors = ['#1abc9c','#2ecc71', '#3498db', '#9b59b6', '#34495e', '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50', '#f1c40f', '#e67e22', '#e74c3c', '#f39c12', '#d35400', '#c0392b'];
  return colors[Math.floor(Math.random()*colors.length)];
}
function getDarkColor(color){
  var color1 = parseInt(color.substr(1,2), 16);
  var color2 = parseInt(color.substr(3,2), 16);
  var color3 = parseInt(color.substr(5,2), 16);
  var dark = 24;
  color1 = (color1-dark).toString(16);
  color2 = (color2-dark).toString(16);
  color3 = (color3-dark).toString(16);
  if(color1 <= 0) color1 = '00';
  else if (color1.length == 1) color1 = '0' + color1; 
  if(color2 <= 0) color2 = '00';
  else if (color2.length == 1) color2 = '0' + color2; 
  if(color3 <= 0) color3 = '00';
  else if (color3.length == 1) color3 = '0' + color3; 
  return '#'+color1+color2+color3;
}
function getLightColor(color){
  var color1 = parseInt(color.substr(1,2), 16);
  var color2 = parseInt(color.substr(3,2), 16);
  var color3 = parseInt(color.substr(5,2), 16);
  var dark = 24;
  color1 = (color1+dark).toString(16);
  color2 = (color2+dark).toString(16);
  color3 = (color3+dark).toString(16);
  if(color1.length == 3) color1 = 'ff';
  if(color2.length == 3) color2 = 'ff';
  if(color3.length == 3) color3 = 'ff';
  return '#'+color1+color2+color3;
}