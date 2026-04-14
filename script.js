import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, controls;
let previewObject;
let particlesMesh;

const init3DScene = () => {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0c, 0.03);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(2, 2, 7); 

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0; 
    renderer.shadowMap.enabled = true; 
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.minPolarAngle = 0.1;

    // Función para reposicionar Robot según el tipo de pantalla
    const calculateRobotPosition = () => {
        if (!previewObject) return;
        const w = window.innerWidth;
        // Si la pantalla es ancha (Escritorio), mándalo a la derecha
        if (w >= 900) {
            previewObject.position.set(w > 1200 ? 2.5 : 1.8, -2, 0); 
        } else {
            // Si es un celular o pantalla reducida, ponlo en el centro pero más alejado para hacer espacio
            previewObject.position.set(0, -2, -1.5);
        }
    };

    /* == EL MODELO 3D GLB == */
    const loader = new GLTFLoader();
    const urlFakeBlenderModel = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/RobotExpressive/RobotExpressive.glb';
    
    loader.load(urlFakeBlenderModel, function (gltf) {
            previewObject = gltf.scene;

            previewObject.scale.set(0.6, 0.6, 0.6); 
            calculateRobotPosition(); // Calcular donde no estorbe el texto
            
            previewObject.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add(previewObject);

            document.getElementById('project-title').textContent = portfolioData[0].title;
            document.getElementById('project-desc').textContent = portfolioData[0].description;
        }, undefined, function (error) { console.error('No se pudo cargar el GLB', error); }
    );

    /* == PARTICULAS == */
    const particlesCount = 700;
    const posArray = new Float32Array(particlesCount * 3);
    for(let i = 0; i < particlesCount * 3; i++) { posArray[i] = (Math.random() - 0.5) * 15; }
    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({ size: 0.02, color: 0xff9900, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
    particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particlesMesh);

    /* == LUCES ESTUDIO == */
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 5, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const orangeLight = new THREE.PointLight(0xff6a00, 8);
    orangeLight.position.set(-2, 1, 2);
    scene.add(orangeLight);
    
    const blueLight = new THREE.PointLight(0x00ccff, 3);
    blueLight.position.set(5, -2, -2);
    scene.add(blueLight);

    const clock = new THREE.Clock();
    const animate = () => {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        if(previewObject) {
            previewObject.rotation.y = elapsedTime * 0.2;
            // Efecto flotar atado a su posición real X, Z
            const basePos = window.innerWidth >= 900 ? (window.innerWidth > 1200 ? 2.5 : 1.8) : 0;
            const baseY = -2;
            previewObject.position.y = baseY + Math.sin(elapsedTime * 0.8) * 0.1;
        }

        if(particlesMesh) particlesMesh.rotation.y = elapsedTime * -0.03;
        
        controls.update();
        renderer.render(scene, camera);
    };
    animate();

    // Reajustar todo al redimensionar la ventana (evita traslapes dinámicamente)
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        calculateRobotPosition();
    });
};

/* --- DATOS FICTICIOS --- */
const portfolioData = [
    { id: 1, title: "Robot Expresivo", description: "ESTE ES EL MODELO IMPORTADO DESDE ('glb'). Fue generado en Blender y cargado exitosamente. Gíralo y haz Zoom con tu ratón.", image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400&auto=format&fit=crop" },
    { id: 2, title: "Espada Medieval", description: "Renderizado fotorealista en Cycles. Se logró una simulación de desgate del metal.", image: "https://images.unsplash.com/photo-1590341328520-22d41b8a514d?q=80&w=400&auto=format&fit=crop" },
    { id: 3, title: "Interior Minimalista", description: "Estudio de luz en interiores usando PBR. Horneado en Eevee.", image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=400&auto=format&fit=crop" }
];

const renderGallery = () => {
    const track = document.getElementById('gallery-track');
    const titleEl = document.getElementById('project-title');
    const descEl = document.getElementById('project-desc');
    if (!track) return;

    portfolioData.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `gallery-item ${index === 0 ? 'active' : ''}`;
        itemDiv.style.backgroundImage = `url(${item.image})`;
        const titleSpan = document.createElement('span');
        titleSpan.textContent = item.title;
        itemDiv.appendChild(titleSpan);

        itemDiv.addEventListener('click', () => {
            document.querySelectorAll('.gallery-item').forEach(el => el.classList.remove('active'));
            itemDiv.classList.add('active');
            titleEl.style.opacity = 0;
            descEl.style.opacity = 0;
            setTimeout(() => {
                titleEl.textContent = item.title;
                descEl.textContent = item.description;
                titleEl.style.opacity = 1;
                descEl.style.opacity = 1;
            }, 300);
        });
        track.appendChild(itemDiv);
    });
};

/* --- MODALES A PRUEBA DE FALLOS --- */
const setupModals = () => {
    window.closeAllModals = () => {
        document.getElementById('modal-about')?.classList.add('hidden');
        document.getElementById('modal-contact')?.classList.add('hidden');
        document.getElementById('nav-gallery')?.classList.add('active'); // Regresar selector a Galería
        document.getElementById('nav-about')?.classList.remove('active');
        document.getElementById('nav-contact')?.classList.remove('active');
    };

    document.getElementById('nav-gallery')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.closeAllModals();
    });

    document.getElementById('nav-about')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.closeAllModals();
        document.getElementById('modal-about').classList.remove('hidden');
        document.getElementById('nav-about').classList.add('active');
        document.getElementById('nav-gallery').classList.remove('active');
    });

    document.getElementById('nav-contact')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.closeAllModals();
        document.getElementById('modal-contact').classList.remove('hidden');
        document.getElementById('nav-gallery').classList.remove('active');
    });

    // Anexar también evento a los botones manualmente por si el HTML carece de 'onclick' global
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', window.closeAllModals);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    init3DScene();
    renderGallery();
    setupModals();
});
