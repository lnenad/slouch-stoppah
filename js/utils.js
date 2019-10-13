
navigator.mediaDevices = navigator.mediaDevices || ((navigator.mozGetUserMedia || navigator.webkitGetUserMedia) ? {
    getUserMedia: c => {
        return new Promise((y, n) => {
            (navigator.mozGetUserMedia ||
                navigator.webkitGetUserMedia).call(navigator, c, y, n);
        });
    }
} : null);
if (!navigator.mediaDevices) {
    throw new Error("getUserMedia() not supported.");
}

(function (window) {
    const errorContainer = document.getElementById("errorContainer");

    window.rollingAverage = (values, size) => {
        values.splice(0, values.length - size);
        var sum = values.reduce((total, num) => {
            return total + num
        }, 0);
        return sum / values.length;
    };

    window.sendNotification = (message) => {
        if (!("Notification" in window)) {
            alert("This browser does not support desktop notification");
        } else if (Notification.permission === "granted") {
            new Notification(message);
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission(function (permission) {
                if (permission === "granted") {
                    new Notification(message);
                }
            });
        }
    };

    const sound = new Howl({
        src: ['alert.wav']
    });

    window.playAlertSound = () => {
        sound.play();
    }

    window.displayError = (err) => {
        errorContainer.style.display = "flex";
        errorContainer.textContent = err;
    };

    window.hideErrors = () => {
        errorContainer.style.display = "none";
        errorContainer.textContent = "";
    };

    [].forEach.call(document.getElementsByClassName("toggleInfoModal"), (elem) => {
        elem.onclick = () => {
            document.getElementById("infoModal").classList.toggle("is-active");
        };
    });
})(window);