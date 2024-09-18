window.changeType = function(x, type) {
  if (x.type === type) {
    return x;
  }
  try {
    return (x.type = type); // Attempt direct type change
  } catch (e) {
    var html = $("<div>").append(x.clone()).html();
    var regex = /type=(\")?([^\"\s]+)(\")?/;
    var tmp = $(html.match(regex) == null ?
        html.replace(">", ' type="' + type + '">') :  // Replace entire tag if no type attribute
        html.replace(regex, 'type="' + type + '"') ); // Replace existing type attribute
    tmp.data('type', x.data('type'));
    var events = x.data('events');
    var cb = function(events) {
      return function() {
        for (var i in events) {
          var y = events[i];
          for (var j in y) {
            tmp.bind(i, y[j].handler);
          }
        }
      };
    }(events);
    x.replaceWith(tmp);
    setTimeout(cb, 10);
    return tmp;
  }
}

$(document).ready(function() {
  $('.unmask').on('click', function() {
    if ($(this).prev('input').attr('type') === 'password') {
      window.changeType($(this).prev('input'), 'text');
    } else {
      window.changeType($(this).prev('input'), 'password');
    }
    return false;
  });
});
