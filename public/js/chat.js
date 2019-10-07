const socket = io();
// Elements
const $messageForm = document.querySelector('#form-message');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true }); 
// ignoreQueryPrefix will remove query prefix i.e. '?'

const autoscroll = () => {
	// New message element
	const $newMessage = $messages.lastElementChild;

	// Height of the new message
	const newMessageStyles = getComputedStyle($newMessage); //this method is provided by the browser
	const newMessageMargin = parseInt(newMessageStyles.marginBottom);
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

	// Visible height of the messages container
	const visibleHeight = $messages.offsetHeight;

	// Total height of message container
	const containerHeight = $messages.scrollHeight;

	// How far have I scrolled?
	const scrollOffset = $messages.scrollTop + visibleHeight;
	console.log(visibleHeight);
	console.log(containerHeight);
	console.log(newMessageHeight);
	console.log(scrollOffset);
	if(containerHeight - newMessageHeight <= scrollOffset) {
		$messages.scrollTop = $messages.scrollHeight;
	}
}

$messageForm.addEventListener('submit', (e) => {
	e.preventDefault();
	const message = e.target.elements.message.value;

	$messageFormButton.setAttribute('disabled', 'disabled');

	socket.emit('sendMessage', message, (error) => {
		$messageFormButton.removeAttribute('disabled');
		$messageFormInput.value = '';
		$messageFormInput.focus()
		if(error) {
			return console.log(error);
		}
	});
});

$locationButton.addEventListener('click', () => {
	if(!navigator.geolocation) {
		return alert('Geolocation is not supported by your browser.');
	}

	$locationButton.setAttribute('disabled', 'disabled');
	navigator.geolocation.getCurrentPosition((position) => {
		const location = {
			latitude: position.coords.latitude,
			longitude: position.coords.longitude
		}
		socket.emit('sendLocation', location, () => {
			console.log('Location shared!');
			$locationButton.removeAttribute('disabled');
		});
	});
});

socket.on('message', (message) => {
	console.log('New Message: ', message);
	const html = Mustache.render(messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format('h:mm a')
	});
	$messages.insertAdjacentHTML('beforeend', html);
	autoscroll();
});

socket.on('locationMessage', (locationMessage) => {
	console.log('New Location Message: ', locationMessage);
	const html = Mustache.render(locationMessageTemplate, {
		username: locationMessage.username,
		url: locationMessage.url,
		createdAt: moment(locationMessage.createdAt).format('h:mm a')
	});
	$messages.insertAdjacentHTML('beforeend', html);
	autoscroll();
});

socket.on('roomData', ({ room, users }) => {
	const html = Mustache.render(sidebarTemplate, {
		room,
		users
	});
	$sidebar.innerHTML = html;
})

socket.emit('join', { username, room }, (error) => {
	if( error ) {
		alert(error);
		location.href = '/';
	}
});