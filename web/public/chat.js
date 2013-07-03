
window.onload = function() {
 
    var messages = [];
    var socket = io.connect('http://localhost:3700');
    console.log(socket);
    //var field = document.getElementById("field");
    //var sendButton = document.getElementById("send");
    //var content = document.getElementById("content");
 
    socket.on('message', function (data) {
        console.log("socket on");
        if(data.message) {
            messages.push(data.message);
            var html = '';
            for(var i=0; i<messages.length; i++) {
                html += messages[i] + '<br />';
            }
            content.innerHTML = html;
        } else {
            console.log("There is a problem:", data);
        }
    });
 
    console.log("pre emit");
    socket.emit('send', { message: "testing message"});
 
}
