// Slouch stoppah
// faceapi: https://github.com/justadudewhohacks/face-api.js
// Maintainer: Nenad Lukic https://github.com/lnenad
// Icon credit: Icons made by Freepik from https://www.flaticon.com is licensed - CC 3.0 BY
(async function (window) {
    const breakDetectionFrequency = 60000;
    const net = new faceapi.SsdMobilenetv1();
    await net.load('js/models');

    const video = document.querySelector('video'),
        constraints = {
            audio: false,
            video: true
        },
        canvas = document.querySelector('canvas'),
        context = canvas.getContext('2d'),
        startCameraButton = document.querySelector('#startCamera');

    let notificationFrequency = document.getElementById('notificationFrequency').value,
        breakPercentage = document.getElementById('breakPercentage').value,
        detectionFrequency = document.getElementById('detectionFrequency').value * 1000,
        faceDetectionTimeout = null,
        soundAlerts = true,
        detectedHeights = [], detectedYs = [], capturedSize = 0, capturedY = 0, lastSize = 0, lastY = 0;

    const startCamera = () => {
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
                faceDetectionTimeout = setTimeout(performDetection, 3500);

                return stream;
            })
            .catch((error) => {
                console.error(error);
                displayError(error)
            });
    }

    let lastNotificationTime = 0, noFace = 0;

    let performDetection = async (initial) => {
        const { width, height } = faceapi.getMediaDimensions(video)
        canvas.width = width
        canvas.height = height

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        faces = await net.locateFaces(video, {
            scoreThreshold: 0.5,
            inputSize: 'md'
        });

        if (faces.length > 0) {
            noFace = 0;
            analyzeSize(initial, width, height, faces[0].box);
            analyzePosition(initial, faces[0].box);
            if (initial !== true) {
                faceDetectionTimeout = setTimeout(performDetection, detectionFrequency);
            }
            return;
        }
            
        noFace++;
        if (noFace > 5) {
            // Slow down face detection for computer break
            faceDetectionTimeout = setTimeout(performDetection, breakDetectionFrequency);
            return;
        }
        else if (noFace > 10) {
            displayError("Tracking stopped because we are unable to detect a face. Maybe increase light intensity?");
            stopCamera();
            return;
        }
        faceDetectionTimeout = setTimeout(performDetection, detectionFrequency);
    }

    const analyzePosition = (initial, face) => {
        const percentage = 100 * face.y / canvas.height;

        detectedYs.push(percentage);
        if (initial === true) {
            return;
        }
        lastY = rollingAverage(detectedYs, 4).toFixed(0);
                
        if (capturedY > 0 
            && lastY > capturedY 
            && lastY - capturedY >= breakPercentage
            && (Date.now() - lastNotificationTime) > notificationFrequency * 1000) {
                alertUser("Are you slouching there? You're sitting lower than the captured position.");                
            }

        document.getElementById('distance').textContent = lastY;
    }

    const analyzeSize = (initial, width, height, face) => {
        faceapi.drawDetection(canvas, faces.map(det => det.forSize(width, height)))

        const percentage = 100 * face.height / canvas.height;
        detectedHeights.push(percentage);
        if (initial === true) {
            return;
        }
        lastSize = rollingAverage(detectedHeights, 4).toFixed(0);

        if (capturedSize > 0
            && lastSize > capturedSize  // If you're further away from the screen you're probably not slouching
            && (lastSize - capturedSize >= breakPercentage) // Slouching threshold crossed
            && (Date.now() - lastNotificationTime) > notificationFrequency * 1000) {
                alertUser("Are you slouching there? You're getting closer to the camera.");
            }

        document.getElementById('scale').textContent = lastSize;
    }

    const alertUser = (message) => {
        lastNotificationTime = Date.now();
        sendNotification(message);
        if (soundAlerts) {
            playAlertSound();
        }
    }

    const stopCamera = () => {
        document.getElementById('captureDistance').setAttribute("disabled", true);
        document.getElementById("distanceDisplay").style.display = "none";
        if (streamOn && streamOn.getVideoTracks().length > 0) {
            streamOn.getVideoTracks()[0].stop();
        }
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
            document.getElementById('captureDistance').setAttribute("disabled", true);
            new Noty({
                timeout: 6000,
                type: 'success',
                text: 'Sit up straight and click on capture current position when ready!',
            }).show();
            startCameraButton.textContent = 'Starting camera';
            startCamera().then(stream => {
                streamOn = stream;
                startCameraButton.textContent = 'Stop camera';
                sendNotification('You will get a notification whenever we think you are slouching.');
                setTimeout(() => {
                    document.getElementById('captureDistance').removeAttribute("disabled");
                }, 5000);
            });
        }
    }

    document.getElementById('captureDistance').onclick = () => {
        capturedSize = lastSize;
        capturedY = lastY;
        document.getElementById("capturedDistance").innerHTML = "Captured size is <code> " + lastSize + "</code> percent. Captured vertical position is <code>" + capturedY + "</code> percent."
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

    document.getElementById("playAudioAlerts").onchange = () => {
        soundAlerts = document.getElementById("playAudioAlerts").checked;
    }

    document.getElementById("playTestSound").onclick = () => {
        playAlertSound();
    }

    document.getElementById("showDebugOverlay").onchange = () => {
        document.getElementById("debugOverlay").style.display = document.getElementById("showDebugOverlay").checked ? "block" : "none";
    }
})(window);
