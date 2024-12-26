let scene, camera, renderer;
let carSceneLeft, carCameraLeft, carRendererLeft;
let carSceneRight, carCameraRight, carRendererRight;
let carLeft, carRight;
let mixerLeft, mixerRight;
let letters = [];
let rotationSpeed = 0.01;
let isGrayscale = false;
let showShadows = true;
let carScale = .9;
let baseSizeWithPadding = 350; // Increased from 300 to 350 for more width
let carContainerSize = baseSizeWithPadding * carScale;

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', function() {
    init();
});

function init() {
    // Original scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setClearColor(0xf0f0f0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = showShadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Camera position
    camera.position.z = 12;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 500;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    scene.add(mainLight);

    // Add shadow-catching plane
    const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 50),
        new THREE.ShadowMaterial({
            opacity: 0.2
        })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Initialize car scene
    initCarScene();
    createText();
    animate();
    setupEventListeners();
}

function initCarScene() {
    console.log('Initializing car scenes...');
    
    // Update container size based on scale
    carContainerSize = baseSizeWithPadding * carScale;
    
    // Initialize left car scene
    carSceneLeft = new THREE.Scene();
    carCameraLeft = new THREE.PerspectiveCamera(32, 1, 0.1, 1000); // Reduced FOV slightly more
    carRendererLeft = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance",
        alpha: true
    });
    
    carRendererLeft.setClearColor(0x000000, 0);
    carRendererLeft.setSize(carContainerSize, carContainerSize);
    document.getElementById('car-container-left').appendChild(carRendererLeft.domElement);

    // Initialize right car scene
    carSceneRight = new THREE.Scene();
    carCameraRight = new THREE.PerspectiveCamera(32, 1, 0.1, 1000); // Reduced FOV slightly more
    carRendererRight = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance",
        alpha: true
    });
    
    carRendererRight.setClearColor(0x000000, 0);
    carRendererRight.setSize(carContainerSize, carContainerSize);
    document.getElementById('car-container-right').appendChild(carRendererRight.domElement);

    // Setup lighting for both scenes
    [carSceneLeft, carSceneRight].forEach(scene => {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
        scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 3.0);
        sunLight.position.set(10, 15, 10);
        scene.add(sunLight);
    });

    // Position cameras even further back
    carCameraLeft.position.set(0, 0, 17);  // Increased from 15 to 17
    carCameraLeft.lookAt(0, -1, 0);
    
    carCameraRight.position.set(0, 0, 17);  // Increased from 15 to 17
    carCameraRight.lookAt(0, -1, 0);

    // Load cars
    loadCar('left');
    loadCar('right');
}

function loadCar(side) {
    console.log(`Loading ${side} car...`);
    const loader = new THREE.GLTFLoader();
    loader.load(
        './impala_1964_lowrider.glb',
        function (gltf) {
            console.log(`${side} car loaded successfully:`, gltf);
            const car = gltf.scene;
            
            // Create chrome material
            const chromeMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                metalness: 1.0,
                roughness: 0.1,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1,
                envMapIntensity: 1.2,
                reflectivity: 1.0
            });

            // Load environment map
            const cubeTextureLoader = new THREE.CubeTextureLoader();
            cubeTextureLoader
                .setPath('https://threejs.org/examples/textures/cube/Bridge2/')
                .load([
                    'posx.jpg', 'negx.jpg',
                    'posy.jpg', 'negy.jpg',
                    'posz.jpg', 'negz.jpg'
                ], function(envMap) {
                    // Convert to grayscale if needed
                    if (isGrayscale) {
                        envMap.images.forEach((image, index) => {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            canvas.width = image.width;
                            canvas.height = image.height;
                            
                            ctx.drawImage(image, 0, 0);
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const data = imageData.data;
                            
                            for (let i = 0; i < data.length; i += 4) {
                                const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
                                data[i] = data[i + 1] = data[i + 2] = gray;
                            }
                            
                            ctx.putImageData(imageData, 0, 0);
                            envMap.images[index] = canvas;
                        });
                        envMap.needsUpdate = true;
                    }
                    
                    chromeMaterial.envMap = envMap;
                    chromeMaterial.needsUpdate = true;
                });
            
            // Apply chrome material to car
            car.traverse((child) => {
                if (child.isMesh) {
                    child.material = chromeMaterial;
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            car.scale.set(carScale, carScale, carScale);
            
            if (side === 'left') {
                car.position.set(0, -1, 0);
                car.rotation.set(0, Math.PI / 2, 0);
                carLeft = car;
                carSceneLeft.add(car);
                mixerLeft = new THREE.AnimationMixer(car);
                if (gltf.animations.length) {
                    gltf.animations.forEach(clip => mixerLeft.clipAction(clip).play());
                }
            } else {
                car.position.set(0, -1, 0);
                car.rotation.set(0, -Math.PI / 2, 0);
                carRight = car;
                carSceneRight.add(car);
                mixerRight = new THREE.AnimationMixer(car);
                if (gltf.animations.length) {
                    gltf.animations.forEach(clip => mixerRight.clipAction(clip).play());
                }
            }
        },
        function (xhr) {
            console.log(`${side} car loading progress:`, (xhr.loaded / xhr.total * 100) + '%');
        },
        function (error) {
            console.error(`Error loading ${side} car:`, error);
        }
    );
}

function animate() {
    requestAnimationFrame(animate);
    
    // Update text scene
    letters.forEach(letter => {
        letter.rotation.y += rotationSpeed;
    });
    renderer.render(scene, camera);

    // Update car animations
    if (mixerLeft) mixerLeft.update(0.016);
    if (mixerRight) mixerRight.update(0.016);
    
    // Render both car scenes
    if (carRendererLeft && carSceneLeft && carCameraLeft) {
        carRendererLeft.render(carSceneLeft, carCameraLeft);
    }
    if (carRendererRight && carSceneRight && carCameraRight) {
        carRendererRight.render(carSceneRight, carCameraRight);
    }
}

function createText(textContent = 'CHROME') {
    letters.forEach(letter => scene.remove(letter));
    letters = [];

    const loader = new THREE.FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function(font) {
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 1.0,
            roughness: 0.05,
            envMapIntensity: 1.0,
        });

        // Environment map loading...
        const cubeTextureLoader = new THREE.CubeTextureLoader();
        cubeTextureLoader
            .setPath('https://threejs.org/examples/textures/cube/Bridge2/')
            .load([
                'posx.jpg', 'negx.jpg',
                'posy.jpg', 'negy.jpg',
                'posz.jpg', 'negz.jpg'
            ], function(envMap) {
                // Convert to grayscale if needed
                if (isGrayscale) {
                    envMap.images.forEach((image, index) => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = image.width;
                        canvas.height = image.height;
                        
                        ctx.drawImage(image, 0, 0);
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imageData.data;
                        
                        for (let i = 0; i < data.length; i += 4) {
                            const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
                            data[i] = data[i + 1] = data[i + 2] = gray;
                        }
                        
                        ctx.putImageData(imageData, 0, 0);
                        envMap.images[index] = canvas;
                    });
                    envMap.needsUpdate = true;
                }
                
                scene.environment = envMap;
                material.envMap = envMap;
                material.needsUpdate = true;
            });

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
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = showShadows; // Use shadow toggle state
            return mesh;
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

    document.getElementById('grayscaleToggle').addEventListener('change', (e) => {
        isGrayscale = e.target.checked;
        createText(document.getElementById('textInput').value.toUpperCase());
        
        if (carLeft) {
            carSceneLeft.remove(carLeft);
            loadCar('left');
        }
        if (carRight) {
            carSceneRight.remove(carRight);
            loadCar('right');
        }
    });

    // Add shadow toggle listener
    document.getElementById('shadowToggle').addEventListener('change', (e) => {
        showShadows = e.target.checked;
        
        // Update renderer
        renderer.shadowMap.enabled = showShadows;
        
        // Update shadow plane visibility
        scene.traverse((object) => {
            if (object.isMesh && object.material instanceof THREE.ShadowMaterial) {
                object.visible = showShadows;
            }
        });
        
        // Update letter shadows
        letters.forEach(letter => {
            letter.castShadow = showShadows;
        });
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateCarSize(newScale) {
    carScale = newScale;
    carContainerSize = baseSizeWithPadding * carScale;
    
    // Update CSS custom property
    document.documentElement.style.setProperty('--car-container-size', `${carContainerSize}px`);
    
    // Update renderer sizes
    if (carRendererLeft) {
        carRendererLeft.setSize(carContainerSize, carContainerSize);
    }
    if (carRendererRight) {
        carRendererRight.setSize(carContainerSize, carContainerSize);
    }
    
    // Update camera positions with adjusted values for wider view
    if (carCameraLeft) {
        carCameraLeft.position.set(0, 0, 17 + (carScale * 5)); // Increased base distance
        carCameraLeft.lookAt(0, -1, 0);
    }
    if (carCameraRight) {
        carCameraRight.position.set(0, 0, 17 + (carScale * 5)); // Increased base distance
        carCameraRight.lookAt(0, -1, 0);
    }
    
    // Update car scales and positions
    if (carLeft) {
        carLeft.scale.set(carScale, carScale, carScale);
        carLeft.position.set(0, -1, 0);
    }
    if (carRight) {
        carRight.scale.set(carScale, carScale, carScale);
        carRight.position.set(0, -1, 0);
    }
}