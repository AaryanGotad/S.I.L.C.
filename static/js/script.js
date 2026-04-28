document.addEventListener('DOMContentLoaded', () => {
    // fetching current year
    document.getElementById("year").innerHTML = new Date().getFullYear();

    // file uploading logic
    const previewContainer = document.getElementById('previewContainer');
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const browseBtn = document.getElementById('browseBtn');
    const preview = document.getElementById('imagePreview');
    const sendBtn = document.getElementById('sendBtn');
    const sampleCards = document.querySelectorAll('.sample-card');

    // predictions
    const confBar = document.getElementById('confBar');
    const reSec = document.getElementById('reSec');

    const EMOJI_MAP = {
        "AnnualCrop": "🌾",
        "Forest": "🌲",
        "HerbaceousVegetation": "🌿",
        "Highway": "🛣️",
        "Industrial": "🏭",
        "Pasture": "🍀",
        "PermanentCrop": "🌳",
        "Residential": "🏘️",
        "River": "🌊",
        "SeaLake": "🚢",
    }

    const stickyNav = document.getElementById('stickyNav');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const body = document.body;

    // Info Tooltip Sticky Toggle Logic
    const infoWrapper = document.getElementById('infoWrapper');
    const infoBtn = document.getElementById('infoToggleBtn');

    infoBtn.addEventListener('click', (e) => {
        // preventing the click from bubbling up (useful for adding a 'click away to close' later)
        e.stopPropagation();
        infoWrapper.classList.toggle('is-active');
    });

    // closing the tooltip if the user clicks anywhere else on the page
    document.addEventListener('click', () => {
        infoWrapper.classList.remove('is-active');
    });

    // 1. Navbar Scroll Effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 30) {
            stickyNav.classList.add('active');
        } else {
            stickyNav.classList.remove('active');
        }
    });

    // 2. Theme Toggle Logic
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('light-mode');

        // Save to localStorage
        const isLight = body.classList.contains('light-mode');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');

        // Switch Icon (Material Symbols use underscores)
        themeIcon.innerText = isLight ? 'dark_mode' : 'light_mode';
    });

    // 3. Load Saved Theme on Page Load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        themeIcon.innerText = 'dark_mode';
    }

    let currentFile = null // high-level variable to store the selected file

    sampleCards.forEach(card => {
        card.addEventListener('click', async () => {
            const img = card.querySelector('.sample-img');
            const label = card.querySelector('p').innerText;
            const imageUrl = img.src;

            try {
                // fetching the image and converting to a blob
                const response = await fetch(imageUrl);
                const blob = await response.blob();

                // creating a file object so it matches my upload logic
                // giving it a dummy name and type
                const file = new File([blob], `${label.toLowerCase()}.jpg`, { type: "image/jpeg"});

                // setting as currentFile and triggering my preview logic
                currentFile = file;

                //re-using the existing reader logic to update the UI
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                    previewContainer.style.display = 'block';
                    preview.style.display = 'block';
                    reSec.style.display = "none";

                    // scrolling the user up to the preview window automatically
                    previewContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                };
                reader.readAsDataURL(currentFile);

            } catch (error) {
                console.error("Error loading sample image:", error);
            }
        });
    })

    // triggering input when button is clicked
    browseBtn.addEventListener('click', () => fileInput.click());

    // loading the sample image to preview windom


    // handling file selection via button
    fileInput.addEventListener('change', (e) => handleFile(e.target.files));

    // drag and drop listeners
    ['dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    // visual cue for dragging
    dropZone.addEventListener('dragover', () => dropZone.classList.add('active'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('active'));

    dropZone.addEventListener('drop', (e) => {
        dropZone.classList.remove('active');
        const files = e.dataTransfer.files;
        handleFile(files);
    });

    // central function to process the file
    function handleFile(files) {
        if (files.length > 0) {
            currentFile = files[0]; // storing the file globally

            // showing a preview (helpful for the user)
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                previewContainer.style.display = 'block';
                preview.style.display = 'block';

                // hiding previous reuslts if the user uploads a new image
                reSec.style.display = "none";
            };
            reader.readAsDataURL(currentFile);

            // sending to flask
            // sendBtn.addEventListener("click", uploadToServer(file));
        }
    }

    sendBtn.addEventListener("click", () => {
        if (currentFile) {
            uploadToServer(currentFile);
        } else {
            alert("Please select an image first!");
        }
    });

    async function uploadToServer(file) {
        const formData = new FormData();
        formData.append('image', file);

        sendBtn.innerHTML = "Analyzing...";
        sendBtn.disabled = true;

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            // console.log("Prediction:", result.prediction);

            // creating the visual comparision
            generateModelView(file);

            // showing the result section
            reSec.style.display = "block";

            // const winner = result[0];
            // document.getElementById('predClass').innerText = winner.label;
            // document.getElementById('confPerc').innerText = winner.confidence.toFixed(1);
            // confBar.style.width = `${winner.confidence}%`;

            // mapping class names to IDs for the top 3
            const ranks = ['first', 'second', 'third'];

            result.forEach((item, index) => {
                if (index < 3) {
                    const rankPrefix = ranks[index];
                    const row = document.getElementById(`${rankPrefix}Row`);

                    // resetting classes to avoid stacking styles from previous runs
                    row.className = "p-3 rounded-xl transition-all duration-300";

                    // Special handling for the #1 Viewer (the 'hero' section)
                    if (index == 0) {
                        document.getElementById('predClass').innerText = item.label;
                        document.getElementById('confPerc').innerText = item.confidence.toFixed(1);

                        const emojiElement = document.getElementById('predEmoji');
                        emojiElement.innerText = EMOJI_MAP[item.label] || "🛰️";

                        // calculating the Hue for conf bar
                        // Hue: 0 is Red, 12- is Green
                        // Multiplyinh confidence by 1.2 maps 0-100% to 0-120 degrees
                        const hue = item.confidence * 1.2;
                        const color = `hsl(${hue}, 70%, 50%)`;
                        const shadowColor = `hsla(${hue}, 70%, 50%, 0.5)`;

                        // radiant glow over the downscaled image
                        const cnnContainer = document.getElementById('PrepImagePreview');
                        const glowColor = `hsla(${hue}, 70%, 50%, 0.4)`;
                        const borderColor = `hsla(${hue}, 70%, 50%, 0.5)`;

                        cnnContainer.style.borderColor = borderColor;
                        cnnContainer.style.boxShadow = `0 0 40px ${glowColor}, 0 0 10px ${glowColor} inset`;

                        // high-res source simple white ring
                        const orgPreview = document.getElementById('orgImagePreview');
                        const orgContainer = orgPreview.parentElement.parentElement;
                        orgContainer.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        // orgContainer.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';

                        // applying width and dynmaic color
                        confBar.style.width = `${item.confidence}%`;
                        confBar.style.backgroundColor  = color;

                        // updating the glow to match the color
                        confBar.style.boxShadow = `0 0 12px ${shadowColor}`;

                        row.classList.add('bg-white/5', 'border', 'border-white/10', 'shadow-lg');
                    } else {
                        // hover effect for runners up
                        row.classList.add('hover:bg-white/5', 'hover:border-white/10', 'hover:shadow-lg', 'cursor-default');

                        // Dim the opacity of labels slightly for runners-up to create hierarchy
                        row.style.opacity = "0.7";
                        row.addEventListener('mouseenter', () => row.style.opacity = "1");
                        row.addEventListener('mouseleave', () => row.style.opacity = "0.7");
                    }

                    // updating the probability map labels and percentages
                    document.getElementById(`${rankPrefix}Pred`).innerText = item.label;
                    document.getElementById(`${rankPrefix}PredConf`).innerText = item.confidence.toFixed(1);

                    // calculating the Hue for conf bar
                    // Hue: 0 is Red, 12- is Green
                    // Multiplying confidence by 1.2 maps 0-100% to 0-120 degrees
                    const hue = item.confidence * 1.2;
                    const color = `hsl(${hue}, 70%, 50%)`;
                    const shadowColor = `hsla(${hue}, 70%, 50%, 0.5)`;

                    // applying width and dynmaic color
                    document.getElementById(`${rankPrefix}confBar`).style.width = `${item.confidence}%`;
                    document.getElementById(`${rankPrefix}confBar`).style.backgroundColor  = color;

                    // document.getElementById(`${rankPrefix}Pred`).innerText = item.label;
                    // document.getElementById(`${rankPrefix}PredConf`).innerText = `${item.confidence.toFixed(1)}%`;

                    if (item.confidence < 90) {
                        infoBtn.classList.add('animate-pulse', 'test-secondary');
                    } else {
                        infoBtn.classList.remove('animate-pulse', 'test-secondary');
                    }

                    document.getElementById(`${rankPrefix}confBar`).style.boxShadow = `0 0 8px ${shadowColor}`
                }
            });

            // updating the ui with the results
            // confPerc.innerHTML = result.prediction;
            // confBar.style.width = result.prediction + "%";

        } catch (error) {
            console.log("Error uploading image:", error);
        } finally {
            sendBtn.innerHTML = "Run Classification";
            sendBtn.disabled = false;
        }
    }

    function generateModelView(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const resLabel = document.getElementById('orgResText');
                resLabel.innerText = `High Resolution (${img.naturalWidth}x${img.naturalHeight})`;

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // the exact dimensions my model uses
                canvas.width = 64;
                canvas.height = 64;

                // Draw the source image into the 64x64 container
                ctx.drawImage(img, 0, 0, 64, 64);

                // updating the preprocessed preview with the result
                const prepPreview = document.getElementById('PrepImagePreview');
                prepPreview.src = canvas.toDataURL('image/jpeg');
                prepPreview.style.display = 'block';

                // also updating the original rebuilt preview
                const orgPreview = document.getElementById('orgImagePreview');
                orgPreview.src = e.target.result;
                orgPreview.style.display = 'block';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});
