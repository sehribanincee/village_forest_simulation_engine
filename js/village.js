window.villageScene = null;
window.villageCamera = null;
window.villageRenderer = null;
window.villageGroup = null;
window.activeVillageAnimation = null;

const keysPressed = { w: false, s: false, a: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
const moveSpeed = 0.12; 
const playerRadius = 0.4; 

let yaw = -Math.PI / 2; // Doğrudan köy merkezine odaklanan bakış açısı
let pitch = 0;
const mouseSensitivity = 0.0025;

window.initVillage = function() {
    window.closeVillage(); 

    window.villageScene = new THREE.Scene();
    window.villageScene.background = new THREE.Color(0xbae6fd); 
    window.villageScene.fog = new THREE.FogExp2(0xbae6fd, 0.003); 

    window.villageCamera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500);
    window.villageCamera.position.set(0, 1.6, 5); // Güvenli başlangıç noktası

    window.villageRenderer = new THREE.WebGLRenderer({ antialias: true });
    window.villageRenderer.setSize(window.innerWidth, window.innerHeight);
    window.villageRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    window.villageRenderer.domElement.style.position = "absolute";
    window.villageRenderer.domElement.style.top = "0";
    window.villageRenderer.domElement.style.left = "0";
    window.villageRenderer.domElement.style.zIndex = "1"; 
    document.body.appendChild(window.villageRenderer.domElement);

    // Güçlü kristal gün ışığı aydınlatması
    const ambient = new THREE.AmbientLight(0xffffff, 1.3); window.villageScene.add(ambient);
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.7); sunLight.position.set(15, 40, 15); window.villageScene.add(sunLight);
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x16a34a, 0.4); window.villageScene.add(hemiLight);

    window.villageGroup = new THREE.Group();

    // Çimen zemin
    const valleyGrass = new THREE.Mesh(new THREE.PlaneGeometry(120, 240), new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.9 }));
    valleyGrass.rotation.x = -Math.PI / 2; window.villageGroup.add(valleyGrass);

    // Mavi Dere
    const river = new THREE.Mesh(new THREE.PlaneGeometry(6, 240), new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.1, metalness: 0.1 }));
    river.rotation.x = -Math.PI / 2; river.position.set(13, 0.02, 0); window.villageGroup.add(river);

    // Taş Patika
    const walkingPath = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 240), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 })); 
    walkingPath.rotation.x = -Math.PI / 2; walkingPath.position.set(8.5, 0.03, 0); window.villageGroup.add(walkingPath);

    // Evler Döngüsü
    window.colliders = []; 
    for (let zOffset = -45; zOffset <= 45; zOffset += 15) {
        const isMyHouse = (zOffset === 0); 
        const houseColor = isMyHouse ? 0xfef08a : 0xf8fafc; 
        const houseMesh = new THREE.Mesh(new THREE.BoxGeometry(5, 3.5, 4), new THREE.MeshStandardMaterial({ color: houseColor, roughness: 0.4 }));
        houseMesh.position.set(-6, 1.75, zOffset); window.villageGroup.add(houseMesh);
        window.colliders.push({ xMin: -8.8, xMax: -3.2, zMin: zOffset - 2.3, zMax: zOffset + 2.3 });

        const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2, 4), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }));
        roof.rotation.y = Math.PI / 4; roof.position.set(-6, 4.5, zOffset); window.villageGroup.add(roof);

        const fenceMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.6 });
        const sideFence = new THREE.Mesh(new THREE.BoxGeometry(12, 0.8, 0.15), fenceMat);
        sideFence.position.set(-2, 0.4, zOffset - 7.5); window.villageGroup.add(sideFence);
        window.colliders.push({ xMin: -8.2, xMax: 4.2, zMin: zOffset - 7.65, zMax: zOffset - 7.35 });

        const frontFenceLeft = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 5.5), fenceMat);
        frontFenceLeft.position.set(4, 0.4, zOffset - 4.75); window.villageGroup.add(frontFenceLeft);
        window.colliders.push({ xMin: 3.85, xMax: 4.15, zMin: zOffset - 7.6, zMax: zOffset - 2.0 });

        const frontFenceRight = frontFenceLeft.clone(); frontFenceRight.position.z = zOffset + 4.75; window.villageGroup.add(frontFenceRight);
        window.colliders.push({ xMin: 3.85, xMax: 4.15, zMin: zOffset + 2.0, zMax: zOffset + 7.6 });

        for (let t = 0; t < 2; t++) {
            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2.2), new THREE.MeshStandardMaterial({ color: 0x7c2d12 })); trunk.position.y = 1.1; tree.add(trunk);
            const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.5 })); leaves.position.y = 2.2; tree.add(leaves);
            tree.position.set(-1.5 - (t * 3), 0, zOffset - 4); window.villageGroup.add(tree);
        }
    }

    window.vSlots = { dog: new THREE.Group(), cat: new THREE.Group(), rabbit: new THREE.Group(), kamelya: new THREE.Group(), swing: new THREE.Group(), flowers: new THREE.Group() };
    window.vSlots.dog.position.set(1, 0, -1); window.vSlots.cat.position.set(0, 0.1, -3); window.vSlots.rabbit.position.set(2, 0, -0.5);
    window.vSlots.kamelya.position.set(1.5, 0, -4); window.vSlots.swing.position.set(-2, 0, -4.5); window.vSlots.flowers.position.set(2.5, 0, -3.5);
    Object.values(window.vSlots).forEach(slot => window.villageGroup.add(slot));

    window.villageScene.add(window.villageGroup);
    drawOwnedRewards();
    window.bindVillageEvents();
    updateCameraRotation(); 

    loopVillage();
};

window.bindVillageEvents = function() {
    document.onkeydown = function(e) { if (e.key in keysPressed) keysPressed[e.key] = true; };
    document.onkeyup = function(e) { if (e.key in keysPressed) keysPressed[e.key] = false; };

    window.villageRenderer.domElement.onclick = function() {
        window.villageRenderer.domElement.requestPointerLock();
    };

    document.onmousemove = function(e) {
        if (document.pointerLockElement === window.villageRenderer.domElement) {
            yaw -= e.movementX * mouseSensitivity;
            pitch -= e.movementY * mouseSensitivity;
            pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch)); 
            updateCameraRotation();
        }
    };
};

function updateCameraRotation() {
    const target = new THREE.Vector3();
    target.x = window.villageCamera.position.x + Math.cos(pitch) * Math.cos(yaw);
    target.y = window.villageCamera.position.y + Math.sin(pitch);
    target.z = window.villageCamera.position.z + Math.cos(pitch) * Math.sin(yaw);
    window.villageCamera.lookAt(target);
}

function checkCollision(nextX, nextZ) {
    if (nextX < -15 || nextX > 7.5) return true; 
    if (nextZ < -55 || nextZ > 55) return true;

    for (let i = 0; i < window.colliders.length; i++) {
        const box = window.colliders[i];
        if (nextX + playerRadius > box.xMin && nextX - playerRadius < box.xMax &&
            nextZ + playerRadius > box.zMin && nextZ - playerRadius < box.zMax) {
            return true; 
        }
    }
    return false;
}

function loopVillage() {
    function villageLoop() {
        if (!window.villageRenderer) return;
        window.activeVillageAnimation = requestAnimationFrame(villageLoop);

        let currentX = window.villageCamera.position.x;
        let currentZ = window.villageCamera.position.z;

        let moveX = 0;
        let moveZ = 0;

        // Kameranın baktığı yöne göre (FPS tarzı) yürüme hesaplama motoru
        if (keysPressed.w || keysPressed.W || keysPressed.ArrowUp) {
            moveX += Math.cos(yaw) * moveSpeed;
            moveZ += Math.sin(yaw) * moveSpeed;
        }
        if (keysPressed.s || keysPressed.S || keysPressed.ArrowDown) {
            moveX -= Math.cos(yaw) * moveSpeed;
            moveZ -= Math.sin(yaw) * moveSpeed;
        }
        if (keysPressed.a || keysPressed.A || keysPressed.ArrowLeft) {
            moveX += Math.sin(yaw) * moveSpeed;
            moveZ -= Math.cos(yaw) * moveSpeed;
        }
        if (keysPressed.d || keysPressed.D || keysPressed.ArrowRight) {
            moveX -= Math.sin(yaw) * moveSpeed;
            moveZ += Math.cos(yaw) * moveSpeed;
        }

        let nextX = currentX + moveX;
        let nextZ = currentZ + moveZ;

        if (!checkCollision(nextX, currentZ)) window.villageCamera.position.x = nextX;
        if (!checkCollision(currentX, nextZ)) window.villageCamera.position.z = nextZ;

        window.villageCamera.position.y = 1.6; 

        window.villageRenderer.render(window.villageScene, window.villageCamera);
    }
    villageLoop();
}

function drawOwnedRewards() {
    Object.keys(window.ownedItems).forEach(key => {
        if (window.ownedItems[key]) {
            const g = new THREE.Group();
            if (key === 'dog') { 
                const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.3), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }));
                const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }));
                headMesh.position.set(0.24, 0.22, 0);
                const earL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.06), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
                earL.position.set(0.24, 0.35, 0.1); const earR = earL.clone(); earR.position.z = -0.1;
                g.add(bodyMesh, headMesh, earL, earR); g.position.y = 0.175;
            } else if (key === 'kamelya') { 
                const floorGeo = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.1, 6), new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6 }));
                const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.7, 6), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })); 
                roofMesh.position.y = 1.3;
                for(let i=0; i<4; i++) {
                    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2), new THREE.MeshStandardMaterial({ color: 0x78350f }));
                    const angle = (i * Math.PI) / 2; post.position.set(Math.cos(angle)*0.7, 0.6, Math.sin(angle)*0.7); g.add(post);
                }
                g.add(floorGeo, roofMesh);
            } else if (key === 'swing') { 
                const frameLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8), new THREE.MeshStandardMaterial({ color: 0x451a03 })); frameLeft.position.set(-0.7, 0.9, 0);
                const frameRight = frameLeft.clone(); frameRight.position.x = 0.7;
                const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5), new THREE.MeshStandardMaterial({ color: 0x451a03 })); topBar.rotation.z = Math.PI / 2; topBar.position.set(0, 1.8, 0);
                const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.25), new THREE.MeshStandardMaterial({ color: 0xb45309 })); seat.position.set(0, 0.4, 0);
                g.add(frameLeft, frameRight, topBar, seat);
            } else {
                g.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff, roughness: 0.4 }))); g.position.y = 0.25;
            }
            window.vSlots[key].add(g);
        }
    });
}

window.closeVillage = function() {
    if (window.activeVillageAnimation) cancelAnimationFrame(window.activeVillageAnimation);
    if (window.villageRenderer) {
        document.body.removeChild(window.villageRenderer.domElement);
        window.villageRenderer = null;
    }
};