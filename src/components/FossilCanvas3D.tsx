import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, ZoomIn, ZoomOut, Sun, Lightbulb, Eye, Compass, Activity } from 'lucide-react';

interface FossilCanvas3DProps {
  fossilType: string;
  color: string;
  wearFactor: number;
  size: number;
  ridges: number;
  fossilName: string;
}

export type LightMode = 'museum' | 'studio' | 'field';
export type RenderStyle = 'realistic' | 'xray' | 'wireframe';

export default function FossilCanvas3D({
  fossilType,
  color,
  wearFactor,
  size,
  ridges,
  fossilName,
}: FossilCanvas3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Interactive UI State
  const [lightMode, setLightMode] = useState<LightMode>('museum');
  const [renderStyle, setRenderStyle] = useState<RenderStyle>('realistic');
  const [showRuler, setShowRuler] = useState<boolean>(false);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [fissuresActive, setFissuresActive] = useState<boolean>(false);

  // References for live update inside Three.js loop
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const rotationActiveRef = useRef<boolean>(isRotating);
  const zoomFactorRef = useRef<number>(1);

  // Sync isRotating state with reference
  useEffect(() => {
    rotationActiveRef.current = isRotating;
  }, [isRotating]);

  useEffect(() => {
    if (!mountRef.current || !canvasRef.current) return;

    const container = mountRef.current;
    const canvas = canvasRef.current;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1110); // Seamless Artistic Flair background

    // Initial size of container
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Light Setup
    const lightGroup = new THREE.Group();
    scene.add(lightGroup);

    const updateLights = () => {
      // Clear existing lights
      while (lightGroup.children.length > 0) {
        lightGroup.remove(lightGroup.children[0]);
      }

      if (lightMode === 'museum') {
        // Dramatic museum spotlight
        const ambient = new THREE.AmbientLight(0x0b132b, 1.2);
        lightGroup.add(ambient);

        const spotLight = new THREE.SpotLight(0xfff3e0, 15);
        spotLight.position.set(3, 5, 4);
        spotLight.angle = Math.PI / 6;
        spotLight.penumbra = 0.8;
        spotLight.castShadow = true;
        spotLight.shadow.bias = -0.001;
        lightGroup.add(spotLight);

        // Cold fill light from background
        const dirLight = new THREE.DirectionalLight(0x4a90e2, 2.5);
        dirLight.position.set(-4, -2, -2);
        lightGroup.add(dirLight);
      } else if (lightMode === 'studio') {
        // Studio lights for clarity
        const ambient = new THREE.AmbientLight(0xffffff, 1.5);
        lightGroup.add(ambient);

        const keyLight = new THREE.DirectionalLight(0xffffff, 4.0);
        keyLight.position.set(5, 5, 5);
        lightGroup.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xddf0ff, 2.5);
        fillLight.position.set(-5, 2, 2);
        lightGroup.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xffffff, 2.0);
        rimLight.position.set(0, -5, -5);
        lightGroup.add(rimLight);
      } else {
        // Field/natural excavation light
        const ambient = new THREE.AmbientLight(0xdff0ff, 1.0); // sky light
        lightGroup.add(ambient);

        const sunLight = new THREE.DirectionalLight(0xfffaed, 5.0); // golden sun
        sunLight.position.set(6, 8, 3);
        sunLight.castShadow = true;
        lightGroup.add(sunLight);

        const groundLight = new THREE.DirectionalLight(0x8b5a2b, 1.5); // bounce from soil
        groundLight.position.set(-2, -6, -2);
        lightGroup.add(groundLight);
      }
    };

    updateLights();

    // 3. Procedural Fossil Geometries Generator
    const fossilGroup = new THREE.Group();
    scene.add(fossilGroup);
    modelGroupRef.current = fossilGroup;

    // Setup materials based on styles
    const baseColor = new THREE.Color(color);
    let fossilMaterial: THREE.Material;

    if (renderStyle === 'wireframe') {
      fossilMaterial = new THREE.MeshBasicMaterial({
        color: baseColor,
        wireframe: true,
      });
    } else if (renderStyle === 'xray') {
      fossilMaterial = new THREE.MeshStandardMaterial({
        color: 0x00f3ff,
        emissive: 0x00a8cc,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.45,
        wireframe: true,
        side: THREE.DoubleSide,
      });
    } else {
      // Realistic stone/amber materials
      if (fossilType === 'AMBER_INSECT') {
        // Transparent golden-orange material
        fossilMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xffaa00,
          roughness: 0.15,
          metalness: 0.05,
          transmission: 0.85, // semi-translucent glass/amber
          thickness: 2.0,
          ior: 1.55,
          specularIntensity: 1.0,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
          side: THREE.DoubleSide,
        });
      } else {
        // Textured ancient fossil stone
        fossilMaterial = new THREE.MeshStandardMaterial({
          color: baseColor,
          roughness: 0.8 - wearFactor * 0.4,
          metalness: 0.1,
          bumpScale: 0.1 + wearFactor * 0.15,
          flatShading: true, // gives blocky stone feel
        });
      }
    }

    // Build Specific Geometries
    const buildModel = () => {
      // Clear fossil group children
      while (fossilGroup.children.length > 0) {
        fossilGroup.remove(fossilGroup.children[0]);
      }

      // Root container to easily apply global scaling
      const innerGroup = new THREE.Group();
      fossilGroup.add(innerGroup);

      if (fossilType === 'AMMONITE') {
        // Logarithmic spiral conch shell
        // We render individual expanding chambers
        const chamberCount = Math.round(ridges);
        for (let i = 0; i < chamberCount; i++) {
          const t = i / (chamberCount - 1);
          const theta = t * Math.PI * 4.5; // Spiral loops
          const a = 0.08;
          const b = 0.16;
          
          // Spiral radius
          const r = a * Math.exp(b * theta);
          const x = r * Math.cos(theta);
          const y = r * Math.sin(theta);
          
          // Chamber radius expands as we go outwards
          const chamberRadius = 0.06 + r * 0.28;
          
          const chamberGeom = new THREE.TorusGeometry(chamberRadius, chamberRadius * 0.45, 12, 24);
          const chamberMesh = new THREE.Mesh(chamberGeom, fossilMaterial);
          chamberMesh.position.set(x, y, 0);
          chamberMesh.rotation.z = theta + Math.PI / 2;
          
          // Add some flat cap inside for authentic structure
          if (i % 2 === 0) {
            const capGeom = new THREE.SphereGeometry(chamberRadius * 0.9, 8, 8);
            const capMesh = new THREE.Mesh(capGeom, fossilMaterial);
            capMesh.position.set(x, y, 0);
            innerGroup.add(capMesh);
          }

          innerGroup.add(chamberMesh);
        }

        // Add a central solid core
        const coreGeom = new THREE.SphereGeometry(0.12, 12, 12);
        const coreMesh = new THREE.Mesh(coreGeom, fossilMaterial);
        innerGroup.add(coreMesh);

      } else if (fossilType === 'TRILOBITE') {
        // Artrópode trilobite
        // Central axial lobe (segmented dome)
        const segmentCount = Math.round(ridges / 2) + 5;
        const bodyLength = 2.4;
        
        // Cephalon (head shield)
        const headGeom = new THREE.SphereGeometry(0.6, 16, 16);
        const headMesh = new THREE.Mesh(headGeom, fossilMaterial);
        headMesh.scale.set(1.4, 0.8, 0.6);
        headMesh.position.set(0, bodyLength / 2 - 0.2, 0);
        innerGroup.add(headMesh);

        // Eyes on the Cephalon
        const eyeColor = renderStyle === 'xray' ? 0x00ffff : 0x222222;
        const eyeMat = new THREE.MeshStandardMaterial({ color: eyeColor, roughness: 0.2, flatShading: true });
        
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), eyeMat);
        leftEye.position.set(-0.4, bodyLength / 2 - 0.15, 0.25);
        leftEye.scale.set(1.5, 0.8, 0.8);
        innerGroup.add(leftEye);

        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), eyeMat);
        rightEye.position.set(0.4, bodyLength / 2 - 0.15, 0.25);
        rightEye.scale.set(1.5, 0.8, 0.8);
        innerGroup.add(rightEye);

        // Thorax (individual segments)
        for (let i = 0; i < segmentCount; i++) {
          const ratio = i / (segmentCount - 1);
          const yPos = (bodyLength / 2 - 0.6) - ratio * (bodyLength * 0.65);
          
          // Width tappings down towards pygidium
          const widthScale = 1.0 - ratio * 0.45;
          
          // Central axial ring
          const ringGeom = new THREE.CylinderGeometry(0.2 * widthScale, 0.2 * widthScale, 0.12, 16);
          const ringMesh = new THREE.Mesh(ringGeom, fossilMaterial);
          ringMesh.rotation.x = Math.PI / 2;
          ringMesh.position.set(0, yPos, 0.1);
          innerGroup.add(ringMesh);

          // Left Pleural Pleat (ribbed side plate)
          const leftRibGeom = new THREE.BoxGeometry(0.6 * widthScale, 0.1, 0.15);
          const leftRibMesh = new THREE.Mesh(leftRibGeom, fossilMaterial);
          leftRibMesh.position.set(-0.45 * widthScale, yPos, 0.02);
          leftRibMesh.rotation.z = -0.15; // slightly curved back
          innerGroup.add(leftRibMesh);

          // Right Pleural Pleat
          const rightRibGeom = new THREE.BoxGeometry(0.6 * widthScale, 0.1, 0.15);
          const rightRibMesh = new THREE.Mesh(rightRibGeom, fossilMaterial);
          rightRibMesh.position.set(0.45 * widthScale, yPos, 0.02);
          rightRibMesh.rotation.z = 0.15;
          innerGroup.add(rightRibMesh);
        }

        // Pygidium (tail shield)
        const tailGeom = new THREE.SphereGeometry(0.4, 12, 12);
        const tailMesh = new THREE.Mesh(tailGeom, fossilMaterial);
        tailMesh.scale.set(1.1, 0.8, 0.4);
        tailMesh.position.set(0, -bodyLength / 2 + 0.1, 0);
        innerGroup.add(tailMesh);

      } else if (fossilType === 'MEGALODON_TOOTH') {
        // Great predator shark tooth (massive triangle)
        // Main tooth blade
        const shape = new THREE.Shape();
        shape.moveTo(-1.2, 0);
        shape.bezierCurveTo(-1.0, 1.2, -0.4, 2.2, 0, 3.2); // curved left side
        shape.bezierCurveTo(0.4, 2.2, 1.0, 1.2, 1.2, 0);   // curved right side
        shape.lineTo(1.1, -0.2);
        shape.bezierCurveTo(0.6, -0.5, -0.6, -0.5, -1.1, -0.2); // serrated blade base
        shape.lineTo(-1.2, 0);

        const extrudeSettings = {
          depth: 0.35,
          bevelEnabled: true,
          bevelSegments: 5,
          steps: 1,
          bevelSize: 0.06,
          bevelThickness: 0.08
        };

        const bladeGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        bladeGeom.center(); // Center geometry
        const bladeMesh = new THREE.Mesh(bladeGeom, fossilMaterial);
        innerGroup.add(bladeMesh);

        // Robust root block (darker cap)
        const rootColor = renderStyle === 'xray' ? 0x00f3ff : 0x1c1a18;
        const rootMaterial = new THREE.MeshStandardMaterial({
          color: rootColor,
          roughness: 0.9,
          flatShading: true,
        });
        
        // Curved massive root bone on top (which is actually the bottom anatomy-wise)
        const rootGeom = new THREE.BoxGeometry(2.4, 0.6, 0.65);
        const rootMesh = new THREE.Mesh(rootGeom, renderStyle === 'realistic' ? rootMaterial : fossilMaterial);
        rootMesh.position.set(0, -1.4, 0);
        innerGroup.add(rootMesh);

        // Distinct root lobes
        const lobeGeom = new THREE.SphereGeometry(0.35, 12, 12);
        const leftLobe = new THREE.Mesh(lobeGeom, renderStyle === 'realistic' ? rootMaterial : fossilMaterial);
        leftLobe.position.set(-1.0, -1.6, 0);
        leftLobe.scale.set(1.0, 1.4, 1.0);
        innerGroup.add(leftLobe);

        const rightLobe = new THREE.Mesh(lobeGeom, renderStyle === 'realistic' ? rootMaterial : fossilMaterial);
        rightLobe.position.set(1.0, -1.6, 0);
        rightLobe.scale.set(1.0, 1.4, 1.0);
        innerGroup.add(rightLobe);

        // Center the entire structure
        innerGroup.position.set(0, 0.5, 0);

      } else if (fossilType === 'LEAF_IMPRINT') {
        // Siltstone shale slab with dark leaf carbonization
        // 1. The Rock Slab
        const slabGeom = new THREE.BoxGeometry(2.8, 3.8, 0.25);
        const slabColor = renderStyle === 'xray' ? 0x001122 : 0x766d62;
        const slabMat = new THREE.MeshStandardMaterial({
          color: slabColor,
          roughness: 0.95,
          bumpScale: 0.2,
          flatShading: true,
        });
        const slabMesh = new THREE.Mesh(slabGeom, renderStyle === 'realistic' ? slabMat : fossilMaterial);
        slabMesh.castShadow = true;
        slabMesh.receiveShadow = true;
        innerGroup.add(slabMesh);

        // 2. The Leaf Carbon imprint (procedural veined structure)
        const leafColor = renderStyle === 'xray' ? 0x00f3ff : 0x24201c;
        const leafMat = new THREE.MeshStandardMaterial({
          color: leafColor,
          roughness: 0.7,
          metalness: 0.1,
        });

        const mainStemLength = 2.8;
        // Stem
        const stemGeom = new THREE.CylinderGeometry(0.04, 0.06, mainStemLength, 8);
        const stemMesh = new THREE.Mesh(stemGeom, leafMat);
        stemMesh.position.set(0, 0, 0.14);
        innerGroup.add(stemMesh);

        // Leaf blade outline using thin meshes
        const outlineShape = new THREE.Shape();
        outlineShape.moveTo(0, -mainStemLength / 2);
        outlineShape.quadraticCurveTo(-0.9, -0.4, -1.0, 0.4);
        outlineShape.quadraticCurveTo(-0.7, 1.2, 0, mainStemLength / 2);
        outlineShape.quadraticCurveTo(0.7, 1.2, 1.0, 0.4);
        outlineShape.quadraticCurveTo(0.9, -0.4, 0, -mainStemLength / 2);

        const outlineGeom = new THREE.ShapeGeometry(outlineShape);
        const outlineMesh = new THREE.Mesh(outlineGeom, leafMat);
        outlineMesh.position.set(0, 0.1, 0.13);
        outlineMesh.scale.set(0.95, 0.9, 1.0);
        innerGroup.add(outlineMesh);

        // Veins branching out
        const veinCount = Math.round(ridges / 2) + 4;
        for (let i = 0; i < veinCount; i++) {
          const ratio = (i + 1) / (veinCount + 1);
          // Position along stem
          const y = -mainStemLength / 2 + ratio * mainStemLength * 0.9;
          const veinLength = (1.0 - Math.abs(ratio - 0.5) * 1.5) * 0.8;
          
          if (veinLength > 0.1) {
            // Left branch
            const leftVein = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, veinLength, 4), leafMat);
            leftVein.position.set(-veinLength / 2 * Math.cos(0.4), y + veinLength / 2 * Math.sin(0.4), 0.145);
            leftVein.rotation.z = Math.PI / 2 - 0.45;
            innerGroup.add(leftVein);

            // Right branch
            const rightVein = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, veinLength, 4), leafMat);
            rightVein.position.set(veinLength / 2 * Math.cos(0.4), y + veinLength / 2 * Math.sin(0.4), 0.145);
            rightVein.rotation.z = -(Math.PI / 2 - 0.45);
            innerGroup.add(rightVein);
          }
        }

      } else if (fossilType === 'AMBER_INSECT') {
        // 1. The Amber gemstone
        const amberGeom = new THREE.SphereGeometry(1.6, 24, 24);
        const amberMesh = new THREE.Mesh(amberGeom, fossilMaterial);
        amberMesh.scale.set(1.0, 1.4, 0.8);
        innerGroup.add(amberMesh);

        // 2. Suspended Prehistoric Insect (inside!)
        const bugGroup = new THREE.Group();
        bugGroup.position.set(0, 0.1, 0);
        innerGroup.add(bugGroup);

        const bugColor = renderStyle === 'xray' ? 0x00f3ff : 0x110d0a;
        const bugMat = new THREE.MeshStandardMaterial({
          color: bugColor,
          roughness: 0.4,
          metalness: 0.3,
        });

        // Bug Abdomen
        const abdomen = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), bugMat);
        abdomen.scale.set(0.6, 1.8, 0.6);
        abdomen.rotation.x = -Math.PI / 4;
        bugGroup.add(abdomen);

        // Bug Thorax & Head
        const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), bugMat);
        thorax.position.set(0, 0.22, 0.15);
        bugGroup.add(thorax);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), bugMat);
        head.position.set(0, 0.32, 0.22);
        bugGroup.add(head);

        // Bug Antennae
        const antGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.15, 4);
        const leftAnt = new THREE.Mesh(antGeom, bugMat);
        leftAnt.position.set(-0.04, 0.4, 0.28);
        leftAnt.rotation.set(0.2, 0, -0.4);
        bugGroup.add(leftAnt);

        const rightAnt = new THREE.Mesh(antGeom, bugMat);
        rightAnt.position.set(0.04, 0.4, 0.28);
        rightAnt.rotation.set(0.2, 0, 0.4);
        bugGroup.add(rightAnt);

        // Translucent wings
        const wingMat = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transmission: 0.9,
          opacity: 0.7,
          transparent: true,
          roughness: 0.1,
          side: THREE.DoubleSide,
        });
        const wingGeom = new THREE.BoxGeometry(0.45, 0.18, 0.01);
        
        const leftWing = new THREE.Mesh(wingGeom, renderStyle === 'realistic' ? wingMat : fossilMaterial);
        leftWing.position.set(-0.25, 0.15, 0.1);
        leftWing.rotation.set(0.3, -0.4, 0.2);
        bugGroup.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeom, renderStyle === 'realistic' ? wingMat : fossilMaterial);
        rightWing.position.set(0.25, 0.15, 0.1);
        rightWing.rotation.set(0.3, 0.4, -0.2);
        bugGroup.add(rightWing);

        // Tiny legs
        for (let l = 0; l < 6; l++) {
          const legSide = l % 2 === 0 ? -1 : 1;
          const legRow = Math.floor(l / 2);
          const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.35, 4), bugMat);
          legMesh.position.set(legSide * 0.15, 0.15 - legRow * 0.12, 0.05);
          legMesh.rotation.set(0.2, 0, legSide * (0.6 + legRow * 0.1));
          bugGroup.add(legMesh);
        }

      } else {
        // DINOSAUR_BONE ( femur bone shape )
        const boneShaftGeom = new THREE.CylinderGeometry(0.3, 0.3, 2.2, 16);
        const boneShaft = new THREE.Mesh(boneShaftGeom, fossilMaterial);
        innerGroup.add(boneShaft);

        // Femur joints (condyles) - Spheres at the ends
        const jointGeom = new THREE.SphereGeometry(0.48, 16, 16);
        
        // Top Joints
        const topJointL = new THREE.Mesh(jointGeom, fossilMaterial);
        topJointL.position.set(-0.35, 1.1, 0);
        innerGroup.add(topJointL);

        const topJointR = new THREE.Mesh(jointGeom, fossilMaterial);
        topJointR.position.set(0.35, 1.1, 0);
        innerGroup.add(topJointR);

        // Bottom Joints
        const botJointL = new THREE.Mesh(jointGeom, fossilMaterial);
        botJointL.position.set(-0.32, -1.1, 0);
        innerGroup.add(botJointL);

        const botJointR = new THREE.Mesh(jointGeom, fossilMaterial);
        botJointR.position.set(0.32, -1.1, 0);
        innerGroup.add(botJointR);

        // Add some fossil fractures (little cracks)
        if (fissuresActive && renderStyle === 'realistic') {
          const fractureMat = new THREE.MeshBasicMaterial({ color: 0x3d2719 });
          for (let f = 0; f < 3; f++) {
            const crack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.015, 0.61), fractureMat);
            crack.position.set(0, -0.5 + f * 0.5, 0.05);
            crack.rotation.z = 0.3 * (f % 2 === 0 ? 1 : -1);
            innerGroup.add(crack);
          }
        }
      }

      // Add crack/fissure artifacts for non-amber fossils when wearFactor is high
      if (fissuresActive && fossilType !== 'AMBER_INSECT' && renderStyle === 'realistic') {
        const crackMat = new THREE.MeshBasicMaterial({ color: 0x1c1917 });
        const crackGeom = new THREE.BoxGeometry(0.5, 0.02, 0.02);
        
        // Add random crack markers
        for (let i = 0; i < Math.floor(wearFactor * 6) + 2; i++) {
          const crack = new THREE.Mesh(crackGeom, crackMat);
          crack.position.set((Math.sin(i) * 0.6), (Math.cos(i) * 0.8), 0.2);
          crack.rotation.z = Math.sin(i * 10) * 1.5;
          innerGroup.add(crack);
        }
      }

      // Global scaling of innerGroup
      const scale = size;
      innerGroup.scale.set(scale, scale, scale);
    };

    buildModel();

    // 4. Interactive Ruler (3D overlay helper)
    let rulerLine: THREE.Line | null = null;
    let rulerLabelsGroup = new THREE.Group();
    scene.add(rulerLabelsGroup);

    const buildRuler = () => {
      // Clear previous labels
      while (rulerLabelsGroup.children.length > 0) {
        rulerLabelsGroup.remove(rulerLabelsGroup.children[0]);
      }
      if (rulerLine) {
        scene.remove(rulerLine);
        rulerLine = null;
      }

      if (!showRuler) return;

      // Draw ruler alongside the fossil on the left side
      const points = [
        new THREE.Vector3(-1.8, -1.8, 0.2),
        new THREE.Vector3(-1.8, 1.8, 0.2),
      ];
      const rulerGeom = new THREE.BufferGeometry().setFromPoints(points);
      const rulerMat = new THREE.LineBasicMaterial({
        color: 0x10b981, // Emerald green
        linewidth: 2,
      });

      rulerLine = new THREE.Line(rulerGeom, rulerMat);
      scene.add(rulerLine);

      // Add ticks
      const tickMat = new THREE.LineBasicMaterial({ color: 0x10b981 });
      const tickCount = 6;
      for (let i = 0; i < tickCount; i++) {
        const y = -1.8 + (3.6 * i) / (tickCount - 1);
        const tickPoints = [
          new THREE.Vector3(-1.8, y, 0.2),
          new THREE.Vector3(-1.65, y, 0.2),
        ];
        const tickGeom = new THREE.BufferGeometry().setFromPoints(tickPoints);
        const tick = new THREE.Line(tickGeom, tickMat);
        rulerLabelsGroup.add(tick);
      }
    };

    buildRuler();

    // 5. Mouse Orbit Interaction
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      if (fossilGroup) {
        fossilGroup.rotation.y += deltaX * 0.008;
        fossilGroup.rotation.x += deltaY * 0.008;
      }
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    // Touch support for mobile inside Iframe
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isMouseDown = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isMouseDown || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;

      if (fossilGroup) {
        fossilGroup.rotation.y += deltaX * 0.012;
        fossilGroup.rotation.x += deltaY * 0.012;
      }
    };

    // Add event listeners directly to canvas
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    // Zoom listener (mouse wheel)
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomFactorRef.current = Math.max(0.4, Math.min(2.5, zoomFactorRef.current - e.deltaY * 0.0015));
    };
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // 6. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Continuous subtle rotation if enabled
      if (rotationActiveRef.current && !isMouseDown) {
        fossilGroup.rotation.y = elapsedTime * 0.18;
        // Float animation
        fossilGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.12;
      } else if (!isMouseDown) {
        // Slow recovery rotation
        fossilGroup.position.y = Math.sin(elapsedTime * 0.5) * 0.04;
      }

      // Smooth camera zoom
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, 8 / zoomFactorRef.current, 0.08);

      renderer.render(scene, camera);
    };

    animate();

    // 7. Responsive Resize Handling (using ResizeObserver on Container)
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0) return;
      const rect = entries[0].contentRect;
      const newWidth = rect.width;
      const newHeight = rect.height;

      if (newWidth > 0 && newHeight > 0) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    });

    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);

      canvas.removeEventListener('wheel', handleWheel);

      renderer.dispose();
      scene.clear();
    };
  }, [fossilType, color, wearFactor, size, ridges, lightMode, renderStyle, showRuler, fissuresActive]);

  // Handle manual zoom triggers
  const triggerZoom = (amount: number) => {
    zoomFactorRef.current = Math.max(0.4, Math.min(2.5, zoomFactorRef.current + amount));
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0F1110] rounded-2xl overflow-hidden border border-[#C2A26E]/20 shadow-2xl group/canvas" id="canvas-container">
      {/* 3D Render Canvas */}
      <div ref={mountRef} className="relative flex-grow w-full h-full min-h-[340px] cursor-grab active:cursor-grabbing">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" id="three-fossil-canvas" />

        {/* Floating Indicator */}
        <div className="absolute top-4 left-4 flex flex-col gap-1 pointer-events-none select-none bg-[#141615]/90 backdrop-blur-sm border border-[#C2A26E]/20 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-[#C2A26E] animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider text-[#C2A26E]/80 font-mono">Modo de Exploração</span>
          </div>
          <span className="text-xs font-serif italic text-slate-100">{fossilName}</span>
        </div>

        {/* Quick Instructions Overlay */}
        <div className="absolute bottom-4 right-4 pointer-events-none text-[10px] text-slate-500 font-mono bg-[#141615]/80 backdrop-blur-sm rounded px-2.5 py-1 select-none border border-[#C2A26E]/10 opacity-0 group-hover/canvas:opacity-100 transition-opacity duration-300">
          Arraste p/ Rodar • Roda p/ Zoom
        </div>

        {/* Ruler Overlay Values */}
        {showRuler && (
          <div className="absolute top-1/2 left-10 -translate-y-1/2 flex flex-col gap-16 pointer-events-none select-none text-[10px] text-[#C2A26E] font-mono font-semibold">
            <span>+{Math.round(size * 10)} cm</span>
            <span>0 cm</span>
            <span>-{Math.round(size * 10)} cm</span>
          </div>
        )}
      </div>

      {/* Interactive Toolbar Control Panel */}
      <div className="p-3 bg-[#141615] border-t border-[#C2A26E]/20 flex flex-wrap gap-2 items-center justify-between z-10">
        
        {/* Lights Mode Selector */}
        <div className="flex items-center gap-1 bg-[#0F1110] rounded-lg p-1 border border-[#C2A26E]/15">
          <button
            id="light-btn-museum"
            title="Luz de Exposição"
            onClick={() => setLightMode('museum')}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${lightMode === 'museum' ? 'bg-[#C2A26E]/20 text-[#C2A26E]' : 'text-slate-500 hover:text-[#C2A26E]'}`}
          >
            <Lightbulb className="w-4 h-4" />
          </button>
          <button
            id="light-btn-studio"
            title="Luz de Estúdio"
            onClick={() => setLightMode('studio')}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${lightMode === 'studio' ? 'bg-[#C2A26E]/20 text-white' : 'text-slate-500 hover:text-[#C2A26E]'}`}
          >
            <Activity className="w-4 h-4" />
          </button>
          <button
            id="light-btn-field"
            title="Luz Natural (Escavação)"
            onClick={() => setLightMode('field')}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${lightMode === 'field' ? 'bg-[#C2A26E]/20 text-yellow-500' : 'text-slate-500 hover:text-[#C2A26E]'}`}
          >
            <Sun className="w-4 h-4" />
          </button>
        </div>

        {/* Rendering Styles (Realistic, X-Ray, Wireframe) */}
        <div className="flex items-center gap-1 bg-[#0F1110] rounded-lg p-1 border border-[#C2A26E]/15">
          <button
            id="style-btn-real"
            onClick={() => setRenderStyle('realistic')}
            className={`px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer ${renderStyle === 'realistic' ? 'bg-[#C2A26E]/20 text-[#C2A26E]' : 'text-slate-500 hover:text-[#C2A26E]'}`}
          >
            Realista
          </button>
          <button
            id="style-btn-xray"
            onClick={() => setRenderStyle('xray')}
            className={`px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer ${renderStyle === 'xray' ? 'bg-[#C2A26E]/20 text-cyan-400' : 'text-slate-500 hover:text-[#C2A26E]'}`}
          >
            Raio-X
          </button>
          <button
            id="style-btn-wire"
            onClick={() => setRenderStyle('wireframe')}
            className={`px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer ${renderStyle === 'wireframe' ? 'bg-[#C2A26E]/20 text-indigo-400' : 'text-slate-500 hover:text-[#C2A26E]'}`}
          >
            Malha
          </button>
        </div>

        {/* View and Rotation Helpers */}
        <div className="flex items-center gap-1">
          {/* Fissures/Analysis Toggle */}
          <button
            id="btn-analysis"
            title="Análise de Desgaste e Fissuras"
            onClick={() => setFissuresActive(!fissuresActive)}
            className={`p-1.5 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${fissuresActive ? 'bg-rose-950/40 border-rose-800/60 text-rose-400' : 'bg-[#0F1110] border-[#C2A26E]/15 text-slate-400 hover:text-[#C2A26E]'}`}
          >
            Detetar Desgaste
          </button>

          {/* Ruler Toggle */}
          <button
            id="btn-ruler"
            title="Mostrar Régua de Medição"
            onClick={() => setShowRuler(!showRuler)}
            className={`p-1.5 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${showRuler ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400' : 'bg-[#0F1110] border-[#C2A26E]/15 text-slate-400 hover:text-[#C2A26E]'}`}
          >
            Régua 3D
          </button>

          {/* Auto Rotation Toggle */}
          <button
            id="btn-auto-rotate"
            title={isRotating ? "Pausar Rotação" : "Rodar Automaticamente"}
            onClick={() => setIsRotating(!isRotating)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${isRotating ? 'bg-[#0F1110] border-[#C2A26E]/20 text-[#C2A26E]' : 'bg-[#0F1110] border-[#C2A26E]/15 text-slate-400 hover:text-[#C2A26E]'}`}
          >
            <RotateCw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '10s' }} />
          </button>

          {/* Quick Zooms */}
          <button
            id="btn-zoom-in"
            onClick={() => triggerZoom(0.25)}
            className="p-1.5 rounded-lg border bg-[#0F1110] border-[#C2A26E]/15 text-slate-400 hover:text-[#C2A26E] transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="btn-zoom-out"
            onClick={() => triggerZoom(-0.25)}
            className="p-1.5 rounded-lg border bg-[#0F1110] border-[#C2A26E]/15 text-slate-400 hover:text-[#C2A26E] transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
