const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');
const width = 600;
const height = 400;
canvas.width = width;
canvas.height = height;

const source = { x: 50, y: 200 };
const slit_x = 200;
const screen_x = 550;
const slit_width = 20;
let slit_separation = 40; // Controlled by a-slider (2 * a)
let slit1_center = 200 - slit_separation / 2;
let slit2_center = 200 + slit_separation / 2;
let M = 1; // Sample points per slit
let lambda = 10; // Wavelength in pixels
let viewMode = 'pattern';
let selectedY = null;
let animating = false;

function distance(p1, p2) {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function getSamplePoints(center, width, numPoints) {
    if (numPoints === 1) {
        return [{ x: slit_x, y: center }];
    }
    const points = [];
    for (let i = 0; i < numPoints; i++) {
        const y = center - width / 2 + (i / (numPoints - 1)) * width;
        points.push({ x: slit_x, y });
    }
    return points;
}

function computeAmplitude(y_screen, M, lambda) {
    const k = 2 * Math.PI / lambda;
    let amplitude = [0, 0]; // [real, imaginary]
    const slit1_points = getSamplePoints(slit1_center, slit_width, M);
    const slit2_points = getSamplePoints(slit2_center, slit_width, M);
    const all_points = slit1_points.concat(slit2_points);
    const screen_point = { x: screen_x, y: y_screen };

    for (const point of all_points) {
        const d = distance(source, point) + distance(point, screen_point);
        const phase = k * d;
        amplitude[0] += Math.cos(phase);
        amplitude[1] += Math.sin(phase);
    }
    return amplitude;
}

function drawPattern(M, lambda) {
    let max_intensity = 0;
    const intensities = [];
    
    for (let y = 0; y < height; y++) {
        const amplitude = computeAmplitude(y, M, lambda);
        const intensity = amplitude[0] ** 2 + amplitude[1] ** 2;
        intensities.push(intensity);
        if (intensity > max_intensity) max_intensity = intensity;
    }
    
    for (let y = 0; y < height; y++) {
        const normalized = intensities[y] / max_intensity * 255;
        ctx.fillStyle = `rgb(${normalized}, ${normalized}, ${normalized})`;
        ctx.fillRect(screen_x, y, 50, 1); // Wider screen area for visibility
    }
}

function drawPaths(y_selected, M, lambda) {
    const k = 2 * Math.PI / lambda;
    const slit1_points = getSamplePoints(slit1_center, slit_width, M);
    const slit2_points = getSamplePoints(slit2_center, slit_width, M);
    const all_points = slit1_points.concat(slit2_points);
    const screen_point = { x: screen_x, y: y_selected };

    for (const point of all_points) {
        const d = distance(source, point) + distance(point, screen_point);
        const phase = (k * d) % (2 * Math.PI);
        const hue = (phase / (2 * Math.PI)) * 360;
        ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(screen_point.x, screen_point.y);
        ctx.stroke();
    }
}

function drawSetup() {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(source.x, source.y, 5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = 'black';
    ctx.fillRect(slit_x - 2, slit1_center - slit_width / 2, 4, slit_width);
    ctx.fillRect(slit_x - 2, slit2_center - slit_width / 2, 4, slit_width);

    ctx.fillStyle = 'gray';
    ctx.fillRect(screen_x, 0, 50, height);
}

function drawAll() {
    ctx.clearRect(0, 0, width, height);
    drawSetup();
    if (viewMode === 'pattern') {
        drawPattern(M, lambda);
    } else if (viewMode === 'path' && selectedY !== null) {
        drawPaths(selectedY, M, lambda);
    }
}

canvas.addEventListener('click', (event) => {
    if (viewMode === 'path') {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (x >= screen_x && x <= screen_x + 50) {
            selectedY = y;
            drawAll();
        }
    }
});

document.getElementById('M-slider').addEventListener('input', (event) => {
    M = parseInt(event.target.value);
    drawAll();
});

document.getElementById('lambda-slider').addEventListener('input', (event) => {
    lambda = parseFloat(event.target.value);
    drawAll();
});

document.getElementById('a-slider').addEventListener('input', (event) => {
    slit_separation = parseFloat(event.target.value);
    slit1_center = 200 - slit_separation / 2;
    slit2_center = 200 + slit_separation / 2;
    drawAll();
});

document.getElementById('view-toggle').addEventListener('change', (event) => {
    viewMode = event.target.value;
    drawAll();
});

document.getElementById('animate-button').addEventListener('click', () => {
    animating = !animating;
    document.getElementById('animate-button').textContent = animating ? 'Stop Animation' : 'Start Animation';
    if (animating) animatePaths();
});

function animatePaths() {
    if (animating) {
        M = M < 50 ? M + 1 : 1;
        drawAll();
        setTimeout(animatePaths, 500); // Update every 0.5 seconds
    }
}

drawAll();
