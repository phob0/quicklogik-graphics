import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';

// Parametrii de Intrare (simulând datele din dashboard)
const PROPS_STATICE = {
    grosimeCadru: 0.08, // metri
    adancimeCadru: 0.06, // metri
    culoareCadru: 0x333333,
    culoareSticla: 0xADD8E6,
};

const Fereastra3D = ({ 
  profilLatime = 3.0, 
  profilInaltime = 2.0, 
  numarDiviziuni = 2,
  diviziuniCustom = {},
  deschideri = {},
  culoareExterior = '#333333', 
  culoareInterior = '#666666',
  latimeCadruSus = 0.05,
  latimeCadruJos = 0.05,
  latimeCadruStanga = 0.05,
  latimeCadruDreapta = 0.05,
  latimeCadruSeparatori = 0.05,
  latimeCadruExterior = 0.05,
  latimeCadruInterior = 0.03,
  zoomLevel = 3.0,
  rotationX = 0,
  rotationY = 0,
  onRotationChange = () => {}
}) => {
    const mountRef = useRef(null);

    // Funcție pentru a crea săgeți pentru deschideri
    const createArrowForOpening = useCallback((position, latimeGeam, inaltimeGeam, direction) => {
        const arrowSize = Math.min(latimeGeam, inaltimeGeam) * 0.2; // 20% din dimensiunea mai mică
        
        // Creează geometria pentru săgeată (cone pentru vârf + cylinder pentru tijă)
        const arrowHeadGeometry = new THREE.ConeGeometry(arrowSize / 4, arrowSize / 2, 8);
        const arrowShaftGeometry = new THREE.CylinderGeometry(arrowSize / 20, arrowSize / 20, arrowSize / 3, 8);
        
        // Material alb pentru săgeți (ca o bandă de scotch)
        const arrowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });
        
        // Creează grupul pentru săgeată
        const arrowGroup = new THREE.Group();
        
        // Vârful săgeții
        const arrowHead = new THREE.Mesh(arrowHeadGeometry, arrowMaterial);
        arrowHead.position.y = arrowSize / 6; // Poziționează vârful
        
        // Tija săgeții
        const arrowShaft = new THREE.Mesh(arrowShaftGeometry, arrowMaterial);
        arrowShaft.position.y = -arrowSize / 6; // Poziționează tija
        
        arrowGroup.add(arrowHead);
        arrowGroup.add(arrowShaft);
        
        // Poziționare și orientare în funcție de tipul deschiderii
        if (direction === 'rabatant') {
            // Săgeată pentru deschidere sus (rabatant) - săgeata în sus
            arrowGroup.position.copy(position);
            arrowGroup.position.y += inaltimeGeam / 3; // Sus pe geam
            // Nu rotim - săgeata rămâne în sus
        } else if (direction === 'stanga') {
            // Săgeată pentru deschidere laterală stânga - săgeata spre stânga
            arrowGroup.position.copy(position);
            arrowGroup.position.x -= latimeGeam / 3; // În partea stângă a geamului
            arrowGroup.rotation.z = Math.PI / 2; // Săgeata spre stânga
        } else if (direction === 'dreapta') {
            // Săgeată pentru deschidere laterală dreapta - săgeata spre dreapta
            arrowGroup.position.copy(position);
            arrowGroup.position.x += latimeGeam / 3; // În partea dreaptă a geamului
            arrowGroup.rotation.z = -Math.PI / 2; // Săgeata spre dreapta
        }
        
        return arrowGroup;
    }, []);

    // Cache pentru materiale - se recreează doar când culorile se schimbă
    const materials = useMemo(() => ({
        exterior: new THREE.MeshLambertMaterial({ color: culoareExterior }),
        interior: new THREE.MeshLambertMaterial({ color: culoareInterior }),
        glass: new THREE.MeshBasicMaterial({ 
            color: PROPS_STATICE.culoareSticla, 
            transparent: true, 
            opacity: 0.5
        })
    }), [culoareExterior, culoareInterior]);

    // Cache pentru dimensiuni - se recreează doar când se schimbă
    const dimensions = useMemo(() => {
        const aCadru = PROPS_STATICE.adancimeCadru;
        const exteriorThickness = aCadru * 0.7;
        const interiorThickness = latimeCadruInterior;
        
        // Verifică dacă avem dimensiuni custom sau folosește dimensiuni egale
        const hasCustomDimensions = Object.keys(diviziuniCustom).length > 0;
        let latimeGeam;
        
        if (hasCustomDimensions) {
            // Folosește dimensiunile custom
            latimeGeam = 1.0; // Valoare placeholder, se va înlocui în geometrii
        } else {
            // Folosește dimensiuni egale - calcul corect bazat pe zona disponibilă
            const zonaDisponibilaLatime = profilLatime - latimeCadruStanga - latimeCadruDreapta;
            const latimeSeparatori = latimeCadruSeparatori * (numarDiviziuni - 1); // separatori între geamuri
            const latimeGeamTotal = zonaDisponibilaLatime - latimeSeparatori;
            latimeGeam = latimeGeamTotal / numarDiviziuni;
        }
        
        return {
            aCadru,
            exteriorThickness,
            interiorThickness,
            latimeGeam,
            hasCustomDimensions
        };
    }, [profilLatime, numarDiviziuni, diviziuniCustom, latimeCadruStanga, latimeCadruDreapta, latimeCadruSeparatori, latimeCadruInterior]);

    // Cache pentru geometrii - se recreează doar când dimensiunile se schimbă
    const geometries = useMemo(() => {
        const { exteriorThickness, interiorThickness, latimeGeam } = dimensions;
        
        return {
            // Geamuri (doar pentru dimensiuni egale, pentru custom se creează dinamic)
            glass: new THREE.BoxGeometry(latimeGeam, profilInaltime - latimeCadruSus - latimeCadruJos, 0.01)
        };
    }, [profilLatime, profilInaltime, dimensions, latimeCadruSus, latimeCadruJos]);

    useEffect(() => {
        if (!mountRef.current) return;
        
        // Salvează referința pentru cleanup
        const mountElement = mountRef.current;

        // --- 1. SETAREA SCENEI ---
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ 
            antialias: false, // Disable antialiasing pentru performanță
            powerPreference: "high-performance"
        });
        
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        // Curățare renderer-ului vechi
        if (mountElement.firstChild) {
            mountElement.removeChild(mountElement.firstChild);
        }
        mountElement.appendChild(renderer.domElement);
        
        // --- 2. ILUMINAREA OPTIMIZATĂ ---
        // Doar lumină ambientală pentru performanță
        scene.add(new THREE.AmbientLight(0xffffff, 0.8)); // Intensitate redusă
        
        // O singură lumină direcțională pentru performanță
        const light = new THREE.DirectionalLight(0xffffff, 1.0);
        light.position.set(5, 5, 5);
        scene.add(light);
        
        // Setează o culoare de fundal mai deschisă scenei, pentru a nu fi negru complet
        scene.background = new THREE.Color(0xf0f0f0); // Fundal gri deschis
        
        // --- 3. GENERAREA PROFILULUI CU DIVIZIUNI ---
        
        // Folosește materialele și dimensiunile din cache
        const { gCadru, exteriorThickness, interiorThickness, latimeGeam } = dimensions;
        
        // Array pentru a stoca toate obiectele
        const allObjects = [];
        
        // Generează cadrul exterior al profilului cu lățimi specifice
        // Cadrul de sus
        const topFrameExterior = new THREE.BoxGeometry(profilLatime, latimeCadruSus, exteriorThickness);
        const topFrameExteriorMesh = new THREE.Mesh(topFrameExterior, materials.exterior);
        topFrameExteriorMesh.position.y = (profilInaltime / 2) - (latimeCadruSus / 2);
        topFrameExteriorMesh.position.z = exteriorThickness / 2;
        allObjects.push(topFrameExteriorMesh);
        
        // Cadrul de jos
        const bottomFrameExterior = new THREE.BoxGeometry(profilLatime, latimeCadruJos, exteriorThickness);
        const bottomFrameExteriorMesh = new THREE.Mesh(bottomFrameExterior, materials.exterior);
        bottomFrameExteriorMesh.position.y = -(profilInaltime / 2) + (latimeCadruJos / 2);
        bottomFrameExteriorMesh.position.z = exteriorThickness / 2;
        allObjects.push(bottomFrameExteriorMesh);
        
        // Cadrul de stânga
        const leftFrameExterior = new THREE.BoxGeometry(latimeCadruStanga, profilInaltime - latimeCadruSus - latimeCadruJos, exteriorThickness);
        const leftFrameExteriorMesh = new THREE.Mesh(leftFrameExterior, materials.exterior);
        leftFrameExteriorMesh.position.x = -(profilLatime / 2) + (latimeCadruStanga / 2);
        leftFrameExteriorMesh.position.z = exteriorThickness / 2;
        allObjects.push(leftFrameExteriorMesh);
        
        // Cadrul de dreapta
        const rightFrameExterior = new THREE.BoxGeometry(latimeCadruDreapta, profilInaltime - latimeCadruSus - latimeCadruJos, exteriorThickness);
        const rightFrameExteriorMesh = new THREE.Mesh(rightFrameExterior, materials.exterior);
        rightFrameExteriorMesh.position.x = (profilLatime / 2) - (latimeCadruDreapta / 2);
        rightFrameExteriorMesh.position.z = exteriorThickness / 2;
        allObjects.push(rightFrameExteriorMesh);
        
        // Generează cadrul interior al profilului cu lățimi specifice
        // Cadrul de sus interior
        const topFrameInterior = new THREE.BoxGeometry(profilLatime, latimeCadruSus, interiorThickness);
        const topFrameInteriorMesh = new THREE.Mesh(topFrameInterior, materials.interior);
        topFrameInteriorMesh.position.y = (profilInaltime / 2) - (latimeCadruSus / 2);
        topFrameInteriorMesh.position.z = -interiorThickness / 2;
        allObjects.push(topFrameInteriorMesh);
        
        // Cadrul de jos interior
        const bottomFrameInterior = new THREE.BoxGeometry(profilLatime, latimeCadruJos, interiorThickness);
        const bottomFrameInteriorMesh = new THREE.Mesh(bottomFrameInterior, materials.interior);
        bottomFrameInteriorMesh.position.y = -(profilInaltime / 2) + (latimeCadruJos / 2);
        bottomFrameInteriorMesh.position.z = -interiorThickness / 2;
        allObjects.push(bottomFrameInteriorMesh);
        
        // Cadrul de stânga interior
        const leftFrameInterior = new THREE.BoxGeometry(latimeCadruStanga, profilInaltime - latimeCadruSus - latimeCadruJos, interiorThickness);
        const leftFrameInteriorMesh = new THREE.Mesh(leftFrameInterior, materials.interior);
        leftFrameInteriorMesh.position.x = -(profilLatime / 2) + (latimeCadruStanga / 2);
        leftFrameInteriorMesh.position.z = -interiorThickness / 2;
        allObjects.push(leftFrameInteriorMesh);
        
        // Cadrul de dreapta interior
        const rightFrameInterior = new THREE.BoxGeometry(latimeCadruDreapta, profilInaltime - latimeCadruSus - latimeCadruJos, interiorThickness);
        const rightFrameInteriorMesh = new THREE.Mesh(rightFrameInterior, materials.interior);
        rightFrameInteriorMesh.position.x = (profilLatime / 2) - (latimeCadruDreapta / 2);
        rightFrameInteriorMesh.position.z = -interiorThickness / 2;
        allObjects.push(rightFrameInteriorMesh);
        
        // Generează diviziunile verticale (separatorii) în funcție de dimensiunile custom
        if (numarDiviziuni > 1) {
            const zonaDisponibilaInaltime = profilInaltime - latimeCadruSus - latimeCadruJos;
            let currentX = -(profilLatime / 2) + latimeCadruStanga;
            
            for (let i = 0; i < numarDiviziuni - 1; i++) {
                // Determină lățimea geamului curent
                const latimeGeamActuala = dimensions.hasCustomDimensions && diviziuniCustom[i] 
                    ? diviziuniCustom[i] 
                    : dimensions.latimeGeam;
                
                // Calculează poziția separatorului (după geamul curent)
                currentX += latimeGeamActuala;
                
                // Creează geometriile pentru separator
                const separatorExteriorGeo = new THREE.BoxGeometry(latimeCadruSeparatori, zonaDisponibilaInaltime, exteriorThickness);
                const separatorInteriorGeo = new THREE.BoxGeometry(latimeCadruSeparatori, zonaDisponibilaInaltime, interiorThickness);
                
                // Separator exterior
                const separatorExterior = new THREE.Mesh(separatorExteriorGeo, materials.exterior);
                separatorExterior.position.x = currentX;
                separatorExterior.position.z = exteriorThickness / 2;
                allObjects.push(separatorExterior);
                
                // Separator interior
                const separatorInterior = new THREE.Mesh(separatorInteriorGeo, materials.interior);
                separatorInterior.position.x = currentX;
                separatorInterior.position.z = -interiorThickness / 2;
                allObjects.push(separatorInterior);
                
                // Actualizează poziția pentru următorul separator (trece peste separatorul curent)
                currentX += latimeCadruSeparatori;
            }
        }
        
        // Generează geamurile folosind dimensiunile custom sau egale
        // Calculează zona disponibilă pentru geamuri (fără cadrele exterioare)
        const zonaDisponibilaLatime = profilLatime - latimeCadruStanga - latimeCadruDreapta;
        const zonaDisponibilaInaltime = profilInaltime - latimeCadruSus - latimeCadruJos;
        
        let currentX = -(profilLatime / 2) + latimeCadruStanga;
        
        for (let i = 0; i < numarDiviziuni; i++) {
            // Determină lățimea geamului
            const latimeGeamActuala = dimensions.hasCustomDimensions && diviziuniCustom[i] 
                ? diviziuniCustom[i] 
                : dimensions.latimeGeam;
            
            let glassMesh;
            
            if (dimensions.hasCustomDimensions) {
                // Creează geometria pentru acest geam specific
                const glassGeo = new THREE.BoxGeometry(
                    latimeGeamActuala,
                    zonaDisponibilaInaltime,
                    0.01
                );
                glassMesh = new THREE.Mesh(glassGeo, materials.glass);
            } else {
                // Folosește cache-ul pentru dimensiuni egale
                glassMesh = new THREE.Mesh(geometries.glass, materials.glass);
            }
            
            // Poziționează geamul la centrul zonei sale
            glassMesh.position.x = currentX + (latimeGeamActuala / 2);
            allObjects.push(glassMesh);
            
            // Adaugă săgeți pentru deschideri pe acest geam
            const glassPosition = new THREE.Vector3(
                currentX + (latimeGeamActuala / 2),
                0,
                0
            );
            
            // Verifică dacă această diviziune are deschideri configurate
            if (deschideri[i]) {
                // Săgeată pentru deschidere rabatant (sus)
                if (deschideri[i].rabatant) {
                    const arrowRabatant = createArrowForOpening(
                        glassPosition, 
                        latimeGeamActuala, 
                        zonaDisponibilaInaltime, 
                        'rabatant'
                    );
                    allObjects.push(arrowRabatant);
                }
                
                // Săgeată pentru deschidere laterală
                if (deschideri[i].laterala && deschideri[i].laterala !== 'none') {
                    const arrowLaterala = createArrowForOpening(
                        glassPosition, 
                        latimeGeamActuala, 
                        zonaDisponibilaInaltime, 
                        deschideri[i].laterala
                    );
                    allObjects.push(arrowLaterala);
                }
            }
            
            // Actualizează poziția pentru următorul geam (inclusiv separatorul)
            currentX += latimeGeamActuala + latimeCadruSeparatori;
        }
        
        // Adaugă toate obiectele în scenă
        scene.add(...allObjects);
        
        // --- 4. POZIȚIA CAMEREI ȘI RANDARE ---
        camera.position.z = zoomLevel;
        camera.position.y = 0; // Pozitie frontală perfectă
        
        // --- 5. CONTROLUL PRIN BUTOANE (NU MAI FOLOSIM MOUSE) ---
        // Cursor normal pentru canvas
        renderer.domElement.style.cursor = 'default';
        
        // Aplică rotirea inițială din state
        scene.rotation.x = rotationX;
        scene.rotation.y = rotationY;
        
        // Limitează FPS la 30fps pentru performanță
        let lastTime = 0;
        const targetFPS = 30;
        const frameInterval = 1000 / targetFPS;
        
        const animate = (currentTime) => {
            if (currentTime - lastTime >= frameInterval) {
                renderer.render(scene, camera);
                lastTime = currentTime;
            }
            requestAnimationFrame(animate);
        };
        
        animate(0);

        // Curățare îmbunătățită la de-montare componentă
        return () => {
            // Nu mai avem event listeners pentru mouse
            
            // Curăță scene-ul
            scene.clear();
            
            // Eliberează geometriile
            scene.traverse((child) => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            
            // Elimină canvas-ul
            if (mountElement && renderer.domElement.parentNode) {
                mountElement.removeChild(renderer.domElement);
            }
            
            // Eliberează renderer-ul
            renderer.dispose();
        };
    }, [materials, dimensions, geometries, zoomLevel, rotationX, rotationY, numarDiviziuni, onRotationChange, profilInaltime, profilLatime, diviziuniCustom, deschideri, createArrowForOpening, latimeCadruSus, latimeCadruJos, latimeCadruStanga, latimeCadruDreapta, latimeCadruSeparatori, latimeCadruInterior]); // Se re-randează doar când cache-ul se invalidează sau controalele de vizualizare se schimbă

    return (
        <div 
            ref={mountRef} 
            style={{ width: '100%', height: '100%', minHeight: 600 }}
        />
    );
};

export default Fereastra3D;