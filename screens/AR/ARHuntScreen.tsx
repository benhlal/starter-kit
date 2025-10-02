/* eslint-disable prettier/prettier */
import React from "react";
import ARScreen from "./ARScreen";

interface ARHuntScreenProps {
  eventId: string;
  onClose?: () => void;
}

const ARHuntScreen: React.FC<ARHuntScreenProps> = ({ eventId, onClose }) => {
  return <ARScreen eventId={eventId} debugOverlay onClose={onClose} />;
};

export default ARHuntScreen;
