import React, { useMemo, useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  ViroARSceneNavigator,
  ViroARScene,
  ViroAmbientLight,
  ViroNode,
  ViroBox,
  ViroMaterials,
  ViroAnimations,
} from "@reactvision/react-viro";

interface MockedARScreenProps {
  onClose?: () => void;
  eventId?: string;
}

ViroMaterials.createMaterials({
  cylRed: { lightingModel: "Blinn", diffuseColor: "#EF4444" },
  cylBlue: { lightingModel: "Blinn", diffuseColor: "#3B82F6" },
  cylGreen: { lightingModel: "Blinn", diffuseColor: "#10B981" },
  cylPurple: { lightingModel: "Blinn", diffuseColor: "#8B5CF6" },
  cylYellow: { lightingModel: "Blinn", diffuseColor: "#F59E0B" },
  cylCollected: { lightingModel: "Blinn", diffuseColor: "#9CA3AF" },
});

ViroAnimations.registerAnimations({
  pop: { properties: { scaleX: 1.2, scaleY: 1.2, scaleZ: 1.2 }, duration: 100 },
  popBack: {
    properties: { scaleX: 1.0, scaleY: 1.0, scaleZ: 1.0 },
    duration: 120,
  },
});

type Target = {
  id: string;
  pos: [number, number, number];
  collected?: boolean;
  material: string;
};

function makeTargets(n = 5): Target[] {
  const mats = ["cylRed", "cylBlue", "cylGreen", "cylPurple", "cylYellow"];
  const res: Target[] = [];
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    const r = 0.6 + Math.random() * 1.2; // 0.6m .. 1.8m away
    const x = Math.cos(ang) * r;
    const z = Math.sin(ang) * r; // we’ll place as [x, y, -z] below
    const y = 0.1 + Math.random() * 0.5; // some height variance
    res.push({
      id: `t_${Date.now()}_${i}_${Math.round(Math.random() * 1e6)}`,
      pos: [x, y, -z],
      material: mats[i % mats.length],
    });
  }
  return res;
}

function MockScene(props: any) {
  const [targets, setTargets] = useState<Target[]>(() => makeTargets(5));
  const sceneRef = useRef<any>(null);

  // Optional proximity collection as you approach (kept minimal, but we primarily collect on tap)
  useEffect(() => {
    let id: any;
    const tick = async () => {
      try {
        if (!sceneRef.current) {
          return;
        }
        const { position } = await sceneRef.current.getCameraOrientationAsync();
        setTargets((prev) =>
          prev.map((t) => {
            if (t.collected) {
              return t;
            }
            const dx = position[0] - t.pos[0];
            const dy = position[1] - t.pos[1];
            const dz = position[2] - t.pos[2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < 0.75) {
              return { ...t, collected: true, material: "cylCollected" };
            }
            return t;
          })
        );
      } catch {}
    };
    id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, []);

  const onTap = (id: string) => {
    setTargets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, collected: true, material: "cylCollected" } : t
      )
    );
  };

  return (
    <ViroARScene ref={sceneRef}>
      <ViroAmbientLight color="#FFFFFF" intensity={500} />
      {targets.map((t) => (
        <ViroNode
          key={t.id}
          position={t.pos}
          transformBehaviors={["billboardY"]}
        >
          {/* Cylinder-like pillar using a thin tall box */}
          <ViroBox
            width={0.22}
            height={0.6}
            length={0.22}
            materials={[t.material]}
            opacity={t.collected ? 0.4 : 1}
            onClick={() => onTap(t.id)}
            animation={{
              name: t.collected ? undefined : "pop",
              run: true,
              loop: false,
            }}
          />
        </ViroNode>
      ))}
      {/* Expose a generator through viroAppProps */}
      {props?.sceneNavigator?.viroAppProps?.onInject && <ViroNode />}
    </ViroARScene>
  );
}

const MockedARScreen: React.FC<MockedARScreenProps> = ({ onClose }) => {
  const [key, setKey] = useState(0); // force remount scene when generating fresh set

  const content = useMemo(
    () => (
      <ViroARSceneNavigator
        key={key}
        autofocus={true}
        initialScene={{ scene: MockScene as any }}
        viroAppProps={{
          onInject: () => {},
        }}
        style={styles.flex}
      />
    ),
    [key]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mock AR (Room)</Text>
        {onClose && (
          <TouchableOpacity accessibilityRole="button" onPress={onClose}>
            <Text style={styles.close}>Close</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.flex}>{content}</View>
      <TouchableOpacity
        style={styles.generateFab}
        onPress={() => setKey((k) => k + 1)}
        accessibilityLabel="Generate more objects"
      >
        <Text style={styles.fabText}>➕ Generate 5</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MockedARScreen;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "600" },
  close: { color: "#4da3ff", fontSize: 16, fontWeight: "600" },
  generateFab: {
    position: "absolute",
    right: 16,
    bottom: 24,
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  fabText: { color: "#fff", fontWeight: "800" },
});
