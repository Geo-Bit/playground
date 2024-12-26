let scene, camera, renderer, text;
let rotationSpeed = 0.01;

function init() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0xf0f0f0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Camera position
    camera.position.z = 7;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Add additional point light from another angle
    const pointLight2 = new THREE.PointLight(0xffffff, 1.5);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    createText();
    animate();
    setupEventListeners();
}

function createText(textContent = 'HELLO') {
    if (text) scene.remove(text);

    const loader = new THREE.FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function(font) {
        const geometry = new THREE.TextGeometry(textContent, {
            font: font,
            size: 1,
            height: 0.4,
        });

        const material = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.9,
            roughness: 0.1,
        });

        text = new THREE.Mesh(geometry, material);
        geometry.center();
        
        // Auto-scale text to fit screen
        const bbox = new THREE.Box3().setFromObject(text);
        const size = bbox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y);
        const scale = 3.5 / maxDim; // Adjust this value to change how much of the screen the text fills
        text.scale.set(scale, scale, scale);

        scene.add(text);
    });
}

function animate() {
    requestAnimationFrame(animate);
    if (text) {
        text.rotation.y += rotationSpeed;
    }
    renderer.render(scene, camera);
}

function setupEventListeners() {
    window.addEventListener('resize', onWindowResize, false);
    
    document.getElementById('textInput').addEventListener('input', (e) => {
        createText(e.target.value);
    });

    document.getElementById('bgColor').addEventListener('input', (e) => {
        document.body.style.backgroundColor = e.target.value;
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();