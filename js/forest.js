window.forestScene = null;
window.forestCamera = null;
window.forestRenderer = null;
window.activeForestAnimation = null;

window.initForest = function() {
    window.closeForest(); 

    // --- 1. FERAH VE TEMİZ ORMAN SAHNESİ (SİS TEMİZLENDİ) ---
    window.forestScene = new THREE.Scene();
    window.forestScene.background = new THREE.Color(0xa5f3fc); // Pırıl pırıl açık pastel gökyüzü mavisi
    
    // Yoğun yeşil sis yerine, sadece çok uzaktaki nesneleri yumuşatan hafif beyaz bir sis ekledik
    window.forestScene.fog = new THREE.FogExp2(0xa5f3fc, 0.015); 

    window.forestCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    window.forestCamera.position.set(0, 4.0, 4.5); // Kamerayı biraz daha yukarı kaldırıp görüşü rahatlattık
    window.forestCamera.lookAt(0, 1, -2);

    window.forestRenderer = new THREE.WebGLRenderer({ antialias: true });
    window.forestRenderer.setSize(window.innerWidth, window.innerHeight);
    window.forestRenderer.domElement.style.position = "absolute";
    window.forestRenderer.domElement.style.top = "0";
    window.forestRenderer.domElement.style.left = "0";
    window.forestRenderer.domElement.style.zIndex = "1";
    document.body.appendChild(window.forestRenderer.domElement);

    // Güçlü ve Canlı Işıklandırma (Etraf pırıl pırıl parlasın diye)
    const ambient = new THREE.AmbientLight(0xffffff, 1.0); window.forestScene.add(ambient);
    const dir = new THREE.DirectionalLight(0xfffbeb, 0.7); dir.position.set(5, 20, 5); window.forestScene.add(dir);

    // --- 2. DÜZENLI TOPRAK YOL VE CANLI YEŞİL ÇİMENLİKLER ---
    const roadGeo = new THREE.PlaneGeometry(8, 1000);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.8 }); // Sıcak kızıl-kahve toprak orman yolu
    const forestRoad = new THREE.Mesh(roadGeo, roadMat);
    forestRoad.rotation.x = -Math.PI / 2;
    forestRoad.position.set(0, 0, -450);
    window.forestScene.add(forestRoad);

    const leftGrass = new THREE.Mesh(new THREE.PlaneGeometry(40, 1000), new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 })); // Canlı çimen yeşili
    leftGrass.rotation.x = -Math.PI / 2; leftGrass.position.set(-24, -0.01, -450); window.forestScene.add(leftGrass);
    const rightGrass = leftGrass.clone(); rightGrass.position.x = 24; window.forestScene.add(rightGrass);

    // --- 3. SEPETLİ KOŞUCU MODELİ ---
    window.runnerPlayer = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1, 16), new THREE.MeshStandardMaterial({ color: 0x0284c7 })); pBody.position.y = 0.8;
    const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffdbac })); pHead.position.y = 1.45;
    const pBasket = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.4), new THREE.MeshStandardMaterial({ color: 0x7c2d12 })); pBasket.position.set(0, 0.7, -0.4);
    window.runnerPlayer.add(pBody, pHead, pBasket);
    window.forestScene.add(window.runnerPlayer);

    window.forestLanes = [-2.5, 0, 2.5];
    window.currentForestLane = 1;
    
    // ZORLUK ARTIRILDI: Başlangıç hızı yükseltildi!
    window.forestSpeed = 0.28; 
    window.isJumping = false;
    window.jumpVelocity = 0;
    window.gravity = -0.015; // Yerçekimi fiziği bir tık daha sertleştirildi

    // --- 4. DÜZENLİ SIRALANMIŞ YOL KENARI AĞAÇLARI ---
    window.environmentTrees = [];
    for (let i = 0; i < 30; i++) {
        const tree = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 2.5, 8), new THREE.MeshStandardMaterial({ color: 0x451a03 })); trunk.position.y = 1.25; tree.add(trunk);
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.5, 8), new THREE.MeshStandardMaterial({ color: 0x15803d })); leaves.position.y = 3.2; tree.add(leaves);
        
        // Ağaçların konumu yoldan biraz daha dışarıda tutularak görüş alanı temizlendi
        const side = i % 2 === 0 ? 6.5 : -6.5;
        tree.position.set(side, 0, -i * 14);
        window.forestScene.add(tree); window.environmentTrees.push(tree);
    }

    // --- 5. NET VE BELİRGİN MEYVELER & ENGELLER ---
    window.forestItems = [];
    const poolSize = 6; // Tempoyu artırmak için ekrandaki nesne sayısı 6'ya çıkarıldı

    window.itemBlueprints = [
        { name: "cilek", score: 5, color: 0xef4444, size: 0.26, isObstacle: false, shape: "cone", canJumpOver: true },
        { name: "bogurtlen", score: 10, color: 0x581c87, size: 0.25, isObstacle: false, shape: "sphere", canJumpOver: true },
        { name: "ahududu", score: 15, color: 0xdb2777, size: 0.24, isObstacle: false, shape: "sphere", canJumpOver: true },
        { name: "yabanmersini", score: 20, color: 0x1e3a8a, size: 0.20, isObstacle: false, shape: "sphere", canJumpOver: true },
        { name: "kutuk", score: 0, color: 0x7c2d12, size: 0.5, isObstacle: true, shape: "cylinder", canJumpOver: true }, 
        { name: "cali", score: 0, color: 0x166534, size: 1.1, isObstacle: true, shape: "box", canJumpOver: false } 
    ];

    window.buildItemMesh = function() {
        const group = new THREE.Group();
        const type = window.itemBlueprints[Math.floor(Math.random() * window.itemBlueprints.length)];
        let geo, mat;

        if (type.shape === "cone") { // Belirgin Koni Çilek
            geo = new THREE.ConeGeometry(type.size, type.size * 1.6, 16);
            mat = new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.2, metalness: 0.1 });
            const mesh = new THREE.Mesh(geo, mat); mesh.rotation.x = Math.PI; mesh.position.y = 0.4; group.add(mesh);
        } else if (type.shape === "cylinder") { // Net Kahverengi Odun Kütük
            geo = new THREE.CylinderGeometry(0.25, 0.25, 1.7, 12);
            mat = new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.7 });
            const mesh = new THREE.Mesh(geo, mat); mesh.rotation.z = Math.PI / 2; mesh.position.y = 0.25; group.add(mesh);
        } else if (type.shape === "box") { // Net Büyük Koyu Yeşil Çalı
            geo = new THREE.BoxGeometry(1.8, 1.4, 0.5);
            mat = new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.9 });
            const mesh = new THREE.Mesh(geo, mat); mesh.position.y = 0.7; group.add(mesh);
        } else { // Parlak Belirgin Meyve Küreleri
            geo = new THREE.SphereGeometry(type.size, 16, 16);
            mat = new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.3 });
            const mesh = new THREE.Mesh(geo, mat); mesh.position.y = 0.4; group.add(mesh);
        }

        group.userData = type;
        return group;
    };

    // SAFE SPAWN ZONE: İlk doğuşta asla kütüğe takılmaman için nesneleri en az 55 birim uzağa yerleştiriyoruz!
    for (let i = 0; i < poolSize; i++) {
        const item = window.buildItemMesh();
        resetForestItem(item, -55 - (i * 15)); 
        window.forestScene.add(item); window.forestItems.push(item);
    }

    // Klavye Kontrolleri
    document.onkeydown = function(e) {
        if (!window.isPlaying || window.isGameOver) return; 
        if (e.key === 'ArrowLeft' && window.currentForestLane > 0) window.currentForestLane--;
        if (e.key === 'ArrowRight' && window.currentForestLane < 2) window.currentForestLane++;
        if (e.key === ' ' && !window.isJumping) {
            window.isJumping = true;
            window.jumpVelocity = 0.25; 
        }
    };

    loopForest();
};

function resetForestItem(obj, startZ = -75) {
    window.forestScene.remove(obj); 
    const newItem = window.buildItemMesh();
    const randomLane = window.forestLanes[Math.floor(Math.random() * 3)];
    newItem.position.set(randomLane, 0, startZ);
    
    const idx = window.forestItems.indexOf(obj);
    if (idx !== -1) window.forestItems[idx] = newItem;
    window.forestScene.add(newItem);
}

function loopForest() {
    function loop() {
        if (!window.isPlaying || window.isGameOver) {
            cancelAnimationFrame(window.activeForestAnimation);
            return;
        }
        window.activeForestAnimation = requestAnimationFrame(loop);

        // Şerit Geçiş Yumuşatma
        window.runnerPlayer.position.x += (window.forestLanes[window.currentForestLane] - window.runnerPlayer.position.x) * 0.22;

        // Zıplama Fizik Motoru
        if (window.isJumping) {
            window.runnerPlayer.position.y += window.jumpVelocity;
            window.jumpVelocity += window.gravity;

            if (window.runnerPlayer.position.y <= 0) {
                window.runnerPlayer.position.y = 0;
                window.isJumping = false;
                window.jumpVelocity = 0;
            }
        }

        // ZORLUK ARTIŞI: Oyun her an çaktırmadan hızlanmaya devam eder (Simulation Logic)
        window.forestSpeed += 0.00004;

        // Yol kenarı ağaç akışı
        window.environmentTrees.forEach(tree => {
            tree.position.z += window.forestSpeed;
            if (tree.position.z > 10) tree.position.z = -240;
        });

        // Nesne Havuz Akışı ve Çarpışma Testleri
        window.forestItems.forEach(item => {
            item.position.z += window.forestSpeed;

            if (item.position.z > 5) { 
                let furthestZ = -50;
                window.forestItems.forEach(i => { if(i.position.z < furthestZ) furthestZ = i.position.z; });
                resetForestItem(item, furthestZ - 15); 
            }
            
            // Çarpışma Testi
            if (Math.abs(item.position.x - window.runnerPlayer.position.x) < 0.9 && Math.abs(item.position.z - window.runnerPlayer.position.z) < 1.1) {
                if (item.userData.isObstacle) {
                    if (item.userData.canJumpOver && window.runnerPlayer.position.y > 0.65) {
                        // Kütüğün üstünden atladın!
                    } else {
                        window.triggerGameOver(); 
                    }
                } else {
                    if (window.runnerPlayer.position.y < 0.7) {
                        window.runMeyveCount += item.userData.score;
                        document.getElementById('scoreVal').innerText = window.runMeyveCount;
                        
                        let furthestZ = -50;
                        window.forestItems.forEach(i => { if(i.position.z < furthestZ) furthestZ = i.position.z; });
                        resetForestItem(item, furthestZ - 15);
                    }
                }
            }
        });

        window.forestRenderer.render(window.forestScene, window.forestCamera);
    }
    loop();
}

window.closeForest = function() {
    if (window.activeForestAnimation) cancelAnimationFrame(window.activeForestAnimation);
    if (window.forestRenderer) {
        document.body.removeChild(window.forestRenderer.domElement);
        window.forestRenderer = null;
    }
};