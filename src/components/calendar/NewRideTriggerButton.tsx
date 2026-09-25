"use client";

import { NewRideSplitButton } from "./NewRideSplitButton";
import { useNewRide } from "./NewRideContext";

export function NewRideTriggerButton() {
  const { openNewRide } = useNewRide();
  return <NewRideSplitButton onClick={openNewRide} />;
}
