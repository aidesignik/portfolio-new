"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { NewRideSplitButton } from "@/components/calendar/NewRideSplitButton";
import { NewRideModal } from "@/components/calendar/NewRideModal";

export function AddRideButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <NewRideSplitButton onClick={() => setOpen(true)} />
      {open ? (
        <NewRideModal
          onClose={() => setOpen(false)}
          onCreated={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}
