
(function () {
    const errorContainer = document.getElementById("errorContainer");

    window.rollingAverage = (values, size) => {
        values.splice(0, values.length - size);
        var sum = values.reduce((total, num) => {
            return total + num
        }, 0);
        return sum / values.length;
    };

    window.percentageToInches = (p) => {
        return 49 * Math.exp(-0.023 * p);
    };

    window.percentageToCM = (p) => {
        return 49 * Math.exp(-0.023 * p) * 2.54;
    };

    window.sendNotification = (message) => {
        // Let's check if the browser supports notifications
        if (!("Notification" in window)) {
            alert("This browser does not support desktop notification");
        }

        // Let's check whether notification permissions have already been granted
        else if (Notification.permission === "granted") {
            // If it's okay let's create a notification
            const notification = new Notification(message);
        }

        // Otherwise, we need to ask the user for permission
        else if (Notification.permission !== "denied") {
            Notification.requestPermission(function (permission) {
                // If the user accepts, let's create a notification
                if (permission === "granted") {
                    const notification = new Notification(message);
                }
            });
        }
    };

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