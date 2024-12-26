let scene, camera, renderer;
let letters = []; // Array to store individual letter meshes
let rotationSpeed = 0.01;

function init() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setClearColor(0xf0f0f0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Camera position - moved even further back
    camera.position.z = 12; // Increased from 10 to 12

    // Enhanced lighting setup for chrome effect
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Add multiple point lights for better reflections
    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xffffff, 1.5);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    // Add rim lights for that extra shine
    const rimLight1 = new THREE.PointLight(0xffffff, 1);
    rimLight1.position.set(0, 10, -10);
    scene.add(rimLight1);

    const rimLight2 = new THREE.PointLight(0xffffff, 1);
    rimLight2.position.set(0, -10, -10);
    scene.add(rimLight2);

    createText();
    animate();
    setupEventListeners();
}

function createText(textContent = 'CHROME') {
    // Remove existing letters
    letters.forEach(letter => scene.remove(letter));
    letters = [];

    const loader = new THREE.FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function(font) {
        // Enhanced chrome material
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,  // Brighter base color
            metalness: 1.0,   // Maximum metalness
            roughness: 0.05,  // Very smooth surface
            envMapIntensity: 1.0,
            flatShading: false
        });

        // Create environment map for reflections
        const cubeTextureLoader = new THREE.CubeTextureLoader();
        const envMap = cubeTextureLoader
            .setPath('https://threejs.org/examples/textures/cube/Bridge2/')
            .load([
                'posx.jpg', 'negx.jpg',
                'posy.jpg', 'negy.jpg',
                'posz.jpg', 'negz.jpg'
            ]);
        
        scene.environment = envMap;
        material.envMap = envMap;

        // First, create all letters to get total width
        const letterMeshes = textContent.split('').map(char => {
            const geometry = new THREE.TextGeometry(char, {
                font: font,
                size: 1,
                height: 0.4,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.03,
                bevelSegments: 5
            });
            geometry.center();
            return new THREE.Mesh(geometry, material);
        });

        // Calculate total width with spacing
        const spacing = 0.8; // Spacing between letters
        let totalWidth = 0;
        letterMeshes.forEach(mesh => {
            const bbox = new THREE.Box3().setFromObject(mesh);
            const size = bbox.getSize(new THREE.Vector3());
            totalWidth += size.x + spacing;
        });
        totalWidth -= spacing; // Remove extra spacing after last letter

        // Position letters side by side with spacing
        const screenAspect = window.innerWidth / window.innerHeight;
        const targetWidth = 10; // Reduced from 12 to 10 for better fit
        const scale = (targetWidth * screenAspect) / totalWidth;
        
        let currentX = -totalWidth * scale / 2; // Start from left side
        
        letterMeshes.forEach(mesh => {
            const bbox = new THREE.Box3().setFromObject(mesh);
            const size = bbox.getSize(new THREE.Vector3());
            
            mesh.scale.set(scale, scale, scale);
            mesh.position.x = currentX + (size.x * scale / 2);
            currentX += (size.x + spacing) * scale;
            
            scene.add(mesh);
            letters.push(mesh);
        });
    });
}

function animate() {
    requestAnimationFrame(animate);
    // Rotate each letter independently
    letters.forEach(letter => {
        letter.rotation.y += rotationSpeed;
    });
    renderer.render(scene, camera);
}

function setupEventListeners() {
    window.addEventListener('resize', onWindowResize, false);
    
    document.getElementById('textInput').addEventListener('input', (e) => {
        createText(e.target.value.toUpperCase());
    });

    document.getElementById('bgColor').addEventListener('input', (e) => {
        const color = e.target.value;
        document.body.style.backgroundColor = color;
        renderer.setClearColor(color);
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();