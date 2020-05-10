function setupSubscriptionButton(subscriptionButton) {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
        subscriptionButton.setAttribute('disabled', true);
        return;
    }
    navigator.serviceWorker.register('service-worker.js');

    const baseURL = "https://orga.symposion.hilton.rwth-aachen.de/push/";

    navigator.serviceWorker.ready
        .then(function(registration) {
            console.log('service worker registered');
            subscriptionButton.removeAttribute('disabled');

            return registration.pushManager.getSubscription();
        }).then(function(subscription) {
            if (subscription) {
                console.log('Already subscribed', subscription.endpoint);
                setUnsubscribeButton();
            } else {
                setSubscribeButton();
            }
        });

    function subscribe() {
        function urlBase64ToUint8Array(base64String) {
            var padding = '='.repeat((4 - base64String.length % 4) % 4);
            var base64 = (base64String + padding)
                .replace(/\-/g, '+')
                .replace(/_/g, '/');

            var rawData = window.atob(base64);
            var outputArray = new Uint8Array(rawData.length);

            for (var i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        }
        Notification.requestPermission().then(function(permission) {
            // If the user accepts, let's create a notification
            if (permission === "granted") {
                navigator.serviceWorker.ready
                    .then(async function(registration) {
                        //const google = await fetch('https://google.de');
                        const response = await fetch(baseURL + 'vapidPublicKey', { mode: "cors" });
                        const vapidPublicKey = await response.text();
                        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
                        return registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: convertedVapidKey
                        });
                    }).then(function(subscription) {
                        console.log('Subscribed', subscription.endpoint);
                        return fetch(baseURL + 'register', {
                            mode: "cors",
                            method: 'post',
                            headers: {
                                'Content-type': 'application/json'
                            },
                            body: JSON.stringify({
                                subscription: subscription
                            })
                        });
                    }).then(setUnsubscribeButton);
            } else {
                alert("Wenn du Notifications erhalten möchtest musst du diese auch erlauben...");
            }
        });
    }

    function unsubscribe() {
        navigator.serviceWorker.ready
            .then(function(registration) {
                return registration.pushManager.getSubscription();
            }).then(function(subscription) {
                return subscription.unsubscribe()
                    .then(function() {
                        console.log('Unsubscribed', subscription.endpoint);
                        return fetch(baseURL + 'unregister', {
                            method: 'post',
                            headers: {
                                'Content-type': 'application/json'
                            },
                            body: JSON.stringify({
                                subscription: subscription
                            })
                        });
                    });
            }).then(setSubscribeButton);
    }

    function setSubscribeButton() {
        subscriptionButton.onclick = subscribe;
        subscriptionButton.textContent = 'Subscribe';
    }

    function setUnsubscribeButton() {
        subscriptionButton.onclick = unsubscribe;
        subscriptionButton.textContent = 'Unsubscribe';
    }
}