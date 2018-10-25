// Icon credit: Icons made by Freepik from https://www.flaticon.com is licensed - CC 3.0 BY
navigator.mediaDevices = navigator.mediaDevices || ((navigator.mozGetUserMedia || navigator.webkitGetUserMedia) ? {
    getUserMedia: function (c) {
        return new Promise(function (y, n) {
            (navigator.mozGetUserMedia ||
                navigator.webkitGetUserMedia).call(navigator, c, y, n);
        });
    }
} : null);
if (!navigator.mediaDevices) {
    throw new Error("getUserMedia() not supported.");
}

(function (window) {
    const video = document.querySelector('video'),
        constraints = {
            audio: false,
            video: true
        },
        canvas = document.querySelector('canvas'),
        context = canvas.getContext('2d'),
        startCameraButton = document.querySelector('#startCamera');

    let notificationFrequency = document.getElementById('notificationFrequency').value;
        breakPercentage = document.getElementById('breakPercentage').value;
        detectionFrequency = document.getElementById('detectionFrequency').value * 1000;
        faceDetectionTimeout = null,
        percentages = [], capturedSize = 0, capturedY = 0, lastSize = 0, lastY = 0;

    function startCamera() {

        hideErrors();

        return navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) => {
                document.getElementById("distanceDisplay").style.display = "block";

                video.srcObject = stream;
                video.play();

                // Get a baseline for comparison quickly
                setTimeout(performDetection.bind(null, true), 2000)
                setTimeout(performDetection.bind(null, true), 2500)
                setTimeout(performDetection.bind(null, true), 3000)
                setTimeout(performDetection.bind(null, true), 3500)
                faceDetectionTimeout = setTimeout(performDetection, 4000);

                return stream;
            })
            .catch((error) => {
                console.error(error);
                displayError(error)
            });
    }

    let lastNotificationTime = 0, noFace = 0;

    async function performDetection(initial) {

        const { width, height } = faceapi.getMediaDimensions(video)
        canvas.width = width
        canvas.height = height

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // defaults parameters shown:

        const forwardParams = {
            scoreThreshold: 0.5,
            inputSize: 'md'
        }

        faces = await net.locateFaces(video, forwardParams);

        console.log(faces);

        if (faces.length === 0) {
            noFace++;
            if (noFace > 5) {
                displayError("We're unable to detect a face. Maybe increase light intensity?");
                stopCamera();
            }
            return;
        } else {
            noFace = 0;
        }

        ((face) => {
            faceapi.drawDetection(canvas, faces.map(det => det.forSize(width, height)))

            context.beginPath();
            context.rect(face.x, face.y, face.width, face.height);
            context.lineWidth = 1;
            context.strokeStyle = 'red';
            context.stroke();

            const percentage = 100 * face.height / canvas.height;
            percentages.push(percentage);
            if (initial === true) {
                return;
            }
            const rolling = rollingAverage(percentages, 5).toFixed(0);

            lastSize = rolling;
            lastY = face.y;

            if (capturedSize > 0
                && lastSize > capturedSize  // If you're further away from the screen you're probably not slouching
                && (lastSize - capturedSize >= breakPercentage) // Slouching threshold crossed
                && (Date.now() - lastNotificationTime) > notificationFrequency * 1000) {
                lastNotificationTime = Date.now();
                sendNotification("Are you slouching there? You're getting closer to the screen.");
            }

            // if (lastY < capturedY // If you're higher you're probably not slouching
            //     && ((capturedY - lastY) / capturedY) * 100 > breakPercentage // Slouching threshold crossed
            //     && Date.now() - lastNotificationTime > notificationFrequency * 1000) {
            //     lastNotificationTime = Date.now();
            //     sendNotification("Are you slouching there? You're dropping down.");
            // }

            document.getElementById('distance').textContent = lastSize;
        })(faces[0].box);

        if (initial !== true) {
            setTimeout(performDetection, detectionFrequency);
        }
    }

    function stopCamera() {
        document.getElementById("distanceDisplay").style.display = "none";
        streamOn.getVideoTracks()[0].stop();
        streamOn = null;
        clearTimeout(faceDetectionTimeout);
        URL.revokeObjectURL(video.src);  // cleanin up
        startCameraButton.textContent = 'Start camera';
    }

    let streamOn = null;

    startCameraButton.onclick = () => {
        if (streamOn !== null) {
            stopCamera();
        } else {
            startCameraButton.textContent = 'Starting camera';
            startCamera().then(function (stream) {
                streamOn = stream;
                startCameraButton.textContent = 'Stop camera';
            });
        }
    }

    document.getElementById('captureDistance').onclick = () => {
        capturedSize = lastSize;
        capturedY = lastY;
        document.getElementById("capturedDistance").innerHTML = "Captured size is <code> " + lastSize + "</code> percent. Captured vertical position is <code>" + parseInt(capturedY) + "</code> pixels."
    }

    document.getElementById('notificationFrequency').onchange = () => {
        notificationFrequency = document.getElementById('notificationFrequency').value;
    }

    document.getElementById('breakPercentage').onchange = () => {
        breakPercentage = document.getElementById('breakPercentage').value;
    }

    document.getElementById('detectionFrequency').onchange = () => {
        detectionFrequency = document.getElementById('detectionFrequency').value * 1000;
    }

    document.getElementById("showVideoInput").onchange = () => {
        document.getElementById("videoContent").style.display = document.getElementById("showVideoInput").checked ? "block" : "none";
    }
})(window);
