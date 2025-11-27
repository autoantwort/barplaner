self.addEventListener('push', function(event) {
    let data = event.data.json();
    event.waitUntil(self.registration.showNotification(data.titel, {
        body: data.description,
        data: data.studibarsEventId,
        image: data.studibarsEventPosterURL,
    }));
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    if (event.notification.data) {
        event.waitUntil(
            self.clients.openWindow(`https://studibars-ac.de/symposion/---${event.notification.data}/`)
        );
    }
});

self.addEventListener('pushsubscriptionchange', function(event) {
    console.log('Subscription expired');
    event.waitUntil(
        self.registration.pushManager.subscribe({ userVisibleOnly: true })
        .then(function(subscription) {
            console.log('Subscribed after expiration', subscription.endpoint);
            return fetch('https://orga.symposion.hilton.rwth-aachen.de/push/register', {
                method: 'post',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint
                })
            });
        })
    );
});