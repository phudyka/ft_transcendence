function chatbot(navigateTo, $player_name) {

	document.addEventListener("DOMContentLoaded", function() {
		var chatLog = document.getElementById("chat-log");
		var messageInput = document.getElementById("message-input");
		var sendButton = document.getElementById("send-button");
		
		sendButton.addEventListener("click", function() {
	  sendMessage();
	});
  
	messageInput.addEventListener("keydown", function(event) {
	  if (event.key === "Enter" && !event.shiftKey) {
		  event.preventDefault();
		  sendMessage();
	  }
	});
  
	messageInput.addEventListener("input", function() {
		adjustInputHeight();
	});
  
	messageInput.addEventListener("paste", function(event) {
	  event.preventDefault();
	  var clipboardData = event.clipboardData || window.clipboardData;
	  var pastedContent = clipboardData.getData("text/plain");
	  var formattedContent = formatMessage(pastedContent);
	  document.execCommand("insertHTML", false, formattedContent);
	});
  
	function sendMessage() {
		var message = messageInput.value;
	  if (message !== "") {
		  appendUserMessage(message);
		messageInput.value = "";
		adjustInputHeight(); // Shrink the input box after sending
		setTimeout(function() {
		  var response = "Hello!";
		  appendBotMessage(response);
		}, 1000);
	}
}

function appendUserMessage(message) {
	var timestamp = getCurrentTimestamp();
	var userMessage = `<div><span class="timestamp">${timestamp}</span>[User]: ${formatMessage(message)}</div>`;
	chatLog.innerHTML += userMessage;
	scrollToBottom();
}

	function appendBotMessage(message) {
	  var timestamp = getCurrentTimestamp();
	  var botMessage = `<div><span class="timestamp">${timestamp}</span>[ChatGPT]: ${formatMessage(message)}</div>`;
	  chatLog.innerHTML += botMessage;
	  scrollToBottom();
	}
	
	function scrollToBottom() {
		chatLog.scrollTop = chatLog.scrollHeight;
	}
	
	function getCurrentTimestamp() {
		var now = new Date();
		var hours = now.getHours().toString().padStart(2, "0");
		var minutes = now.getMinutes().toString().padStart(2, "0");
		return `${hours}:${minutes}`;
	}
	
	function adjustInputHeight() {
		messageInput.style.height = "auto";
		messageInput.style.height = messageInput.scrollHeight + "px";
	}
  
	function formatMessage(message) {
	  // Check if the message starts with a code block indicator
	  if (message.startsWith("```")) {
		  return `<pre>${message}</pre>`;
		}
		
		// Escape HTML characters
		message = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
		
		// Format code blocks enclosed in backticks
		return message.replace(/(```[\s\S]*?```)/g, '<pre>$1</pre>');
	}
});

}