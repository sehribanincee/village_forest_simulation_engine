window.totalMeyveKasa = 0;
window.runMeyveCount = 0;
window.isPlaying = false;
window.isGameOver = false;

window.onload = function() {
    createLobiCanvas();

    // Evime/Köyüme Git Tetikleyicisi
    const btnVillage = document.getElementById("btnGoToVillage");
    if (btnVillage) {
        btnVillage.onclick = function() {
            removeLobiCanvas(); // LACİVERT PERDEYİ UÇURUR!
            window.closeForest(); 
            
            document.getElementById("mainMenuScreen").style.display = "none";
            document.getElementById("villageScreen").style.display = "flex";
            document.getElementById("villageMeyveCount").innerText = "Meyve Bütçen: " + window.totalMeyveKasa + " 🧺";
            
            window.initVillage(); // Cam gibi berrak köyü yükler
            window.updateTradeButtons();
        };
    }

    // Pazar Pop-up Açma
    const btnOpenMarket = document.getElementById("btnOpenMarket");
    if (btnOpenMarket) {
        btnOpenMarket.onclick = function() {
            document.getElementById("myMarketPopup").style.display = "block";
            window.updateTradeButtons();
        };
    }

    // Pazar Pop-up Kapatma
    const btnCloseMarket = document.getElementById("btnCloseMarket");
    if (btnCloseMarket) {
        btnCloseMarket.onclick = function() {
            document.getElementById("myMarketPopup").style.display = "none";
        };
    }

    // Ormana Git Tetikleyicisi
    const btnGoToForest = document.getElementById("btnGoToForest");
    if (btnGoToForest) {
        btnGoToForest.onclick = function() {
            removeLobiCanvas();
            window.closeVillage(); 
            document.getElementById("mainMenuScreen").style.display = "none";
            document.getElementById("forestRulesScreen").style.display = "flex"; 
        };
    }

    // Yarışı Başlatma
    const btnStartRun = document.getElementById("btnStartActualRun");
    if (btnStartRun) {
        btnStartRun.onclick = function() {
            document.getElementById("forestRulesScreen").style.display = "none";
            document.getElementById("uiScore").style.display = "block";
            
            window.runMeyveCount = 0;
            document.getElementById("scoreVal").innerText = window.runMeyveCount;
            window.isPlaying = true;
            window.isGameOver = false;
            
            window.initForest(); 
        };
    }

    // Köyden Geri Dönüş
    const btnBack = document.getElementById("btnVillageBack");
    if (btnBack) {
        btnBack.onclick = function() {
            document.getElementById("myMarketPopup").style.display = "none";
            window.closeVillage();
            returnToLobiState();
        };
    }

    const btnClosePopup = document.getElementById("btnPopupClose");
    if (btnClosePopup) {
        btnClosePopup.onclick = function() {
            document.getElementById("gameOverPopup").style.display = "none";
            returnToLobiState();
        };
    }
};

function createLobiCanvas() {
    if(!document.getElementById("lobiCanvas")) {
        const lobiRenderer = new THREE.WebGLRenderer({ antialias: true });
        lobiRenderer.setSize(window.innerWidth, window.innerHeight);
        lobiRenderer.domElement.setAttribute("id", "lobiCanvas");
        lobiRenderer.domElement.style.position = "absolute";
        lobiRenderer.domElement.style.top = "0";
        lobiRenderer.domElement.style.left = "0";
        lobiRenderer.domElement.style.zIndex = "1";
        document.body.appendChild(lobiRenderer.domElement);
        
        const lobiScene = new THREE.Scene();
        lobiScene.background = new THREE.Color(0x0f172a); 
        const lobiCam = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 10);
        lobiRenderer.render(lobiScene, lobiCam);
    }
}

function removeLobiCanvas() {
    const lobi = document.getElementById("lobiCanvas");
    if(lobi) document.body.removeChild(lobi);
}

function returnToLobiState() {
    window.closeVillage();
    window.closeForest();
    window.isPlaying = false;
    window.isGameOver = false;
    createLobiCanvas();

    document.getElementById("mainMenuScreen").style.display = "flex";
    document.getElementById("mainMenuMeyveCount").innerText = "Toplam Birikmiş Meyve: " + window.totalMeyveKasa + " 🧺";
}

window.triggerGameOver = function() {
    window.isGameOver = true;
    window.isPlaying = false;
    window.totalMeyveKasa += window.runMeyveCount; 
    
    document.getElementById("uiScore").style.display = "none";
    document.getElementById("finalScoreMsg").innerText = "Bu koşuda sepetinde tam " + window.runMeyveCount + " meyve biriktirdin!";
    document.getElementById("gameOverPopup").style.display = "block";
};