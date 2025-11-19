import { Keyboard } from "@/components/Keyboard";
import { Stage, useTexture } from "@react-three/drei";
import { KEYCAP_TEXTURES } from ".";
// Removed unused imports: materialAO, roughness from "three/tsl"
import { useMemo, useRef, useState } from "react";
import * as THREE from "three"; // Use * as THREE for constants like SRGBColorSpace
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

gsap.registerPlugin(useGSAP);

type SceneProps = {
  selectedTextureId: string;
  onAnimationComplete: () => void;
};

// Define the component signature properly
export function Scene({ selectedTextureId, onAnimationComplete }: SceneProps) {
  // 1. Get all texture paths
  const keyboardRef = useRef<THREE.Group>(null);
  const texturePaths = KEYCAP_TEXTURES.map((t) => t.path);

  // 2. Load all textures in parallel
  // Note: useTexture returns an array if passed an array of paths
  const textures = useTexture(texturePaths);

  const [currentTextureId, setCurrentTextureId] = useState(selectedTextureId);

  useGSAP(() => {
    // Animate Keyboard
    if (!keyboardRef.current || currentTextureId === selectedTextureId) {
      return;
    }

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference", () => {
      const keyboard = keyboardRef.current;
      if (!keyboard) return;

      const tl = gsap.timeline({
        onComplete: onAnimationComplete, // Directly pass the function
      });

      tl.to(keyboard.position, {
        y: 0.3,
        duration: 0.4,
        ease: "power2.out",
        onComplete: () => {
          setCurrentTextureId(selectedTextureId);
        },
      });
      tl.to(keyboard.position, {
        y: 0,
        duration: 0.6,
        ease: "elastic.out(1,0.4)",
      });
    });

    mm.add("(prefers-reduced-motion: reduce", () => {
      setCurrentTextureId(selectedTextureId);
      onAnimationComplete();
    });
  }, [selectedTextureId, currentTextureId]);

  // 3. Create materials map using useMemo for performance
  const materials = useMemo(() => {
    // Check if textures have loaded
    if (!Array.isArray(textures) || textures.length === 0) {
      return {}; // Return empty map if textures aren't ready
    }

    const materialMap: { [key: string]: THREE.MeshStandardMaterial } = {};

    // Use a proper forEach structure
    KEYCAP_TEXTURES.forEach((textureConfig, index) => {
      const texture = Array.isArray(textures) ? textures[index] : textures;

      if (texture) {
        // Correct way to set texture properties
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;

        // Correct object literal syntax for MeshStandardMaterial
        materialMap[textureConfig.id] = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.7,
        });
      }
    });

    // The useMemo callback must return the computed value
    return materialMap;
  }, [textures]); // Dependency array is only `textures`
  const currentKnobColor = KEYCAP_TEXTURES.find(
    (t) => t.id === selectedTextureId,
  )?.knobColor;
  // 4. Component return (JSX)
  return (
    <Stage environment={"city"} intensity={0.05} shadows="contact">
      <group ref={keyboardRef}>
        {/*
          You'll need to pass the 'materials' map to the <Keyboard /> component
          so it can apply the correct material based on 'selectedTextureId'.
          Example: <Keyboard materials={materials} selectedTextureId={selectedTextureId} />
        */}
        <Keyboard
          keycapMaterial={materials[currentTextureId]}
          knobColor={currentKnobColor}
        />
      </group>
    </Stage>
  );
}
