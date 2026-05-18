import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, controls;
let previewObject;
let particlesMesh;
let ambientLight, dirLight, orangeLight, blueLight;

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
    controls.enablePan = true;
    controls.autoRotate = true; // Rotación automática suave
    controls.autoRotateSpeed = 1.0;
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.minPolarAngle = 0.1;
    controls.target.set(0, -2, 0); // Fija el centro de rotación en el objeto

    // Función para ajustar la cámara y el objeto
    const updateRobotAndCamera = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Offset de la cámara para que en PC se vea a la derecha
        if (w >= 900) {
            // Aumentamos ligeramente el shift para asegurar que el objeto quede bien a la derecha
            const shift = w > 1200 ? -w * 0.3 : -w * 0.25;
            camera.setViewOffset(w, h, shift, 0, w, h);
            if (previewObject) {
                previewObject.position.set(0, -2, 0);
                controls.target.set(0, -2, 0);
            }
        } else {
            camera.clearViewOffset();
            if (previewObject) {
                previewObject.position.set(0, -2, -1.5);
                controls.target.set(0, -2, -1.5);
            }
        }
        controls.update();
    };

    /* == EL MODELO 3D GLB == */
    const loader = new GLTFLoader();

    // Convertimos la carga en una función global para llamarla desde los botones
    window.loadModel = (url) => {
        if (previewObject) {
            scene.remove(previewObject);
        }

        loader.load(url, function (gltf) {
            const model = gltf.scene;

            // Calcular el bounding box para centrar el modelo
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());

            model.position.x = -center.x;
            model.position.y = -center.y;
            model.position.z = -center.z;

            // Crear un grupo que contendrá el modelo centrado
            previewObject = new THREE.Group();
            previewObject.add(model);

            // Si el modelo es muy grande, ajustar escala dinámicamente basado en su tamaño
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 8; // Tamaño máximo deseado en la escena
            const scale = targetSize / maxDim;

            // Usar la escala dinámica si es menor que 0.6 para evitar que sea inmenso, sino mantener un buen tamaño
            const finalScale = Math.min(scale, 0.6);
            previewObject.scale.set(finalScale, finalScale, finalScale);

            updateRobotAndCamera(); // Ajustar cámara y posición del objeto

            previewObject.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add(previewObject);

            // Actualizar los textos solo para el primer modelo o si quieres textos dinámicos después
            if (url === './assets/3D/SetUp.glb') {
                const titleEl = document.getElementById('project-title');
                const descEl = document.getElementById('project-desc');
                if (titleEl && portfolioData[0]) titleEl.innerHTML = portfolioData[0].title;
                if (descEl && portfolioData[0]) descEl.innerHTML = portfolioData[0].description;
            }
        }, undefined, function (error) {
            console.error('No se pudo cargar el GLB', error);
        });
    };

    // Carga inicial
    window.loadModel('./assets/3D/SetUp.glb');

    /* == PARTICULAS == */
    const particlesCount = 700;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) { posArray[i] = (Math.random() - 0.5) * 15; }
    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({ size: 0.02, color: 0xff9900, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
    particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particlesMesh);

    /* == LUCES ESTUDIO == */
    ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 5, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    orangeLight = new THREE.PointLight(0xff6a00, 8);
    orangeLight.position.set(-2, 1, 2);
    scene.add(orangeLight);

    blueLight = new THREE.PointLight(0x00ccff, 3);
    blueLight.position.set(5, -2, -2);
    scene.add(blueLight);

    const clock = new THREE.Clock();
    const animate = () => {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        if (previewObject) {
            // Removida la rotación forzada del objeto para que OrbitControls funcione correctamente
            // El efecto flotar se mantiene solo en el eje Y
            const baseY = -2;
            previewObject.position.y = baseY + Math.sin(elapsedTime * 0.8) * 0.1;
        }

        if (particlesMesh) particlesMesh.rotation.y = elapsedTime * -0.03;

        controls.update();
        renderer.render(scene, camera);
    };
    animate();

    // Reajustar todo al redimensionar la ventana (evita traslapes dinámicamente)
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        updateRobotAndCamera();
    });
};

/* --- DATOS DE PROYECTOS --- */
const portfolioData = [
    {
        id: 1,
        title: "Setup Programador",
        description: "Modelo 3D integral generado en Blender.<br><br>Elementos importados:<br>• Taza Minecraft<br>• Silla Ergonómica<br>• Mouse Gamer",
        image: "./assets/Setup2.png"
    },
    { id: 2, title: "Animación en Rive", description: "Proyecto de animación interactiva creado con Rive. <br><br><a href='https://github.com/CaroMFernandez/login_with_rive_animation_torres_com' target='_blank' style='color: #ff6a00; text-decoration: underline; font-weight: 600;'>Ver Repositorio en GitHub</a>", image: "https://github.com/CaroMFernandez/login_with_rive_animation_torres_com/raw/main/assets/demo.gif" },
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
        titleSpan.innerHTML = item.title;
        itemDiv.appendChild(titleSpan);

        itemDiv.addEventListener('click', () => {
            document.querySelectorAll('.gallery-item').forEach(el => el.classList.remove('active'));
            itemDiv.classList.add('active');
            titleEl.style.opacity = 0;
            descEl.style.opacity = 0;
            setTimeout(() => {
                titleEl.innerHTML = item.title;
                descEl.innerHTML = item.description;
                titleEl.style.opacity = 1;
                descEl.style.opacity = 1;
            }, 300);
        });
        track.appendChild(itemDiv);
    });
};

/* --- MODALES A PRUEBA DE FALLOS --- */
const setupModals = () => {
    const mainNav = document.getElementById('main-nav');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');

    mobileMenuBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = mainNav?.classList.toggle('show-mobile-menu');
        document.body.classList.toggle('mobile-menu-active', isOpen);
    });

    closeMenuBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        mainNav?.classList.remove('show-mobile-menu');
        document.body.classList.remove('mobile-menu-active');
    });

    // Cerrar menú móvil al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!mainNav?.contains(e.target) && e.target !== mobileMenuBtn) {
            mainNav?.classList.remove('show-mobile-menu');
            document.body.classList.remove('mobile-menu-active');
        }
    });

    window.closeAllModals = () => {
        document.getElementById('modal-about')?.classList.add('hidden');
        document.getElementById('modal-contact')?.classList.add('hidden');
        document.getElementById('modal-skills')?.classList.add('hidden');
        document.getElementById('nav-projects')?.classList.add('active'); // Regresar selector a Proyectos
        document.getElementById('nav-about')?.classList.remove('active');
        document.getElementById('nav-contact')?.classList.remove('active');
        document.getElementById('nav-skills')?.classList.remove('active');
        mainNav?.classList.remove('show-mobile-menu'); // Cerrar el menú móvil
        document.body.classList.remove('mobile-menu-active');
        document.body.classList.remove('modal-active'); // Remover clase de modal activo
    };

    document.getElementById('nav-projects')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.closeAllModals();
    });

    document.getElementById('nav-about')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.closeAllModals();
        document.getElementById('modal-about').classList.remove('hidden');
        document.getElementById('nav-about').classList.add('active');
        document.getElementById('nav-projects').classList.remove('active');
        document.body.classList.add('modal-active'); // Agregar clase de modal activo
    });

    document.getElementById('nav-skills')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.closeAllModals();
        document.getElementById('modal-skills').classList.remove('hidden');
        document.getElementById('nav-skills').classList.add('active');
        document.getElementById('nav-projects').classList.remove('active');
        document.body.classList.add('modal-active'); // Agregar clase de modal activo
    });

    document.getElementById('nav-contact')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.closeAllModals();
        document.getElementById('modal-contact').classList.remove('hidden');
        document.getElementById('nav-contact').classList.add('active');
        document.getElementById('nav-projects').classList.remove('active');
        document.body.classList.add('modal-active'); // Agregar clase de modal activo
    });

    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.closeAllModals();
        });
    });
};

/* --- INTERACCIONES PROGRAMADAS --- */
const setupInteractions = () => {
    // 1. Modo Claro / Oscuro
    const themeBtn = document.getElementById('theme-toggle');
    let isLightMode = false;

    themeBtn?.addEventListener('click', () => {
        isLightMode = !isLightMode;
        document.body.classList.toggle('light-theme');
        themeBtn.innerHTML = isLightMode ? '<span style="pointer-events: none;">🌙</span>' : '<span style="pointer-events: none;">☀️</span>';

        if (scene && scene.fog) {
            if (isLightMode) {
                scene.fog.color.setHex(0xf0f2f5);
                scene.fog.density = 0.04;
                if (ambientLight) ambientLight.intensity = 1.5;
                if (dirLight) dirLight.intensity = 2.0;
            } else {
                scene.fog.color.setHex(0x0a0a0c);
                scene.fog.density = 0.03;
                if (ambientLight) ambientLight.intensity = 0.6;
                if (dirLight) dirLight.intensity = 1.5;
            }
        }
    });

    // 2. Botón de Color del Setup
    const colorBtn = document.getElementById('color-toggle');
    let currentThemeIndex = 0;

    // Definimos las rutas a los archivos que tú exportaste
    const setupThemes = [
        {
            name: "Naranja",
            file: "./assets/3D/SetUp.glb",
            accentUI: "#ff6a00"
        },
        {
            name: "Cyan",
            file: "./assets/3D/SetUp_cyan.glb",
            accentUI: "#00ffff"
        },
        {
            name: "Rosa",
            file: "./assets/3D/SetUp_rosa.glb",
            accentUI: "#ff66b2"
        }
    ];

    colorBtn?.addEventListener('click', () => {
        currentThemeIndex = (currentThemeIndex + 1) % setupThemes.length;
        const theme = setupThemes[currentThemeIndex];

        // Actualizamos colores de UI y luces para que todo combine
        document.documentElement.style.setProperty('--accent', theme.accentUI);
        if (orangeLight) orangeLight.color.set(theme.accentUI);
        if (particlesMesh) particlesMesh.material.color.set(theme.accentUI);

        // Cargar el archivo 3D correspondiente desde Blender
        if (window.loadModel) {
            window.loadModel(theme.file);
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    init3DScene();
    renderGallery();
    setupModals();
    setupInteractions();
});
