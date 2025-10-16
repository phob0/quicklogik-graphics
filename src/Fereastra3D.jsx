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
        const gCadru = PROPS_STATICE.grosimeCadru;
        const aCadru = PROPS_STATICE.adancimeCadru;
        const exteriorThickness = aCadru * 0.7;
        const interiorThickness = aCadru * 0.3;
        
        // Verifică dacă avem dimensiuni custom sau folosește dimensiuni egale
        const hasCustomDimensions = Object.keys(diviziuniCustom).length > 0;
        let latimeGeam;
        
        if (hasCustomDimensions) {
            // Folosește dimensiunile custom
            latimeGeam = 1.0; // Valoare placeholder, se va înlocui în geometrii
        } else {
            // Folosește dimensiuni egale
            latimeGeam = (profilLatime - gCadru * (numarDiviziuni + 1)) / numarDiviziuni;
        }
        
        return {
            gCadru,
            aCadru,
            exteriorThickness,
            interiorThickness,
            latimeGeam,
            hasCustomDimensions
        };
    }, [profilLatime, numarDiviziuni, diviziuniCustom]);

    // Cache pentru geometrii - se recreează doar când dimensiunile se schimbă
    const geometries = useMemo(() => {
        const { gCadru, exteriorThickness, interiorThickness, latimeGeam } = dimensions;
        
        return {
            // Cadrul principal
            topFrameExterior: new THREE.BoxGeometry(profilLatime, gCadru, exteriorThickness),
            bottomFrameExterior: new THREE.BoxGeometry(profilLatime, gCadru, exteriorThickness),
            leftFrameExterior: new THREE.BoxGeometry(gCadru, profilInaltime - (gCadru * 2), exteriorThickness),
            rightFrameExterior: new THREE.BoxGeometry(gCadru, profilInaltime - (gCadru * 2), exteriorThickness),
            
            topFrameInterior: new THREE.BoxGeometry(profilLatime, gCadru, interiorThickness),
            bottomFrameInterior: new THREE.BoxGeometry(profilLatime, gCadru, interiorThickness),
            leftFrameInterior: new THREE.BoxGeometry(gCadru, profilInaltime - (gCadru * 2), interiorThickness),
            rightFrameInterior: new THREE.BoxGeometry(gCadru, profilInaltime - (gCadru * 2), interiorThickness),
            
            // Geamuri (doar pentru dimensiuni egale, pentru custom se creează dinamic)
            glass: new THREE.BoxGeometry(latimeGeam, profilInaltime - (gCadru * 2), 0.01)
        };
    }, [profilLatime, profilInaltime, dimensions]);

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
        
        // Generează cadrul exterior al profilului folosind cache-ul
        const topFrameExterior = new THREE.Mesh(geometries.topFrameExterior, materials.exterior);
        topFrameExterior.position.y = (profilInaltime / 2) - (gCadru / 2);
        topFrameExterior.position.z = exteriorThickness / 2;
        allObjects.push(topFrameExterior);
        
        const bottomFrameExterior = new THREE.Mesh(geometries.bottomFrameExterior, materials.exterior);
        bottomFrameExterior.position.y = -(profilInaltime / 2) + (gCadru / 2);
        bottomFrameExterior.position.z = exteriorThickness / 2;
        allObjects.push(bottomFrameExterior);
        
        const leftFrameExterior = new THREE.Mesh(geometries.leftFrameExterior, materials.exterior);
        leftFrameExterior.position.x = -(profilLatime / 2) + (gCadru / 2);
        leftFrameExterior.position.z = exteriorThickness / 2;
        allObjects.push(leftFrameExterior);
        
        const rightFrameExterior = new THREE.Mesh(geometries.rightFrameExterior, materials.exterior);
        rightFrameExterior.position.x = (profilLatime / 2) - (gCadru / 2);
        rightFrameExterior.position.z = exteriorThickness / 2;
        allObjects.push(rightFrameExterior);
        
        // Generează cadrul interior al profilului folosind cache-ul
        const topFrameInterior = new THREE.Mesh(geometries.topFrameInterior, materials.interior);
        topFrameInterior.position.y = (profilInaltime / 2) - (gCadru / 2);
        topFrameInterior.position.z = -interiorThickness / 2;
        allObjects.push(topFrameInterior);
        
        const bottomFrameInterior = new THREE.Mesh(geometries.bottomFrameInterior, materials.interior);
        bottomFrameInterior.position.y = -(profilInaltime / 2) + (gCadru / 2);
        bottomFrameInterior.position.z = -interiorThickness / 2;
        allObjects.push(bottomFrameInterior);
        
        const leftFrameInterior = new THREE.Mesh(geometries.leftFrameInterior, materials.interior);
        leftFrameInterior.position.x = -(profilLatime / 2) + (gCadru / 2);
        leftFrameInterior.position.z = -interiorThickness / 2;
        allObjects.push(leftFrameInterior);
        
        const rightFrameInterior = new THREE.Mesh(geometries.rightFrameInterior, materials.interior);
        rightFrameInterior.position.x = (profilLatime / 2) - (gCadru / 2);
        rightFrameInterior.position.z = -interiorThickness / 2;
        allObjects.push(rightFrameInterior);
        
        // Generează diviziunile verticale (separatorii) în funcție de dimensiunile custom
        if (numarDiviziuni > 1) {
            let currentX = -(profilLatime / 2) + (gCadru / 2);
            
            for (let i = 0; i < numarDiviziuni - 1; i++) {
                // Determină lățimea geamului curent
                const latimeGeamActuala = dimensions.hasCustomDimensions && diviziuniCustom[i] 
                    ? diviziuniCustom[i] 
                    : dimensions.latimeGeam;
                
                // Calculează poziția separatorului
                currentX += latimeGeamActuala + (gCadru / 2);
                
                // Creează geometriile pentru separator
                const separatorExteriorGeo = new THREE.BoxGeometry(gCadru, profilInaltime - (gCadru * 2), exteriorThickness);
                const separatorInteriorGeo = new THREE.BoxGeometry(gCadru, profilInaltime - (gCadru * 2), interiorThickness);
                
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
                
                // Actualizează poziția pentru următorul separator
                currentX += gCadru / 2;
            }
        }
        
        // Generează geamurile folosind dimensiunile custom sau egale
        let currentX = -(profilLatime / 2) + (gCadru / 2);
        
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
                    profilInaltime - (gCadru * 2),
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
            
            // Adaugă triunghiuri pentru deschideri pe acest geam
            const inaltimeGeam = profilInaltime - (gCadru * 2);
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
                        inaltimeGeam, 
                        'rabatant'
                    );
                    allObjects.push(arrowRabatant);
                }
                
                // Săgeată pentru deschidere laterală
                if (deschideri[i].laterala && deschideri[i].laterala !== 'none') {
                    const arrowLaterala = createArrowForOpening(
                        glassPosition, 
                        latimeGeamActuala, 
                        inaltimeGeam, 
                        deschideri[i].laterala
                    );
                    allObjects.push(arrowLaterala);
                }
            }
            
            // Actualizează poziția pentru următorul geam (inclusiv separatorul)
            currentX += latimeGeamActuala + gCadru;
        }
        
        // Adaugă toate obiectele în scenă
        scene.add(...allObjects);
        
        // --- 4. POZIȚIA CAMEREI ȘI RANDARE ---
        camera.position.z = zoomLevel;
        camera.position.y = 0.5;
        
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
    }, [materials, dimensions, geometries, zoomLevel, rotationX, rotationY, numarDiviziuni, onRotationChange, profilInaltime, profilLatime, diviziuniCustom, deschideri, createArrowForOpening]); // Se re-randează doar când cache-ul se invalidează sau controalele de vizualizare se schimbă

    return (
        <div 
            ref={mountRef} 
            style={{ width: '100%', height: '100%', minHeight: 600 }}
        />
    );
};

export default Fereastra3D;