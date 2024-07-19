import React from "react";
import {
  Viro3DObject,
  ViroAmbientLight,
  ViroAnimations,
  ViroARScene,
  ViroText,
} from "@reactvision/react-viro";

const HomeScene = (props: {
  sceneNavigator: {
    viroAppProps: {
      object: any;
      scale: [number, number, number];
      textObject: { id: string; text: string } | null;
    };
  };
}): JSX.Element => {
  const { object, scale, textObject } = props.sceneNavigator.viroAppProps;

  ViroAnimations.registerAnimations({
    rotate: {
      duration: 2550,
      properties: { rotateY: "+=90" },
      easing: "Linear",
      loop: true,
    },
  });

  return (
    <ViroARScene>
      <ViroAmbientLight color="#ffffff" />
      {object && (
        <Viro3DObject
          source={object.obj}
          resources={[object.mtl]}
          position={[0, 0, -3]}
          scale={scale}
          rotation={[45, 50, 40]}
          type="OBJ"
          animation={{ name: "rotate", run: true, loop: true }}
        />
      )}
      {textObject && (
        <ViroText
          text={textObject.text}
          position={[0, 0, -3]}
          scale={[0.5, 0.5, 0.5]}
          style={{ color: "#000", fontSize: 20, textAlign: "center" }}
        />
      )}
    </ViroARScene>
  );
};

export default HomeScene;
