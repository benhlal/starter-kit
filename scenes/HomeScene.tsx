import React from "react";
import {
  Viro3DObject,
  ViroAmbientLight,
  ViroAnimations,
  ViroARScene,
  ViroText,
} from "@reactvision/react-viro";

interface ARObject {
  id: string;
  name: string;
  img: any;
  obj?: any;
  mtl?: any;
  position: [number, number, number];
}

interface TextObject {
  id: string;
  text: string;
  position: [number, number, number];
}

const HomeScene = (props: {
  sceneNavigator: {
    viroAppProps: {
      object: ARObject | null;
      scale: [number, number, number];
      textObject: TextObject | null;
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
      {object && object.obj && object.mtl ? (
        <Viro3DObject
          source={object.obj}
          resources={[object.mtl]}
          position={object.position}
          scale={scale}
          rotation={[45, 50, 40]}
          type="OBJ"
          animation={{ name: "rotate", run: true, loop: true }}
        />
      ) : null}
      {textObject && (
        <ViroText
          text={textObject.text}
          position={textObject.position}
          scale={[0.5, 0.5, 0.5]}
          style={{ color: "#000", fontSize: 20, textAlign: "center" }}
        />
      )}
    </ViroARScene>
  );
};

export default HomeScene;
