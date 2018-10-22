// Inital code credit: Peter Bengtsson https://www.sitepoint.com/face-proximity-detection-with-javascript/

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
    const video = document.querySelector('video');
    const constraints = {
        audio: false,
        video: true
    };
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('2d');

    const startCameraButton = document.querySelector('#startCamera');

    let faceDetectionTimer = null,
        breakPercentage = 5,
        notificationFrequency = 15,
        percentages = [], capturedDistance = 0, capturedX = 0, lastDistance = 0, lastX = 0;

    function startCamera() {
        let lastNotificationTime = 0, noFace = 0;

        hideErrors();

        return navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) => {
                document.getElementById("distanceDisplay").style.display = "block";


                video.srcObject = stream;
                video.play();
                faceDetectionTimer = setInterval(async () => {
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
     
                    const faces = ccv.detect_objects({
                        canvas: ccv.pre(canvas),
                        cascade: cascade,
                        interval: 2,
                        min_neighbors: 1
                    });

                    if (faces.length === 0) {
                        noFace++;
                        if (noFace > 4) {
                            displayError("We're unable to detect a face. Maybe increase light intensity?");
                            stopCamera();
                        }
                    } else {
                        noFace = 0;
                    }

                    faces.forEach((face) => {
                        console.log(face);
                        context.beginPath();
                        context.rect(face.x, face.y, face.width, face.height);
                        context.lineWidth = 1;
                        context.strokeStyle = 'red';
                        context.stroke();

                        const percentage = 100 * face.height / canvas.height;
                        percentages.push(percentage);
                        let centimeters = percentageToCM(rollingAverage(percentages, 5)).toFixed(0);
                        lastDistance = centimeters;
                        lastX = face.x;

                        if (lastDistance < capturedDistance // If you're further away from the screen you're probably not slouching
                            && ((capturedDistance - lastDistance) / capturedDistance) * 100 > breakPercentage // Slouching threshold crossed
                            && Date.now() - lastNotificationTime > notificationFrequency * 1000) {
                            lastNotificationTime = Date.now();
                            sendNotification("Are you slouching there? You're getting closer to the screen.");
                        }

                        if (lastX < capturedX // If you're higher you're probably not slouching
                            && ((capturedX - lastX) / capturedX) * 100 > breakPercentage // Slouching threshold crossed
                            && Date.now() - lastNotificationTime > notificationFrequency * 1000) {
                            lastNotificationTime = Date.now();
                            sendNotification("Are you slouching there? You're dropping down.");
                        }

                        document.querySelector('code').textContent = centimeters;
                    });
                }, 500);

                return stream;
            })
            .catch((error) => {
                console.error(error);
                displayError(error)
            });
    }

    function stopCamera() {
        document.getElementById("distanceDisplay").style.display = "none";
        streamOn.getVideoTracks()[0].stop();
        streamOn = null;
        clearInterval(faceDetectionTimer);
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

    document.querySelector('#captureDistance').onclick = () => {
        capturedDistance = lastDistance;
        capturedX = lastX;
        document.getElementById("capturedDistance").innerHTML = "Captured distance is <code> " + lastDistance + "</code> cm. Captured vertical position is <code>" + parseInt(capturedX) + "</code> pixels."
    }

    document.querySelector('#notificationFrequency').onchange = () => {
        notificationFrequency = document.querySelector('#notificationFrequency').value;
    }

    document.querySelector('#breakPercentage').onchange = () => {
        notificationFrequency = document.querySelector('#breakPercentage').value;
    }

    document.getElementById("showVideoInput").onchange = () => {
        document.getElementById("videoContent").style.display = document.getElementById("showVideoInput").checked ? "block" : "none";
    }
})(window);
