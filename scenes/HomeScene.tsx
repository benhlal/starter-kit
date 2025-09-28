import React, { Component } from "react";
import {
  Viro3DObject,
  ViroAmbientLight,
  ViroAnimations,
  ViroARScene,
  ViroText,
} from "@reactvision/react-viro";

class HomeScene extends Component<{
  sceneNavigator: {
    viroAppProps: {
      object: {
        obj: any;
        mtl?: any;
        position: [number, number, number];
      } | null;
      scale: [number, number, number];
      textObject: {
        id: string;
        text: string;
        position: [number, number, number];
      } | null;
    };
  };
}> {
  constructor(props: any) {
    super(props);

    // Register animations once when the scene initializes
    ViroAnimations.registerAnimations({
      rotate: {
        duration: 2550,
        properties: { rotateY: "+=90" },
        easing: "Linear",
      },
    });
  }

  render() {
    const { object, scale, textObject } =
      this.props.sceneNavigator.viroAppProps;

    return (
      <ViroARScene>
        {/* Ambient light for visibility */}
        <ViroAmbientLight color="#ffffff" />

        {/* 3D Object rendering */}
        {object && (
          <Viro3DObject
            source={object.obj}
            resources={object.mtl ? [object.mtl] : []}
            position={object.position}
            scale={scale}
            rotation={[45, 50, 40]}
            type="OBJ"
            animation={{ name: "rotate", run: true, loop: true }}
          />
        )}

        {/* Optional AR Text */}
        {textObject && (
          <ViroText
            text={textObject.text}
            position={textObject.position}
            scale={[0.5, 0.5, 0.5]}
            style={{
              color: "#af0606ff",
              fontSize: 60,
              textAlign: "center",
            }}
          />
        )}
      </ViroARScene>
    );
  }
}

export default HomeScene;
